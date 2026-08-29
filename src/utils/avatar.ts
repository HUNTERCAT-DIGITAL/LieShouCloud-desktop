/**
 * 头像配色工具(纯前端本地存储;BasicLayout 顶栏与 Profile 共用).
 */
const KEY = "lm_avatar_color";
export const AVATAR_COLORS = ["#1677ff", "#eb2f96", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2", "#8c8c8c"];

function hashColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** 当前头像颜色(显式设置优先,否则按用户名哈希) */
export function getAvatarColor(name?: string): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && AVATAR_COLORS.includes(saved)) return saved;
  } catch {
    /* localStorage 不可用(隐私模式等) */
  }
  return hashColor(name ?? "U");
}

/** 设置头像颜色(持久化) */
export function setAvatarColor(color: string): void {
  try {
    localStorage.setItem(KEY, color);
  } catch {
    /* 忽略 */
  }
}
