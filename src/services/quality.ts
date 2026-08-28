/**
 * 质检追溯 API service（ADR-0037 · inventory-service）.
 *
 * 2026-10 上收 lieshou-core-web（业务逻辑唯一源，同 auth/approval 模式）：
 * 实现移至 core-web features/quality/quality.api.ts（走注入的 ApiPort 传输），
 * 本文件保留导出路径兼容既有页面/测试。
 */
export {
  listBatches,
  countBatches,
  createBatch,
  getBatchDetail,
  listInspections,
  countInspections,
  createInspection,
  getInspection,
  getProductTrace,
} from '@lieshoucloud/core-web';
export type {
  Batch,
  BatchDetail,
  CreateBatchRequest,
  CreateInspectionRequest,
  InspectionDetail,
  InspectionResult,
  InspectionType,
  ProductTrace,
  QualityInspection,
} from '@lieshoucloud/contract-types/business/quality';
