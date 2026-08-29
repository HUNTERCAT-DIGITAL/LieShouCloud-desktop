/**
 * 认证 API service —— 2026-10 上收 lieshou-core-web（业务逻辑唯一源）.
 * 本文件保留导出路径兼容既有页面/测试（实现已移至 core-web）。
 * isApiError / RegisterRequest 保留本地：页面错误判定 + desktop 开放注册形态（后端 code 可选）。
 */
import { register as coreRegister } from '@lieshoucloud/core-web';
import type { CodeChannel } from '@lieshoucloud/core-web';
import type { TokenResponse } from '@lieshoucloud/contract-types/business/auth';

export {
  login,
  refreshTokens,
  fetchCurrentUser,
  switchTenant,
  sendCode,
  loginWithCode,
  resetPassword,
  oauthProviders,
  oauthAuthorize,
  oauthToken,
  type CodeChannel,
  type CodePurpose,
  type OAuthProvider,
  type OAuthAuthorizeResult,
  type OAuthTokenResult,
  type SecureSession,
} from '@lieshoucloud/core-web';

export type { TokenResponse, CurrentUser, LoginRequest } from '@lieshoucloud/contract-types/business/auth';

export interface ApiError extends Error {
  code: string;
  status?: number;
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && 'code' in e;
}

/** 开放注册形态（无验证码；后端 code 可选 · 2026-08） */
export interface RegisterRequest {
  /** 加入哪个租户（单租户客户版固定用默认租户；有邀请码时后端忽略） */
  tenantCode?: string;
  username: string;
  displayName: string;
  password: string;
  /** 注册方式：SMS=手机号 / EMAIL=邮箱（开放注册,无需验证码） */
  channel: CodeChannel;
  target: string;
  inviteCode?: string;
}

/** 注册（注册即登录）—— 薄适配：实现走 core-web（ApiPort 传输） */
export async function register(req: RegisterRequest): Promise<TokenResponse> {
  return coreRegister(req);
}
