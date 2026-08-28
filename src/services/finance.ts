/**
 * 财务记账 API service —— 2026-10 上收 lieshou-core-web（业务逻辑唯一源）.
 * 本文件保留导出路径兼容既有页面/测试（实现已移至 core-web）。
 * getSummary 别名保留（旧页面导入名 → core-web getLedgerSummary，同端点 /api/ledger/summary）。
 * META 展示常量保留本地（core-web 不承载 UI 元数据）。
 */
export {
  listLedger,
  getLedgerSummary,
  getLedgerSummary as getSummary,
  getMonthlySummary,
  getLedger,
  createLedger,
  updateLedger,
  deleteLedger,
} from '@lieshoucloud/core-web';
export type {
  CreateLedgerRequest,
  LedgerEntry,
  LedgerSummary,
  LedgerType,
  MonthlySummary,
  UpdateLedgerRequest,
} from '@lieshoucloud/contract-types/business/finance';
export {
  LEDGER_TYPE_META,
  LEDGER_CATEGORIES,
} from '@lieshoucloud/contract-types/business/finance';
