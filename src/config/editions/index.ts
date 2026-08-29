/**
 * 版别聚合 + 客户注入（端自身骨架 · 类型来自共享契约 contract-types）。
 * 客户仓 deploy 生成 config/editions/<client>.extra.ts，glob 自动收集。
 */
import type { EditionConfig } from '@lieshoucloud/contract-types';

import { genericEdition } from './generic';

/** 客户注入的 Edition 增强（extraRoutes 等） */
export interface EditionExtraModule {
  default?: Partial<EditionConfig>;
}

const EDITION_ENV_KEY = 'VITE_EDITION';

/** 部署版别：VITE_EDITION 构建期注入 → generic 兜底 */
export function resolveEditionId(): string {
  const env = (import.meta.env?.[EDITION_ENV_KEY] as string | undefined)?.trim();
  if (env) return env;
  return 'generic';
}

// glob 默认返回 { default: ... }（客户 extra 文件 default 导出；独立仓库无匹配）
const EXTRA_MODULES = import.meta.glob<EditionExtraModule>('./*.extra.ts', { eager: true });

/** 合并客户注入 → 完整 Edition（客户字段覆盖；extraRoutes 追加） */
function withExtras(base: EditionConfig): EditionConfig {
  const extras = Object.values(EXTRA_MODULES)
    .map((m) => m.default)
    .filter((m): m is Partial<EditionConfig> => !!m);
  if (extras.length === 0) return base;
  return extras.reduce<EditionConfig>(
    (acc, m) => ({
      ...acc,
      ...m,
      extraRoutes: [...(acc.extraRoutes ?? []), ...(m.extraRoutes ?? [])],
    }),
    base,
  );
}

/** 当前部署版别配置（generic 基准 + 客户 extra 叠加；非内置版别以 generic 为底） */
export function getEdition(): EditionConfig {
  const id = resolveEditionId();
  if (id === 'generic') return withExtras(genericEdition);
  return withExtras({ ...genericEdition, id });
}
