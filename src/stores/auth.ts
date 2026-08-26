/**
 * Desktop auth store (Zustand + persist). 与 admin 独立——desktop 是独立进程。
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setAccessTokenProvider } from "@lieshoucloud/api-client";
import type { CurrentUser } from "@lieshoucloud/types";
import { fetchCurrentUser, login as loginApi } from "../services/auth";

const STORAGE_KEY = "lieshoucloud:desktop-auth";

// 模块加载时注册 token 供给器：每次 request 时自动从 store 取最新 token
setAccessTokenProvider(() => useAuthStore.getState().accessToken);

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;

  login: (username: string, password: string, tenantCode?: string) => Promise<void>;
  fetchMe: () => Promise<CurrentUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (username, password, tenantCode) => {
        const token = await loginApi({ username, password, tenantCode });
        set({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          user: { userId: token.userId, username: token.username, roles: ["USER"] },
          isAuthenticated: true,
        });
        // 异步 fetch 真实角色（失败不影响登录态）
        get()
          .fetchMe()
          .catch(() => undefined);
      },

      fetchMe: async () => {
        const me = await fetchCurrentUser();
        set({ user: me });
        return me;
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
