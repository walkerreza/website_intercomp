import { useState, useEffect } from "react";

/**
 * Cinematic completion / abort screen with animated XP counter.
 * Renders a full-screen payoff moment before handing control back to the dashboard.
 */
export function CompletionScreen({ earnedXp, isAbort, progressPercentage, onDismiss }) {
  const [displayXp, setDisplayXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [phase, setPhase] = useState("enter"); // "enter" | "counting" | "done"

  // Animated XP counter — counts up over ~1.5s with easing
  useEffect(() => {
    if (earnedXp <= 0) {
      setPhase("done");
      return;
    }

    // Short delay before count starts so the screen has entered
    const enterDelay = setTimeout(() => {
      setPhase("counting");
      const duration = 1400;
      const steps = 40;
      const stepTime = duration / steps;
      let step = 0;

      const counter = setInterval(() => {
        step++;
        // Ease-out: fast at start, slow at end
        const progress = 1 - Math.pow(1 - step / steps, 3);
        setDisplayXp(Math.round(earnedXp * progress));

        if (step >= steps) {
          clearInterval(counter);
          setDisplayXp(earnedXp);
          setPhase("done");

          // Show level up after XP lands
          if (!isAbort && earnedXp >= 80) {
            setTimeout(() => setShowLevelUp(true), 400);
          }
        }
      }, stepTime);

      return () => clearInterval(counter);
    }, 300);

    return () => clearTimeout(enterDelay);
  }, [earnedXp, isAbort]);

  const accentColor = isAbort ? "#f59e0b" : "#4ade80";
  const accentGlow = isAbort
    ? "rgba(245, 158, 11, 0.3)"
    : "rgba(74, 222, 128, 0.3)";

  const progressBarWidth = `${Math.round((progressPercentage ?? 1) * 100)}%`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "radial-gradient(circle at 50% 40%, #1e1b4b 0%, #030712 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 0.4s ease-out forwards",
      }}
    >
      {/* Ambient grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          animation: "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        {/* Status badge */}
        <div
          style={{
            background: isAbort
              ? "rgba(245,158,11,0.12)"
              : "rgba(74,222,128,0.12)",
            border: `1px solid ${isAbort ? "rgba(245,158,11,0.3)" : "rgba(74,222,128,0.3)"}`,
            padding: "8px 22px",
            borderRadius: "24px",
            fontSize: "0.9rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: accentColor,
            textTransform: "uppercase",
          }}
        >
          {isAbort ? "MISSION ABORTED" : "MISSION COMPLETE"}
        </div>

        {/* Animated XP number */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "clamp(4rem, 12vw, 8rem)",
              fontWeight: 900,
              lineHeight: 1,
              color: accentColor,
              textShadow: `0 0 40px ${accentGlow}, 0 0 80px ${accentGlow}`,
              fontVariantNumeric: "tabular-nums",
              transition: "text-shadow 0.3s ease",
              letterSpacing: "-0.02em",
            }}
          >
            +{displayXp}
          </span>
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            XP {isAbort ? "Salvaged" : "Earned"}
          </span>
        </div>

        {/* Progress bar — shows session completion % */}
        <div style={{ width: "min(400px, 80vw)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "0.8rem",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <span>Session Progress</span>
            <span style={{ color: accentColor }}>
              {Math.round((progressPercentage ?? 1) * 100)}%
            </span>
          </div>
          <div
            style={{
              height: "6px",
              background: "rgba(255,255,255,0.07)",
              borderRadius: "99px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: phase !== "enter" ? progressBarWidth : "0%",
                background: isAbort
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #22c55e, #4ade80)",
                borderRadius: "99px",
                transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: `0 0 10px ${accentGlow}`,
              }}
            />
          </div>
        </div>

        {/* Level Up badge — appears only on full completion of high XP quests */}
        {showLevelUp && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))",
              border: "1px solid rgba(168,85,247,0.4)",
              padding: "10px 24px",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "#c084fc",
              textTransform: "uppercase",
              boxShadow: "0 0 20px rgba(168,85,247,0.25)",
              animation: "fade-in 0.5s ease-out, pulse 2s ease-in-out infinite",
            }}
          >
            ✨ LEVEL UP
          </div>
        )}

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          style={{
            marginTop: "1rem",
            padding: "14px 36px",
            background: isAbort
              ? "rgba(245,158,11,0.15)"
              : "linear-gradient(135deg, #22c55e, #16a34a)",
            border: isAbort ? "1px solid rgba(245,158,11,0.4)" : "none",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            boxShadow: isAbort ? "none" : "0 0 20px rgba(34,197,94,0.35)",
            opacity: phase === "done" ? 1 : 0,
            transition: "opacity 0.5s ease 0.3s",
            pointerEvents: phase === "done" ? "auto" : "none",
          }}
        >
          {isAbort ? "Return to Board" : "Claim & Continue"}
        </button>
      </div>
    </div>
  );
}
