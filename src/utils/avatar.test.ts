/**
 * avatar 工具单测(node 环境无 localStorage → try/catch 回退路径).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { AVATAR_COLORS, getAvatarColor, setAvatarColor } from "./avatar";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAvatarColor", () => {
  it("无 localStorage → 按用户名哈希稳定取色", () => {
    const c1 = getAvatarColor("alice");
    const c2 = getAvatarColor("alice");
    expect(c1).toBe(c2);
    expect(AVATAR_COLORS).toContain(c1);
  });

  it("不同用户名可能不同色(哈希分散)", () => {
    const colors = new Set(["alice", "bob", "carol", "dave", "eve"].map((n) => getAvatarColor(n)));
    expect(colors.size).toBeGreaterThan(1);
  });

  it("设置后优先返回已存色", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "#52c41a",
      setItem: vi.fn(),
    });
    expect(getAvatarColor("alice")).toBe("#52c41a");
  });

  it("setAvatarColor 持久化到 localStorage", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem });
    setAvatarColor("#eb2f96");
    expect(setItem).toHaveBeenCalledWith("lm_avatar_color", "#eb2f96");
  });
});
