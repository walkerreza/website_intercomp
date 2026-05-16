import { useState } from "react";
import {
  Activity,
  Archive,
  CheckSquare,
  Crown,
  Eye,
  Lock,
  MessageSquare,
  Pencil,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";

export function QuestDetailModal({
  card,
  columnTitle,
  onAddComment,
  onArchiveQuest,
  onChecklistToggle,
  onClose,
  onDeleteQuest,
  onEditQuest,
}) {
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const checklistDone = card.checklist?.filter((item) => item.done).length ?? 0;
  const checklistTotal = card.checklist?.length ?? 0;
  const checklistPercent = checklistTotal
    ? Math.round((checklistDone / checklistTotal) * 100)
    : 0;

  async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!comment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(card, comment);
      setComment("");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <div className="sync-modal-backdrop" role="presentation">
      <section
        aria-label={`Detail quest ${card.title}`}
        aria-modal="true"
        className="sync-quest-detail-modal"
        role="dialog"
      >
        <header className="sync-quest-detail-header">
          <div>
            <small>{card.tag} | {columnTitle}</small>
            <h2>{card.title}</h2>
          </div>
          <button aria-label="Tutup detail quest" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="sync-quest-detail-layout">
          <section className="sync-quest-detail-main">
            <article className="sync-quest-detail-section">
              <h3>
                <Activity size={17} />
                Brief
              </h3>
              <p>{card.description}</p>
            </article>

            <article className="sync-quest-detail-section">
              <h3>
                <CheckSquare size={17} />
                Checklist {checklistDone}/{checklistTotal}
              </h3>
              <div className="sync-detail-check-progress">
                <span style={{ width: `${checklistPercent}%` }} />
              </div>
              <div className="sync-card-checklist sync-card-checklist--detail">
                {(card.checklist ?? []).length ? (
                  card.checklist.map((item) => (
                    <label className={item.done ? "is-checked" : ""} key={item.id}>
                      <input
                        checked={item.done}
                        onChange={() => onChecklistToggle(card.id, item.id)}
                        type="checkbox"
                      />
                      <span>{item.text}</span>
                    </label>
                  ))
                ) : (
                  <small className="sync-detail-muted">Belum ada checklist.</small>
                )}
              </div>
            </article>

            <article className="sync-quest-detail-section">
              <h3>
                <MessageSquare size={17} />
                Comments
              </h3>
              <form className="sync-detail-comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tulis komentar atau update progress..."
                  rows={3}
                  value={comment}
                />
                <button disabled={isSubmittingComment} type="submit">
                  {isSubmittingComment ? "Saving..." : "Add Comment"}
                </button>
              </form>
              <div className="sync-detail-comments">
                {(card.comments ?? []).length ? (
                  card.comments.map((item, index) => (
                    <article key={`${item}-${index}`}>
                      <strong>Comment #{card.comments.length - index}</strong>
                      <p>{item}</p>
                    </article>
                  ))
                ) : (
                  <small className="sync-detail-muted">Belum ada komentar.</small>
                )}
              </div>
            </article>
          </section>

          <aside className="sync-quest-detail-side">
            <div className="sync-detail-meta-list">
              {card.deadline && (
                <span>
                  <Activity size={15} />
                  {new Date(card.deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>
                <Zap size={15} />
                {card.difficulty ?? "Normal"}
              </span>
              <span>
                {card.visibility === "private" ? <Lock size={15} /> : <Eye size={15} />}
                {card.visibility === "private" ? "Owner + Creator" : "Workspace"}
              </span>
              <span>
                <Crown size={15} />
                {card.assignedRoleName ?? "Any Role"}
              </span>
              <span>
                <Users size={15} />
                {(card.members ?? []).length} member
              </span>
            </div>

            <div className="sync-detail-reward-card">
              <small>Reward</small>
              <strong>{card.claimed ? "CLAIMED" : card.reward}</strong>
              {card.penalty && <span>{card.penalty}</span>}
            </div>

            <div className="sync-detail-actions">
              <button onClick={() => onEditQuest(card)} type="button">
                <Pencil size={16} />
                Edit Quest
              </button>
              <button onClick={() => onArchiveQuest(card)} type="button">
                <Archive size={16} />
                Archive
              </button>
              <button className="is-danger" onClick={() => onDeleteQuest(card)} type="button">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
