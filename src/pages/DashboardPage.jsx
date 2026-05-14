import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Backpack,
  Briefcase,
  ChevronDown,
  CheckSquare,
  ClipboardList,
  Coins,
  Command,
  Crown,
  Eye,
  Lock,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Store,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { CharacterSprite } from "../components/CharacterSprite.jsx";
import { getItemById, shopItems, starterEquipment } from "../data/cosmetics.js";
import { roles } from "../data/roles.js";

const roleDashboards = {
  healer: {
    codename: "OP_HEAL_01",
    classLine: "Focus Support / Recovery",
    headline: "RESTORE THE PARTY FLOW",
    status: "SQUAD_MORALE: STABLE",
    passive: "Healing completed quests restores +8 HP to party health.",
    metric: "Focus recovery",
    metricValue: "92%",
    warning: "Low rest cycles reduce healing output.",
    activeQuest: "Revive overdue study plan",
    load: 42,
  },
  assassin: {
    codename: "OP_SHADE_07",
    classLine: "Stealth / Critical Tasks",
    headline: "ELIMINATE HIGH-RISK TASKS",
    status: "CRITICAL_CHAIN: ARMED",
    passive: "Finishing urgent quests grants bonus XP streak multipliers.",
    metric: "Critical precision",
    metricValue: "88%",
    warning: "Avoid multitasking to preserve combo state.",
    activeQuest: "Clear pending micro-deadlines",
    load: 57,
  },
  warrior: {
    codename: "OP_BLADE_12",
    classLine: "Execution / Boss Quests",
    headline: "BREAK THE DEADLINE FRONT",
    status: "BATTLE_STANCE: READY",
    passive: "Boss quests give +20% Gold when completed before deadline.",
    metric: "Quest pressure",
    metricValue: "76%",
    warning: "Heavy tasks are stacked in the next 48 hours.",
    activeQuest: "Complete project milestone",
    load: 68,
  },
  mage: {
    codename: "OP_ARCANE_04",
    classLine: "Planning / Deep Work",
    headline: "CAST THE NEXT STUDY SYSTEM",
    status: "MANA_LINK: ONLINE",
    passive: "Deep work sessions add bonus XP to research quests.",
    metric: "Mana efficiency",
    metricValue: "84%",
    warning: "Context switching drains mana.",
    activeQuest: "Design weekly learning ritual",
    load: 51,
  },
  tank: {
    codename: "OP_AEGIS_09",
    classLine: "Defense / Consistency",
    headline: "HOLD THE PRODUCTIVITY LINE",
    status: "SHIELD_GRID: DEPLOYED",
    passive: "Daily streaks reduce HP penalties from failed quests.",
    metric: "Defense uptime",
    metricValue: "95%",
    warning: "Missed dailies weaken party shield.",
    activeQuest: "Protect morning routine",
    load: 62,
  },
  bard: {
    codename: "OP_CHORD_03",
    classLine: "Motivation / Guild Buff",
    headline: "AMPLIFY THE GUILD TEMPO",
    status: "BATTLE_SONG: ACTIVE",
    passive: "Group quests grant cohesion buffs and extra Gold.",
    metric: "Guild cohesion",
    metricValue: "81%",
    warning: "Party members need a check-in.",
    activeQuest: "Coordinate study squad",
    load: 39,
  },
  ranger: {
    codename: "OP_TRAIL_05",
    classLine: "Targets / Long Range",
    headline: "TRACK THE SEMESTER ROUTE",
    status: "TARGET_LOCK: CONFIRMED",
    passive: "Weekly target chains reveal bonus long-term quests.",
    metric: "Target accuracy",
    metricValue: "86%",
    warning: "One long-range objective is drifting.",
    activeQuest: "Map exam preparation path",
    load: 48,
  },
};

const initialBoardColumns = [
  {
    id: "available",
    title: "AVAILABLE QUESTS",
    cards: [
      {
        id: "debug-payment-api",
        title: "Debug Legacy Payment API",
        description: "Critical failure in the main workflow. Requires immediate attention.",
        reward: "+150 XP",
        penalty: "-50 HP",
        tag: "BOUNTY",
        accent: "danger",
        label: "bounty",
        workspaceId: "workspace",
        creatorId: "owner",
        creatorName: "Workspace Owner",
        visibility: "workspace",
        assignedRoleId: "warrior",
        assignedRoleName: "Warrior",
        rewardXp: 150,
        rewardGold: 40,
        claimed: false,
        checklist: createChecklistItems([
          "Trace error flow",
          "Fix API response",
          "Retest payment path",
        ]),
        members: ["Anjim"],
        comments: [],
      },
      {
        id: "q3-marketing-copy",
        title: "Write Q3 Marketing Copy",
        description: "Draft the initial sequence for the new product launch.",
        reward: "+50 XP",
        penalty: "-20 HP",
        tag: "DUE TOMORROW",
        accent: "normal",
        label: "daily",
        workspaceId: "workspace",
        creatorId: "owner",
        creatorName: "Workspace Owner",
        visibility: "workspace",
        assignedRoleId: "mage",
        assignedRoleName: "Mage",
        rewardXp: 50,
        rewardGold: 18,
        claimed: false,
        checklist: createChecklistItems([
          "Outline angle",
          "Draft first copy",
          "Review final CTA",
        ]),
        members: ["Sari"],
        comments: [],
      },
    ],
  },
  {
    id: "progress",
    title: "IN PROGRESS",
    cards: [
      {
        id: "onboarding-flow",
        title: "Design New Onboarding Flow",
        description: "Create wireframes for the mobile app onboarding sequence.",
        reward: "+100 XP",
        penalty: "",
        tag: "ACTIVE",
        accent: "active",
        label: "study",
        workspaceId: "workspace",
        creatorId: "sari",
        creatorName: "Sari",
        visibility: "private",
        assignedRoleId: "mage",
        assignedRoleName: "Mage",
        rewardXp: 100,
        rewardGold: 25,
        claimed: false,
        checklist: createChecklistItems([
          "Sketch login flow",
          "Prepare mobile variant",
        ]),
        members: ["Budi", "Sari"],
        comments: [],
      },
    ],
  },
  {
    id: "done",
    title: "COMPLETED",
    cards: [
      {
        id: "navigation-bug",
        title: "Fix Navigation Bug",
        description: "Resolved dropdown overlap on mobile viewport.",
        reward: "+30 XP",
        penalty: "",
        tag: "CLAIMED",
        accent: "muted",
        label: "guild",
        workspaceId: "workspace",
        creatorId: "owner",
        creatorName: "Workspace Owner",
        visibility: "workspace",
        assignedRoleId: "tank",
        assignedRoleName: "Tank",
        rewardXp: 30,
        rewardGold: 12,
        claimed: true,
        checklist: createChecklistItems(["Verify dropdown", "Ship fix"]),
        members: ["Budi"],
        comments: [],
      },
    ],
  },
];

