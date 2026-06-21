import { useState } from "react";
import { PlusCircle, UserRound } from "lucide-react";
import { MermaidMessage } from "./MermaidMessage.jsx";
import { parseGeneratedQuestDrafts } from "../utils/generatedQuestParser.js";

function removeGeneratedQuestJson(content = "") {
  let cleanedContent = content.replace(/```json\s*([\s\S]*?)```/gi, (match, jsonBody) => {
    return /"questifyQuests"\s*:/.test(jsonBody) ? "" : match;
  });

  cleanedContent = cleanedContent.replace(/\{\s*"questifyQuests"\s*:\s*\[[\s\S]*?\]\s*\}/gi, "");

  return cleanedContent.trim();
}

function splitMessageParts(content = "", contentType = "text") {
  const blockPattern = /```mermaid\s*([\s\S]*?)```/gi;
  const rawMermaidPattern = /^\s*(lowchart|flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|journey|gantt|pie)\b/i;
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

  if (!parts.length && rawMermaidPattern.test(content)) {
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

export function GuildOrbMessage({ isCreatingGeneratedQuests, message, onCreateGeneratedQuests }) {
  const isAi = message.senderType === "ai";
  const isSystem = message.senderType === "system";
  const generatedQuestDrafts = isAi ? parseGeneratedQuestDrafts(message.content) : [];
  const visibleContent = generatedQuestDrafts.length
    ? removeGeneratedQuestJson(message.content)
    : message.content;
  const parts = splitMessageParts(visibleContent, message.contentType);
  const [createdDraftIds, setCreatedDraftIds] = useState(() => new Set());
  const [importError, setImportError] = useState("");

  async function handleCreateDrafts(drafts) {
    if (!drafts.length || !onCreateGeneratedQuests) return;

    try {
      setImportError("");
      await onCreateGeneratedQuests(drafts);
      setCreatedDraftIds((currentIds) => {
        const nextIds = new Set(currentIds);
        drafts.forEach((draft) => nextIds.add(draft.id));
        return nextIds;
      });
    } catch (error) {
      setImportError(error.message || "Gagal menambahkan generated quest.");
    }
  }

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
        {generatedQuestDrafts.length > 0 && (
          <div className="guild-orb-generated-quests">
            <header>
              <span>{generatedQuestDrafts.length} AI QUEST DRAFT</span>
              <button
                disabled={
                  !onCreateGeneratedQuests ||
                  isCreatingGeneratedQuests ||
                  generatedQuestDrafts.every((draft) => createdDraftIds.has(draft.id))
                }
                onClick={() =>
                  handleCreateDrafts(
                    generatedQuestDrafts.filter((draft) => !createdDraftIds.has(draft.id)),
                  )
                }
                type="button"
              >
                <PlusCircle size={14} />
                Add All
              </button>
            </header>
            {generatedQuestDrafts.map((draft) => {
              const isCreated = createdDraftIds.has(draft.id);

              return (
                <article className={isCreated ? "is-created" : ""} key={draft.id}>
                  <div>
                    <strong>{draft.title}</strong>
                    <small>{draft.difficulty} | {draft.label}</small>
                  </div>
                  <button
                    disabled={!onCreateGeneratedQuests || isCreatingGeneratedQuests || isCreated}
                    onClick={() => handleCreateDrafts([draft])}
                    type="button"
                  >
                    {!onCreateGeneratedQuests ? "Open Board" : isCreated ? "Added" : "Add"}
                  </button>
                </article>
              );
            })}
            {importError && <p>{importError}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
