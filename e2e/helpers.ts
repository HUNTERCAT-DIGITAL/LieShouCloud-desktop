/**
 * E2E helpers：API mock + 登录工具.
 * 所有后端 API 由 route 拦截,不依赖真实环境。
 */
import type { Page } from "@playwright/test";

export interface MockApiOptions {
  roles?: string[];
  username?: string;
}

/** 拦截 /api/** 并返回 mock 数据（auth 特殊处理,其余返回空数组） */
export async function mockApi(page: Page, opts: MockApiOptions = {}) {
  const { roles = ["USER"], username = "e2euser" } = opts;
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/login")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "e2e-access",
          refreshToken: "e2e-refresh",
          expiresIn: 1800,
          tokenType: "Bearer",
          userId: 1,
          username,
          tenantCode: "jxlkas",
          tenantName: "凌科安时",
          tenantEdition: "LEGALMIND",
          availableTenants: [],
        }),
      });
    }
    if (url.includes("/auth/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          userId: 1,
          tenantId: 1,
          tenantCode: "jxlkas",
          username,
          roles,
        }),
      });
    }
    if (url.includes("/auth/refresh") || url.includes("/actuator/health")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    }
    // 计数类接口返回数字/对象（Statistic 渲染需要）
    if (url.includes("/approvals/counts")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ inbox: 0, mine: 0 }) });
    }
    if (url.includes("/unread-count")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unread: 0 }) });
    }
    if (url.includes("/count")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "0" });
    }
    // 案件分页接口返回 { items, total }（LegalMindWorkspace 依赖）
    if (url.includes("/legal/cases")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0, page: 0, size: 100 }),
      });
    }
    // 其余列表接口 → 空数组（页面容错）
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

/** 走一遍真实登录表单提交（mock API 已注入） */
export async function login(page: Page, opts: MockApiOptions = {}) {
  await mockApi(page, opts);
  await page.goto("/login");
  await page.getByPlaceholder("请输入用户名").fill(opts.username ?? "e2euser");
  await page.getByPlaceholder("请输入密码").fill("pw123456");
  await page.getByRole("button", { name: /登\s*录/ }).click();
  // 客户版登录首页 = 今日作战台(/legalmind/workspace),通用版 = /welcome
  await page.waitForURL("**/workspace**");
  // 等页面渲染完成（今日作战台/工作台标题）
  await page.getByText(/今日作战台|快捷入口/).first().waitFor({ timeout: 15_000 });
}