const guildMembers = [
  { name: "Anjim", role: "Warrior", hp: "20/100", status: "Needs heal" },
  { name: "Budi", role: "Tank", hp: "80/100", status: "Deployed" },
  { name: "Sari", role: "Mage", hp: "64/100", status: "Planning" },
];

const invitedUserTemplates = [
  { id: "anjim", name: "Anjim", roleId: "warrior", role: "Warrior", hp: "20/100", status: "Needs heal" },
  { id: "budi", name: "Budi", roleId: "tank", role: "Tank", hp: "80/100", status: "Deployed" },
  { id: "sari", name: "Sari", roleId: "mage", role: "Mage", hp: "64/100", status: "Planning" },
];

const questLabelOptions = [
  {
    value: "bounty",
    label: "Bounty",
    tag: "BOUNTY",
    accent: "danger",
    reward: "+150 XP",
    penalty: "-50 HP",
  },
  {
    value: "study",
    label: "Study",
    tag: "STUDY",
    accent: "active",
    reward: "+80 XP",
    penalty: "-20 HP",
  },
  {
    value: "daily",
    label: "Daily",
    tag: "DAILY",
    accent: "normal",
    reward: "+50 XP",
    penalty: "-10 HP",
  },
  {
    value: "guild",
    label: "Guild",
    tag: "GUILD",
    accent: "active",
    reward: "+100 XP",
    penalty: "",
  },
];

const navItems = [
  { id: "command", label: "Command Center", icon: Command },
  { id: "workspace", label: "Workspace", icon: Briefcase },
  { id: "quests", label: "Quest Board", icon: ClipboardList },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "shop", label: "Shop", icon: Store },
  { id: "guild", label: "Guild Hall", icon: Users },
];

