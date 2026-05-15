import { FOCUS_STATUS } from "../utils/timerHelpers.js";
import { Play, Pause, Square } from "lucide-react";

export function FocusControls({ status, onPause, onResume, onAbort }) {
  // COMPLETED state is now handled by CompletionScreen — nothing to show here
  if (status === FOCUS_STATUS.COMPLETED) {
    return null;
  }

  const isPaused = status === FOCUS_STATUS.PAUSED;

  return (
    <div style={{ display: "flex", gap: "1.5rem", marginTop: "4rem" }}>
      <button
        onClick={isPaused ? onResume : onPause}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 28px",
          background: isPaused ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
          border: isPaused
            ? "1px solid rgba(59,130,246,0.4)"
            : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          color: isPaused ? "#60a5fa" : "#fff",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {isPaused ? <Play size={20} /> : <Pause size={20} />}
        {isPaused ? "Resume Session" : "Pause Session"}
      </button>

      <button
        onClick={onAbort}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 28px",
          background: "transparent",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
          color: "#f87171",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <Square size={20} />
        End Session
      </button>
    </div>
  );
}
