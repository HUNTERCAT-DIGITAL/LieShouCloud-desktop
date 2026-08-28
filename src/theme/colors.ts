/**
 * Desktop 主题色 - 与 apps/admin / apps/mobile / apps/mini-program 对齐.
 * 默认品牌蓝（客户版可由 Edition branding.colorPrimary 覆盖 · 2026-09）.
 */
export const colors = {
  primary: "#02429B",
  primaryHover: "#1a5cb8",
  primaryActive: "#01337a",
  bg: "#ffffff",
  pageBg: "#f5f7fa",
  text: "#1f1f1f",
  textSecondary: "#666666",
  border: "#e0e0e0",
  surface: "#fafafa",
  success: "#52c41a",
  error: "#f5222d",
  warning: "#faad14",
  /** Sidebar 背景色（深蓝渐变基底） */
  siderBg: "#001529",
  siderBgLight: "#0a2a5c",
} as const;

export type ThemeColor = keyof typeof colors;
