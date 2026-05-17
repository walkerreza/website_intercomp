import { useState } from "react";
import { Activity, CheckSquare, Crown, Eye, Lock, MessageSquare, Pencil, Users, Zap } from "lucide-react";

function getDueStatus(deadline) {
  if (!deadline) return null;

  const dueTime = new Date(deadline).getTime();
  if (Number.isNaN(dueTime)) return null;

  const now = Date.now();
  const hoursUntilDue = (dueTime - now) / 36e5;
  const today = new Date();
  const dueDate = new Date(deadline);
  const isToday =
    today.getFullYear() === dueDate.getFullYear() &&
    today.getMonth() === dueDate.getMonth() &&
    today.getDate() === dueDate.getDate();

  if (hoursUntilDue < 0) return { label: "Overdue", tone: "danger" };
  if (hoursUntilDue <= 2) return { label: "<2h", tone: "warning" };
  if (isToday) return { label: "Today", tone: "gold" };
  return null;
}

export function QuestCardContent({
  activeMission,
  card,
  columnId,
  isPreview = false,
  onChecklistToggle,
  onCompleteMission,
  onEditQuest,
  onOpenQuestDetail,
  onStartMission,
}) {
  const [showMethods, setShowMethods] = useState(false);
  const checklistDone = card.checklist?.filter((item) => item.done).length ?? 0;
  const checklistTotal = card.checklist?.length ?? 0;
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const dueStatus = getDueStatus(card.deadline);
  const isThisCardActive = activeMission?.cardId === card.id;
  const isAnyMissionActive = !!activeMission;

  const methodButtonBase = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 700,
    textAlign: "left",
    width: "100%",
    transition: "all 0.2s ease",
  };

  function handleMethodClick(event, minutes, multiplier, methodName) {
    event.stopPropagation();
    onStartMission?.(card, columnId, minutes, multiplier, methodName);
    setShowMethods(false);
  }

  return (
    <>
      <small>{card.tag}</small>
      {!isPreview && (
        <button
          aria-label={`Edit ${card.title}`}
          className="sync-card-edit-button"
          onClick={(event) => {
            event.stopPropagation();
            onEditQuest?.(card);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <Pencil size={14} />
        </button>
      )}
      {dueStatus ? (
        <span className={`sync-due-badge is-${dueStatus.tone}`}>{dueStatus.label}</span>
      ) : null}
      <h3>{card.title}</h3>
      {!isPreview && (
        <button
          className="sync-card-detail-trigger"
          onClick={(event) => {
            event.stopPropagation();
            onOpenQuestDetail?.(card);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          Open Detail
        </button>
      )}
      <p>{card.description}</p>
      {(card.visibility || card.assignedRoleName || card.checklist?.length || card.members?.length || card.comments?.length || card.deadline || card.difficulty) && (
        <div className="sync-card-meta">
          {card.deadline && (
            <span>
              <Activity size={14} />
              {new Date(card.deadline).toLocaleString("id-ID", {
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {card.difficulty && (
            <span>
              <Zap size={14} />
              {card.difficulty}
            </span>
          )}
          <span>
            {card.visibility === "private" ? <Lock size={14} /> : <Eye size={14} />}
            {card.visibility === "private" ? "Owner + Creator" : "Workspace"}
          </span>
          {card.assignedRoleName && (
            <span>
              <Crown size={14} />
              {card.assignedRoleName}
            </span>
          )}
          {card.checklist?.length > 0 && (
            <span>
              <CheckSquare size={14} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {card.members?.length > 0 && (
            <span>
              <Users size={14} />
              {card.members.length}
            </span>
          )}
          {card.comments?.length > 0 && (
            <span>
              <MessageSquare size={14} />
              {card.comments.length}
            </span>
          )}
        </div>
      )}
      {card.members?.length > 0 && (
        <div className="sync-member-pills">
          {card.members.map((member) => (
            <span key={member}>{member.slice(0, 2).toUpperCase()}</span>
          ))}
        </div>
      )}
      {card.checklist?.length > 0 && (
        <div className="sync-card-checklist" aria-label={`Checklist ${card.title}`}>
          <div className="sync-card-checklist-progress">
            <span style={{ width: `${checklistPercent}%` }} />
          </div>
          {card.checklist.map((item) => (
            <label
              className={item.done ? "is-checked" : ""}
              key={item.id}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <input
                checked={item.done}
                disabled={isPreview}
                onChange={() => onChecklistToggle?.(card.id, item.id)}
                type="checkbox"
              />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      )}
      <footer>
        <strong>{card.claimed ? "CLAIMED" : card.reward}</strong>
        {card.penalty && <em>{card.penalty}</em>}
      </footer>

      {/* START MISSION / IN PROGRESS — only for unclaimed cards NOT in done column */}
      {!isPreview && !card.claimed && columnId !== "done" && (
        <div
          style={{
            marginTop: "8px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "8px",
          }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {isThisCardActive ? (
            <div
              style={{
                textAlign: "center",
                padding: "8px 12px",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "8px",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.03em",
              }}
            >
              ⏳ IN PROGRESS — Check Timer
            </div>
          ) : isAnyMissionActive ? (
            <div
              style={{
                textAlign: "center",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.35)",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              🔒 Selesaikan misi aktif dulu
            </div>
          ) : !showMethods ? (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); setShowMethods(true); }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none",
                borderRadius: "8px",
                color: "#000",
                fontWeight: 800,
                fontSize: "0.8rem",
                letterSpacing: "0.05em",
                cursor: "pointer",
                textTransform: "uppercase",
                boxShadow: "0 0 12px rgba(245,158,11,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              ⚔️ START MISSION
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <button
                type="button"
                onClick={(event) => handleMethodClick(event, 1, 1.0, "Testing")}
                style={{
                  ...methodButtonBase,
                  background: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1))",
                  borderColor: "rgba(34,197,94,0.4)",
                }}
              >
                <span style={{ fontSize: "1rem" }}>🧪</span>
                <span>Testing <small style={{ opacity: 0.7 }}>(1m)</small></span>
                <span style={{ marginLeft: "auto", color: "#4ade80", fontWeight: 800 }}>1.0x</span>
              </button>
              <button
                type="button"
                onClick={(event) => handleMethodClick(event, 15, 1.0, "Sprint")}
                style={{
                  ...methodButtonBase,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))",
                  borderColor: "rgba(59,130,246,0.4)",
                }}
              >
                <span style={{ fontSize: "1rem" }}>⚡</span>
                <span>Sprint <small style={{ opacity: 0.7 }}>(15m)</small></span>
                <span style={{ marginLeft: "auto", color: "#60a5fa", fontWeight: 800 }}>1.0x</span>
              </button>
              <button
                type="button"
                onClick={(event) => handleMethodClick(event, 25, 1.5, "Pomodoro")}
                style={{
                  ...methodButtonBase,
                  background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1))",
                  borderColor: "rgba(239,68,68,0.4)",
                }}
              >
                <span style={{ fontSize: "1rem" }}>🍅</span>
                <span>Pomodoro <small style={{ opacity: 0.7 }}>(25m)</small></span>
                <span style={{ marginLeft: "auto", color: "#f87171", fontWeight: 800 }}>1.5x</span>
              </button>
              <button
                type="button"
                onClick={(event) => handleMethodClick(event, 50, 2.5, "Deep Work")}
                style={{
                  ...methodButtonBase,
                  background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(168,85,247,0.1))",
                  borderColor: "rgba(168,85,247,0.4)",
                }}
              >
                <span style={{ fontSize: "1rem" }}>🧠</span>
                <span>Deep Work <small style={{ opacity: 0.7 }}>(50m)</small></span>
                <span style={{ marginLeft: "auto", color: "#a855f7", fontWeight: 800 }}>2.5x</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
