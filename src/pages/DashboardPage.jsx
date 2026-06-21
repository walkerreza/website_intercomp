import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Volume2, VolumeX } from "lucide-react";
import { DASHBOARD_BACKGROUND_KEY } from "../data/dashboardBackgrounds.js";
import { roles } from "../data/roles.js";
import { ProfileMenuModal } from "../features/dashboard/components/profile/ProfileMenuModal.jsx";
import { FriendChatPanel } from "../features/dashboard/components/profile/FriendChatPanel.jsx";
import { NotificationCenter } from "../features/dashboard/components/notifications/NotificationCenter.jsx";
import { QuestCardContent } from "../features/dashboard/components/quest/QuestCardContent.jsx";
import { QuestComposerModal } from "../features/dashboard/components/quest/QuestComposerModal.jsx";
import { QuestDetailModal } from "../features/dashboard/components/quest/QuestDetailModal.jsx";
import { DashboardSidebar } from "../features/dashboard/components/sidebar/DashboardSidebar.jsx";
import { StarterTutorialCard } from "../features/onboarding/components/StarterTutorialCard.jsx";
import { ONBOARDING_STEP_IDS } from "../features/onboarding/onboardingSteps.js";
import { GuildOrb } from "../features/guild-orb/components/GuildOrb.jsx";
import { QuestifyLogo } from "../components/QuestifyLogo.jsx";
import {
  initialBoardColumns,
  navItems,
  questLabelOptions,
  roleDashboards,
} from "../features/dashboard/config/dashboardConfig.js";
import {
  canViewerSeeQuest,
  createChecklistItems,
  getLevelProgress,
  getTargetColumnId,
  loadCharacterState,
  loadWorkspaceState,
  mergeChecklistItems,
  moveQuestCard,
} from "../features/dashboard/utils/dashboardUtils.js";
import { calculateQuestRewardPreview } from "../features/dashboard/utils/rolePassiveEngine.js";
import { FullscreenFocusTimer } from "../features/focus/components/FullscreenFocusTimer.jsx";
import { FocusTimerTray } from "../features/focus/components/FocusTimerTray.jsx";
import { clearStoredFocusTimerState } from "../features/focus/hooks/useFocusTimer.js";
import { useOnboardingProgress } from "../hooks/useOnboardingProgress.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { CommandCenterPage } from "./dashboard/CommandCenterPage.jsx";
import { ArchivePage } from "./dashboard/ArchivePage.jsx";
import { ClanDirectoryPage } from "./dashboard/ClanDirectoryPage.jsx";
import { ClanPage } from "./dashboard/ClanPage.jsx";
import { InventoryPage } from "./dashboard/InventoryPage.jsx";
import { QuestBoardPage } from "./dashboard/QuestBoardPage.jsx";
import { ShopPage } from "./dashboard/ShopPage.jsx";
import { WorkspacePage } from "./dashboard/WorkspacePage.jsx";
import {
  addQuestCommentInSupabase,
  archiveQuestInSupabase,
  claimQuestRewardInSupabase,
  createClanInSupabase,
  createPersonalWorkspaceInSupabase,
  createQuestInSupabase,
  createWorkspaceForClanInSupabase,
  deleteWorkspaceInSupabase,
  deleteQuestInSupabase,
  deleteDeadlineNotificationsInSupabase,
  loadCommandCenterSummaryFromSupabase,
  loadArchivedQuestsFromSupabase,
  loadDashboardFromSupabase,
  loadDeadlineNotificationsFromSupabase,
  markDeadlineNotificationsReadInSupabase,
  moveQuestInSupabase,
  recordQuestFocusSessionInSupabase,
  requestJoinClanByCodeInSupabase,
  restoreQuestInSupabase,
  subscribeWorkspaceRealtime,
  updateChecklistItemInSupabase,
  updateQuestInSupabase,
} from "../services/dashboardService.js";
import {
  addFriendByUserId,
  deleteCurrentUserAccount,
  deleteFriendByUserId,
  loadFriendMessages,
  loadProfileSummary,
  searchFriendProfiles,
  sendFriendMessage,
  updateAccountPassword,
  updateProfileName,
} from "../services/profileService.js";
import {
  activateInventoryItem,
  buyShopItem,
  loadShopInventorySummary,
} from "../services/shopService.js";

const emptyCommandCenterSummary = {
  clans: [],
  priorityQuests: [],
  profile: { gold: 0, xp: 0 },
  questStats: { active: 0, completed: 0, overdue: 0, dueSoon: 0 },
  workspaces: [],
};

const emptyShopInventorySummary = {
  activeBoosts: [],
  catalog: [],
  inventory: [],
  profile: { gold: 0 },
};

const emptyQuestFilters = {
  difficulty: "",
  dueStatus: "",
  label: "",
  member: "",
  search: "",
};

const ACTIVE_MISSION_STORAGE_KEY = "questify:active_mission";

function getActiveMissionStorageKey(accountId) {
  return `${ACTIVE_MISSION_STORAGE_KEY}:${accountId || "anonymous"}`;
}

