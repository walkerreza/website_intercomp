import { UserRound } from "lucide-react";
import { MermaidMessage } from "./MermaidMessage.jsx";

function splitMessageParts(content = "", contentType = "text") {
  const blockPattern = /```mermaid\s*([\s\S]*?)```/gi;
  const parts = [];
  let lastIndex = 0;
  let match = blockPattern.exec(content);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index).trim() });
    }
    parts.push({ type: "mermaid", value: match[1].trim() });
    lastIndex = blockPattern.lastIndex;
    match = blockPattern.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex).trim() });
  }

  if (!parts.length && contentType === "mermaid") {
    parts.push({ type: "mermaid", value: content.trim() });
  }

  return parts.filter((part) => part.value);
}

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function GuildOrbMessage({ message }) {
  const isAi = message.senderType === "ai";
  const isSystem = message.senderType === "system";
  const parts = splitMessageParts(message.content, message.contentType);

  return (
    <article className={`guild-orb-message ${isAi ? "is-ai" : ""} ${isSystem ? "is-system" : ""}`}>
      <div className="guild-orb-message-icon">
        {isAi ? <span className="guild-orb-logo guild-orb-logo--small" aria-hidden="true" /> : <UserRound size={15} />}
      </div>
      <div className="guild-orb-message-body">
        <header>
          <strong>{isAi ? "Bola Sihir" : message.senderName || "Guild Member"}</strong>
          <span>{formatMessageTime(message.createdAt)}</span>
        </header>
        <div className="guild-orb-message-content">
          {parts.map((part, index) =>
            part.type === "mermaid" ? (
              <MermaidMessage chart={part.value} key={`${message.id}-diagram-${index}`} />
            ) : (
              <p key={`${message.id}-text-${index}`}>{part.value}</p>
            ),
          )}
        </div>
      </div>
    </article>
  );
}
