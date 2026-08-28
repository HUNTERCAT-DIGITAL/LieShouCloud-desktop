/**
 * 案件 API service（智法云枢 · legal 域）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/case/case.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 * 类型（LegalCase/CaseStage/TimeEntry 等）由页面从 @lieshoucloud/contract-types/business/legal 直接导入。
 */
export {
  listCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  advanceStage,
  listCaseEvents,
  addCaseEvent,
  updateCaseEvent,
  deleteCaseEvent,
  listTimeEntries,
  getTimeSummary,
  createTimeEntry,
  confirmTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  listExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type CasePage,
  type CaseQuery,
} from '@lieshoucloud/core-web';
