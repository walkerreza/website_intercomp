import { FOCUS_STATUS } from "../utils/timerHelpers.js";

export function MissionSummary({ mission, status }) {
  const earnedXp = Math.round(mission.baseXp * mission.methodMultiplier);
  const isCompleted = status === FOCUS_STATUS.COMPLETED;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      marginTop: "1.5rem"
    }}>
      <div style={{
        background: isCompleted ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
        border: isCompleted ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
        padding: "6px 16px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: isCompleted ? "#4ade80" : "#9ca3af",
        textTransform: "uppercase",
        marginBottom: "1rem",
        transition: "all 0.3s ease"
      }}>
        {isCompleted ? "MISSION COMPLETE" : "FOCUS SESSION ACTIVE"}
      </div>
      
      <h2 style={{
        fontSize: "2rem",
        fontWeight: 600,
        margin: 0,
        color: "#fff"
      }}>
        {mission.cardTitle}
      </h2>
      
      <div style={{
        display: "flex",
        gap: "1.5rem",
        color: "#9ca3af",
        fontSize: "1rem",
        marginTop: "0.5rem"
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#fbbf24" }}>★</span>
          {mission.cardDifficulty} Quest
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#3b82f6" }}>▲</span>
          +{earnedXp} XP
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#a855f7" }}>⏱</span>
          {mission.methodName}
        </span>
      </div>
    </div>
  );
}
