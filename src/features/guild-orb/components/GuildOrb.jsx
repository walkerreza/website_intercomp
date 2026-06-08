import { useEffect, useMemo, useState } from "react";
import {
  invokeGuildOrbAi,
  loadGuildOrbMessages,
  sendGuildOrbMessage,
  shouldInvokeGuildOrbAi,
  subscribeGuildOrbMessages,
} from "../../../services/guildOrbService.js";
import { GuildOrbPanel } from "./GuildOrbPanel.jsx";

function mergeMessages(currentMessages, nextMessage) {
  if (!nextMessage) return currentMessages;
  if (currentMessages.some((message) => message.id === nextMessage.id)) {
    return currentMessages.map((message) =>
      message.id === nextMessage.id ? { ...message, ...nextMessage } : message,
    );
  }
  return [...currentMessages, nextMessage].slice(-80);
}

export function GuildOrb({
  currentUser,
  isVisible,
  mode,
  onCreateGeneratedQuests,
  workspaceId,
  workspaceName,
}) {
  const [error, setError] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCreatingGeneratedQuests, setIsCreatingGeneratedQuests] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const senderName = useMemo(
    () => currentUser?.name ?? currentUser?.username ?? currentUser?.email ?? "Player",
    [currentUser],
  );

  useEffect(() => {
    if (!isVisible || !workspaceId) {
      setMessages([]);
      setIsOpen(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);

    loadGuildOrbMessages(workspaceId)
      .then((loadedMessages) => {
        if (isMounted) {
          setMessages(loadedMessages);
          setError("");
        }
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError.message || "Guild Orb gagal dibuka.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = subscribeGuildOrbMessages(workspaceId, (message) => {
      setMessages((currentMessages) => mergeMessages(currentMessages, message));
      setUnreadCount((currentCount) => (isOpen ? currentCount : Math.min(currentCount + 1, 99)));
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [isOpen, isVisible, workspaceId]);

  function handleToggle() {
    setIsOpen((current) => {
      const nextIsOpen = !current;
      if (nextIsOpen) setUnreadCount(0);
      return nextIsOpen;
    });
  }

  async function handleSend(content) {
    try {
      setError("");
      const sentMessage = await sendGuildOrbMessage({
        content,
        senderId: currentUser?.id,
        senderName,
        workspaceId,
      });
      setMessages((currentMessages) => mergeMessages(currentMessages, sentMessage));

      if (shouldInvokeGuildOrbAi(content)) {
        setIsAiThinking(true);
        const aiMessage = await invokeGuildOrbAi({ prompt: content, workspaceId });
        setMessages((currentMessages) => mergeMessages(currentMessages, aiMessage));
      }
    } catch (sendError) {
      setError(sendError.message || "Rune gagal dikirim.");
    } finally {
      setIsAiThinking(false);
    }
  }

  async function handleCreateGeneratedQuests(drafts) {
    if (!onCreateGeneratedQuests) return;

    try {
      setError("");
      setIsCreatingGeneratedQuests(true);
      await onCreateGeneratedQuests(drafts);
    } catch (createError) {
      setError(createError.message || "AI quest gagal ditambahkan.");
      throw createError;
    } finally {
      setIsCreatingGeneratedQuests(false);
    }
  }

  if (!isVisible || !workspaceId) return null;

  return (
    <div className={`guild-orb-shell ${isOpen ? "is-open" : ""}`}>
      {isOpen && (
        <GuildOrbPanel
          error={error}
          isAiThinking={isAiThinking}
          isCreatingGeneratedQuests={isCreatingGeneratedQuests}
          isLoading={isLoading}
          messages={messages}
          mode={mode}
          onClose={() => setIsOpen(false)}
          onCreateGeneratedQuests={handleCreateGeneratedQuests}
          onSend={handleSend}
          workspaceName={workspaceName}
        />
      )}

      <button
        aria-label={isOpen ? "Tutup Guild Orb" : "Buka Guild Orb"}
        className="guild-orb-trigger"
        onClick={handleToggle}
        type="button"
      >
        <span className="guild-orb-logo" aria-hidden="true" />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
    </div>
  );
}
