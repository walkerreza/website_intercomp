import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const LOCAL_STORAGE_KEY = "questify:guild-orb";
let guildOrbRealtimeChannel = null;
let shouldUseLocalGuildOrbFallback = false;

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
}

function isMissingWorkspaceMessagesError(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`;
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("workspace_messages") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  );
}

function inferContentType(content = "") {
  if (/```mermaid[\s\S]*?```/i.test(content)) return "mixed";
  if (/^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|journey|gantt|pie)\b/i.test(content)) {
    return "mermaid";
  }
  return "text";
}

function normalizeMessage(message = {}) {
  return {
    id: message.id,
    content: message.content ?? "",
    contentType: message.content_type ?? message.contentType ?? inferContentType(message.content),
    createdAt: message.created_at ?? message.createdAt ?? new Date().toISOString(),
    senderId: message.sender_id ?? message.senderId ?? "",
    senderName: message.sender_name ?? message.senderName ?? "",
    senderType: message.sender_type ?? message.senderType ?? "user",
    workspaceId: message.workspace_id ?? message.workspaceId ?? "",
  };
}

function getLocalMessages(workspaceId) {
  try {
    const saved = window.localStorage.getItem(`${LOCAL_STORAGE_KEY}:${workspaceId}`);
    return saved ? JSON.parse(saved).map(normalizeMessage) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(workspaceId, messages) {
  window.localStorage.setItem(
    `${LOCAL_STORAGE_KEY}:${workspaceId}`,
    JSON.stringify(messages.slice(-80)),
  );
}

export function shouldInvokeGuildOrbAi(content = "") {
  const cleaned = content.trim().toLowerCase();
  return ["@ai", "/diagram", "/summary", "/quest", "/plan"].some((command) =>
    cleaned === command || cleaned.startsWith(`${command} `),
  );
}

export async function loadGuildOrbMessages(workspaceId) {
  if (!workspaceId) return [];

  if (isSupabaseConfigured && !shouldUseLocalGuildOrbFallback) {
    assertSupabaseConfigured();

    const { data, error } = await supabase
      .from("workspace_messages")
      .select("id, workspace_id, sender_id, sender_type, content, content_type, created_at, users(username, email)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      if (isMissingWorkspaceMessagesError(error)) return getLocalMessages(workspaceId);
      throw error;
    }

    return (data ?? [])
      .reverse()
      .map((message) =>
        normalizeMessage({
          ...message,
          sender_name:
            message.sender_type === "ai"
              ? "Bola Sihir"
              : message.users?.username ?? message.users?.email ?? "Guild Member",
        }),
      );
  }

  return getLocalMessages(workspaceId);
}

export async function sendGuildOrbMessage({ workspaceId, senderId, senderName, content }) {
  const cleanedContent = content.trim();
  if (!workspaceId || !cleanedContent) return null;

  if (isSupabaseConfigured && !shouldUseLocalGuildOrbFallback) {
    assertSupabaseConfigured();

    const { data, error } = await supabase
      .from("workspace_messages")
      .insert({
        workspace_id: workspaceId,
        sender_id: senderId,
        sender_type: "user",
        content: cleanedContent,
        content_type: inferContentType(cleanedContent),
      })
      .select("id, workspace_id, sender_id, sender_type, content, content_type, created_at")
      .single();

    if (error) {
      if (isMissingWorkspaceMessagesError(error)) {
        return null;
      } else {
        throw error;
      }
    } else {
      return normalizeMessage({ ...data, sender_name: senderName || "You" });
    }
  }

  const localMessage = normalizeMessage({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    sender_id: senderId,
    sender_name: senderName || "You",
    sender_type: "user",
    content: cleanedContent,
    content_type: inferContentType(cleanedContent),
    created_at: new Date().toISOString(),
  });
  const nextMessages = [...getLocalMessages(workspaceId), localMessage];
  saveLocalMessages(workspaceId, nextMessages);
  return localMessage;
}

export async function invokeGuildOrbAi({ workspaceId, prompt }) {
  if (!workspaceId || !prompt.trim()) return null;
  if (!isSupabaseConfigured) {
    const fallback = normalizeMessage({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      sender_type: "ai",
      sender_name: "Bola Sihir",
      content: "Bola Sihir perlu Supabase aktif untuk menjawab.",
      content_type: "text",
      created_at: new Date().toISOString(),
    });
    const nextMessages = [...getLocalMessages(workspaceId), fallback];
    saveLocalMessages(workspaceId, nextMessages);
    return fallback;
  }

  assertSupabaseConfigured();
  const { data, error } = await supabase.functions.invoke("guild-orb-ai", {
    body: { workspaceId, prompt },
  });

  if (error) throw error;
  return data?.message ? normalizeMessage(data.message) : null;
}

export function subscribeGuildOrbMessages(workspaceId, onMessage) {
  if (!isSupabaseConfigured || !workspaceId) {
    return () => {};
  }

  assertSupabaseConfigured();

  if (guildOrbRealtimeChannel) {
    supabase.removeChannel(guildOrbRealtimeChannel);
    guildOrbRealtimeChannel = null;
  }

  const channel = supabase.channel(`guild-orb:${workspaceId}:${Date.now()}`);
  guildOrbRealtimeChannel = channel;

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "workspace_messages",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => onMessage?.(normalizeMessage(payload.new)),
    )
    .subscribe();

  return () => {
    if (guildOrbRealtimeChannel?.topic === channel.topic) {
      supabase.removeChannel(channel);
      guildOrbRealtimeChannel = null;
    }
  };
}
