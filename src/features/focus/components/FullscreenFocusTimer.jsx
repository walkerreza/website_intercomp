import { useState, useEffect } from "react";
import { useFocusTimer } from "../hooks/useFocusTimer.js";
import { FOCUS_STATUS } from "../utils/timerHelpers.js";
import { calculateFullXp, calculateAbortXp } from "../reward/rewardCalculator.js";
import { FocusClock } from "./FocusClock.jsx";
import { MissionSummary } from "./MissionSummary.jsx";
import { FocusControls } from "./FocusControls.jsx";
import { CompletionScreen } from "./CompletionScreen.jsx";

/**
 * FullscreenFocusTimer
 * Orchestrates the entire focus session lifecycle:
 *   Running → Paused → Completed / Aborted → CompletionScreen → Dashboard
 *
 * Props:
 *   activeMission  — mission payload from DashboardPage
 *   onAbort(earnedXp, fromColumnId)       — called on abort with partial XP already calculated
 *   onComplete(cardId, fromColumnId, methodMultiplier) — called on full completion
 */
export function FullscreenFocusTimer({ activeMission, onAbort, onComplete }) {
  const {
    status,
    remainingTime,
    totalSessionTime,
    elapsedTime,
    pause,
    resume,
    abort,
    clearState,
  } = useFocusTimer(activeMission);

  // Payoff screen state
  const [payoff, setPayoff] = useState(null); // { earnedXp, isAbort, progressPercentage }

  // Keyboard shortcut: Space = pause/resume
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.code === "Space" && !payoff) {
        e.preventDefault();
        if (status === FOCUS_STATUS.RUNNING) pause();
        else if (status === FOCUS_STATUS.PAUSED) resume();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, pause, resume, payoff]);

  // Lock background scroll while overlay is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // When timer naturally completes, show the payoff screen
  useEffect(() => {
    if (status === FOCUS_STATUS.COMPLETED && !payoff) {
      const earnedXp = calculateFullXp(
        activeMission.baseXp,
        activeMission.methodMultiplier,
      );
      setPayoff({ earnedXp, isAbort: false, progressPercentage: 1 });
    }
  }, [status, payoff, activeMission]);

  function handleAbort() {
    const { earnedXp, progressPercentage } = calculateAbortXp(
      activeMission.baseXp,
      activeMission.methodMultiplier,
      elapsedTime,
      totalSessionTime,
    );
    abort();
    setPayoff({ earnedXp, isAbort: true, progressPercentage });
  }

  function handlePayoffDismiss() {
    clearState();
    if (payoff.isAbort) {
      // Pass earned XP so Dashboard can grant partial reward
      onAbort(payoff.earnedXp);
    } else {
      onComplete(activeMission.cardId, activeMission.fromColumnId, activeMission.methodMultiplier);
    }
  }

  // If in payoff phase, render the cinematic reward screen
  if (payoff) {
    return (
      <CompletionScreen
        earnedXp={payoff.earnedXp}
        isAbort={payoff.isAbort}
        progressPercentage={payoff.progressPercentage}
        onDismiss={handlePayoffDismiss}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "radial-gradient(circle at 50% 40%, #1e1b4b 0%, #030712 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 0.5s ease-out forwards",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
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
          animation: "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <FocusClock
          remainingTime={remainingTime}
          isPaused={status === FOCUS_STATUS.PAUSED}
        />

        <MissionSummary mission={activeMission} status={status} />

        <FocusControls
          status={status}
          onPause={pause}
          onResume={resume}
          onAbort={handleAbort}
          onComplete={() => {}} // timer-based only, no manual complete during running
        />
      </div>
    </div>
  );
}
