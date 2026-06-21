import { useState, useEffect, useCallback } from "react";
import { FOCUS_STATUS } from "../utils/timerHelpers.js";

export const FOCUS_TIMER_STORAGE_KEY = "questify:focus_timer_state";

export function loadStoredFocusTimerState(cardId) {
  const saved = window.localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    return !cardId || parsed.cardId === cardId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearStoredFocusTimerState() {
  window.localStorage.removeItem(FOCUS_TIMER_STORAGE_KEY);
}

export function useFocusTimer(initialMission) {
  const [state, setState] = useState(() => {
    const savedState = loadStoredFocusTimerState(initialMission.cardId);
    if (savedState) return savedState;

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
    window.localStorage.setItem(FOCUS_TIMER_STORAGE_KEY, JSON.stringify(state));
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
    clearStoredFocusTimerState();
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
