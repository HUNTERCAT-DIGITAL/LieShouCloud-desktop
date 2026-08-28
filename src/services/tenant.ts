/**
 * Tenant API service（user-service）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/tenant/tenant.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 */
export {
  listTenants,
  registerTenant,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  createInvite,
  listInvites,
  revokeInvite,
} from '@lieshoucloud/core-web';
export type {
  CreateInviteRequest,
  CreateTenantRequest,
  RegisterTenantRequest,
  RegisterTenantResult,
  Tenant,
  TenantInvite,
  TenantStatus,
  UpdateTenantRequest,
} from '@lieshoucloud/contract-types/business/tenant';
