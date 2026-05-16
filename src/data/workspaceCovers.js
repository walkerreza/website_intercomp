export const workspaceCoverPresets = [
  {
    id: "study-desk",
    title: "Study Desk",
    type: "solo",
    imageSrc: "/assets/workspace-covers/study-desk.png",
    description: "Solo focus desk.",
  },
  {
    id: "tower-room",
    title: "Tower Room",
    type: "solo",
    imageSrc: "/assets/workspace-covers/tower-room.png",
    description: "Quiet mage tower.",
  },
  {
    id: "forest-camp",
    title: "Forest Camp",
    type: "solo",
    imageSrc: "/assets/workspace-covers/forest-camp.png",
    description: "Outdoor study camp.",
  },
  {
    id: "guild-hall",
    title: "Guild Hall",
    type: "clan",
    imageSrc: "/assets/workspace-covers/guild-hall.png",
    description: "Clan meeting hall.",
  },
  {
    id: "war-table",
    title: "War Table",
    type: "clan",
    imageSrc: "/assets/workspace-covers/war-table.png",
    description: "Squad planning room.",
  },
  {
    id: "castle-room",
    title: "Castle Room",
    type: "clan",
    imageSrc: "/assets/workspace-covers/castle-room.png",
    description: "Medieval squad chamber.",
  },
];

export function getWorkspaceCoverPresets(type = "solo") {
  return workspaceCoverPresets.filter((cover) => cover.type === type);
}

export function resolveWorkspaceCoverKey(type = "solo", coverKey = "") {
  const presets = getWorkspaceCoverPresets(type);
  return presets.some((cover) => cover.id === coverKey)
    ? coverKey
    : type === "clan"
      ? "guild-hall"
      : "study-desk";
}

export function getWorkspaceCoverImageSrc(type = "solo", coverKey = "") {
  const resolvedKey = resolveWorkspaceCoverKey(type, coverKey);
  return workspaceCoverPresets.find((cover) => cover.id === resolvedKey)?.imageSrc ?? "";
}
