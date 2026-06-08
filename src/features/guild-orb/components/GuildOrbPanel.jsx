import { Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GuildOrbMessage } from "./GuildOrbMessage.jsx";

const guildOrbCommands = [
  {
    description: "Panggil Bola Sihir untuk menjawab atau memberi saran.",
    label: "@ai",
    trigger: "@",
    value: "@ai ",
  },
  {
    description: "Buat diagram Mermaid dari alur quest atau workflow.",
    label: "/diagram",
    trigger: "/",
    value: "/diagram ",
  },
  {
    description: "Ringkas diskusi dan progress workspace.",
    label: "/summary",
    trigger: "/",
    value: "/summary ",
  },
  {
    description: "Pecah misi besar menjadi checklist kecil.",
    label: "/quest",
    trigger: "/",
    value: "/quest ",
  },
  {
    description: "Susun rencana sprint singkat untuk party.",
    label: "/plan",
    trigger: "/",
    value: "/plan ",
  },
  {
    description: "Tampilkan daftar command yang bisa dipakai di Guild Orb.",
    label: "/help",
    trigger: "/",
    value: "/help ",
  },
];

export function GuildOrbPanel({
  error,
  isAiThinking,
  isCreatingGeneratedQuests,
  isLoading,
  messages,
  mode,
  onClose,
  onCreateGeneratedQuests,
  onSend,
  workspaceName,
}) {
  const [draft, setDraft] = useState("");
  const [activeTrigger, setActiveTrigger] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const visibleCommands = guildOrbCommands.filter((command) => command.trigger === activeTrigger);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isAiThinking]);

  function updateDraft(nextDraft) {
    setDraft(nextDraft);
    const trimmedDraft = nextDraft.trimStart();
    const lastToken = trimmedDraft.split(/\s+/).at(-1) ?? "";
    if (trimmedDraft === "@" || lastToken === "@") {
      setActiveTrigger("@");
    } else if (trimmedDraft === "/" || lastToken === "/") {
      setActiveTrigger("/");
    } else {
      setActiveTrigger("");
    }
  }

  function handleCommandSelect(command) {
    setDraft((currentDraft) => {
      const nextDraft = currentDraft.replace(/(^|\s)([@/])$/, `$1${command.value}`);
      return nextDraft === currentDraft ? `${currentDraft}${command.value}` : nextDraft;
    });
    setActiveTrigger("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextDraft = draft.trim();
    if (!nextDraft) return;
    setDraft("");
    setActiveTrigger("");
    await onSend(nextDraft);
  }

  return (
    <section className="guild-orb-panel" aria-label="Guild Orb">
      <header className="guild-orb-panel-header">
        <div>
          <span>{mode === "clan" ? "Guild Channel" : "Solo Grimoire"}</span>
          <h2>Guild Orb</h2>
          <p>{workspaceName || "Questify Workspace"}</p>
        </div>
        <button aria-label="Tutup Guild Orb" onClick={onClose} type="button">
          <X size={17} />
        </button>
      </header>

      <div className="guild-orb-messages">
        {isLoading ? (
          <div className="guild-orb-empty">Membuka bola sihir...</div>
        ) : messages.length ? (
          messages.map((message) => (
            <GuildOrbMessage
              isCreatingGeneratedQuests={isCreatingGeneratedQuests}
              key={message.id}
              message={message}
              onCreateGeneratedQuests={onCreateGeneratedQuests}
            />
          ))
        ) : (
          <div className="guild-orb-empty">
            <Sparkles size={18} />
            <strong>Orb masih sunyi.</strong>
            <span>Tulis rune, panggil @ai, atau minta /diagram.</span>
          </div>
        )}
        {isAiThinking && (
          <div className="guild-orb-thinking">
            <Sparkles size={15} />
            Bola Sihir membaca rune...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="guild-orb-error">{error}</div>}

      <details className="guild-orb-command-guide">
        <summary>Command Guide</summary>
        <div>
          {guildOrbCommands.map((command) => (
            <button
              key={command.label}
              onClick={() => handleCommandSelect(command)}
              type="button"
            >
              <strong>{command.label}</strong>
              <span>{command.description}</span>
            </button>
          ))}
        </div>
      </details>

      <form className="guild-orb-input" onSubmit={handleSubmit}>
        {visibleCommands.length > 0 && (
          <div className="guild-orb-command-palette">
            {visibleCommands.map((command) => (
              <button
                key={command.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleCommandSelect(command)}
                type="button"
              >
                <strong>{command.label}</strong>
                <span>{command.description}</span>
              </button>
            ))}
          </div>
        )}
        <input
          aria-label="Tulis pesan Guild Orb"
          onBlur={() => window.setTimeout(() => setActiveTrigger(""), 120)}
          onChange={(event) => updateDraft(event.target.value)}
          onFocus={() => updateDraft(draft)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveTrigger("");
          }}
          placeholder="Tulis rune atau panggil @ai..."
          ref={inputRef}
          value={draft}
        />
        <button
          aria-label="Kirim rune"
          className="guild-orb-input-submit"
          disabled={!draft.trim()}
          type="submit"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}
