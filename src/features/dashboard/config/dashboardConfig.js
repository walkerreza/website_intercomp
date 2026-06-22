import { Archive, Backpack, Briefcase, Command, ShoppingBag, Swords } from "lucide-react";

export const roleDashboards = {
  healer: {
    codename: "OP_HEAL_01",
    classLine: "Focus Support / Recovery",
    headline: "RESTORE THE PARTY FLOW",
    status: "SQUAD_MORALE: STABLE",
    passive: "Assigned quests grant party sustain: +3% solo XP or +5% party XP.",
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
    passive: "Urgent, due-soon, and overdue assigned quests grant +15% party XP.",
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
    passive: "Heavy assigned quests (B-Rank or higher) grant +15% party Gold.",
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
    passive: "Study, research, planning, or Deep Work quests grant +12% party XP.",
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
    passive: "Overdue assigned quests gain guard recovery: +5% XP and +10% Gold.",
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
    passive: "Party quests with multiple assignees grant +8% XP and +8% Gold.",
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
    passive: "Long-range quests due in 3+ days grant +10% party XP.",
    metric: "Target accuracy",
    metricValue: "86%",
    warning: "One long-range objective is drifting.",
    activeQuest: "Map exam preparation path",
    load: 48,
  },
};

export const initialBoardColumns = [
  { id: "hard", title: "HARD", cards: [] },
  { id: "medium", title: "MEDIUM", cards: [] },
  { id: "easy", title: "EASY", cards: [] },
  { id: "done", title: "COMPLETED", cards: [] },
];

export const guildMembers = [
  { name: "Anjim", role: "Warrior", hp: "20/100", status: "Needs heal" },
  { name: "Budi", role: "Tank", hp: "80/100", status: "Deployed" },
  { name: "Sari", role: "Mage", hp: "64/100", status: "Planning" },
];

export const questLabelOptions = [
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

export const difficultyWeight = {
  "S-Rank": 6,
  "A-Rank": 5,
  "B-Rank": 4,
  "C-Rank": 3,
  "D-Rank": 2,
  "E-Rank": 1,
};

export const difficultyRewards = {
  "E-Rank": { xp: 25, gold: 10 },
  "D-Rank": { xp: 45, gold: 13 },
  "C-Rank": { xp: 75, gold: 21 },
  "B-Rank": { xp: 110, gold: 31 },
  "A-Rank": { xp: 160, gold: 45 },
  "S-Rank": { xp: 220, gold: 62 },
};

export function getDifficultyReward(difficulty = "C-Rank") {
  return difficultyRewards[difficulty] ?? difficultyRewards["C-Rank"];
}

export const navItems = [
  { id: "command", label: "Command Center", icon: Command },
  { id: "workspace", label: "Workspace", icon: Briefcase },
  { id: "clan", label: "Clan", icon: Swords },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "inventory", label: "Inventory", icon: Backpack },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];
