/**
 * 客户 API service（ADR-0025 · crm-service · 后端强制 X-Tenant-Id）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/crm/crm.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 * META 展示常量保留本地（core-web 不承载 UI 元数据）。
 */
export {
  listCustomers,
  countCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  type ImportResult,
} from '@lieshoucloud/core-web';
export type {
  CreateCustomerRequest,
  Customer,
  CustomerStatus,
  UpdateCustomerRequest,
} from '@lieshoucloud/contract-types/business/customer';
export { STATUS_META } from '@lieshoucloud/contract-types/business/customer';
