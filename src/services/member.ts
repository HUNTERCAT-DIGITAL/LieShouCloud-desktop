/**
 * 会员 API service（ADR-0025 · crm-service）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/member/member.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 */
export {
  listMembers,
  countMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} from '@lieshoucloud/core-web';
export type {
  CreateMemberRequest,
  Member,
  MemberLevel,
  MemberStatus,
  UpdateMemberRequest,
} from '@lieshoucloud/contract-types/business/member';
