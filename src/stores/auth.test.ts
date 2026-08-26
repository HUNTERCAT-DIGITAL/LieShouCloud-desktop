/**
 * Desktop auth store smoke 单测（Phase 9 · 多端真实化）.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "../services/auth";
import { useAuthStore } from "../stores/auth";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe("desktop auth store", () => {
  it("login 成功：写 token + 标 isAuthenticated + 异步 fetchMe", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 1800,
      tokenType: "Bearer",
      userId: 7,
      username: "desktopuser",
    });
    vi.spyOn(authApi, "fetchCurrentUser").mockResolvedValue({
      userId: 7,
      username: "desktopuser",
      roles: ["USER"],
    });

    await useAuthStore.getState().login("desktopuser", "p");

    const s = useAuthStore.getState();
    expect(s.accessToken).toBe("a");
    expect(s.refreshToken).toBe("r");
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.userId).toBe(7);
    // 等异步 fetchMe
    await new Promise((r) => setTimeout(r, 0));
    expect(useAuthStore.getState().user?.roles).toEqual(["USER"]);
  });

  it("login 失败：抛错 + state 不变", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("network down"));

    await expect(useAuthStore.getState().login("x", "bad")).rejects.toThrow("network down");

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
  });

  it("logout：清空 token + user", () => {
    useAuthStore.setState({
      accessToken: "a",
      refreshToken: "r",
      user: { userId: 1, username: "u", roles: [] },
      isAuthenticated: true,
    });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