function loadStoredActiveMission(accountId) {
  const storageKey = getActiveMissionStorageKey(accountId);
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function saveStoredActiveMission(accountId, missionData) {
  window.localStorage.setItem(
    getActiveMissionStorageKey(accountId),
    JSON.stringify(missionData),
  );
}

function removeStoredActiveMission(accountId) {
  window.localStorage.removeItem(getActiveMissionStorageKey(accountId));
  window.localStorage.removeItem(ACTIVE_MISSION_STORAGE_KEY);
}

function getQuestDueStatus(card) {
  if (!card.deadline) return "none";

  const dueTime = new Date(card.deadline).getTime();
  if (Number.isNaN(dueTime)) return "none";

  const now = Date.now();
  const hoursUntilDue = (dueTime - now) / 36e5;
  const today = new Date();
  const dueDate = new Date(card.deadline);
  const isToday =
    today.getFullYear() === dueDate.getFullYear() &&
    today.getMonth() === dueDate.getMonth() &&
    today.getDate() === dueDate.getDate();

  if (hoursUntilDue < 0) return "overdue";
  if (hoursUntilDue <= 2) return "soon";
  if (isToday) return "today";
  return "upcoming";
}

function cardMatchesFilters(card, filters) {
  const query = filters.search.trim().toLowerCase();
  const searchable = [
    card.title,
    card.description,
    card.difficulty,
    card.assignedRoleName,
    ...(card.members ?? []),
  ].join(" ").toLowerCase();

  if (query && !searchable.includes(query)) return false;
  if (filters.member && !(card.members ?? []).includes(filters.member)) return false;
  if (filters.difficulty && card.difficulty !== filters.difficulty) return false;
  if (filters.label && card.label !== filters.label) return false;
  if (filters.dueStatus && getQuestDueStatus(card) !== filters.dueStatus) return false;
  return true;
}

function getBattleDifficultyScore(difficulty = "") {
  const scores = {
    "S-Rank": 6,
    "A-Rank": 5,
    "B-Rank": 4,
    "C-Rank": 3,
    "D-Rank": 2,
    "E-Rank": 1,
  };

  return scores[difficulty] ?? 0;
}

function getBattleDueScore(card) {
  const status = getQuestDueStatus(card);
  if (status === "overdue") return 5000;
  if (status === "soon") return 4000;
  if (status === "today") return 3000;
  if (status === "upcoming") return 1000;
  return 0;
}

function getBattleDeadlineTime(card) {
  if (!card.deadline) return Number.MAX_SAFE_INTEGER;
  const time = new Date(card.deadline).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function formatBattleDeadline(deadline) {
  if (!deadline) return "Tanpa deadline";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Deadline belum valid";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function DashboardPage({
  accountId,
  initialWorkspaceId = "",
  initialView = "command",
  isMusicPlaying = false,
  musicVolume = 0,
  roleId,
  onBackToBoards,
  onLogout,
  onMusicSpeakerToggle,
  onNavigateView,
  onOpenSettings,
}) {
  const [activeView, setActiveView] = useState(initialView);
  const [workspaceSubPage, setWorkspaceSubPage] = useState("directory");
  const [selectedClanId, setSelectedClanId] = useState("");
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuestComposerOpen, setIsQuestComposerOpen] = useState(false);
  const [isQuestPositionEditMode, setIsQuestPositionEditMode] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedQuestDetail, setSelectedQuestDetail] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const [questColumns, setQuestColumns] = useState(initialBoardColumns);
  const [workspaceState, setWorkspaceState] = useState(() =>
    loadWorkspaceState(accountId, roleId),
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() =>
    initialWorkspaceId || window.localStorage.getItem(`questify:active_workspace:${accountId}`) || "",
  );
  const [workspaceViewerId, setWorkspaceViewerId] = useState(accountId);
  const [supabaseUserId, setSupabaseUserId] = useState("");
  const [dashboardSource, setDashboardSource] = useState("local");
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [commandCenterSummary, setCommandCenterSummary] = useState(emptyCommandCenterSummary);
  const [shopInventorySummary, setShopInventorySummary] = useState(emptyShopInventorySummary);
  const [shopInventoryMessage, setShopInventoryMessage] = useState("");
  const [questFilters, setQuestFilters] = useState(emptyQuestFilters);
  const [archivedQuests, setArchivedQuests] = useState([]);
  const [archiveMessage, setArchiveMessage] = useState("");
  const [deadlineNotifications, setDeadlineNotifications] = useState([]);
  const [battleChoices, setBattleChoices] = useState([]);
  const [isBattleEmptyPromptOpen, setIsBattleEmptyPromptOpen] = useState(false);
  const [isTutorialGuideOpen, setIsTutorialGuideOpen] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isShopInventoryLoading, setIsShopInventoryLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("offline");
  const [profileSummary, setProfileSummary] = useState({
    canChangePassword: false,
    email: accountId,
    friendCount: 0,
    friends: [],
    id: "",
    username: accountId?.split("@")[0] ?? "Player",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [isFocusTimerMinimized, setIsFocusTimerMinimized] = useState(false);
  const [friendMessages, setFriendMessages] = useState([]);
  const [friendChatMessage, setFriendChatMessage] = useState("");
  const [friendChatPosition, setFriendChatPosition] = useState(null);
  const [isLoadingFriendMessages, setIsLoadingFriendMessages] = useState(false);
  const [isSendingFriendMessage, setIsSendingFriendMessage] = useState(false);
  const [dragState, setDragState] = useState(null);
  const dragStateRef = useRef(null);
  const realtimeRefreshTimerRef = useRef(null);
  const realtimeRefreshInFlightRef = useRef(false);
  const [activeMission, setActiveMission] = useState(() => {
    return loadStoredActiveMission(accountId);
  });
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const dashboard = roleDashboards[role.id] ?? roleDashboards.healer;
  const Icon = role.icon;
  const [characterState, setCharacterState] = useState(() =>
    loadCharacterState(accountId),
  );
  const levelProgress = getLevelProgress(characterState.xp);
  const onboarding = useOnboardingProgress(accountId);

  useEffect(() => {
    document.body.dataset.dashboardBackground =
      window.localStorage.getItem(DASHBOARD_BACKGROUND_KEY) || "base";
  }, []);

  useEffect(() => {
    refreshProfileSummary();
  }, []);

  useEffect(() => {
    refreshShopInventorySummary();
  }, []);

  useEffect(() => {
    if (initialWorkspaceId) {
      setActiveWorkspaceId(initialWorkspaceId);
    }
  }, [initialWorkspaceId]);

  useEffect(() => {
    setActiveView(initialView);
    if (initialView === "workspace" || initialView === "clan") {
      setWorkspaceSubPage("directory");
      setSelectedClanId("");
    }
  }, [initialView]);

  useEffect(() => {
    setActiveMission(loadStoredActiveMission(accountId));
  }, [accountId]);

  async function refreshProfileSummary() {
    if (!isSupabaseConfigured) return;

    try {
      const profile = await loadProfileSummary();
      setProfileSummary(profile);
      setProfileError("");
    } catch (error) {
      setProfileError(error.message || "Gagal memuat profil dari Supabase.");
    }
  }

  function applyDashboardData(dashboardData) {
    setWorkspaceState(dashboardData.workspaceState);
    setQuestColumns(dashboardData.questColumns);
    setActiveWorkspaceId(dashboardData.workspaceState.id);
    window.localStorage.setItem(
      `questify:active_workspace:${accountId}`,
      dashboardData.workspaceState.id,
    );
    setWorkspaceViewerId(dashboardData.currentUserId);
    setSupabaseUserId(dashboardData.currentUserId);
    setCharacterState(dashboardData.characterState);
    setDashboardSource("supabase");
    setDashboardError("");
    setDashboardNotice("");
  }

  function applyShopInventorySummary(summary, successMessage = "") {
    setShopInventorySummary(summary);
    setShopInventoryMessage(successMessage);

    if (Number.isFinite(summary.profile?.gold)) {
      setCharacterState((currentState) => ({
        ...currentState,
        gold: summary.profile.gold,
      }));
    }
  }

  async function refreshDashboardFromSupabase(nextWorkspaceId = activeWorkspaceId) {
    if (!isSupabaseConfigured) return false;

    const dashboardData = await loadDashboardFromSupabase(roleId, nextWorkspaceId);
    applyDashboardData(dashboardData);
    await refreshCommandCenterSummary();
    return true;
  }

  async function refreshShopInventorySummary() {
    setIsShopInventoryLoading(true);

    try {
      const summary = await loadShopInventorySummary({
        accountId,
        gold: characterState.gold,
      });
      applyShopInventorySummary(summary);
    } catch (error) {
      setShopInventoryMessage(error.message || "Gagal memuat shop dan inventory.");
    } finally {
      setIsShopInventoryLoading(false);
    }
  }

  async function refreshCommandCenterSummary() {
    if (!isSupabaseConfigured) return;

    try {
      setCommandCenterSummary(await loadCommandCenterSummaryFromSupabase());
    } catch (error) {
      setDashboardError(error.message || "Gagal memuat Command Center.");
    }
  }

  async function refreshDeadlineNotifications() {
    if (!isSupabaseConfigured || dashboardSource !== "supabase" || !workspaceState.id || !supabaseUserId) return;

    try {
      setDeadlineNotifications(await loadDeadlineNotificationsFromSupabase(workspaceState, supabaseUserId));
    } catch (error) {
      setDashboardError(error.message || "Gagal memuat deadline notifications.");
    }
  }

  async function refreshArchivedQuests() {
    if (!isSupabaseConfigured || dashboardSource !== "supabase" || !workspaceState.id) return;

    setIsArchiveLoading(true);
    try {
      setArchivedQuests(await loadArchivedQuestsFromSupabase(workspaceState));
      setArchiveMessage("");
    } catch (error) {
      setArchiveMessage(error.message || "Gagal memuat archive.");
    } finally {
      setIsArchiveLoading(false);
    }
  }

  async function refreshFromRealtime(workspaceId) {
    if (!workspaceId || realtimeRefreshInFlightRef.current) return;
    realtimeRefreshInFlightRef.current = true;

    try {
      await refreshDashboardFromSupabase(workspaceId);
      await refreshShopInventorySummary();
      await refreshDeadlineNotifications();
      setRealtimeStatus("live");
    } catch (error) {
      setRealtimeStatus("reconnecting");
      setDashboardError(error.message || "Realtime sync gagal. Mencoba reconnect.");
    } finally {
      realtimeRefreshInFlightRef.current = false;
    }
  }

  function scheduleRealtimeRefresh(workspaceId) {
    if (!workspaceId) return;
    if (realtimeRefreshTimerRef.current) {
      window.clearTimeout(realtimeRefreshTimerRef.current);
    }

    realtimeRefreshTimerRef.current = window.setTimeout(() => {
      realtimeRefreshTimerRef.current = null;
      refreshFromRealtime(workspaceId);
    }, 500);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!isSupabaseConfigured) return;

      setIsDashboardLoading(true);

      try {
        const dashboardData = await loadDashboardFromSupabase(
          roleId,
          initialWorkspaceId || activeWorkspaceId,
        );

        if (!isMounted) return;

        applyDashboardData(dashboardData);
        refreshCommandCenterSummary();
        refreshShopInventorySummary();
        refreshProfileSummary();
      } catch (error) {
        if (!isMounted) return;
        setDashboardSource("local");
        setDashboardError(error.message || "Gagal memuat dashboard dari Supabase.");
      } finally {
        if (isMounted) setIsDashboardLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [roleId, initialWorkspaceId]);

  const activeQuestIds = useMemo(
    () => questColumns.flatMap((column) => column.cards.map((card) => card.id)),
    [questColumns],
  );
  const activeQuestIdsKey = activeQuestIds.join("|");

  useEffect(() => {
    if (!isSupabaseConfigured || dashboardSource !== "supabase" || !workspaceState.id) {
      setRealtimeStatus("offline");
      return undefined;
    }

    setRealtimeStatus("connecting");

    const unsubscribe = subscribeWorkspaceRealtime(workspaceState.id, {
      onEvent: () => {
        setRealtimeStatus("syncing");
        scheduleRealtimeRefresh(workspaceState.id);
      },
      onStatus: (status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("reconnecting");
        }
      },
      onError: () => {
        setRealtimeStatus("reconnecting");
      },
      questIds: activeQuestIds,
    });

    return () => {
      unsubscribe?.();
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
    };
  }, [activeQuestIdsKey, dashboardSource, workspaceState.id]);

  const workspaceOwner = workspaceState.members.find(
    (member) => member.id === workspaceState.ownerId,
  );
  const workspaceViewer =
    workspaceState.members.find((member) => member.id === workspaceViewerId) ??
    workspaceOwner ??
    workspaceState.members[0];
  const operatorProfile =
    workspaceState.members.find((member) => member.id === supabaseUserId) ??
    workspaceState.members.find((member) => member.id === accountId) ??
    workspaceViewer ??
    workspaceOwner;
  const operatorName = operatorProfile?.name ?? accountId?.split("@")[0] ?? "Player";
  const selectedQuestColumn = selectedQuestDetail
    ? questColumns.find((column) =>
        column.cards.some((card) => card.id === selectedQuestDetail.id),
      )
    : null;
  const selectedQuestCard = selectedQuestColumn?.cards.find(
    (card) => card.id === selectedQuestDetail?.id,
  );
  const visibleQuestColumns = useMemo(
    () =>
      questColumns.map((column) => {
        const filteredCards = column.cards.filter((card) =>
          canViewerSeeQuest(card, workspaceState, workspaceViewer?.id) &&
          cardMatchesFilters(card, questFilters),
        ).map((card) => ({
          ...card,
          passivePreview: calculateQuestRewardPreview(card, {
            assignees: card.assignees,
            methodMultiplier: activeMission?.cardId === card.id
              ? activeMission.methodMultiplier
              : 1,
          }),
        }));

        return {
          ...column,
          cards: filteredCards,
        };
      }),
    [activeMission, questColumns, questFilters, workspaceState, workspaceViewer?.id],
  );

  function handleQuestFilterChange(filterKey, value) {
    setQuestFilters((filters) => ({ ...filters, [filterKey]: value }));
  }

  function handleResetQuestFilters() {
    setQuestFilters(emptyQuestFilters);
  }

  function saveCharacterState(nextState) {
    setCharacterState(nextState);
    window.localStorage.setItem(
      `questify:character:${accountId}`,
      JSON.stringify(nextState),
    );
  }

  function navigateDashboardView(viewId) {
    setActiveView(viewId);
    onNavigateView?.(viewId);
  }

  function markOnboardingStep(stepId) {
    onboarding.completeStep(stepId);
  }

  function handleTutorialStepAction(step) {
    if (!step?.id) return;

    if (step.id === ONBOARDING_STEP_IDS.COMMAND_CENTER) {
      markOnboardingStep(ONBOARDING_STEP_IDS.COMMAND_CENTER);
      navigateDashboardView("workspace");
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.WORKSPACE) {
      markOnboardingStep(ONBOARDING_STEP_IDS.WORKSPACE);
      navigateDashboardView("workspace");
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.QUEST_BOARD) {
      markOnboardingStep(ONBOARDING_STEP_IDS.QUEST_BOARD);
      navigateDashboardView("quests");
      handleOpenCreateQuest();
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.CREATE_QUEST) {
      navigateDashboardView("quests");
      handleOpenCreateQuest();
      return;
    }

    if (
      step.id === ONBOARDING_STEP_IDS.START_MISSION ||
      step.id === ONBOARDING_STEP_IDS.COMPLETE_QUEST ||
      step.id === ONBOARDING_STEP_IDS.ARCHIVE_QUEST
    ) {
      navigateDashboardView("quests");
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.RESOURCES) {
      markOnboardingStep(ONBOARDING_STEP_IDS.RESOURCES);
      navigateDashboardView("inventory");
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.CLAN) {
      markOnboardingStep(ONBOARDING_STEP_IDS.CLAN);
      navigateDashboardView("clan");
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.PROFILE) {
      markOnboardingStep(ONBOARDING_STEP_IDS.PROFILE);
      setIsProfileMenuOpen(true);
      return;
    }

    if (step.id === ONBOARDING_STEP_IDS.SETTINGS) {
      markOnboardingStep(ONBOARDING_STEP_IDS.SETTINGS);
      onOpenSettings?.();
    }
  }

  function grantQuestReward(card, methodMultiplier = 1) {
    if (card.claimed) return;

    const isOwner = workspaceViewer?.id === workspaceState.ownerId;
    const ownerMultiplier = isOwner ? 1.6 : 1;
    const goldMultiplier = isOwner ? 1.35 : 1;
    const xpBoost = Math.max(
      0,
      ...shopInventorySummary.activeBoosts
        .filter((boost) => boost.effectType === "next_quest_xp_percent")
        .map((boost) => boost.effectValue),
    );
    const goldBoost = Math.max(
      0,
      ...shopInventorySummary.activeBoosts
        .filter((boost) => boost.effectType === "next_quest_gold_percent")
        .map((boost) => boost.effectValue),
    );
    const passiveReward = calculateQuestRewardPreview(card, {
      assignees: card.assignees,
      methodMultiplier,
    });
    const earnedXp = Math.round(
      passiveReward.baseXp *
        ownerMultiplier *
        methodMultiplier *
        passiveReward.xpPassiveMultiplier *
        (1 + xpBoost / 100),
    );
    const earnedGold = Math.round(
      passiveReward.baseGold *
        goldMultiplier *
        passiveReward.goldPassiveMultiplier *
        (1 + goldBoost / 100),
    );

    saveCharacterState({
      ...characterState,
      xp: (characterState.xp ?? 0) + earnedXp,
      gold: characterState.gold + earnedGold,
    });

    setShopInventorySummary((summary) => ({
      ...summary,
      activeBoosts: summary.activeBoosts
        .map((boost) =>
          boost.effectType === "next_quest_xp_percent" ||
          boost.effectType === "next_quest_gold_percent"
            ? { ...boost, remainingUses: Math.max((boost.remainingUses ?? 1) - 1, 0) }
            : boost,
        )
        .filter((boost) => (boost.remainingUses ?? 0) > 0),
    }));
  }

  async function handleCompleteMission(cardId, fromColumnId, methodMultiplier) {
    let targetCard = null;

    // Find the card
    for (const column of questColumns) {
      const found = column.cards.find((c) => c.id === cardId);
      if (found) { targetCard = found; break; }
    }

    if (!targetCard || targetCard.claimed) return;

    if (dashboardSource === "supabase") {
      try {
        await moveQuestInSupabase(cardId, "done", workspaceState, null, supabaseUserId || workspaceViewerId);
        await claimQuestRewardInSupabase(cardId, targetCard, supabaseUserId || workspaceViewerId, methodMultiplier);
        await refreshDashboardFromSupabase();
        await refreshShopInventorySummary();
        await refreshDeadlineNotifications();
        markOnboardingStep(ONBOARDING_STEP_IDS.COMPLETE_QUEST);
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal menyelesaikan quest lewat Supabase.");
      }
    }

    // Grant reward with method multiplier
    grantQuestReward(targetCard, methodMultiplier);

    // Move card from source column to 'done' and mark as claimed
    setQuestColumns((columns) =>
      columns.map((column) => {
        if (column.id === fromColumnId) {
          return { ...column, cards: column.cards.filter((c) => c.id !== cardId) };
        }
        if (column.id === "done") {
          return {
            ...column,
            cards: [
              {
                ...targetCard,
                claimed: true,
                tag: "CLAIMED",
                accent: "muted",
                activity: [
                  `Mission selesai! Reward diklaim dengan multiplier ${methodMultiplier}x.`,
                  ...(targetCard.activity ?? []),
                ],
              },
              ...column.cards,
            ],
          };
        }
        return column;
      }),
    );
    markOnboardingStep(ONBOARDING_STEP_IDS.COMPLETE_QUEST);
  }

  function handleStartMission(card, fromColumnId, minutes, methodMultiplier, methodName) {
    const missionData = {
      baseGold: card.rewardGold ?? 15,
      cardId: card.id,
      cardTitle: card.title,
      cardDifficulty: card.difficulty || "Normal",
      baseXp: parseInt(card.reward, 10) || 50,
      durationMinutes: minutes,
      fromColumnId,
      methodMultiplier,
      methodName,
      endTime: Date.now() + minutes * 60 * 1000,
    };
    setActiveMission(missionData);
    setIsFocusTimerMinimized(false);
    saveStoredActiveMission(accountId, missionData);
    markOnboardingStep(ONBOARDING_STEP_IDS.START_MISSION);
  }

  function getBattleCandidates() {
    return questColumns.flatMap((column) =>
      column.cards
        .filter((card) =>
          column.id !== "done" &&
          !card.claimed &&
          canViewerSeeQuest(card, workspaceState, workspaceViewer?.id),
        )
        .map((card, index) => ({
          card,
          columnId: column.id,
          index,
          deadlineScore: getBattleDueScore(card),
          deadlineTime: getBattleDeadlineTime(card),
          difficultyScore: getBattleDifficultyScore(card.difficulty),
        })),
    ).sort((a, b) => {
      if (b.deadlineScore !== a.deadlineScore) return b.deadlineScore - a.deadlineScore;
      if (a.deadlineTime !== b.deadlineTime) return a.deadlineTime - b.deadlineTime;
      if (b.difficultyScore !== a.difficultyScore) return b.difficultyScore - a.difficultyScore;
      return a.index - b.index;
    });
  }

  function startBattleChoice(target) {
    navigateDashboardView("quests");
    setSelectedQuestDetail(null);
    setEditingQuest(null);
    setBattleChoices([]);
    setDashboardNotice(`Battle Mode dimulai: ${target.card.title}`);
    handleStartMission(target.card, target.columnId, 25, 1.5, "Battle Mode");
  }

  function handleBattleMode() {
    if (activeMission) {
      setDashboardNotice("Battle mode sedang berjalan.");
      return;
    }

    const candidates = getBattleCandidates();

    if (!candidates.length) {
      navigateDashboardView("quests");
      setBattleChoices([]);
      setIsBattleEmptyPromptOpen(true);
      return;
    }

    if (candidates.length === 1) {
      startBattleChoice(candidates[0]);
      return;
    }

    navigateDashboardView("quests");
    setSelectedQuestDetail(null);
    setEditingQuest(null);
    setBattleChoices(candidates.slice(0, 6));
    setDashboardNotice("Pilih quest untuk Battle Mode.");
  }

  function handleCreateQuestFromBattlePrompt() {
    setIsBattleEmptyPromptOpen(false);
    navigateDashboardView("quests");
    handleOpenCreateQuest();
  }

  function handleCloseBattleEmptyPrompt() {
    setIsBattleEmptyPromptOpen(false);
    navigateDashboardView("command");
  }

  async function handleFinishActiveMission() {
    if (!activeMission) return;
    await recordFocusSession(activeMission, true);
    await handleCompleteMission(activeMission.cardId, activeMission.fromColumnId, activeMission.methodMultiplier);
    setActiveMission(null);
    setIsFocusTimerMinimized(false);
    clearStoredFocusTimerState();
    removeStoredActiveMission(accountId);
  }

  async function recordFocusSession(mission, resultedInCompletion = false) {
    const sessionLog = {
      cardId: mission.cardId,
      cardTitle: mission.cardTitle,
      completedAt: new Date().toISOString(),
      durationMinutes: mission.durationMinutes ?? Math.max(1, Math.round((mission.endTime - Date.now()) / 60000)),
      methodName: mission.methodName,
      resultedInCompletion,
    };

    const localKey = `questify:focus_sessions:${accountId}`;
    try {
      const saved = window.localStorage.getItem(localKey);
      const parsed = saved ? JSON.parse(saved) : [];
      window.localStorage.setItem(localKey, JSON.stringify([sessionLog, ...parsed].slice(0, 80)));
    } catch {
      window.localStorage.setItem(localKey, JSON.stringify([sessionLog]));
    }

    if (dashboardSource !== "supabase") return;

    try {
      await recordQuestFocusSessionInSupabase({
        durationMinutes: sessionLog.durationMinutes,
        methodName: sessionLog.methodName,
        questId: sessionLog.cardId,
        resultedInCompletion,
      });
    } catch (error) {
      setDashboardError(error.message || "Gagal menyimpan focus session.");
    }
  }

  async function handleContinueActiveMission(mission) {
    await recordFocusSession(mission, false);
    const nextMissionData = {
      ...mission,
      endTime: Date.now() + (mission.durationMinutes ?? 25) * 60 * 1000,
    };

    setActiveMission(nextMissionData);
    setIsFocusTimerMinimized(false);
    saveStoredActiveMission(accountId, nextMissionData);
    setDashboardNotice(`Sesi baru dimulai: ${mission.cardTitle}`);
  }

  async function handleSaveActiveMissionProgress(mission) {
    await recordFocusSession(mission, false);
    setActiveMission(null);
    setIsFocusTimerMinimized(false);
    clearStoredFocusTimerState();
    removeStoredActiveMission(accountId);
    setDashboardNotice(`Progress tersimpan untuk ${mission.cardTitle}. Quest belum diklaim.`);
  }

  // earnedXp is pre-calculated by rewardCalculator inside FullscreenFocusTimer
  function handleAbortMission(earnedXp = 0) {
    if (activeMission) {
      recordFocusSession(activeMission, false);
    }
    if (earnedXp > 0 && activeMission) {
      saveCharacterState({
        ...characterState,
        xp: (characterState.xp ?? 0) + earnedXp,
      });
    }
    setActiveMission(null);
    setIsFocusTimerMinimized(false);
    clearStoredFocusTimerState();
    removeStoredActiveMission(accountId);
  }

  function handleNavigation(viewId) {
    navigateDashboardView(viewId);
    if (viewId === "quests") {
      markOnboardingStep(ONBOARDING_STEP_IDS.QUEST_BOARD);
    }
    if (viewId === "workspace") {
      markOnboardingStep(ONBOARDING_STEP_IDS.WORKSPACE);
    }
    if (viewId === "clan") {
      markOnboardingStep(ONBOARDING_STEP_IDS.CLAN);
    }
    if (viewId === "inventory" || viewId === "shop") {
      markOnboardingStep(ONBOARDING_STEP_IDS.RESOURCES);
    }
    if (viewId === "workspace" || viewId === "clan") {
      setWorkspaceSubPage("directory");
      setSelectedClanId("");
    }
    setIsSidebarMenuOpen(false);
  }

  async function handleOpenWorkspaceBoard(workspaceId) {
    if (!workspaceId || dashboardSource !== "supabase") return;

    try {
      setIsDashboardLoading(true);
      await refreshDashboardFromSupabase(workspaceId);
      navigateDashboardView("quests");
      markOnboardingStep(ONBOARDING_STEP_IDS.QUEST_BOARD);
      setWorkspaceSubPage("directory");
      setSelectedQuestDetail(null);
      setEditingQuest(null);
    } catch (error) {
      setDashboardError(error.message || "Gagal membuka board.");
    } finally {
      setIsDashboardLoading(false);
    }
  }

  function handleOpenClan(clanId) {
    if (!clanId) return;
    navigateDashboardView("clan");
    setSelectedClanId(clanId);
    setWorkspaceSubPage("clan");
  }

  function handleBackToClanDirectory() {
    setSelectedClanId("");
    setWorkspaceSubPage("directory");
  }

  async function handleCreatePersonalBoard(boardName, coverKey = "study-desk") {
    const cleanedName = boardName.trim();
    if (!cleanedName) {
      throw new Error("Nama solo board wajib diisi.");
    }

    if (dashboardSource !== "supabase") {
      throw new Error("Supabase belum tersinkron. Login ulang atau cek konfigurasi.");
    }

    try {
      const createdWorkspaceId = await createPersonalWorkspaceInSupabase(cleanedName, coverKey);
      await handleOpenWorkspaceBoard(createdWorkspaceId);
    } catch (error) {
      const message = error.message || "Gagal membuat personal board.";
      setDashboardError(message);
      throw new Error(message);
    }
  }

  async function handleCreateClan(clanName) {
    const cleanedName = clanName.trim();
    if (!cleanedName || dashboardSource !== "supabase") return;

    try {
      const createdClanId = await createClanInSupabase(cleanedName);
      setSelectedClanId(createdClanId);
      setWorkspaceSubPage("clan");
    } catch (error) {
      setDashboardError(error.message || "Gagal membuat clan.");
    }
  }

  async function handleCreateClanBoard(clanId, boardName, coverKey = "guild-hall") {
    const cleanedName = boardName.trim();
    if (!clanId) {
      throw new Error("Clan belum siap dimuat. Coba lagi setelah data selesai.");
    }

    if (!cleanedName) {
      throw new Error("Nama squad board wajib diisi.");
    }

    if (dashboardSource !== "supabase") {
      throw new Error("Supabase belum tersinkron. Login ulang atau cek konfigurasi.");
    }

    try {
      const createdWorkspaceId = await createWorkspaceForClanInSupabase(clanId, cleanedName, coverKey);
      await handleOpenWorkspaceBoard(createdWorkspaceId);
    } catch (error) {
      const message = error.message || "Gagal membuat clan board.";
      setDashboardError(message);
      throw new Error(message);
    }
  }

  async function handleJoinClanByCode(joinCode) {
    const cleanedCode = joinCode.trim();
    if (!cleanedCode || dashboardSource !== "supabase") return;

    try {
      const clanId = await requestJoinClanByCodeInSupabase(cleanedCode);
      setDashboardNotice("Berhasil join clan. Squad workspace clan ini sekarang langsung terbuka.");
      setSelectedClanId(clanId);
      navigateDashboardView("clan");
      setWorkspaceSubPage("clan");
      await refreshDashboardFromSupabase();
    } catch (error) {
      setDashboardError(error.message || "Gagal join clan dengan kode.");
    }
  }

  async function handleBuyShopItem(itemId) {
    setShopInventoryMessage("");
    setIsShopInventoryLoading(true);

    try {
      const summary = await buyShopItem(itemId, {
        accountId,
        gold: characterState.gold,
      });
      applyShopInventorySummary(summary, "Item berhasil dibeli.");
      await refreshCommandCenterSummary();
    } catch (error) {
      setShopInventoryMessage(error.message || "Gagal membeli item.");
    } finally {
      setIsShopInventoryLoading(false);
    }
  }

  async function handleActivateInventoryItem(userItemId) {
    setShopInventoryMessage("");
    setIsShopInventoryLoading(true);

    try {
      const summary = await activateInventoryItem(userItemId, {
        accountId,
        gold: characterState.gold,
      });
      applyShopInventorySummary(summary, "Boost berhasil diaktifkan.");
    } catch (error) {
      setShopInventoryMessage(error.message || "Gagal mengaktifkan item.");
    } finally {
      setIsShopInventoryLoading(false);
    }
  }

  async function handleDeleteWorkspace() {
    if (dashboardSource !== "supabase") return;

    const workspaceLabel = workspaceState.type === "clan" ? "squad workspace" : "solo workspace";
    if (!window.confirm(`Delete ${workspaceLabel} "${workspaceState.name}"?`)) return;

    try {
      setIsDashboardLoading(true);
      await deleteWorkspaceInSupabase(workspaceState.id);
      navigateDashboardView("workspace");
      setWorkspaceSubPage("directory");
      setSelectedQuestDetail(null);
      setEditingQuest(null);
      setDashboardNotice("Workspace berhasil dihapus.");
      await refreshDashboardFromSupabase("");
    } catch (error) {
      setDashboardError(error.message || "Gagal menghapus workspace.");
    } finally {
      setIsDashboardLoading(false);
    }
  }

  function setCurrentDragState(nextState) {
    dragStateRef.current = nextState;
    setDragState(nextState);
  }

  function getDropTarget(clientX, clientY, cardId) {
    const element = document.elementFromPoint(clientX, clientY);
    const columnElement = element?.closest?.("[data-quest-column-id]");
    const cardElement = element?.closest?.("[data-quest-card-id]");

    return {
      toColumnId: columnElement?.dataset.questColumnId,
      beforeCardId:
        cardElement?.dataset.questCardId !== cardId
          ? cardElement?.dataset.questCardId
          : "",
    };
  }

  function handleCardPointerDown(event, fromColumnId, card) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!isQuestPositionEditMode || event.currentTarget.dataset.dragHandle !== "true") return;

    const cardElement = event.currentTarget.closest("[data-quest-card-id]");
    const cardRect = cardElement.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    setCurrentDragState({
      card,
      cardId: card.id,
      fromColumnId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - cardRect.left,
      offsetY: event.clientY - cardRect.top,
      width: cardRect.width,
      isDragging: false,
      overColumnId: fromColumnId,
      beforeCardId: "",
    });
  }

  function handleCardPointerMove(event) {
    if (!isQuestPositionEditMode) return;
    const currentDrag = dragStateRef.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    const movement = Math.hypot(
      event.clientX - currentDrag.startX,
      event.clientY - currentDrag.startY,
    );
    const dropTarget = getDropTarget(event.clientX, event.clientY, currentDrag.cardId);

    setCurrentDragState({
      ...currentDrag,
      x: event.clientX,
      y: event.clientY,
      isDragging: currentDrag.isDragging || movement > 5,
      overColumnId: dropTarget.toColumnId || currentDrag.overColumnId,
      beforeCardId: dropTarget.beforeCardId,
    });
  }

  async function handleCardPointerEnd(event) {
    if (!isQuestPositionEditMode) return;
    const currentDrag = dragStateRef.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (currentDrag.isDragging) {
      const dropTarget = getDropTarget(event.clientX, event.clientY, currentDrag.cardId);
      const toColumnId = dropTarget.toColumnId || currentDrag.overColumnId || currentDrag.fromColumnId;
      const beforeCardId = dropTarget.beforeCardId || currentDrag.beforeCardId;

      const nextColumns = moveQuestCard(questColumns, {
          cardId: currentDrag.cardId,
          fromColumnId: currentDrag.fromColumnId,
          toColumnId,
          beforeCardId,
        });

      setQuestColumns(nextColumns);
      setCurrentDragState(null);

      if (dashboardSource === "supabase") {
        try {
          await moveQuestInSupabase(currentDrag.cardId, toColumnId, workspaceState, nextColumns, supabaseUserId || workspaceViewerId);
        } catch (error) {
          setDashboardError(error.message || "Gagal menyimpan posisi quest ke Supabase.");
          await refreshDashboardFromSupabase();
        }
      }
      return;
    }

    setCurrentDragState(null);
  }

  function handleCardPointerCancel() {
    setCurrentDragState(null);
  }

  function handleOpenCreateQuest() {
    if (isQuestComposerOpen && !editingQuest) return;
    setEditingQuest(null);
    setSelectedQuestDetail(null);
    setIsQuestComposerOpen(true);
  }

  function mapGeneratedQuestDraftToPayload(draft) {
    const assigneeName = workspaceViewer?.name || workspaceOwner?.name || workspaceState.members?.[0]?.name || "";

    return {
      assignedRoleId: "",
      checklist: draft.checklist ?? [],
      comment: "Generated by Guild Orb AI.",
      deadline: draft.deadline || "",
      description: draft.description || "Generated by Guild Orb AI.",
      difficulty: draft.difficulty || "C-Rank",
      label: draft.label || "study",
      members: assigneeName ? [assigneeName] : [],
      title: draft.title,
    };
  }

  async function handleCreateGuildOrbQuests(drafts) {
    if (!Array.isArray(drafts) || !drafts.length) return;

    if (dashboardSource !== "supabase") {
      throw new Error("AI generated quest perlu Supabase aktif agar masuk backend.");
    }

    const actorId = supabaseUserId || workspaceViewerId;

    for (const draft of drafts) {
      await createQuestInSupabase(
        mapGeneratedQuestDraftToPayload(draft),
        workspaceState,
        actorId,
      );
    }

    await refreshDashboardFromSupabase();
    await refreshDeadlineNotifications();
    markOnboardingStep(ONBOARDING_STEP_IDS.CREATE_QUEST);
    navigateDashboardView("quests");
    setDashboardNotice(`${drafts.length} AI quest berhasil ditambahkan ke Quest Board.`);
  }

  async function handleCreateQuest(questData) {
    if (dashboardSource === "supabase") {
      try {
        await createQuestInSupabase(questData, workspaceState, supabaseUserId || workspaceViewerId);
        await refreshDashboardFromSupabase();
        await refreshDeadlineNotifications();
        setIsQuestComposerOpen(false);
        setEditingQuest(null);
        markOnboardingStep(ONBOARDING_STEP_IDS.CREATE_QUEST);
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal membuat quest di Supabase.");
      }
    }

    const labelOption =
      questLabelOptions.find((option) => option.value === questData.label) ??
      questLabelOptions[0];
    const creator =
      workspaceState.members.find((member) => member.id === questData.creatorId) ??
      workspaceOwner;
    const assignedRole = questData.assignedRoleId
      ? roles.find((item) => item.id === questData.assignedRoleId) ?? role
      : null;
    const isOwnerCreated = creator?.id === workspaceState.ownerId;
    const rewardXp = parseInt(labelOption.reward, 10) || 50;
    const createdQuest = {
      id: `quest-${Date.now()}`,
      title: questData.title,
      description: questData.description,
      reward: labelOption.reward,
      penalty: labelOption.penalty,
      tag: labelOption.tag,
      accent: labelOption.accent,
      label: labelOption.value,
      workspaceId: workspaceState.id,
      creatorId: creator?.id ?? accountId,
      creatorName: creator?.name ?? "Unknown",
      visibility: isOwnerCreated ? "workspace" : "private",
      assignedRoleId: assignedRole?.id ?? "",
      assignedRoleName: assignedRole?.name ?? "All Role",
      deadline: questData.deadline,
      difficulty: questData.difficulty,
      rewardXp,
      rewardGold: Math.max(10, Math.round(rewardXp * 0.28)),
      claimed: false,
      checklist: createChecklistItems(questData.checklist),
      members: questData.members,
      comments: questData.comment ? [questData.comment] : [],
      activity: [
        isOwnerCreated
          ? "Quest owner dibuat dan dapat dilihat seluruh workspace."
          : "Quest invited dibuat privat untuk owner dan pembuat task.",
        `Target role: ${assignedRole?.name ?? "All Role"}.`,
        ...(questData.members.length
          ? [`Members ditugaskan: ${questData.members.join(", ")}.`]
          : []),
        ...(questData.checklist.length
          ? [`Checklist ditambahkan: ${questData.checklist.length} item.`]
          : []),
      ],
    };

    const targetColumnId = getTargetColumnId(questData.difficulty);

      setQuestColumns((columns) =>
      columns.map((column) =>
        column.id === targetColumnId
          ? { ...column, cards: [createdQuest, ...column.cards] }
          : column,
      ),
    );
    setIsQuestComposerOpen(false);
    setEditingQuest(null);
    markOnboardingStep(ONBOARDING_STEP_IDS.CREATE_QUEST);
  }

  function handleOpenEditQuest(card) {
    setEditingQuest(card);
    setSelectedQuestDetail(null);
    setIsQuestComposerOpen(true);
  }

  function handleCloseQuestComposer() {
    setEditingQuest(null);
    setIsQuestComposerOpen(false);
  }

  async function handleUpdateQuest(questData) {
    if (dashboardSource === "supabase") {
      try {
        await updateQuestInSupabase(questData, workspaceState, supabaseUserId || workspaceViewerId);
        await refreshDashboardFromSupabase();
        await refreshDeadlineNotifications();
        handleCloseQuestComposer();
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal update quest di Supabase.");
      }
    }

    const labelOption =
      questLabelOptions.find((option) => option.value === questData.label) ??
      questLabelOptions[0];
    const creator =
      workspaceState.members.find((member) => member.id === questData.creatorId) ??
      workspaceOwner;
    const assignedRole = questData.assignedRoleId
      ? roles.find((item) => item.id === questData.assignedRoleId) ?? role
      : null;
    const isOwnerCreated = creator?.id === workspaceState.ownerId;
    const rewardXp = parseInt(labelOption.reward, 10) || 50;

    setQuestColumns((columns) =>
      columns.map((column) => ({
        ...column,
        cards: column.cards.map((card) => {
          if (card.id !== questData.id) return card;

          return {
            ...card,
            title: questData.title,
            description: questData.description,
            reward: labelOption.reward,
            penalty: labelOption.penalty,
            tag: labelOption.tag,
            accent: labelOption.accent,
            label: labelOption.value,
            creatorId: creator?.id ?? card.creatorId,
            creatorName: creator?.name ?? card.creatorName,
            visibility: isOwnerCreated ? "workspace" : "private",
            assignedRoleId: assignedRole?.id ?? "",
            assignedRoleName: assignedRole?.name ?? "All Role",
            deadline: questData.deadline,
            difficulty: questData.difficulty,
            rewardXp,
            rewardGold: Math.max(10, Math.round(rewardXp * 0.28)),
            checklist: mergeChecklistItems(questData.checklist, card.checklist),
            members: questData.members,
            comments: questData.comment
              ? [...(card.comments ?? []), questData.comment]
              : card.comments ?? [],
            activity: [
              `Quest diedit: ${questData.title}.`,
              ...(questData.comment ? ["Komentar baru ditambahkan."] : []),
              ...(card.activity ?? []),
            ],
          };
        }),
      })),
    );

    handleCloseQuestComposer();
  }

  async function handleChecklistToggle(cardId, checklistId) {
    const currentCard = questColumns
      .flatMap((column) => column.cards)
      .find((card) => card.id === cardId);
    const currentItem = currentCard?.checklist?.find((item) => item.id === checklistId);

    if (dashboardSource === "supabase" && currentItem) {
      try {
        await updateChecklistItemInSupabase(checklistId, !currentItem.done, currentCard, supabaseUserId || workspaceViewerId);
        await refreshDashboardFromSupabase();
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal update checklist di Supabase.");
      }
    }

    setQuestColumns((columns) =>
      columns.map((column) => ({
        ...column,
        cards: column.cards.map((card) => {
          if (card.id !== cardId) return card;

          return {
            ...card,
            checklist: (card.checklist ?? []).map((item) =>
              item.id === checklistId ? { ...item, done: !item.done } : item,
            ),
            activity: [
              `Checklist diperbarui pada ${card.title}.`,
              ...(card.activity ?? []),
            ],
          };
        }),
      })),
    );
  }

  async function handleAddQuestComment(card, comment) {
    const cleanedComment = comment.trim();
    if (!cleanedComment) return;

    if (dashboardSource === "supabase") {
      try {
        await addQuestCommentInSupabase(card.id, supabaseUserId || workspaceViewerId, cleanedComment, card);
        await refreshDashboardFromSupabase();
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal menambahkan komentar quest.");
      }
    }

    setQuestColumns((columns) =>
      columns.map((column) => ({
        ...column,
        cards: column.cards.map((item) =>
          item.id === card.id
            ? {
                ...item,
                comments: [cleanedComment, ...(item.comments ?? [])],
                activity: [`Komentar baru ditambahkan.`, ...(item.activity ?? [])],
              }
            : item,
        ),
      })),
    );
  }

  async function handleArchiveQuest(card) {
    if (dashboardSource === "supabase") {
      try {
        await archiveQuestInSupabase(card.id, card, supabaseUserId || workspaceViewerId);
        await refreshDashboardFromSupabase();
        await refreshArchivedQuests();
        await refreshDeadlineNotifications();
        setSelectedQuestDetail(null);
        markOnboardingStep(ONBOARDING_STEP_IDS.ARCHIVE_QUEST);
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal archive quest.");
      }
    }

    setQuestColumns((columns) =>
      columns.map((column) => ({
        ...column,
        cards: column.cards.filter((item) => item.id !== card.id),
      })),
    );
    setSelectedQuestDetail(null);
    markOnboardingStep(ONBOARDING_STEP_IDS.ARCHIVE_QUEST);
  }

  async function handleDeleteQuest(card) {
    if (!window.confirm(`Delete quest "${card.title}" secara permanen?`)) return;

    if (dashboardSource === "supabase") {
      try {
        await deleteQuestInSupabase(card.id);
        await refreshDashboardFromSupabase();
        setSelectedQuestDetail(null);
        return;
      } catch (error) {
        setDashboardError(error.message || "Gagal delete quest.");
      }
    }

    setQuestColumns((columns) =>
      columns.map((column) => ({
        ...column,
        cards: column.cards.filter((item) => item.id !== card.id),
      })),
    );
    setSelectedQuestDetail(null);
  }

  async function handleRestoreQuest(questId) {
    if (dashboardSource !== "supabase") return;

    try {
      await restoreQuestInSupabase(questId);
      await refreshDashboardFromSupabase();
      await refreshArchivedQuests();
      await refreshDeadlineNotifications();
      setArchiveMessage("Quest berhasil direstore.");
    } catch (error) {
      setArchiveMessage(error.message || "Gagal restore quest.");
    }
    setEditingQuest(null);
  }

  async function handleDeleteArchivedQuest(card) {
    await handleDeleteQuest(card);
    await refreshArchivedQuests();
  }

  useEffect(() => {
    if (activeView === "archive") {
      refreshArchivedQuests();
    }
  }, [activeView, workspaceState.id]);

  useEffect(() => {
    refreshDeadlineNotifications();
  }, [dashboardSource, workspaceState.id, supabaseUserId]);

  async function handleProfileNameChange(username) {
    setProfileMessage("");
    setProfileError("");

    try {
      const nextUsername = await updateProfileName(username);
      setProfileSummary((profile) => ({ ...profile, username: nextUsername }));
      setProfileMessage("Nama profil berhasil diperbarui.");
      await refreshDashboardFromSupabase();
    } catch (error) {
      setProfileError(error.message || "Gagal mengubah nama profil.");
    }
  }

  async function handleProfilePasswordChange(password) {
    setProfileMessage("");
    setProfileError("");

    try {
      await updateAccountPassword(password);
      setProfileMessage("Password berhasil diperbarui.");
    } catch (error) {
      setProfileError(error.message || "Gagal mengubah password.");
    }
  }

  async function handleAddFriend(userId) {
    setProfileMessage("");
    setProfileError("");

    try {
      await addFriendByUserId(userId);
      await refreshProfileSummary();
      setProfileMessage("Teman berhasil ditambahkan.");
    } catch (error) {
      setProfileError(error.message || "Gagal menambahkan teman.");
    }
  }

  async function handleSearchFriend(query) {
    setProfileMessage("");
    setProfileError("");

    try {
      return await searchFriendProfiles(query);
    } catch (error) {
      setProfileError(error.message || "Gagal mencari user.");
      return [];
    }
  }

  async function handleDeleteFriend(userId) {
    setProfileMessage("");
    setProfileError("");

    try {
      await deleteFriendByUserId(userId);
      await refreshProfileSummary();
      if (activeChatFriend?.userId === userId) {
        handleCloseFriendChat();
      }
      setProfileMessage("Teman berhasil dihapus.");
    } catch (error) {
      setProfileError(error.message || "Gagal menghapus teman.");
    }
  }

  async function handleLoadFriendMessages(userId) {
    setProfileMessage("");
    setProfileError("");

    try {
      return await loadFriendMessages(userId);
    } catch (error) {
      setProfileError(error.message || "Gagal memuat chat teman.");
      return [];
    }
  }

  async function handleSendFriendMessage(userId, content) {
    setProfileMessage("");
    setProfileError("");

    try {
      return await sendFriendMessage(userId, content);
    } catch (error) {
      setProfileError(error.message || "Gagal mengirim pesan.");
      throw error;
    }
  }

  async function handleOpenFriendChat(friend) {
    setActiveChatFriend(friend);
    setFriendMessages([]);
    setFriendChatMessage("");
    setIsLoadingFriendMessages(true);

    try {
      setFriendMessages(await handleLoadFriendMessages(friend.userId));
    } finally {
      setIsLoadingFriendMessages(false);
    }
  }

  function handleCloseFriendChat() {
    setActiveChatFriend(null);
    setFriendMessages([]);
    setFriendChatMessage("");
  }

  function handleFriendChatDragStart(event) {
    if (event.button !== undefined && event.button !== 0) return;

    const card = event.currentTarget.closest(".sync-profile-chat-card");
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const dragStart = {
      cardHeight: rect.height,
      cardWidth: rect.width,
      originX: rect.left,
      originY: rect.top,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };

    function getClampedPosition(pointerEvent) {
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - dragStart.cardWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - dragStart.cardHeight - margin);
      const nextX = dragStart.originX + pointerEvent.clientX - dragStart.pointerX;
      const nextY = dragStart.originY + pointerEvent.clientY - dragStart.pointerY;

      return {
        x: Math.min(Math.max(nextX, margin), maxX),
        y: Math.min(Math.max(nextY, margin), maxY),
      };
    }

    function handlePointerMove(pointerEvent) {
      pointerEvent.preventDefault();
      setFriendChatPosition(getClampedPosition(pointerEvent));
    }

    function handlePointerUp(pointerEvent) {
      setFriendChatPosition(getClampedPosition(pointerEvent));
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    event.preventDefault();
    setFriendChatPosition({ x: rect.left, y: rect.top });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  async function handleSubmitFriendChat(event) {
    event.preventDefault();

    if (!activeChatFriend || !friendChatMessage.trim() || isSendingFriendMessage) return;

    const messageContent = friendChatMessage;
    setFriendChatMessage("");
    setIsSendingFriendMessage(true);

    try {
      const message = await handleSendFriendMessage(activeChatFriend.userId, messageContent);
      setFriendMessages((messages) => [...messages, message]);
    } finally {
      setIsSendingFriendMessage(false);
    }
  }

  async function handleDeleteAccount(confirmation) {
    setProfileMessage("");
    setProfileError("");

    if (confirmation !== profileSummary.id) {
      setProfileError("Ketik User ID sendiri untuk konfirmasi hapus akun.");
      return;
    }

    try {
      await deleteCurrentUserAccount();
      onLogout();
    } catch (error) {
      setProfileError(error.message || "Gagal menghapus akun.");
    }
  }

  async function handleMarkAllNotificationsRead() {
    const unreadIds = deadlineNotifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    try {
      await markDeadlineNotificationsReadInSupabase(unreadIds);
      setDeadlineNotifications((notifications) =>
        notifications.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      setDashboardError(error.message || "Gagal menandai notifikasi.");
    }
  }

  async function handleClearAllNotifications() {
    const notificationIds = deadlineNotifications.map((notification) => notification.id);

    try {
      await deleteDeadlineNotificationsInSupabase(notificationIds);
      setDeadlineNotifications([]);
    } catch (error) {
      setDashboardError(error.message || "Gagal menghapus notifikasi.");
    }
  }

  function handleOpenNotificationQuest(questId) {
    const targetCard = questColumns.flatMap((column) => column.cards).find((card) => card.id === questId);
    if (targetCard) {
      setSelectedQuestDetail(targetCard);
      navigateDashboardView("quests");
      setIsNotificationCenterOpen(false);
    }
  }

  useEffect(() => {
    if (!dragState) return undefined;

    function handleWindowPointerMove(event) {
      handleCardPointerMove(event);
    }

    function handleWindowPointerEnd(event) {
      handleCardPointerEnd(event);
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleCardPointerCancel);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleCardPointerCancel);
    };
  }, [dragState]);

  return (
    <main className="sync-dashboard">
      <header className="sync-topbar">
        <div className="sync-brand">
          <QuestifyLogo className="questify-logo--topbar" />
        </div>

        <div className="sync-top-status">
          <button
            aria-label={musicVolume === 0 ? "Unmute background music" : "Mute background music"}
            className={`sync-top-music-button ${
              isMusicPlaying && musicVolume > 0 ? "is-playing" : ""
            }`}
            onClick={onMusicSpeakerToggle}
            title={musicVolume === 0 ? "Unmute music" : "Mute music"}
            type="button"
          >
            {musicVolume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <NotificationCenter
            isOpen={isNotificationCenterOpen}
            notifications={deadlineNotifications}
            onClose={() => setIsNotificationCenterOpen(false)}
            onClearAll={handleClearAllNotifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onOpenQuest={handleOpenNotificationQuest}
            onToggle={() => setIsNotificationCenterOpen((isOpen) => !isOpen)}
          />
          <button onClick={handleBattleMode} type="button">BATTLE MODE</button>
        </div>
      </header>

      {activeMission && !isFocusTimerMinimized && (
        <FullscreenFocusTimer
          activeMission={activeMission}
          onAbort={handleAbortMission}
          onComplete={handleFinishActiveMission}
          onContinueSession={handleContinueActiveMission}
          onMinimize={() => setIsFocusTimerMinimized(true)}
          onSaveProgress={handleSaveActiveMissionProgress}
        />
      )}
      {activeMission && isFocusTimerMinimized && (
        <FocusTimerTray
          activeMission={activeMission}
          onAbort={() => handleAbortMission(0)}
          onComplete={handleFinishActiveMission}
          onOpen={() => setIsFocusTimerMinimized(false)}
        />
      )}

      {battleChoices.length > 0 && (
        <div
          className="sync-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBattleChoices([]);
          }}
        >
          <section className="sync-battle-chooser" aria-modal="true" role="dialog">
            <header>
              <div>
                <span>BATTLE MODE</span>
                <h2>Pilih Quest</h2>
                <p>Prioritas: deadline terdekat, lalu tingkat kesulitan tertinggi.</p>
              </div>
              <button
                aria-label="Tutup pilihan Battle Mode"
                onClick={() => setBattleChoices([])}
                type="button"
              >
                x
              </button>
            </header>
            <div className="sync-battle-choice-list">
              {battleChoices.map((choice, choiceIndex) => (
                <button
                  key={`${choice.columnId}-${choice.card.id}`}
                  onClick={() => startBattleChoice(choice)}
                  type="button"
                >
                  <small>#{choiceIndex + 1} Target</small>
                  <strong>{choice.card.title}</strong>
                  <span>
                    <em>{choice.card.difficulty || "Normal"}</em>
                    <em>{formatBattleDeadline(choice.card.deadline)}</em>
                    {choice.deadlineScore > 0 ? <em>Deadline priority</em> : null}
                    {choice.card.members?.length ? (
                      <em>{choice.card.members.join(", ")}</em>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {isBattleEmptyPromptOpen && (
        <div
          className="sync-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseBattleEmptyPrompt();
          }}
        >
          <section
            aria-labelledby="battle-empty-prompt-title"
            aria-modal="true"
            className="sync-battle-chooser sync-battle-empty-prompt"
            role="dialog"
          >
            <header>
              <div>
                <span>BATTLE MODE</span>
                <h2 id="battle-empty-prompt-title">Tidak bisa bertarung sekarang</h2>
                <p>Buat tugasmu dahulu sebelum memulai Battle Mode.</p>
              </div>
              <button
                aria-label="Tutup Battle Mode"
                onClick={handleCloseBattleEmptyPrompt}
                type="button"
              >
                x
              </button>
            </header>
            <div className="sync-battle-empty-actions">
              <button onClick={handleCreateQuestFromBattlePrompt} type="button">
                Ya, buat tugas
              </button>
              <button className="is-secondary" onClick={handleCloseBattleEmptyPrompt} type="button">
                Tidak, kembali
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="sync-layout">
        <DashboardSidebar
          activeView={activeView}
          characterState={characterState}
          isCollapsed={isSidebarCollapsed}
          isMobileMenuOpen={isSidebarMenuOpen}
          levelProgress={levelProgress}
          navItems={navItems}
          onBackToBoards={onBackToBoards}
          onLogout={onLogout}
          onNavigate={handleNavigation}
          onOpenProfile={() => {
            markOnboardingStep(ONBOARDING_STEP_IDS.PROFILE);
            setIsProfileMenuOpen(true);
          }}
          onOpenSettings={() => {
            markOnboardingStep(ONBOARDING_STEP_IDS.SETTINGS);
            onOpenSettings?.();
          }}
          onOpenTutorial={async () => {
            if (!onboarding.progress.startedAt) {
              await onboarding.restart();
            }
            setIsTutorialGuideOpen(true);
          }}
          onToggleCollapsed={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
          onToggleMobileMenu={() => setIsSidebarMenuOpen((isOpen) => !isOpen)}
          operatorName={operatorName}
          role={role}
          roleIcon={Icon}
        />

        <section className="sync-content">
          {(isDashboardLoading || dashboardError || dashboardNotice) && (
            <div className="sync-visibility-note">
              <Activity size={16} />
              {isDashboardLoading
                ? "Sinkronisasi Supabase..."
                : dashboardError
                  ? dashboardError
                  : dashboardNotice}
            </div>
          )}
          {!onboarding.isLoading && (
            <div className="sync-tutorial-shell">
              <StarterTutorialCard
                onOpen={async () => {
                  if (!onboarding.progress.startedAt) {
                    await onboarding.restart();
                  }
                  setIsTutorialGuideOpen(true);
                }}
                progress={onboarding.progress}
                variant="button"
              />
              <StarterTutorialCard
                isOpen={isTutorialGuideOpen}
                nextStep={onboarding.nextStep}
                onClose={() => setIsTutorialGuideOpen(false)}
                onDismiss={async () => {
                  await onboarding.dismiss();
                  setIsTutorialGuideOpen(false);
                }}
                onSkipStep={(step) => markOnboardingStep(step.id)}
                onStepAction={handleTutorialStepAction}
                progress={onboarding.progress}
              />
            </div>
          )}
          {activeView === "command" && (
            <CommandCenterPage
              dashboard={dashboard}
              characterState={characterState}
              commandSummary={commandCenterSummary}
              levelProgress={levelProgress}
              onOpenBoard={handleOpenWorkspaceBoard}
              role={role}
              roleIcon={Icon}
            />
          )}

          {activeView === "workspace" && (
            <WorkspacePage
              activeWorkspaceId={workspaceState.id}
              onCreateBoard={handleCreatePersonalBoard}
              onOpenBoard={handleOpenWorkspaceBoard}
            />
          )}

          {activeView === "clan" && (
            workspaceSubPage === "clan" ? (
              <ClanPage
                clanId={selectedClanId}
                onBack={handleBackToClanDirectory}
                onCreateBoard={handleCreateClanBoard}
                onOpenBoard={handleOpenWorkspaceBoard}
              />
            ) : (
              <ClanDirectoryPage
                onCreateClan={handleCreateClan}
                onJoinClan={handleJoinClanByCode}
                onOpenClan={handleOpenClan}
              />
            )
          )}

          {activeView === "quests" && (
            <QuestBoardPage
              activeMission={activeMission}
              canDeleteWorkspace={workspaceViewer?.id === workspaceState.ownerId}
              columns={visibleQuestColumns}
              dragState={dragState}
              isPositionEditMode={isQuestPositionEditMode}
              questFilters={questFilters}
              onOpenComposer={handleOpenCreateQuest}
              onCardPointerCancel={handleCardPointerCancel}
              onCardPointerDown={handleCardPointerDown}
              onCardPointerEnd={handleCardPointerEnd}
              onCardPointerMove={handleCardPointerMove}
              onChecklistToggle={handleChecklistToggle}
              onCompleteMission={handleCompleteMission}
              onDeleteWorkspace={handleDeleteWorkspace}
              onEditQuest={handleOpenEditQuest}
              onArchiveQuest={handleArchiveQuest}
              onFilterChange={handleQuestFilterChange}
              onOpenQuestDetail={setSelectedQuestDetail}
              onResetFilters={handleResetQuestFilters}
              onStartMission={handleStartMission}
              onTogglePositionEditMode={() => {
                setCurrentDragState(null);
                setIsQuestPositionEditMode((isEditMode) => !isEditMode);
              }}
              workspaceState={workspaceState}
              workspaceViewer={workspaceViewer}
            />
          )}

          {activeView === "archive" && (
            <ArchivePage
              archivedQuests={archivedQuests}
              isLoading={isArchiveLoading}
              message={archiveMessage}
              onDeleteQuest={handleDeleteArchivedQuest}
              onRestoreQuest={handleRestoreQuest}
              workspaceState={workspaceState}
            />
          )}

          {activeView === "inventory" && (
            <InventoryPage
              activeBoosts={shopInventorySummary.activeBoosts}
              inventory={shopInventorySummary.inventory}
              isLoading={isShopInventoryLoading}
              message={shopInventoryMessage}
              onActivateItem={handleActivateInventoryItem}
            />
          )}

          {activeView === "shop" && (
            <ShopPage
              catalog={shopInventorySummary.catalog}
              gold={characterState.gold}
              isLoading={isShopInventoryLoading}
              message={shopInventoryMessage}
              onBuyItem={handleBuyShopItem}
            />
          )}

        </section>
      </div>

      <GuildOrb
        currentUser={{
          ...operatorProfile,
          email: profileSummary.email,
          id: supabaseUserId || workspaceViewerId || operatorProfile?.id,
          username: profileSummary.username,
        }}
        isVisible={Boolean(workspaceState.id)}
        mode={workspaceState.clanId || workspaceState.type === "clan" ? "clan" : "solo"}
        onCreateGeneratedQuests={handleCreateGuildOrbQuests}
        workspaceId={workspaceState.id}
        workspaceName={workspaceState.name}
      />

      {dragState?.isDragging && (
        <article
          className={`sync-quest-card sync-quest-card--${dragState.card.accent} sync-drag-preview`}
          style={{
            left: dragState.x - dragState.offsetX,
            top: dragState.y - dragState.offsetY,
            width: dragState.width,
          }}
        >
          <QuestCardContent card={dragState.card} isPreview />
        </article>
      )}

      {isQuestComposerOpen && (
        <QuestComposerModal
          initialQuest={editingQuest}
          mode={editingQuest ? "edit" : "create"}
          onClose={handleCloseQuestComposer}
          onCreate={handleCreateQuest}
          onUpdate={handleUpdateQuest}
          workspaceState={workspaceState}
        />
      )}

      {selectedQuestCard && (
        <QuestDetailModal
          card={selectedQuestCard}
          columnTitle={selectedQuestColumn?.title ?? "Quest Board"}
          onAddComment={handleAddQuestComment}
          onArchiveQuest={handleArchiveQuest}
          onChecklistToggle={handleChecklistToggle}
          onClose={() => setSelectedQuestDetail(null)}
          onDeleteQuest={handleDeleteQuest}
          onEditQuest={handleOpenEditQuest}
        />
      )}

      {isProfileMenuOpen && (
        <ProfileMenuModal
          gold={characterState.gold ?? 0}
          onAddFriend={handleAddFriend}
          onSearchFriend={handleSearchFriend}
          onChangeName={handleProfileNameChange}
          onChangePassword={handleProfilePasswordChange}
          onClose={() => setIsProfileMenuOpen(false)}
          onDeleteAccount={handleDeleteAccount}
          onDeleteFriend={handleDeleteFriend}
          onOpenFriendChat={handleOpenFriendChat}
          profile={profileSummary}
          profileError={profileError}
          profileMessage={profileMessage}
        />
      )}

      {activeChatFriend && (
        <div
          className={`sync-profile-chat-card ${friendChatPosition ? "is-dragged" : ""}`}
          style={
            friendChatPosition
              ? { left: `${friendChatPosition.x}px`, top: `${friendChatPosition.y}px` }
              : undefined
          }
        >
          <FriendChatPanel
            chatMessage={friendChatMessage}
            currentUserId={profileSummary.id}
            friend={activeChatFriend}
            isLoading={isLoadingFriendMessages}
            isSending={isSendingFriendMessage}
            messages={friendMessages}
            onChatMessageChange={setFriendChatMessage}
            onClose={handleCloseFriendChat}
            onDragPointerDown={handleFriendChatDragStart}
            onSendMessage={handleSubmitFriendChat}
          />
        </div>
      )}
    </main>
  );
}
