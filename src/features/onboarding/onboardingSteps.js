export const ONBOARDING_STEP_IDS = {
  COMMAND_CENTER: "command_center",
  WORKSPACE: "workspace",
  QUEST_BOARD: "quest_board",
  CREATE_QUEST: "create_quest",
  START_MISSION: "start_mission",
  COMPLETE_QUEST: "complete_quest",
  ARCHIVE_QUEST: "archive_quest",
  RESOURCES: "resources",
  CLAN: "clan",
  PROFILE: "profile",
  SETTINGS: "settings",
};

export const starterOnboardingSteps = [
  {
    id: ONBOARDING_STEP_IDS.COMMAND_CENTER,
    title: "Kenali Command Center",
    description: "Lihat ringkasan bounty, alert deadline, dan saldo akunmu.",
    actionLabel: "Lanjut",
  },
  {
    id: ONBOARDING_STEP_IDS.WORKSPACE,
    title: "Buka Workspace",
    description: "Workspace adalah tempat memilih solo board atau squad board sebelum mengerjakan quest.",
    actionLabel: "Buka Workspace",
  },
  {
    id: ONBOARDING_STEP_IDS.QUEST_BOARD,
    title: "Masuk ke Quest Board",
    description: "Quest Board adalah tempat semua task kamu diatur seperti bounty RPG.",
    actionLabel: "Buat quest pertama",
  },
  {
    id: ONBOARDING_STEP_IDS.CREATE_QUEST,
    title: "Buat Quest Pertama",
    description: "Isi nama tugas, rank, deadline, dan assignee agar reward bisa dihitung.",
    actionLabel: "New Mission",
  },
  {
    id: ONBOARDING_STEP_IDS.START_MISSION,
    title: "Start Mission",
    description: "Mulai quest dengan Sprint, Pomodoro, Deep Work, atau Battle Mode.",
    actionLabel: "Lihat quest aktif",
  },
  {
    id: ONBOARDING_STEP_IDS.COMPLETE_QUEST,
    title: "Complete Quest",
    description: "Selesaikan quest untuk klaim XP, Gold, dan passive aura party.",
    actionLabel: "Ke Quest Board",
  },
  {
    id: ONBOARDING_STEP_IDS.ARCHIVE_QUEST,
    title: "Archive Quest",
    description: "Quest yang sudah selesai bisa diarsipkan supaya board tetap bersih.",
    actionLabel: "Lihat completed",
  },
  {
    id: ONBOARDING_STEP_IDS.RESOURCES,
    title: "Cek Reward dan Item",
    description: "Buka Inventory atau Shop untuk memakai item dan boost reward berikutnya.",
    actionLabel: "Buka Inventory",
  },
  {
    id: ONBOARDING_STEP_IDS.CLAN,
    title: "Kenali Clan",
    description: "Clan dipakai untuk squad, board bersama, dan kerja tim dengan member lain.",
    actionLabel: "Buka Clan",
  },
  {
    id: ONBOARDING_STEP_IDS.PROFILE,
    title: "Atur Profile dan Teman",
    description: "Profile dipakai untuk nama akun, friend list, add friend, dan chat teman.",
    actionLabel: "Buka Profile",
  },
  {
    id: ONBOARDING_STEP_IDS.SETTINGS,
    title: "Cek Settings",
    description: "Settings berisi theme, musik, background, dan ganti role dengan cooldown.",
    actionLabel: "Buka Settings",
  },
];

export function getNextOnboardingStep(completedSteps = []) {
  const completed = new Set(completedSteps);
  return starterOnboardingSteps.find((step) => !completed.has(step.id)) ?? null;
}

export function isOnboardingComplete(completedSteps = []) {
  const completed = new Set(completedSteps);
  return starterOnboardingSteps.every((step) => completed.has(step.id));
}
