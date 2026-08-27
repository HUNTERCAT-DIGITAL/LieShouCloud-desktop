/**
 * Desktop auth API service（Phase 9 多端真实化）.
 *
 * 与 admin 共享 api-client request<T>()，区别是 desktop 不依赖
 * 自动注入 Bearer token（desktop 是独立进程，token 直接从 store 拿）。
 *
 * 注意：api-client 的 request() 会自动拼接 `/api` 前缀（vite proxy → gateway），
 * 因此这里 path 只写 `/auth/**`，不能再重复 `/api`。
 */
import { request } from "@lieshoucloud/contract-api";
import type { CurrentUser, LoginRequest, TokenResponse } from "@lieshoucloud/contract-types";

export async function login(req: LoginRequest): Promise<TokenResponse> {
  return request<TokenResponse>({
    method: "POST",
    path: `/auth/login`,
    body: req,
  });
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>({
    method: "GET",
    path: `/auth/me`,
  });
}

export interface ApiError extends Error {
  code: string;
  status?: number;
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && "code" in e;
}
