/**
 * E2E · 核心模块页可访问性（管理员视角,导航 + 关键 UI 断言）.
 */
import { expect, test } from "@playwright/test";

import { login } from "./helpers";

test.describe("模块页", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { roles: ["PLATFORM_ADMIN"] });
  });

  const cases: { path: string; expectText: string }[] = [
    { path: "/customers", expectText: "新建客户" },
    { path: "/lead/list", expectText: "新建线索" },
    { path: "/contact/list", expectText: "新建联系人" },
    { path: "/contract/list", expectText: "新建合同" },
    { path: "/member/list", expectText: "新建会员" },
    { path: "/quality/list", expectText: "质量管理" },
    { path: "/user/list", expectText: "新建用户" },
    { path: "/role/list", expectText: "新建角色" },
    { path: "/tenant/list", expectText: "开通租户" },
    { path: "/audit/list", expectText: "审计日志" },
    { path: "/approval", expectText: "发起审批" },
    { path: "/inventory", expectText: "新建商品" },
    { path: "/finance", expectText: "记一笔" },
    { path: "/profile", expectText: "个人中心" },
    { path: "/notification", expectText: "通知中心" },
  ];

  for (const c of cases) {
    test(`可访问 ${c.path}`, async ({ page }) => {
      await page.goto(c.path);
      await expect(page.getByText(c.expectText).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
