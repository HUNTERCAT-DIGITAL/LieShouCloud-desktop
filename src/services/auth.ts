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

import { API_BASE } from "./api";

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

// ============================================================
// 注册/验证码（ADR-0023 · 与 admin-web 契约一致）
// ============================================================

export type CodeChannel = "SMS" | "EMAIL";
export type CodePurpose = "LOGIN" | "REGISTER" | "RESET_PASSWORD";

export interface RegisterRequest {
  /** 加入哪个租户（单租户客户版固定用默认租户；有邀请码时后端忽略） */
  tenantCode?: string;
  username: string;
  displayName: string;
  password: string;
  channel: CodeChannel;
  target: string;
  code: string;
  inviteCode?: string;
}

/** POST /auth/send-code - 发送验证码（公开接口;fetch 直调,避免 200 空 body 的 JSON 解析问题） */
export async function sendCode(
  channel: CodeChannel,
  target: string,
  purpose: CodePurpose,
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, target, purpose }),
  });
  if (!res.ok) {
    // ApiError 为接口（鸭子类型）：构造带 code 的 Error,isApiError 可识别
    const e = new Error(`HTTP ${res.status}`) as ApiError;
    e.code = "SEND_CODE_FAILED";
    throw e;
  }
}

/** POST /auth/register - 注册（注册即登录） */
export async function register(req: RegisterRequest): Promise<TokenResponse> {
  return request<TokenResponse>({
    method: "POST",
    path: `/auth/register`,
    body: req,
    // 注册 400 = 参数/验证码错误,不走会话过期拦截
    skipAuth401: true,
  });
}
