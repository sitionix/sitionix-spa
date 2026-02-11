export const OVERLAY_TOKENS = {
  badge: {
    fontSize: "text-[13px]",
    lineHeight: "leading-4",
    padding: "px-[10px] py-[6px]",
    background: "bg-zinc-900/95",
    text: "text-white",
    radius: "rounded-lg",
    shadow: "shadow-md",
    weight: "font-medium",
  },
  label: {
    fontSize: "text-[12px]",
    lineHeight: "leading-4",
    tracking: "tracking-[0.08em]",
    text: "text-zinc-500",
  },
  labelLine: "border-zinc-400",
};

export const overlayBadgeClassName = [
  OVERLAY_TOKENS.badge.fontSize,
  OVERLAY_TOKENS.badge.lineHeight,
  OVERLAY_TOKENS.badge.padding,
  OVERLAY_TOKENS.badge.background,
  OVERLAY_TOKENS.badge.text,
  OVERLAY_TOKENS.badge.radius,
  OVERLAY_TOKENS.badge.shadow,
  OVERLAY_TOKENS.badge.weight,
].join(" ");

export const overlayLabelClassName = [
  OVERLAY_TOKENS.label.fontSize,
  OVERLAY_TOKENS.label.lineHeight,
  "uppercase",
  OVERLAY_TOKENS.label.tracking,
  OVERLAY_TOKENS.label.text,
].join(" ");
