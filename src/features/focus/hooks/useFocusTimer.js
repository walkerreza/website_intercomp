import { useState, useEffect, useCallback } from "react";
import { FOCUS_STATUS } from "../utils/timerHelpers.js";

const STORAGE_KEY = "questify:focus_timer_state";

export function useFocusTimer(initialMission) {
  const [state, setState] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cardId === initialMission.cardId) {
          return parsed;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    const totalSessionTime = initialMission.endTime - Date.now();
    return {
      cardId: initialMission.cardId,
      status: FOCUS_STATUS.RUNNING,
      remainingTime: Math.max(0, totalSessionTime),
      endTime: initialMission.endTime,
      totalSessionTime: Math.max(0, totalSessionTime),
      pausedAt: null,
    };
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Main tick interval
  useEffect(() => {
    if (state.status !== FOCUS_STATUS.RUNNING) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newRemaining = Math.max(0, prev.endTime - Date.now());
        if (newRemaining <= 0) {
          return { ...prev, remainingTime: 0, status: FOCUS_STATUS.COMPLETED };
        }
        return { ...prev, remainingTime: newRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status, state.endTime]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.status !== FOCUS_STATUS.RUNNING) return prev;
      return { ...prev, status: FOCUS_STATUS.PAUSED, pausedAt: Date.now() };
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.status !== FOCUS_STATUS.PAUSED) return prev;
      const now = Date.now();
      const pauseDuration = now - prev.pausedAt;
      return {
        ...prev,
        status: FOCUS_STATUS.RUNNING,
        endTime: prev.endTime + pauseDuration,
        pausedAt: null,
      };
    });
  }, []);

  const abort = useCallback(() => {
    setState((prev) => ({ ...prev, status: FOCUS_STATUS.ABORTED }));
  }, []);

  const clearState = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  // How much time has actually elapsed (accounting for pauses)
  const elapsedTime = state.totalSessionTime - state.remainingTime;

  return {
    status: state.status,
    remainingTime: state.remainingTime,
    totalSessionTime: state.totalSessionTime,
    elapsedTime: Math.max(0, elapsedTime),
    pause,
    resume,
    abort,
    clearState,
  };
}
