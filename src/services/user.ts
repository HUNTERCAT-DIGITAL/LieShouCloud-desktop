/**
 * User API service（user-service）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/user/user.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 * UserOption 保留本地（Approval 页面使用的轻量选项类型）。
 */
export {
  listUsers,
  countUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeMyPassword,
} from '@lieshoucloud/core-web';
export type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserStatus,
} from '@lieshoucloud/contract-types/business/user';

/** 用户轻量选项（Approval 页选择器用 · 本地 UI 类型） */
export interface UserOption {
  id: number;
  username: string;
  displayName?: string | null;
  status?: string;
}
