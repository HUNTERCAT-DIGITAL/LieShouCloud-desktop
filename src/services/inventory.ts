/**
 * 进销存 API service —— 2026-10 上收 lieshou-core-web（业务逻辑唯一源）.
 * 本文件保留导出路径兼容既有页面/测试（实现已移至 core-web）。
 * META 展示常量保留本地（core-web 不承载 UI 元数据）。
 */
export {
  listProducts,
  countProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  stockIn,
  stockOut,
  listMovements,
  importProducts,
  type ImportResult,
} from '@lieshoucloud/core-web';
export type {
  CreateProductRequest,
  Product,
  StockChangeRequest,
  StockMovement,
  StockMovementType,
  UpdateProductRequest,
} from '@lieshoucloud/contract-types/business/inventory';
export { MOVEMENT_META } from '@lieshoucloud/contract-types/business/inventory';
