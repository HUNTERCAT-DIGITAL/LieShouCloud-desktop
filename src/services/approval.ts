/**
 * 审批流 API service（ADR-0032 · approval-service）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/approval/approval.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 * META 展示常量保留本地（core-web 不承载 UI 元数据）。
 */
export {
  listApprovals,
  getApprovalCounts,
  getApproval,
  createApproval,
  approveApproval,
  rejectApproval,
  cancelApproval,
} from '@lieshoucloud/core-web';
export type {
  ApprovalCounts,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalType,
  CreateApprovalRequest,
  DecideRequest,
} from '@lieshoucloud/contract-types/business/approval';
export {
  APPROVAL_TYPE_META,
  APPROVAL_STATUS_META,
} from '@lieshoucloud/contract-types/business/approval';
