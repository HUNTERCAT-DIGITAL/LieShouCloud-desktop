/**
 * E2E · 登录与权限可见性.
 */
import { expect, test } from "@playwright/test";

import { login, mockApi } from "./helpers";

test.describe("登录页", () => {
  test("渲染登录表单（用户名/密码/登录/注册入口）", async ({ page }) => {
    await mockApi(page);
    await page.goto("/login");
    await expect(page.getByPlaceholder("请输入用户名")).toBeVisible();
    await expect(page.getByPlaceholder("请输入密码")).toBeVisible();
    await expect(page.getByRole("button", { name: /登\s*录/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /注册账号/ })).toBeVisible();
  });

  test("登录成功进入工作台", async ({ page }) => {
    await login(page, { roles: ["USER"], username: "e2euser" });
    // legalmind 客户版登录后进入今日作战台(页面标题 h4)
    await expect(page.getByRole("heading", { name: "今日作战台" })).toBeVisible();
  });

  test("普通用户(USER)不显示平台管理菜单", async ({ page }) => {
    await login(page, { roles: ["USER"] });
    await expect(page.getByText("平台管理")).toHaveCount(0);
    // 业务管理对普通用户可见
    await expect(page.getByText("业务管理")).toBeVisible();
  });

  test("管理员(PLATFORM_ADMIN)显示平台管理菜单", async ({ page }) => {
    await login(page, { roles: ["PLATFORM_ADMIN"] });
    const platformMenu = page.getByText("平台管理", { exact: true });
    await expect(platformMenu).toBeVisible();
    // 展开子菜单
    await platformMenu.click();
    await expect(page.getByText("用户管理")).toBeVisible();
    await expect(page.getByText("租户管理")).toBeVisible();
    await expect(page.getByText("审计日志")).toBeVisible();
  });
});
