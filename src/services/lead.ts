/**
 * CRM 线索 API service —— 2026-10 上收 lieshou-core-web（业务逻辑唯一源）.
 * 本文件保留导出路径兼容既有页面/测试（实现已移至 core-web）。
 */
export {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  releaseLead,
  convertLead,
  listFollowUps,
  addFollowUp,
  importLeads,
  type ImportResult,
} from '@lieshoucloud/core-web';
export type {
  FollowUpRequest,
  Lead,
  LeadFollowUp,
  LeadRequest,
  LeadStatus,
} from '@lieshoucloud/contract-types/business/lead';
