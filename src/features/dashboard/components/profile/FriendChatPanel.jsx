import { Send, X } from "lucide-react";

function formatChatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export function FriendChatPanel({
  chatMessage,
  currentUserId,
  friend,
  isLoading = false,
  isSending = false,
  messages = [],
  onChatMessageChange,
  onClose,
  onDragPointerDown,
  onSendMessage,
}) {
  return (
    <section
      aria-label="Party chat"
      className="sync-profile-form sync-profile-chat-panel"
      role="dialog"
    >
      <header
        className="sync-profile-panel-heading sync-profile-chat-panel__header"
        onPointerDown={onDragPointerDown}
      >
        <div>
          <h3>Party Chat</h3>
          <span>{friend ? friend.username : "Pilih teman"}</span>
        </div>
        <button
          aria-label="Tutup party chat"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <X size={16} />
        </button>
      </header>

      <div className="sync-profile-chat-panel__messages">
        {!friend && (
          <small className="sync-profile-help">
            Pilih teman accepted dari Friend List untuk membuka chat.
          </small>
        )}

        {friend && isLoading && (
          <small className="sync-profile-help">Memuat pesan...</small>
        )}

        {friend && !isLoading && !messages.length && (
          <small className="sync-profile-help">Belum ada pesan. Mulai chat party.</small>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;

          return (
            <article className={isMine ? "is-mine" : ""} key={message.id}>
              <strong>{isMine ? "You" : message.senderName}</strong>
              <p>{message.content}</p>
              <small>{formatChatTime(message.createdAt)}</small>
            </article>
          );
        })}
      </div>

      <form className="sync-profile-chat-panel__composer" onSubmit={onSendMessage}>
        <input
          disabled={!friend || isSending}
          maxLength={1000}
          onChange={(event) => onChatMessageChange(event.target.value)}
          placeholder={friend ? "Tulis pesan..." : "Pilih teman dulu"}
          type="text"
          value={chatMessage}
        />
        <button disabled={!friend || isSending || !chatMessage.trim()} type="submit">
          <Send size={15} />
          {isSending ? "Send..." : "Send"}
        </button>
      </form>
    </section>
  );
}
