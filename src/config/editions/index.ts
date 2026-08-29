/**
 * 版别解析（端自身骨架）：
 * 构建期 `VITE_EDITION` 注入 → generic 兜底。
 */
import { genericEdition } from './generic';
import type { EditionConfig } from './types';

export function resolveEditionId(): string {
  const env = (import.meta.env?.VITE_EDITION as string | undefined)?.trim();
  if (env) return env;
  return 'generic';
}

export function getEdition(): EditionConfig {
  const id = resolveEditionId();
  return id === 'generic' ? genericEdition : { ...genericEdition, id };
}
