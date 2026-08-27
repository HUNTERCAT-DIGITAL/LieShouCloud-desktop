/**
 * Desktop auth store smoke 单测（core-web 提供 · 2026-09）.
 * 经 configureCore 注入 mock api 端口（不依赖真实网络）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureCore } from "@lieshoucloud/core-web";
import { useAuthStore } from "../stores/auth";

const loginResp = {
  accessToken: "a",
  refreshToken: "r",
  expiresIn: 1800,
  tokenType: "Bearer",
  userId: 7,
  username: "desktopuser",
  tenantCode: "huntercat",
  tenantName: "t",
  tenantEdition: "GENERIC",
  availableTenants: [],
};

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
  configureCore({
    storage: {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      remove: (k) => localStorage.removeItem(k),
    },
    notifier: { success: () => {}, error: () => {} },
    navigation: { to: () => {}, replace: () => {} },
    api: {
      request: <T>(path: string): Promise<T> => {
        if (path.includes("/login")) return Promise.resolve(loginResp as T);
        if (path.includes("/me")) return Promise.resolve({ userId: 7, username: "desktopuser", roles: ["USER"] } as T);
        return Promise.reject(new Error("unexpected " + path));
      },
    },
  });
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe("desktop auth store", () => {
  it("login 成功：写 token + 标 isAuthenticated + 异步 fetchMe", async () => {
    await useAuthStore.getState().login("desktopuser", "p");
    const s = useAuthStore.getState();
    expect(s.accessToken).toBe("a");
    expect(s.refreshToken).toBe("r");
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.userId).toBe(7);
    await new Promise((r) => setTimeout(r, 0));
    expect(useAuthStore.getState().user?.roles).toEqual(["USER"]);
  });

  it("login 失败：抛错 + state 不变", async () => {
    configureCore({
      storage: { get: () => null, set: () => {}, remove: () => {} },
      notifier: { success: () => {}, error: () => {} },
      navigation: { to: () => {}, replace: () => {} },
      api: { request: <T>() => Promise.reject<T>(new Error("network down")) },
    });
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
