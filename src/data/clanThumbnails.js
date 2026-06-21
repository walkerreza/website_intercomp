export const clanThumbnailPresets = [
  {
    id: "skull",
    title: "Skull",
    imageSrc: "/assets/clan-thumbnails/skull.svg",
    description: "Dark skull emblem.",
  },
  {
    id: "banner",
    title: "Banner",
    imageSrc: "/assets/clan-thumbnails/banner.svg",
    description: "Guild war banner.",
  },
  {
    id: "knight",
    title: "Knight",
    imageSrc: "/assets/clan-thumbnails/knight.svg",
    description: "Knight helmet crest.",
  },
  {
    id: "fortress",
    title: "Fortress",
    imageSrc: "/assets/clan-thumbnails/fortress.svg",
    description: "Castle fortress mark.",
  },
];

export function resolveClanThumbnailKey(thumbnailKey = "") {
  return clanThumbnailPresets.some((thumbnail) => thumbnail.id === thumbnailKey)
    ? thumbnailKey
    : "banner";
}

export function getClanThumbnailImageSrc(thumbnailKey = "") {
  const resolvedKey = resolveClanThumbnailKey(thumbnailKey);
  return clanThumbnailPresets.find((thumbnail) => thumbnail.id === resolvedKey)?.imageSrc ?? "";
}
