/**
 * 冒烟测试：验证测试链路 + editions 装配 + 版本常量解析
 */
import { describe, expect, it } from 'vitest';

import { getEdition } from '../editions';
import { APP_VERSION } from '../version';

describe('冒烟', () => {
  it('版本常量可解析', () => {
    expect(APP_VERSION).toBe('0.0.37');
  });

  it('getEdition 返回 generic 版别配置', () => {
    const e = getEdition();
    expect(e.id).toBe('generic');
    expect(e.brandName).toBe('猎手云');
    expect(e.login?.required).toBe(true);
  });
});
