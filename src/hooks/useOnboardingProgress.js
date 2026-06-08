import { useEffect, useState } from "react";
import {
  getNextOnboardingStep,
  isOnboardingComplete,
} from "../features/onboarding/onboardingSteps.js";
import {
  loadOnboardingProgress,
  saveOnboardingProgress,
  startOnboardingForAccount,
} from "../services/onboardingService.js";

const emptyProgress = {
  completedAt: null,
  completedSteps: [],
  dismissedAt: null,
  startedAt: null,
  updatedAt: null,
};

function shouldAutoStartProgress(progress) {
  return (
    !progress.startedAt &&
    !progress.dismissedAt &&
    !progress.completedAt &&
    !progress.completedSteps.length
  );
}

export function useOnboardingProgress(accountId) {
  const [progress, setProgress] = useState(emptyProgress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      if (!accountId) {
        setProgress(emptyProgress);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const loadedProgress = await loadOnboardingProgress(accountId);
        if (shouldAutoStartProgress(loadedProgress)) {
          const startedProgress = await startOnboardingForAccount(accountId);
          if (isMounted) setProgress(startedProgress);
          return;
        }

        if (isMounted) setProgress(loadedProgress);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [accountId]);

  async function persistProgress(nextProgress) {
    const savedProgress = await saveOnboardingProgress(accountId, nextProgress);
    setProgress(savedProgress);
    return savedProgress;
  }

  async function completeStep(stepId) {
    if (!stepId || progress.completedSteps.includes(stepId)) return progress;

    return persistProgress({
      ...progress,
      completedSteps: [...progress.completedSteps, stepId],
    });
  }

  async function dismiss() {
    return persistProgress({
      ...progress,
      dismissedAt: new Date().toISOString(),
    });
  }

  async function restart() {
    const restartedProgress = await startOnboardingForAccount(accountId);
    setProgress({
      ...restartedProgress,
      completedAt: null,
      completedSteps: [],
      dismissedAt: null,
    });

    return persistProgress({
      ...restartedProgress,
      completedAt: null,
      completedSteps: [],
      dismissedAt: null,
      startedAt: restartedProgress.startedAt || new Date().toISOString(),
    });
  }

  const isComplete = isOnboardingComplete(progress.completedSteps) || Boolean(progress.completedAt);
  const isVisible = Boolean(progress.startedAt) && !progress.dismissedAt && !isComplete;

  return {
    completeStep,
    dismiss,
    isComplete,
    isLoading,
    isVisible,
    nextStep: getNextOnboardingStep(progress.completedSteps),
    progress,
    restart,
  };
}
