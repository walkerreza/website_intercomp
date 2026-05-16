import { formatTime } from "../utils/timerHelpers.js";

export function FocusClock({ remainingTime, isPaused }) {
  const timeString = formatTime(remainingTime);
  
  return (
    <div style={{
      fontFamily: "var(--font-pixel)",
      fontSize: "clamp(6rem, 15vw, 12rem)",
      fontWeight: 800,
      color: "#fff",
      lineHeight: 1,
      letterSpacing: 0,
      textShadow: "0 0 40px rgba(255, 255, 255, 0.15)",
      opacity: isPaused ? 0.5 : 1,
      transition: "opacity 0.3s ease",
      fontVariantNumeric: "tabular-nums"
    }}>
      {timeString}
    </div>
  );
}
