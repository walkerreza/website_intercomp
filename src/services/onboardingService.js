import { isSupabaseConfigured, supabase } from "../lib/supabase.js";
import { isOnboardingComplete } from "../features/onboarding/onboardingSteps.js";

const ONBOARDING_STORAGE_PREFIX = "questify:onboarding:v1";

function getStorageKey(accountId = "") {
  return `${ONBOARDING_STORAGE_PREFIX}:${accountId || "local"}`;
}

function createEmptyProgress() {
  return {
    completedAt: null,
    completedSteps: [],
    dismissedAt: null,
    startedAt: null,
    updatedAt: null,
  };
}

function normalizeProgress(progress = {}) {
  return {
    ...createEmptyProgress(),
    ...progress,
    completedSteps: Array.isArray(progress.completedSteps)
      ? [...new Set(progress.completedSteps)]
      : [],
  };
}

function mapRemoteProgress(row) {
  if (!row) return createEmptyProgress();

  return normalizeProgress({
    completedAt: row.completed_at,
    completedSteps: row.completed_steps,
    dismissedAt: row.dismissed_at,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  });
}

function mapProgressForRemote(progress) {
  return {
    completed_at: progress.completedAt,
    completed_steps: progress.completedSteps,
    dismissed_at: progress.dismissedAt,
    started_at: progress.startedAt,
    updated_at: progress.updatedAt,
  };
}

function isMissingOnboardingTableError(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`;
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("user_onboarding_progress") ||
    message.includes("schema cache")
  );
}

function loadLocalProgress(accountId) {
  try {
    const saved = window.localStorage.getItem(getStorageKey(accountId));
    return saved ? normalizeProgress(JSON.parse(saved)) : createEmptyProgress();
  } catch {
    window.localStorage.removeItem(getStorageKey(accountId));
    return createEmptyProgress();
  }
}

function saveLocalProgress(accountId, progress) {
  const normalized = normalizeProgress(progress);
  window.localStorage.setItem(getStorageKey(accountId), JSON.stringify(normalized));
  return normalized;
}

async function getCurrentSupabaseUserId() {
  if (!isSupabaseConfigured) return "";

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? "";
}

async function loadRemoteProgress() {
  const userId = await getCurrentSupabaseUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_onboarding_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingOnboardingTableError(error)) return null;
    throw error;
  }

  return mapRemoteProgress(data);
}

async function saveRemoteProgress(progress) {
  const userId = await getCurrentSupabaseUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("user_onboarding_progress")
    .upsert({
      user_id: userId,
      ...mapProgressForRemote(progress),
    });

  if (error && !isMissingOnboardingTableError(error)) throw error;
}

export async function loadOnboardingProgress(accountId) {
  const localProgress = loadLocalProgress(accountId);

  if (!isSupabaseConfigured) return localProgress;

  try {
    const remoteProgress = await loadRemoteProgress();
    if (!remoteProgress) return localProgress;

    const localUpdatedAt = localProgress.updatedAt ? new Date(localProgress.updatedAt).getTime() : 0;
    const remoteUpdatedAt = remoteProgress.updatedAt ? new Date(remoteProgress.updatedAt).getTime() : 0;
    const selectedProgress = remoteUpdatedAt >= localUpdatedAt ? remoteProgress : localProgress;

    saveLocalProgress(accountId, selectedProgress);
    return selectedProgress;
  } catch {
    return localProgress;
  }
}

export async function saveOnboardingProgress(accountId, nextProgress) {
  const progress = normalizeProgress({
    ...nextProgress,
    updatedAt: new Date().toISOString(),
  });

  const completed = isOnboardingComplete(progress.completedSteps);
  if (completed && !progress.completedAt) {
    progress.completedAt = new Date().toISOString();
  }

  saveLocalProgress(accountId, progress);

  if (isSupabaseConfigured) {
    try {
      await saveRemoteProgress(progress);
    } catch {
      // Local progress remains the fallback when Supabase is unavailable.
    }
  }

  return progress;
}

export async function startOnboardingForAccount(accountId) {
  const currentProgress = loadLocalProgress(accountId);
  const now = new Date().toISOString();

  if (currentProgress.completedAt) return currentProgress;

  return saveOnboardingProgress(accountId, {
    ...currentProgress,
    dismissedAt: null,
    startedAt: currentProgress.startedAt || now,
  });
}
