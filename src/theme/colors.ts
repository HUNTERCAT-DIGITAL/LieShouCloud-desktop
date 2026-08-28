/**
 * Desktop 主题色 - 与 apps/admin / apps/mobile / apps/mini-program 对齐.
 * 主色：凌科安时品牌蓝 #02429B（legal 行业域品牌色，小程序 tabBar 同源）. 
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
