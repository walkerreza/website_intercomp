import { useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { DASHBOARD_BACKGROUND_KEY } from "../data/dashboardBackgrounds.js";
import { roles } from "../data/roles.js";
import { ProgressBar } from "../features/dashboard/components/DashboardShared.jsx";
import { ProfileMenuModal } from "../features/dashboard/components/profile/ProfileMenuModal.jsx";
import { QuestCardContent } from "../features/dashboard/components/quest/QuestCardContent.jsx";
import { QuestComposerModal } from "../features/dashboard/components/quest/QuestComposerModal.jsx";
import { QuestDetailModal } from "../features/dashboard/components/quest/QuestDetailModal.jsx";
import { DashboardSidebar } from "../features/dashboard/components/sidebar/DashboardSidebar.jsx";
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
import { FullscreenFocusTimer } from "../features/focus/components/FullscreenFocusTimer.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { CommandCenterPage } from "./dashboard/CommandCenterPage.jsx";
import { ClanDirectoryPage } from "./dashboard/ClanDirectoryPage.jsx";
import { ClanPage } from "./dashboard/ClanPage.jsx";
import { QuestBoardPage } from "./dashboard/QuestBoardPage.jsx";
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
  loadDashboardFromSupabase,
  moveQuestInSupabase,
  requestJoinClanByCodeInSupabase,
  updateChecklistItemInSupabase,
  updateQuestInSupabase,
} from "../services/dashboardService.js";
import {
  addFriendByUserId,
  deleteCurrentUserAccount,
  loadProfileSummary,
  searchFriendProfiles,
  updateAccountPassword,
  updateProfileName,
} from "../services/profileService.js";

