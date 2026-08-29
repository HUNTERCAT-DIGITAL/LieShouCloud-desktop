/**
 * 列表列偏好(显示/隐藏列)工具——纯前端 localStorage 持久化,可单测.
 */

/** 读取列偏好;无存储/非法值回退全量 */
export function loadColumnPrefs(key: string, all: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr: unknown = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const valid = arr.filter((c): c is string => typeof c === "string" && all.includes(c));
        // 至少保留一列(防全隐藏导致表空)
        if (valid.length > 0) return valid;
      }
    }
  } catch {
    /* localStorage 不可用 */
  }
  return [...all];
}

/** 保存列偏好 */
export function saveColumnPrefs(key: string, cols: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(cols));
  } catch {
    /* 忽略 */
  }
}
