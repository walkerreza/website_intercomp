import { useEffect, useState } from "react";
import { Maximize2, Square } from "lucide-react";
import { loadStoredFocusTimerState } from "../hooks/useFocusTimer.js";
import { FOCUS_STATUS, formatTime } from "../utils/timerHelpers.js";

function getRemainingTime(mission) {
  const storedTimer = loadStoredFocusTimerState(mission?.cardId);
  if (storedTimer?.status === FOCUS_STATUS.PAUSED) {
    return Math.max(0, storedTimer.remainingTime ?? 0);
  }
  if (storedTimer?.endTime) {
    return Math.max(0, storedTimer.endTime - Date.now());
  }
  if (!mission?.endTime) return 0;
  return Math.max(0, mission.endTime - Date.now());
}

function getStoredTimerStatus(mission) {
  return loadStoredFocusTimerState(mission?.cardId)?.status ?? FOCUS_STATUS.RUNNING;
}

export function FocusTimerTray({ activeMission, onAbort, onComplete, onOpen }) {
  const [remainingTime, setRemainingTime] = useState(() => getRemainingTime(activeMission));
  const [timerStatus, setTimerStatus] = useState(() => getStoredTimerStatus(activeMission));

  useEffect(() => {
    setRemainingTime(getRemainingTime(activeMission));
    setTimerStatus(getStoredTimerStatus(activeMission));

    const interval = window.setInterval(() => {
      const nextStatus = getStoredTimerStatus(activeMission);
      const nextRemainingTime = getRemainingTime(activeMission);
      setTimerStatus(nextStatus);
      setRemainingTime(nextRemainingTime);

      if (nextStatus !== FOCUS_STATUS.PAUSED && nextRemainingTime <= 0) {
        window.clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeMission, onComplete]);

  if (!activeMission) return null;

  return (
    <aside className="focus-timer-tray" aria-label="Minimized focus timer">
      <div className="focus-timer-tray__meta">
        <span>{timerStatus === FOCUS_STATUS.PAUSED ? "Paused" : activeMission.methodName || "Focus Session"}</span>
        <strong>{formatTime(remainingTime)}</strong>
      </div>
      <div className="focus-timer-tray__quest">
        <strong>{activeMission.cardTitle}</strong>
        <small>{activeMission.cardDifficulty || "Quest"} | +{Math.round(activeMission.baseXp * activeMission.methodMultiplier)} XP</small>
      </div>
      <div className="focus-timer-tray__actions">
        <button onClick={onOpen} type="button">
          <Maximize2 size={15} />
          Open
        </button>
        <button className="is-danger" onClick={onAbort} type="button">
          <Square size={14} />
          End
        </button>
      </div>
    </aside>
  );
}