export function DashboardPage({
  accountId,
  initialWorkspaceId = "",
  roleId,
  onBackToBoards,
  onLogout,
  onOpenSettings,
}) {
  const [activeView, setActiveView] = useState("command");
  const [workspaceSubPage, setWorkspaceSubPage] = useState("directory");
  const [selectedClanId, setSelectedClanId] = useState("");
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuestComposerOpen, setIsQuestComposerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState({
    canChangePassword: false,
    email: accountId,
    friendCount: 0,
    id: "",
    username: accountId?.split("@")[0] ?? "Player",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [dragState, setDragState] = useState(null);
  const dragStateRef = useRef(null);
  const [activeMission, setActiveMission] = useState(() => {
    const saved = window.localStorage.getItem("questify:active_mission");
    return saved ? JSON.parse(saved) : null;
  });
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const dashboard = roleDashboards[role.id] ?? roleDashboards.healer;
  const Icon = role.icon;
  const [characterState, setCharacterState] = useState(() =>
    loadCharacterState(accountId),
  );
  const levelProgress = getLevelProgress(characterState.xp);

  useEffect(() => {
    document.body.dataset.dashboardBackground =
      window.localStorage.getItem(DASHBOARD_BACKGROUND_KEY) || "base";
  }, []);

  useEffect(() => {
    refreshProfileSummary();
  }, []);

  useEffect(() => {
    if (initialWorkspaceId) {
      setActiveWorkspaceId(initialWorkspaceId);
    }
  }, [initialWorkspaceId]);

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

  async function refreshDashboardFromSupabase(nextWorkspaceId = activeWorkspaceId) {
    if (!isSupabaseConfigured) return false;

    const dashboardData = await loadDashboardFromSupabase(roleId, nextWorkspaceId);
    applyDashboardData(dashboardData);
    return true;
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
          canViewerSeeQuest(card, workspaceState, workspaceViewer?.id),
        );

        return {
          ...column,
          cards: filteredCards,
        };
      }),
    [questColumns, workspaceState, workspaceViewer?.id],
  );

  function saveCharacterState(nextState) {
    setCharacterState(nextState);
    window.localStorage.setItem(
      `questify:character:${accountId}`,
      JSON.stringify(nextState),
    );
  }

  function grantQuestReward(card, methodMultiplier = 1) {
    if (card.claimed) return;

    const isOwner = workspaceViewer?.id === workspaceState.ownerId;
    const ownerMultiplier = isOwner ? 1.6 : 1;
    const goldMultiplier = isOwner ? 1.35 : 1;
    const earnedXp = Math.round((card.rewardXp ?? parseInt(card.reward, 10) ?? 50) * ownerMultiplier * methodMultiplier);
    const earnedGold = Math.round((card.rewardGold ?? 15) * goldMultiplier);

    saveCharacterState({
      ...characterState,
      xp: (characterState.xp ?? 0) + earnedXp,
      gold: characterState.gold + earnedGold,
    });
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
        await moveQuestInSupabase(cardId, "done", workspaceState);
        await claimQuestRewardInSupabase(cardId);
        await refreshDashboardFromSupabase();
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
  }

  function handleStartMission(card, fromColumnId, minutes, methodMultiplier, methodName) {
    const missionData = {
      cardId: card.id,
      cardTitle: card.title,
      cardDifficulty: card.difficulty || "Normal",
      baseXp: parseInt(card.reward, 10) || 50,
      fromColumnId,
      methodMultiplier,
      methodName,
      endTime: Date.now() + minutes * 60 * 1000,
    };
    setActiveMission(missionData);
    window.localStorage.setItem("questify:active_mission", JSON.stringify(missionData));
  }

  async function handleFinishActiveMission() {
    if (!activeMission) return;
    await handleCompleteMission(activeMission.cardId, activeMission.fromColumnId, activeMission.methodMultiplier);
    setActiveMission(null);
    window.localStorage.removeItem("questify:active_mission");
  }

  // earnedXp is pre-calculated by rewardCalculator inside FullscreenFocusTimer
  function handleAbortMission(earnedXp = 0) {
    if (earnedXp > 0 && activeMission) {
      saveCharacterState({
        ...characterState,
        xp: (characterState.xp ?? 0) + earnedXp,
      });
    }
    setActiveMission(null);
    window.localStorage.removeItem("questify:active_mission");
  }

  function handleNavigation(viewId) {
    setActiveView(viewId);
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
      setActiveView("quests");
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
    setActiveView("clan");
    setSelectedClanId(clanId);
    setWorkspaceSubPage("clan");
  }

  function handleBackToClanDirectory() {
    setSelectedClanId("");
    setWorkspaceSubPage("directory");
  }

  async function handleCreatePersonalBoard(boardName) {
    const cleanedName = boardName.trim();
    if (!cleanedName || dashboardSource !== "supabase") return;

    try {
      const createdWorkspaceId = await createPersonalWorkspaceInSupabase(cleanedName);
      await handleOpenWorkspaceBoard(createdWorkspaceId);
    } catch (error) {
      setDashboardError(error.message || "Gagal membuat personal board.");
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

  async function handleCreateClanBoard(clanId, boardName) {
    const cleanedName = boardName.trim();
    if (!clanId || !cleanedName || dashboardSource !== "supabase") return;

    try {
      const createdWorkspaceId = await createWorkspaceForClanInSupabase(clanId, cleanedName);
      await handleOpenWorkspaceBoard(createdWorkspaceId);
    } catch (error) {
      setDashboardError(error.message || "Gagal membuat clan board.");
    }
  }

  async function handleJoinClanByCode(joinCode) {
    const cleanedCode = joinCode.trim();
    if (!cleanedCode || dashboardSource !== "supabase") return;

    try {
      const clanId = await requestJoinClanByCodeInSupabase(cleanedCode);
      setDashboardNotice("Berhasil join clan. Squad workspace clan ini sekarang langsung terbuka.");
      setSelectedClanId(clanId);
      setActiveView("clan");
      setWorkspaceSubPage("clan");
      await refreshDashboardFromSupabase();
    } catch (error) {
      setDashboardError(error.message || "Gagal join clan dengan kode.");
    }
  }

  async function handleDeleteWorkspace() {
    if (dashboardSource !== "supabase") return;

    const workspaceLabel = workspaceState.type === "clan" ? "squad workspace" : "solo workspace";
    if (!window.confirm(`Delete ${workspaceLabel} "${workspaceState.name}"?`)) return;

    try {
      setIsDashboardLoading(true);
      await deleteWorkspaceInSupabase(workspaceState.id);
      setActiveView("workspace");
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

    const cardRect = event.currentTarget.getBoundingClientRect();
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
          await moveQuestInSupabase(currentDrag.cardId, toColumnId, workspaceState, nextColumns);
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

  async function handleCreateQuest(questData) {
    if (dashboardSource === "supabase") {
      try {
        await createQuestInSupabase(questData, workspaceState, supabaseUserId || workspaceViewerId);
        await refreshDashboardFromSupabase();
        setIsQuestComposerOpen(false);
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
    const assignedRole = roles.find((item) => item.id === questData.assignedRoleId) ?? role;
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
      assignedRoleId: assignedRole.id,
      assignedRoleName: assignedRole.name,
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
        `Target role: ${assignedRole.name}.`,
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
    const assignedRole = roles.find((item) => item.id === questData.assignedRoleId) ?? role;
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
            assignedRoleId: assignedRole.id,
            assignedRoleName: assignedRole.name,
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
        await updateChecklistItemInSupabase(checklistId, !currentItem.done);
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
        await addQuestCommentInSupabase(card.id, supabaseUserId || workspaceViewerId, cleanedComment);
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
        await archiveQuestInSupabase(card.id);
        await refreshDashboardFromSupabase();
        setSelectedQuestDetail(null);
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
        <div className="sync-brand">Questify</div>

        <div className="sync-top-status">
          <div>
            <span>HP</span>
            <strong>85%</strong>
            <ProgressBar value={85} tone="hp" />
          </div>
          <div>
            <span>XP</span>
            <strong>LV {levelProgress.level}</strong>
            <ProgressBar value={levelProgress.progress} tone="xp" />
          </div>
          <button type="button">BATTLE MODE</button>
        </div>
      </header>

      {activeMission && (
        <FullscreenFocusTimer
          activeMission={activeMission}
          onAbort={handleAbortMission}
          onComplete={handleFinishActiveMission}
        />
      )}

      <div className="sync-layout">
        <DashboardSidebar
          activeView={activeView}
          characterState={characterState}
          dashboard={dashboard}
          isCollapsed={isSidebarCollapsed}
          isMobileMenuOpen={isSidebarMenuOpen}
          levelProgress={levelProgress}
          navItems={navItems}
          onBackToBoards={onBackToBoards}
          onLogout={onLogout}
          onNavigate={handleNavigation}
          onOpenProfile={() => setIsProfileMenuOpen(true)}
          onOpenSettings={onOpenSettings}
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

          {activeView === "command" && (
            <CommandCenterPage
              dashboard={dashboard}
              role={role}
              roleIcon={Icon}
              characterState={characterState}
              workspaceState={workspaceState}
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
              onOpenComposer={() => setIsQuestComposerOpen(true)}
              onCardPointerCancel={handleCardPointerCancel}
              onCardPointerDown={handleCardPointerDown}
              onCardPointerEnd={handleCardPointerEnd}
              onCardPointerMove={handleCardPointerMove}
              onChecklistToggle={handleChecklistToggle}
              onCompleteMission={handleCompleteMission}
              onDeleteWorkspace={handleDeleteWorkspace}
              onEditQuest={handleOpenEditQuest}
              onOpenQuestDetail={setSelectedQuestDetail}
              onStartMission={handleStartMission}
              workspaceState={workspaceState}
              workspaceViewer={workspaceViewer}
            />
          )}

        </section>
      </div>

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
          onAddFriend={handleAddFriend}
          onSearchFriend={handleSearchFriend}
          onChangeName={handleProfileNameChange}
          onChangePassword={handleProfilePasswordChange}
          onClose={() => setIsProfileMenuOpen(false)}
          onDeleteAccount={handleDeleteAccount}
          profile={profileSummary}
          profileError={profileError}
          profileMessage={profileMessage}
        />
      )}
    </main>
  );
}
