const DIFFICULTY_WEIGHT = {
  "S-Rank": 6,
  "A-Rank": 5,
  "B-Rank": 4,
  "C-Rank": 3,
  "D-Rank": 2,
  "E-Rank": 1,
  hard: 4,
  medium: 3,
  low: 1,
};

const ROLE_LABELS = {
  assassin: "Assassin",
  bard: "Bard",
  healer: "Healer",
  mage: "Mage",
  ranger: "Ranger",
  tank: "Tank",
  warrior: "Warrior",
};

export const rolePassiveRules = {
  healer: {
    label: "Healer Aura",
    description: "Party quest mendapat bonus XP sustain.",
  },
  warrior: {
    label: "Warrior Might",
    description: "Quest berat memberi bonus Gold.",
  },
  mage: {
    label: "Mage Focus",
    description: "Study dan Deep Work memberi bonus XP.",
  },
  assassin: {
    label: "Assassin Rush",
    description: "Quest urgent memberi bonus XP.",
  },
  tank: {
    label: "Tank Guard",
    description: "Quest overdue mendapat stabilisasi reward.",
  },
  bard: {
    label: "Bard Chorus",
    description: "Quest party memberi bonus XP dan Gold.",
  },
  ranger: {
    label: "Ranger Trail",
    description: "Quest long-term memberi bonus XP.",
  },
};

function uniqueRoleIds(assignees = []) {
  return [...new Set(
    assignees
      .map((assignee) => assignee?.roleId || assignee?.characterId)
      .filter(Boolean),
  )];
}

function getHoursUntilDue(deadline) {
  if (!deadline) return null;
  const dueTime = new Date(deadline).getTime();
  if (Number.isNaN(dueTime)) return null;
  return (dueTime - Date.now()) / 36e5;
}

function getDifficultyWeight(difficulty = "") {
  return DIFFICULTY_WEIGHT[difficulty] ?? 0;
}

function isStudyQuest(card) {
  const searchable = [
    card?.label,
    card?.tag,
    card?.title,
    card?.description,
  ].join(" ").toLowerCase();

  return /study|research|learn|planning|deep|focus/.test(searchable);
}

export function calculateRolePassiveReward(card, {
  assignees = card?.assignees ?? [],
  methodMultiplier = 1,
} = {}) {
  const roles = uniqueRoleIds(assignees);
  const partySize = assignees.length || roles.length;
  const hoursUntilDue = getHoursUntilDue(card?.deadline || card?.dueAt);
  const difficultyWeight = getDifficultyWeight(card?.difficulty);
  const active = [];
  let xpPassiveMultiplier = 1;
  let goldPassiveMultiplier = 1;

  if (roles.includes("healer")) {
    xpPassiveMultiplier += partySize > 1 ? 0.05 : 0.03;
    active.push({ roleId: "healer", label: "Healer +XP" });
  }

  if (roles.includes("warrior") && difficultyWeight >= 4) {
    goldPassiveMultiplier += 0.15;
    active.push({ roleId: "warrior", label: "Warrior +Gold" });
  }

  if (roles.includes("mage") && (isStudyQuest(card) || methodMultiplier >= 2)) {
    xpPassiveMultiplier += 0.12;
    active.push({ roleId: "mage", label: "Mage +XP" });
  }

  if (
    roles.includes("assassin") &&
    hoursUntilDue !== null &&
    hoursUntilDue <= 24
  ) {
    xpPassiveMultiplier += 0.15;
    active.push({ roleId: "assassin", label: "Assassin +XP" });
  }

  if (roles.includes("tank") && hoursUntilDue !== null && hoursUntilDue < 0) {
    xpPassiveMultiplier += 0.05;
    goldPassiveMultiplier += 0.1;
    active.push({ roleId: "tank", label: "Tank Guard" });
  }

  if (roles.includes("bard") && partySize > 1) {
    xpPassiveMultiplier += 0.08;
    goldPassiveMultiplier += 0.08;
    active.push({ roleId: "bard", label: "Bard Party" });
  }

  if (roles.includes("ranger") && hoursUntilDue !== null && hoursUntilDue >= 72) {
    xpPassiveMultiplier += 0.1;
    active.push({ roleId: "ranger", label: "Ranger +XP" });
  }

  return {
    active,
    activeRoleNames: active.map((item) => ROLE_LABELS[item.roleId] ?? item.roleId),
    goldPassiveMultiplier: Math.min(goldPassiveMultiplier, 1.6),
    hasActivePassive: active.length > 0,
    xpPassiveMultiplier: Math.min(xpPassiveMultiplier, 1.6),
  };
}

export function calculateQuestRewardPreview(card, options = {}) {
  const methodMultiplier = options.methodMultiplier ?? 1;
  const baseXp = card?.rewardXp ?? parseInt(card?.reward, 10) ?? 50;
  const baseGold = card?.rewardGold ?? 15;
  const passive = calculateRolePassiveReward(card, options);

  return {
    ...passive,
    baseGold,
    baseXp,
    finalGold: Math.round(baseGold * passive.goldPassiveMultiplier),
    finalXp: Math.round(baseXp * methodMultiplier * passive.xpPassiveMultiplier),
  };
}
