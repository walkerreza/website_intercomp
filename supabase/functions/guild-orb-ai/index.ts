import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

function inferContentType(content: string) {
  if (/```mermaid[\s\S]*?```/i.test(content)) return "mixed";
  if (/^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|journey|gantt|pie)\b/i.test(content)) {
    return "mermaid";
  }
  return "text";
}

function buildSystemPrompt(questContext: unknown[]) {
  return [
    "Kamu adalah Bola Sihir, asisten RPG produktivitas untuk Questify.",
    "Jawab singkat, praktis, dan langsung membantu koordinasi quest.",
    "Jika user meminta diagram, balas dengan blok ```mermaid yang valid.",
    "Jika prompt dimulai /quest, pecah misi menjadi checklist konkret dengan estimasi prioritas.",
    "Jika prompt dimulai /plan, susun rencana aksi singkat berdasarkan quest aktif, deadline, dan difficulty.",
    "Jika prompt dimulai /summary, ringkas progress dan risiko paling penting.",
    "Jangan gunakan HTML. Jangan membuka data di luar konteks workspace.",
    `Quest aktif workspace saat ini: ${JSON.stringify(questContext).slice(0, 4000)}`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";
    const openRouterModel =
      Deno.env.get("OPENROUTER_MODEL") ??
      Deno.env.get("OPENAI_MODEL") ??
      "openai/gpt-oss-120b:free";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !authHeader) {
      throw new Error("Guild Orb AI belum dikonfigurasi lengkap.");
    }

    const { prompt, workspaceId } = await req.json();
    const cleanedPrompt = String(prompt ?? "").trim();
    const targetWorkspaceId = String(workspaceId ?? "").trim();

    if (!targetWorkspaceId || !cleanedPrompt) {
      throw new Error("Workspace dan prompt wajib diisi.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) throw new Error("Sesi user tidak valid.");

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) throw new Error("User bukan member aktif workspace ini.");

    const { data: quests } = await supabase
      .from("quests")
      .select("title, difficulty, due_at, claimed_at, reward_xp, reward_gold")
      .eq("workspace_id", targetWorkspaceId)
      .is("archived_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(12);

    const { data: recentMessages } = await supabase
      .from("workspace_messages")
      .select("sender_type, content, created_at")
      .eq("workspace_id", targetWorkspaceId)
      .order("created_at", { ascending: false })
      .limit(20);

    let answer = "";
    if (!openRouterKey) {
      answer = "Bola Sihir belum memiliki OPENROUTER_API_KEY di Supabase Edge Function secrets.";
    } else {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://questify.local",
          "X-Title": "Questify Guild Orb",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: "system", content: buildSystemPrompt(quests ?? []) },
            ...((recentMessages ?? []).reverse().map((message) => ({
              role: message.sender_type === "ai" ? "assistant" : "user",
              content: String(message.content).slice(0, 1200),
            }))),
            { role: "user", content: cleanedPrompt },
          ],
          temperature: 0.35,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`AI provider error: ${details.slice(0, 240)}`);
      }

      const result = await response.json();
      answer = result.choices?.[0]?.message?.content?.trim() || "Bola Sihir tidak menemukan jawaban.";
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from("workspace_messages")
      .insert({
        workspace_id: targetWorkspaceId,
        sender_id: null,
        sender_type: "ai",
        content: answer,
        content_type: inferContentType(answer),
      })
      .select("id, workspace_id, sender_id, sender_type, content, content_type, created_at")
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: insertedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? "Guild Orb AI gagal." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
