/**
 * Desktop 主题色 - 与 apps/admin / apps/mobile / apps/mini-program 对齐.
 * web tech, 可以被 packages/ui 共享的设计 token 一致使用.
 */
export const colors = {
  primary: "#1677ff",
  bg: "#ffffff",
  text: "#1f1f1f",
  textSecondary: "#666666",
  border: "#e0e0e0",
  surface: "#fafafa",
  success: "#52c41a",
  error: "#f5222d",
  warning: "#faad14",
  /** Sidebar 背景色（ProLayout / 桌面端自定义 sidebar 共用） */
  siderBg: "#001529",
} as const;

export type ThemeColor = keyof typeof colors;
