import { starterEquipment } from "../../../data/cosmetics.js";
import { roles } from "../../../data/roles.js";
import { initialBoardColumns } from "../config/dashboardConfig.js";

export const XP_BASE_PER_LEVEL = 100;
export const XP_GROWTH_PER_LEVEL = 50;

export function getTargetColumnId(difficulty) {
  if (difficulty === "S-Rank" || difficulty === "A-Rank" || difficulty === "hard") return "hard";
  if (difficulty === "B-Rank" || difficulty === "C-Rank" || difficulty === "medium") return "medium";
  if (difficulty === "D-Rank" || difficulty === "E-Rank" || difficulty === "low") return "easy";
  return "medium";
}

export function getXpRequiredForLevel(level = 1) {
  const normalizedLevel = Math.max(0, Number(level) || 0);
  return XP_BASE_PER_LEVEL + (normalizedLevel * XP_GROWTH_PER_LEVEL);
}

export function getLevelProgress(totalXp = 0) {
  const normalizedXp = Math.max(0, Number(totalXp) || 0);
  let level = 0;
  let xpIntoLevel = normalizedXp;
  let xpNeededForNextLevel = getXpRequiredForLevel(level);

  while (xpIntoLevel >= xpNeededForNextLevel) {
    xpIntoLevel -= xpNeededForNextLevel;
    level += 1;
    xpNeededForNextLevel = getXpRequiredForLevel(level);
  }

  const progress = Math.min(100, Math.round((xpIntoLevel / xpNeededForNextLevel) * 100));

  return {
    level,
    currentXp: xpIntoLevel,
    nextLevelXp: xpNeededForNextLevel,
    progress,
    totalXp: normalizedXp,
  };
}

export function loadCharacterState(accountId) {
  const fallback = {
    gold: 220,
    xp: 0,
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

export function createDefaultWorkspace(accountId, roleId) {
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

export function loadWorkspaceState(accountId, roleId) {
  const fallback = createDefaultWorkspace(accountId, roleId);

  try {
    const saved = window.localStorage.getItem(`questify:workspace:${accountId}`);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

export function loadRegisteredUsers() {
  try {
    const savedUsers = window.localStorage.getItem("questify:users");
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
}

export function moveQuestCard(columns, { cardId, toColumnId, beforeCardId }) {
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

export function createChecklistItems(items) {
  return items.map((item, index) => ({
    id: `check-${Date.now()}-${index}-${item.toLowerCase().replace(/\W+/g, "-")}`,
    text: item,
    done: false,
  }));
}

export function mergeChecklistItems(items, existingItems = []) {
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

export function canViewerSeeQuest(card, workspace, viewerId) {
  if (!viewerId) return false;
  if (viewerId === workspace.ownerId) return true;
  const viewer = workspace.members.find((member) => member.id === viewerId);
  if (viewer?.status === "Menunggu persetujuan") return false;
  if (card.visibility === "workspace") return true;
  return card.creatorId === viewerId;
}

export function ensureDifficultyColumns(columns) {
  if (!Array.isArray(columns) || !columns.length) return initialBoardColumns;
  return initialBoardColumns.map((fallbackColumn) => {
    const matchedColumn = columns.find(
      (column) => column.id === fallbackColumn.id || column.title === fallbackColumn.title,
    );
    return matchedColumn ? { ...fallbackColumn, ...matchedColumn } : fallbackColumn;
  });
}
