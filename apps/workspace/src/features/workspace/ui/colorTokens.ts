export type Tone = "blue" | "green" | "purple" | "orange";

export const toneClasses: Record<
  Tone,
  { softBg: string; text: string; badgeBg: string; badgeText: string; solidBg: string }
> = {
  blue: {
    softBg: "bg-blue-100",
    text: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    solidBg: "bg-blue-600",
  },
  green: {
    softBg: "bg-green-100",
    text: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    solidBg: "bg-green-600",
  },
  purple: {
    softBg: "bg-purple-100",
    text: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    solidBg: "bg-purple-600",
  },
  orange: {
    softBg: "bg-orange-100",
    text: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    solidBg: "bg-orange-600",
  },
};
