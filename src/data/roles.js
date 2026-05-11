import {
  Cross,
  Swords,
  Dumbbell,
  FlaskConical,
  Shield,
  Music,
  Target,
} from "lucide-react";

export const roles = [
  {
    id: "healer",
    name: "Healer",
    icon: Cross,
    accent: "#24CC8F",
    description: "Menjaga ritme belajar dan memulihkan fokus.",
  },
  {
    id: "assassin",
    name: "Assassin",
    icon: Swords,
    accent: "#E85D75",
    description: "Menyelesaikan tugas cepat dengan presisi tinggi.",
  },
  {
    id: "warrior",
    name: "Warrior",
    icon: Dumbbell,
    accent: "#FFBE3D",
    description: "Kuat menghadapi deadline dan misi besar.",
  },
  {
    id: "mage",
    name: "Mage",
    icon: FlaskConical,
    accent: "#8E63D7",
    description: "Mengubah ide rumit menjadi strategi belajar.",
  },
  {
    id: "tank",
    name: "Tank",
    icon: Shield,
    accent: "#2995D8",
    description: "Stabil, tahan distraksi, dan konsisten.",
  },
  {
    id: "bard",
    name: "Bard",
    icon: Music,
    accent: "#F97316",
    description: "Menghidupkan motivasi dan kerja kelompok.",
  },
  {
    id: "ranger",
    name: "Ranger",
    icon: Target,
    accent: "#22C55E",
    description: "Fokus pada target mingguan dan progres jarak jauh.",
  },
];