function loadCharacterState(accountId) {
  const fallback = {
    gold: 220,
    xp: 450,
    ownedItems: [],
    equipment: starterEquipment,
  };

  try {
    const saved = window.localStorage.getItem(`questify:character:${accountId}`);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function createDefaultWorkspace(accountId, roleId) {
  const ownerId = accountId || "owner";
  const ownerName = ownerId.includes("@") ? ownerId.split("@")[0] : ownerId;

  return {
    id: `workspace-${ownerId}`,
    name: "Questify Study Guild",
    ownerId,
    members: [
      {
        id: ownerId,
        name: ownerName || "Owner",
        roleId,
        role: roles.find((item) => item.id === roleId)?.name ?? "Leader",
        workspaceRole: "Owner",
        status: "Active",
      },
    ],
  };
}

function loadWorkspaceState(accountId, roleId) {
  const fallback = createDefaultWorkspace(accountId, roleId);

  try {
    const saved = window.localStorage.getItem(`questify:workspace:${accountId}`);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function loadRegisteredUsers() {
  try {
    const savedUsers = window.localStorage.getItem("questify:users");
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
}

function ProgressBar({ value, tone = "xp" }) {
  return (
    <div className={`sync-progress sync-progress--${tone}`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function StatLine({ label, value, tone }) {
  return (
    <div className="sync-stat-line">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

function moveQuestCard(columns, { cardId, fromColumnId, toColumnId, beforeCardId }) {
  if (!toColumnId) return columns;

  let movingCard;
  const columnsWithoutCard = columns.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => {
      if (card.id !== cardId) return true;
      movingCard = card;
      return false;
    }),
  }));

  if (!movingCard) return columns;

  return columnsWithoutCard.map((column) => {
    if (column.id !== toColumnId) return column;

    const nextCards = [...column.cards];
    const beforeIndex = beforeCardId
      ? nextCards.findIndex((card) => card.id === beforeCardId)
      : -1;

    if (beforeIndex >= 0 && beforeCardId !== cardId) {
      nextCards.splice(beforeIndex, 0, movingCard);
    } else {
      nextCards.push(movingCard);
    }

    return {
      ...column,
      cards: nextCards,
    };
  });
}

function createChecklistItems(items) {
  return items.map((item, index) => ({
    id: `check-${Date.now()}-${index}-${item.toLowerCase().replace(/\W+/g, "-")}`,
    text: item,
    done: false,
  }));
}

function mergeChecklistItems(items, existingItems = []) {
  return items.map((item, index) => {
    const existingItem = existingItems.find(
      (checklistItem) =>
        checklistItem.text.trim().toLowerCase() === item.trim().toLowerCase(),
    );

    return {
      id:
        existingItem?.id ??
        `check-${Date.now()}-${index}-${item.toLowerCase().replace(/\W+/g, "-")}`,
      text: item,
      done: existingItem?.done ?? false,
    };
  });
}

function canViewerSeeQuest(card, workspace, viewerId) {
  if (!viewerId) return false;
  if (viewerId === workspace.ownerId) return true;
  const viewer = workspace.members.find((member) => member.id === viewerId);
  if (viewer?.status === "Menunggu persetujuan") return false;
  if (card.visibility === "workspace") return true;
  return card.creatorId === viewerId;
}

export function DashboardPage({ accountId, roleId, onLogout }) {
  const [activeView, setActiveView] = useState("command");
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const [isQuestComposerOpen, setIsQuestComposerOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [questColumns, setQuestColumns] = useState(initialBoardColumns);
  const [workspaceState, setWorkspaceState] = useState(() =>
    loadWorkspaceState(accountId, roleId),
  );
  const [registeredUsers, setRegisteredUsers] = useState(() =>
    loadRegisteredUsers(),
  );
  const [workspaceViewerId, setWorkspaceViewerId] = useState(accountId);
  const [dragState, setDragState] = useState(null);
  const dragStateRef = useRef(null);
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const dashboard = roleDashboards[role.id] ?? roleDashboards.healer;
  const Icon = role.icon;
  const [characterState, setCharacterState] = useState(() =>
    loadCharacterState(accountId),
  );
  const workspaceOwner = workspaceState.members.find(
    (member) => member.id === workspaceState.ownerId,
  );
  const workspaceViewer =
    workspaceState.members.find((member) => member.id === workspaceViewerId) ??
    workspaceOwner ??
    workspaceState.members[0];
  const visibleQuestColumns = useMemo(
    () =>
      questColumns.map((column) => ({
        ...column,
        cards: column.cards.filter((card) =>
          canViewerSeeQuest(card, workspaceState, workspaceViewer?.id),
        ),
      })),
    [questColumns, workspaceState, workspaceViewer?.id],
  );

  const equippedItems = useMemo(
    () =>
      Object.entries(characterState.equipment)
        .map(([slot, itemId]) => ({ slot, item: getItemById(itemId) }))
        .filter(({ item }) => item),
    [characterState.equipment],
  );

  function saveCharacterState(nextState) {
    setCharacterState(nextState);
    window.localStorage.setItem(
      `questify:character:${accountId}`,
      JSON.stringify(nextState),
    );
  }

  function saveWorkspaceState(nextState) {
    setWorkspaceState(nextState);
    window.localStorage.setItem(
      `questify:workspace:${accountId}`,
      JSON.stringify(nextState),
    );
  }

  function handleCreateWorkspace(workspaceName) {
    const cleanedName = workspaceName.trim();

    if (!cleanedName) return;

    saveWorkspaceState({
      ...workspaceState,
      name: cleanedName,
    });
  }

  function handleInviteMember(accountToInvite) {
    const matchedUser = registeredUsers.find(
      (user) => user.id === accountToInvite || user.username === accountToInvite,
    );

    if (!matchedUser?.roleId) return;

    const memberRole = roles.find((item) => item.id === matchedUser.roleId) ?? roles[0];

    if (workspaceState.members.some((member) => member.id === matchedUser.id)) return;

    saveWorkspaceState({
      ...workspaceState,
      members: [
        ...workspaceState.members,
        {
          id: matchedUser.id,
          name: matchedUser.username,
          roleId: memberRole.id,
          role: memberRole.name,
          workspaceRole: "Pending",
          status: "Menunggu persetujuan",
          hp: "100/100",
        },
      ],
    });
  }

  function grantQuestReward(card) {
    if (card.claimed) return;

    const isOwner = workspaceViewer?.id === workspaceState.ownerId;
    const xpMultiplier = isOwner ? 1.6 : 1;
    const goldMultiplier = isOwner ? 1.35 : 1;
    const earnedXp = Math.round((card.rewardXp ?? parseInt(card.reward, 10) ?? 50) * xpMultiplier);
    const earnedGold = Math.round((card.rewardGold ?? 15) * goldMultiplier);

    saveCharacterState({
      ...characterState,
      xp: (characterState.xp ?? 450) + earnedXp,
      gold: characterState.gold + earnedGold,
    });
  }

  function handleBuyOrEquip(item) {
    const hasItem = characterState.ownedItems.includes(item.id);

    if (!hasItem) {
      if (characterState.gold < item.price) return;

      saveCharacterState({
        ...characterState,
        gold: characterState.gold - item.price,
        ownedItems: [...characterState.ownedItems, item.id],
        equipment: {
          ...characterState.equipment,
          [item.slot]: item.id,
        },
      });
      return;
    }

    const isEquipped = characterState.equipment[item.slot] === item.id;
    saveCharacterState({
      ...characterState,
      equipment: {
        ...characterState.equipment,
        [item.slot]: isEquipped ? null : item.id,
      },
    });
  }

  function handleBuyItem(item) {
    const hasItem = characterState.ownedItems.includes(item.id);

    if (hasItem || characterState.gold < item.price) return;

    saveCharacterState({
      ...characterState,
      gold: characterState.gold - item.price,
      ownedItems: [...characterState.ownedItems, item.id],
    });
  }

  function handleNavigation(viewId) {
    setActiveView(viewId);
    setIsSidebarMenuOpen(false);
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

  function handleCardPointerEnd(event) {
    const currentDrag = dragStateRef.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (currentDrag.isDragging) {
      const dropTarget = getDropTarget(event.clientX, event.clientY, currentDrag.cardId);
      const toColumnId = dropTarget.toColumnId || currentDrag.overColumnId;
      const shouldClaimReward = toColumnId === "done" && !currentDrag.card.claimed;

      setQuestColumns((columns) =>
        moveQuestCard(columns, {
          cardId: currentDrag.cardId,
          fromColumnId: currentDrag.fromColumnId,
          toColumnId,
          beforeCardId: dropTarget.beforeCardId || currentDrag.beforeCardId,
        }).map((column) => ({
          ...column,
          cards: column.cards.map((card) =>
            shouldClaimReward && card.id === currentDrag.cardId
              ? {
                  ...card,
                  claimed: true,
                  activity: [
                    `Reward diklaim oleh ${workspaceViewer?.name ?? "viewer"}.`,
                    ...(card.activity ?? []),
                  ],
                }
              : card,
          ),
        })),
      );

      if (shouldClaimReward) {
        grantQuestReward(currentDrag.card);
      }
    }

    setCurrentDragState(null);
  }

  function handleCardPointerCancel() {
    setCurrentDragState(null);
  }

  function handleCreateQuest(questData) {
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

    setQuestColumns((columns) =>
      columns.map((column) =>
        column.id === "available"
          ? { ...column, cards: [createdQuest, ...column.cards] }
          : column,
      ),
    );
    setIsQuestComposerOpen(false);
  }

  function handleOpenEditQuest(card) {
    setEditingQuest(card);
    setIsQuestComposerOpen(true);
  }

  function handleCloseQuestComposer() {
    setEditingQuest(null);
    setIsQuestComposerOpen(false);
  }

  function handleUpdateQuest(questData) {
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

  function handleChecklistToggle(cardId, checklistId) {
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
            <strong>42%</strong>
            <ProgressBar value={42} tone="xp" />
          </div>
          <button type="button">BATTLE MODE</button>
        </div>
      </header>

      <div className="sync-layout">
        <aside className="sync-sidebar">
          <button
            aria-expanded={isSidebarMenuOpen}
            className={`sync-mobile-menu-button ${isSidebarMenuOpen ? "is-open" : ""}`}
            onClick={() => setIsSidebarMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span>
              <span className="sync-mobile-menu-icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{dashboard.codename}</strong>
                <small>{role.name} menu</small>
              </span>
            </span>
            <ChevronDown size={18} />
          </button>

          <div className={`sync-sidebar-menu ${isSidebarMenuOpen ? "is-open" : ""}`}>
            <section className="sync-operator-card">
              <div className="sync-avatar-frame">
                <CharacterSprite
                  roleId={role.id}
                  equipment={characterState.equipment}
                />
              </div>
              <div>
                <strong>{dashboard.codename}</strong>
                <span>LVL 42 {role.name}</span>
                <small>{dashboard.classLine}</small>
              </div>
            </section>

            <button className="sync-mission-button" type="button">
              NEW MISSION
            </button>

            <nav className="sync-side-nav" aria-label="Dashboard navigation">
              {navItems.map((item) => {
                const NavIcon = item.icon;

                return (
                  <button
                    className={activeView === item.id ? "is-active" : ""}
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    type="button"
                  >
                    <NavIcon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <section className="sync-party">
              <h3>PARTY MEMBERS</h3>
              {guildMembers.slice(0, 2).map((member) => (
                <article key={member.name}>
                  <div className="sync-member-thumb" />
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                    <small>{member.hp}</small>
                  </div>
                </article>
              ))}
            </section>

            <div className="sync-sidebar-footer">
              <button type="button">
                <Settings size={18} />
                Settings
              </button>
              <button onClick={onLogout} type="button">
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </div>
        </aside>

        <section className="sync-content">
          {activeView === "command" && (
            <CommandCenterView
              dashboard={dashboard}
              role={role}
              roleIcon={Icon}
              characterState={characterState}
              workspaceState={workspaceState}
            />
          )}

          {activeView === "workspace" && (
            <WorkspaceView
              accountId={accountId}
              onCreateWorkspace={handleCreateWorkspace}
              onInviteMember={handleInviteMember}
              onViewerChange={setWorkspaceViewerId}
              registeredUsers={registeredUsers}
              viewerId={workspaceViewer?.id}
              visibleQuestCount={visibleQuestColumns.reduce(
                (total, column) => total + column.cards.length,
                0,
              )}
              workspaceState={workspaceState}
            />
          )}

          {activeView === "quests" && (
            <QuestBoardView
              columns={visibleQuestColumns}
              dragState={dragState}
              onOpenComposer={() => setIsQuestComposerOpen(true)}
              onCardPointerCancel={handleCardPointerCancel}
              onCardPointerDown={handleCardPointerDown}
              onCardPointerEnd={handleCardPointerEnd}
              onCardPointerMove={handleCardPointerMove}
              onChecklistToggle={handleChecklistToggle}
              onEditQuest={handleOpenEditQuest}
              workspaceState={workspaceState}
              workspaceViewer={workspaceViewer}
            />
          )}

          {activeView === "inventory" && (
            <InventoryView
              characterState={characterState}
              equippedItems={equippedItems}
              handleBuyOrEquip={handleBuyOrEquip}
            />
          )}

          {activeView === "shop" && (
            <ShopView
              characterState={characterState}
              handleBuyItem={handleBuyItem}
              role={role}
            />
          )}

          {activeView === "guild" && <GuildView dashboard={dashboard} />}
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
    </main>
  );
}

function CommandCenterView({
  dashboard,
  role,
  roleIcon: RoleIcon,
  characterState,
  workspaceState,
}) {
  return (
    <>
      <section className="sync-hero-panel">
        <div>
          <span className="sync-broadcast">BROADCAST ACTIVE</span>
          <h1>{dashboard.headline}</h1>
          <p>{dashboard.status} | WORKSPACE: {workspaceState.name}</p>
        </div>
        <span className="sync-role-badge" style={{ "--role-accent": role.accent }}>
          <RoleIcon size={18} />
          {role.name}
        </span>
      </section>

      <section className="sync-panel-grid">
        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>OPERATOR METRICS</h2>
            <span>T-MINUS 30 DAYS</span>
          </div>
          <div className="sync-chart">
            {[48, 36, 57, 44, 66, 53, 38, 74, 82].map((height, index) => (
              <span
                className={index === 6 ? "is-warning" : index === 1 ? "is-danger" : ""}
                key={height + index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>BEHAVIORAL METRICS</h2>
          </div>
          <div className="sync-stat-stack">
            <StatLine label={dashboard.metric} value={Number(dashboard.metricValue.replace("%", ""))} tone="xp" />
            <StatLine label="Guild cohesion" value={62} tone="gold" />
            <StatLine label="Burnout risk" value={31} tone="hp" />
          </div>
          <div className="sync-alert">
            &gt; ALERT: {dashboard.warning}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>ACTIVE MODIFIER</h2>
          </div>
          <p className="sync-terminal-copy">{dashboard.passive}</p>
          <div className="sync-resource-row">
            <span><Coins size={18} /> {characterState.gold} CR</span>
            <span><Zap size={18} /> {characterState.xp ?? 450} XP</span>
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>READINESS MATRIX</h2>
          </div>
          {guildMembers.map((member) => (
            <div className="sync-readiness" key={member.name}>
              <strong>{member.name}</strong>
              <span>{member.status}</span>
              <ProgressBar value={member.name === "Anjim" ? 20 : member.name === "Budi" ? 80 : 64} tone="xp" />
            </div>
          ))}
        </article>
      </section>
    </>
  );
}

function WorkspaceView({
  accountId,
  onCreateWorkspace,
  onInviteMember,
  onViewerChange,
  registeredUsers,
  viewerId,
  visibleQuestCount,
  workspaceState,
}) {
  const [workspaceName, setWorkspaceName] = useState(workspaceState.name);
  const [inviteQuery, setInviteQuery] = useState("");
  const owner = workspaceState.members.find((member) => member.id === workspaceState.ownerId);
  const cleanedInviteQuery = inviteQuery.trim().toLowerCase();
  const matchedUser = registeredUsers.find(
    (user) =>
      cleanedInviteQuery &&
      (user.username.toLowerCase() === cleanedInviteQuery ||
        user.accountId.toLowerCase() === cleanedInviteQuery),
  );
  const matchedUserRole = roles.find((item) => item.id === matchedUser?.roleId);
  const existingWorkspaceMember =
    matchedUser &&
    workspaceState.members.find((member) => member.id === matchedUser.id);
  const isAlreadyMember = Boolean(existingWorkspaceMember);
  const activeMemberCount = workspaceState.members.filter(
    (member) => member.status === "Active" || member.workspaceRole === "Owner",
  ).length;
  const pendingMembers = workspaceState.members.filter(
    (member) => member.status === "Menunggu persetujuan",
  );
  const pendingMemberCount = pendingMembers.length;

  function handleWorkspaceSubmit(event) {
    event.preventDefault();
    onCreateWorkspace(workspaceName);
  }

  function handleInviteSubmit(event) {
    event.preventDefault();
    if (!matchedUser || isAlreadyMember || !matchedUserRole) return;
    onInviteMember(matchedUser.id);
    setInviteQuery("");
  }

  return (
    <>
      <div className="sync-section-title">
        <div>
          <h1>WORKSPACE</h1>
          <span>OWNER CONTROL | TASK VISIBILITY RULES</span>
        </div>
      </div>

      <section className="sync-workspace-grid">
        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>CREATE WORKSPACE</h2>
            <span>{activeMemberCount} ACTIVE | {pendingMemberCount} PENDING</span>
          </div>
          <form className="sync-inline-form" onSubmit={handleWorkspaceSubmit}>
            <label className="sync-form-field">
              <span>Workspace Name</span>
              <input
                onChange={(event) => setWorkspaceName(event.target.value)}
                value={workspaceName}
                type="text"
              />
            </label>
            <button className="sync-composer-submit" type="submit">
              <Briefcase size={17} />
              Save Workspace
            </button>
          </form>
          <div className="sync-workspace-owner">
            <Crown size={20} />
            <span>
              Owner: <strong>{owner?.name ?? accountId}</strong>
            </span>
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>INVITE USER</h2>
            <span>SEARCH REGISTERED ACCOUNT</span>
          </div>
          <form className="sync-inline-form" onSubmit={handleInviteSubmit}>
            <label className="sync-form-field">
              <span>User Name</span>
              <input
                onChange={(event) => setInviteQuery(event.target.value)}
                placeholder="Cari username atau email akun"
                required
                type="text"
                value={inviteQuery}
              />
            </label>

            {matchedUser && (
              <div className="sync-found-user-card">
                <strong>{matchedUser.username.slice(0, 2).toUpperCase()}</strong>
                <span>
                  {matchedUser.username}
                  <small>
                    {matchedUserRole
                      ? `${matchedUser.accountId} | ${matchedUserRole.name}`
                      : "Akun ini belum memilih role"}
                  </small>
                </span>
              </div>
            )}

            {!matchedUser && cleanedInviteQuery && (
              <div className="sync-visibility-note">
                <Lock size={16} />
                Akun tidak ditemukan. User harus register/login dan memilih role dulu.
              </div>
            )}

            {isAlreadyMember && (
              <div className="sync-visibility-note">
                <Eye size={16} />
                {existingWorkspaceMember?.status === "Menunggu persetujuan"
                  ? "Undangan untuk user ini masih menunggu persetujuan."
                  : "User ini sudah menjadi member workspace."}
              </div>
            )}

            <button
              className="sync-composer-submit"
              disabled={!matchedUser || isAlreadyMember || !matchedUserRole}
              type="submit"
            >
              <UserPlus size={17} />
              Invite Member
            </button>
          </form>
        </article>

        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>WORKSPACE MEMBERS</h2>
            <span>VISIBLE QUESTS: {visibleQuestCount}</span>
          </div>
          <div className="sync-workspace-members">
            {workspaceState.members.map((member) => (
              <article
                className={viewerId === member.id ? "is-selected" : ""}
                key={member.id}
              >
                <button onClick={() => onViewerChange(member.id)} type="button">
                  <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                  <span>
                    {member.name}
                    <small>{member.workspaceRole} | {member.role}</small>
                    <em>{member.status ?? "Active"}</em>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>PENDING INVITATIONS</h2>
            <span>{pendingMemberCount} WAITING</span>
          </div>
          <div className="sync-pending-invites">
            {pendingMembers.length ? (
              pendingMembers.map((member) => (
                <article key={member.id}>
                  <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                  <span>
                    {member.name}
                    <small>{member.role} | Menunggu persetujuan</small>
                  </span>
                  <em>Pending</em>
                </article>
              ))
            ) : (
              <div className="sync-visibility-note">
                <Eye size={16} />
                Belum ada undangan yang menunggu persetujuan.
              </div>
            )}
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>REWARD RULE</h2>
          </div>
          <div className="sync-rule-list">
            <span><Eye size={17} /> Owner task: visible to all invited users.</span>
            <span><Lock size={17} /> Invited task: visible only to owner and creator.</span>
            <span><UserPlus size={17} /> Invite masuk sebagai pending sampai user menerima undangan.</span>
            <span><Crown size={17} /> Owner gets 1.6x XP and 1.35x coins on completed quests.</span>
          </div>
        </article>
      </section>
    </>
  );
}

function QuestBoardView({
  columns,
  dragState,
  onOpenComposer,
  onCardPointerCancel,
  onCardPointerDown,
  onCardPointerEnd,
  onCardPointerMove,
  onChecklistToggle,
  onEditQuest,
  workspaceState,
  workspaceViewer,
}) {
  return (
    <>
      <div className="sync-section-title">
        <div>
          <h1>ACTIVE QUESTS</h1>
          <span>
            {workspaceState.name} | VIEW AS: {workspaceViewer?.name ?? "Owner"}
          </span>
        </div>
        <button onClick={onOpenComposer} type="button">
          <Plus size={18} />
          NEW QUEST
        </button>
      </div>

      <section className="sync-quest-board">
        {columns.map((column) => (
          <div
            className={`sync-quest-column ${
              dragState?.overColumnId === column.id ? "is-drop-target" : ""
            }`}
            data-quest-column-id={column.id}
            key={column.id}
          >
            <header>
              <span>{column.title}</span>
              <strong>{column.cards.length}</strong>
            </header>
            {column.cards.map((card) => (
              <article
                className={`sync-quest-card sync-quest-card--${card.accent} ${
                  dragState?.cardId === card.id ? "is-dragging" : ""
                }`}
                data-quest-card-id={card.id}
                key={card.id}
                onDragStart={(event) => event.preventDefault()}
                onPointerCancel={onCardPointerCancel}
                onPointerDown={(event) => onCardPointerDown(event, column.id, card)}
                onPointerMove={onCardPointerMove}
                onPointerUp={onCardPointerEnd}
              >
                <QuestCardContent
                  card={card}
                  onEditQuest={onEditQuest}
                  onChecklistToggle={onChecklistToggle}
                />
              </article>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}

function QuestCardContent({
  card,
  isPreview = false,
  onChecklistToggle,
  onEditQuest,
}) {
  const checklistDone = card.checklist?.filter((item) => item.done).length ?? 0;
  const checklistTotal = card.checklist?.length ?? 0;

  return (
    <>
      <small>{card.tag}</small>
      {!isPreview && (
        <button
          aria-label={`Edit ${card.title}`}
          className="sync-card-edit-button"
          onClick={(event) => {
            event.stopPropagation();
            onEditQuest?.(card);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <Pencil size={14} />
        </button>
      )}
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      {(card.visibility || card.assignedRoleName || card.checklist?.length || card.members?.length || card.comments?.length) && (
        <div className="sync-card-meta">
          <span>
            {card.visibility === "private" ? <Lock size={14} /> : <Eye size={14} />}
            {card.visibility === "private" ? "Owner + Creator" : "Workspace"}
          </span>
          {card.assignedRoleName && (
            <span>
              <Crown size={14} />
              {card.assignedRoleName}
            </span>
          )}
          {card.checklist?.length > 0 && (
            <span>
              <CheckSquare size={14} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {card.members?.length > 0 && (
            <span>
              <Users size={14} />
              {card.members.length}
            </span>
          )}
          {card.comments?.length > 0 && (
            <span>
              <MessageSquare size={14} />
              {card.comments.length}
            </span>
          )}
        </div>
      )}
      {card.members?.length > 0 && (
        <div className="sync-member-pills">
          {card.members.map((member) => (
            <span key={member}>{member.slice(0, 2).toUpperCase()}</span>
          ))}
        </div>
      )}
      {card.checklist?.length > 0 && (
        <div className="sync-card-checklist" aria-label={`Checklist ${card.title}`}>
          {card.checklist.map((item) => (
            <label
              className={item.done ? "is-checked" : ""}
              key={item.id}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <input
                checked={item.done}
                disabled={isPreview}
                onChange={() => onChecklistToggle?.(card.id, item.id)}
                type="checkbox"
              />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      )}
      <footer>
        <strong>{card.claimed ? "CLAIMED" : card.reward}</strong>
        {card.penalty && <em>{card.penalty}</em>}
      </footer>
    </>
  );
}

function QuestComposerModal({
  initialQuest,
  mode = "create",
  onClose,
  onCreate,
  onUpdate,
  workspaceState,
}) {
  const isEditMode = mode === "edit";
  const [selectedMembers, setSelectedMembers] = useState(
    initialQuest?.members ?? [],
  );
  const [comment, setComment] = useState("");
  const initialChecklist = (initialQuest?.checklist ?? [])
    .map((item) => item.text)
    .join("\n");
  const initialLabel = initialQuest?.label ?? "study";
  const initialCreatorId = initialQuest?.creatorId ?? workspaceState.ownerId;
  const initialAssignedRoleId =
    initialQuest?.assignedRoleId ??
    workspaceState.members.find((member) => member.id === initialCreatorId)?.roleId ??
    "healer";
  const [creatorId, setCreatorId] = useState(initialCreatorId);
  const activeWorkspaceMembers = workspaceState.members.filter(
    (member) => member.status === "Active" || member.workspaceRole === "Owner",
  );
  const selectedCreator =
    activeWorkspaceMembers.find((member) => member.id === creatorId) ??
    activeWorkspaceMembers[0];

  function handleMemberToggle(memberName) {
    setSelectedMembers((currentMembers) =>
      currentMembers.includes(memberName)
        ? currentMembers.filter((name) => name !== memberName)
        : [...currentMembers, memberName],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const checklist = formData
      .get("checklist")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const questPayload = {
      id: initialQuest?.id,
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      label: formData.get("label"),
      creatorId: formData.get("creatorId"),
      assignedRoleId: formData.get("assignedRoleId"),
      checklist,
      members: selectedMembers,
      comment: comment.trim(),
    };

    if (isEditMode) {
      onUpdate(questPayload);
      return;
    }

    onCreate(questPayload);
  }

  return (
    <div className="sync-modal-backdrop" role="presentation">
      <section
        aria-label={isEditMode ? "Edit quest" : "Tambah quest baru"}
        aria-modal="true"
        className="sync-card-composer"
        role="dialog"
      >
        <header className="sync-composer-header">
          <div>
            <span>{isEditMode ? "EDIT QUEST CARD" : "NEW QUEST CARD"}</span>
            <h2>{isEditMode ? "Update Mission Brief" : "Create Mission Brief"}</h2>
          </div>
          <button aria-label="Tutup form tambah quest" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <form className="sync-composer-body" onSubmit={handleSubmit}>
          <div className="sync-composer-main">
            <label className="sync-form-field">
              <span>Title</span>
              <input
                autoFocus
                defaultValue={initialQuest?.title ?? ""}
                name="title"
                placeholder="Contoh: Review materi UTS basis data"
                required
                type="text"
              />
            </label>

            <label className="sync-form-field">
              <span>Description</span>
              <textarea
                name="description"
                defaultValue={initialQuest?.description ?? ""}
                placeholder="Tulis detail tugas, deadline, atau catatan penting."
                required
                rows={4}
              />
            </label>

            <label className="sync-form-field">
              <span>Label</span>
              <select defaultValue={initialLabel} name="label">
                {questLabelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.reward}
                  </option>
                ))}
              </select>
            </label>

            <div className="sync-form-split">
              <label className="sync-form-field">
                <span>Creator</span>
                <select
                  defaultValue={initialCreatorId}
                  name="creatorId"
                  onChange={(event) => setCreatorId(event.target.value)}
                >
                  {activeWorkspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.workspaceRole}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sync-form-field">
                <span>Target Role</span>
                <select defaultValue={initialAssignedRoleId} name="assignedRoleId">
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sync-visibility-note">
              {selectedCreator?.id === workspaceState.ownerId ? (
                <>
                  <Eye size={16} />
                  Task dari owner akan terlihat oleh semua user di workspace.
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Task dari invited user hanya terlihat oleh owner dan creator task.
                </>
              )}
            </div>

            <label className="sync-form-field">
              <span>Checklist</span>
              <textarea
                name="checklist"
                defaultValue={initialChecklist}
                placeholder={"Baca modul 1\nKerjakan latihan\nUpload catatan"}
                rows={4}
              />
            </label>

            <div className="sync-form-field">
              <span>Members</span>
              <div className="sync-member-picker">
                {activeWorkspaceMembers.map((member) => (
                  <button
                    className={selectedMembers.includes(member.name) ? "is-selected" : ""}
                    key={member.name}
                    onClick={() => handleMemberToggle(member.name)}
                    type="button"
                  >
                    <strong>{member.name.slice(0, 2).toUpperCase()}</strong>
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="sync-composer-side">
            <div>
              <h3>
                <MessageSquare size={17} />
                Comment
              </h3>
              <textarea
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tambahkan komentar awal untuk card ini."
                rows={5}
                value={comment}
              />
            </div>

            <div>
              <h3>
                <Activity size={17} />
                Activity
              </h3>
              <ul>
                <li>
                  {isEditMode
                    ? "Perubahan akan disimpan ke card ini."
                    : "Card akan dibuat di Available Quests."}
                </li>
                {selectedMembers.length > 0 && (
                  <li>{selectedMembers.length} member siap ditugaskan.</li>
                )}
                {comment && (
                  <li>
                    {isEditMode
                      ? "Komentar baru akan ditambahkan."
                      : "Komentar awal akan disimpan."}
                  </li>
                )}
                {initialQuest?.activity?.slice(0, 3).map((activityItem) => (
                  <li key={activityItem}>{activityItem}</li>
                ))}
              </ul>
            </div>

            <div className="sync-composer-actions">
              <button className="sync-composer-submit" type="submit">
                {isEditMode ? <Pencil size={17} /> : <Plus size={17} />}
                {isEditMode ? "Save Quest" : "Add Card"}
              </button>
              <button className="sync-composer-cancel" onClick={onClose} type="button">
                Cancel
              </button>
            </div>
          </aside>
        </form>
      </section>
    </div>
  );
}

function InventoryView({ characterState, equippedItems, handleBuyOrEquip }) {
  const ownedItems = shopItems.filter((item) =>
    characterState.ownedItems.includes(item.id),
  );

  return (
    <>
      <div className="sync-section-title">
        <h1>VAULT SYSTEMS</h1>
        <span>STATUS: SECURE_LINK_ESTABLISHED</span>
      </div>

      <section className="sync-vault-grid">
        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>PERSONAL STASH</h2>
          </div>
          <div className="sync-stash">
            <div>
              <Coins size={34} />
              <strong>{characterState.gold}</strong>
              <span>CREDITS</span>
            </div>
            <div>
              <Sparkles size={34} />
              <strong>450</strong>
              <span>XP YIELD</span>
            </div>
          </div>
        </article>

        <article className="sync-panel sync-panel--active-item">
          <div className="sync-panel-heading">
            <h2>ACTIVE MODULES</h2>
          </div>
          <div className="sync-equipped-tags">
            {equippedItems.length ? (
              equippedItems.map(({ item }) => <span key={item.id}>{item.name}</span>)
            ) : (
              <span>No item equipped</span>
            )}
          </div>
        </article>
      </section>

      <section className="sync-panel">
        <div className="sync-panel-heading">
          <h2>LOCAL INVENTORY BUFFER</h2>
          <span>CAPACITY: {characterState.ownedItems.length}/64</span>
        </div>
        <div className="sync-inventory-grid">
          {ownedItems.length === 0 && (
            <article className="sync-empty-inventory">
              <strong>Inventory masih kosong</strong>
              <span>Beli item di Shop untuk mulai memperkuat karakter.</span>
            </article>
          )}
          {ownedItems.map((item) => {
            const equipped = characterState.equipment[item.slot] === item.id;

            return (
              <article className="sync-inventory-item" data-rarity={item.rarity} key={item.id}>
                <Backpack size={24} />
                <div className="sync-item-title">
                  <strong>{item.name}</strong>
                  <span>{item.rarity}</span>
                </div>
                <small>{item.description}</small>
                <button
                  onClick={() => handleBuyOrEquip(item)}
                  type="button"
                >
                  {equipped ? "EQUIPPED" : "EQUIP"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function ShopView({ characterState, handleBuyItem, role }) {
  const roleItems = shopItems.filter((item) => item.roles.includes(role.id));
  const recommendedItems = roleItems.filter((item) => item.rarity === "Legendary");

  return (
    <>
      <div className="sync-section-title">
        <h1>ROLE SHOP</h1>
        <span>{role.name.toUpperCase()} LOADOUT MARKET</span>
      </div>

      <section className="sync-vault-grid">
        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>COIN WALLET</h2>
          </div>
          <div className="sync-stash">
            <div>
              <Coins size={34} />
              <strong>{characterState.gold}</strong>
              <span>CREDITS</span>
            </div>
            <div>
              <Store size={34} />
              <strong>{roleItems.length}</strong>
              <span>{role.name.toUpperCase()} ITEMS</span>
            </div>
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>LEGENDARY PICKS</h2>
          </div>
          <div className="sync-equipped-tags">
            {recommendedItems.length ? (
              recommendedItems.map((item) => <span key={item.id}>{item.name}</span>)
            ) : (
              <span>Legendary item belum tersedia untuk role ini</span>
            )}
          </div>
        </article>
      </section>

      <section className="sync-panel">
        <div className="sync-panel-heading">
          <h2>CLASS EQUIPMENT SHOP</h2>
          <span>BUY WITH QUEST COINS</span>
        </div>
        <div className="sync-shop-grid">
          {roleItems.map((item) => {
            const owned = characterState.ownedItems.includes(item.id);
            const canAfford = characterState.gold >= item.price;

            return (
              <article className="sync-shop-item" data-rarity={item.rarity} key={item.id}>
                <div className="sync-shop-item__top">
                  <Backpack size={24} />
                  <span>{item.rarity}</span>
                </div>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                <div className="sync-shop-item__meta">
                  <span>{item.slot.toUpperCase()}</span>
                  <strong>{item.price} CR</strong>
                </div>
                <button
                  disabled={owned || !canAfford}
                  onClick={() => handleBuyItem(item)}
                  type="button"
                >
                  {owned ? "OWNED" : canAfford ? "BUY ITEM" : "NEED COINS"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function GuildView({ dashboard }) {
  return (
    <>
      <section className="sync-hero-panel">
        <div>
          <span className="sync-broadcast">BROADCAST ACTIVE</span>
          <h1>THE WAR FOR PRODUCTIVITY</h1>
          <p>Join a squad. Crush critical objectives. Share the fate. {dashboard.passive}</p>
        </div>
      </section>

      <section className="sync-panel-grid">
        <article className="sync-panel sync-panel--wide">
          <div className="sync-panel-heading">
            <h2>GLOBAL BOUNTY BOARD</h2>
            <span>Live Feed</span>
          </div>
          <div className="sync-bounty-list">
            <div><strong>PRJ-OMEGA</strong><span>Deploy v2.4 Architecture</span><em>15,000 XP</em></div>
            <div><strong>BGF-772</strong><span>Resolve memory leak in auth module</span><em>4,500 XP</em></div>
            <div><strong>DOC-11B</strong><span>Draft API user guidelines</span><em>800 XP</em></div>
          </div>
        </article>

        <article className="sync-panel">
          <div className="sync-panel-heading">
            <h2>TOP SQUADS</h2>
          </div>
          {["Cyber_Strike", "Data_Ghosts", "Syntax_ERR"].map((squad, index) => (
            <div className="sync-squad" key={squad}>
              <strong>#{index + 1}</strong>
              <span>{squad}</span>
              <ProgressBar value={index === 0 ? 82 : index === 1 ? 61 : 44} tone="xp" />
            </div>
          ))}
        </article>
      </section>
    </>
  );
}
