/**
 * Desktop 主题色 - 与 apps/admin / apps/mobile / apps/mini-program 对齐.
 * 主色：海赞数智品牌蓝 #103070（集团投资管理门户 · 2026-09）. 
 */
export const colors = {
  primary: "#103070",
  primaryHover: "#1a4a9e",
  primaryActive: "#0b2454",
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
