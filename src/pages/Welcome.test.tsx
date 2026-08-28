/**
 * Desktop Welcome 工作台单测（增强版适配）.
 *
 * 验证：欢迎语显示当前用户；统计卡/待办/快捷入口渲染。
 * 外部 service 全 mock（不真正请求网络）。
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Welcome from "./Welcome";
import { useAuthStore } from "../stores/auth";

const mocks = vi.hoisted(() => ({
  countCustomers: vi.fn(),
  getApprovalCounts: vi.fn(),
  unreadNotificationCount: vi.fn(),
  listContracts: vi.fn(),
  listApprovals: vi.fn(),
  listNotifications: vi.fn(),
}));

vi.mock("../services/customer", () => ({ countCustomers: mocks.countCustomers }));
vi.mock("../services/approval", () => ({
  getApprovalCounts: mocks.getApprovalCounts,
  listApprovals: mocks.listApprovals,
}));
vi.mock("../services/notification", () => ({
  unreadNotificationCount: mocks.unreadNotificationCount,
  listNotifications: mocks.listNotifications,
}));
vi.mock("../services/contract", () => ({ listContracts: mocks.listContracts }));

function renderWelcome() {
  return render(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>,
  );
}

describe("desktop Welcome", () => {
  it("显示当前用户名", async () => {
    useAuthStore.setState({ user: { userId: 1, username: "futurewl", roles: ["USER"] } });
    mocks.countCustomers.mockResolvedValue(0);
    mocks.getApprovalCounts.mockResolvedValue({ inbox: 0, mine: 0 });
    mocks.unreadNotificationCount.mockResolvedValue(0);
    mocks.listContracts.mockResolvedValue([]);
    mocks.listApprovals.mockResolvedValue([]);
    mocks.listNotifications.mockResolvedValue([]);
    renderWelcome();
    expect(screen.getByText(/欢迎回来，futurewl/)).toBeInTheDocument();
    // 统计卡渲染
    expect(await screen.findByText("待审批")).toBeInTheDocument();
  });

  it("统计卡显示真实数据", async () => {
    useAuthStore.setState({ user: { userId: 1, username: "u", roles: [] } });
    mocks.countCustomers.mockResolvedValue(7);
    mocks.getApprovalCounts.mockResolvedValue({ inbox: 2, mine: 1 });
    mocks.unreadNotificationCount.mockResolvedValue(3);
    mocks.listContracts.mockResolvedValue([{ id: 1 }] as never[]);
    mocks.listApprovals.mockResolvedValue([]);
    mocks.listNotifications.mockResolvedValue([]);
    renderWelcome();
    expect(await screen.findByText("待审批")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("客户")).toBeInTheDocument();
  });

  it("待办区渲染：待我审批 + 最新通知", async () => {
    useAuthStore.setState({ user: { userId: 1, username: "u", roles: [] } });
    mocks.countCustomers.mockResolvedValue(0);
    mocks.getApprovalCounts.mockResolvedValue({ inbox: 1, mine: 0 });
    mocks.unreadNotificationCount.mockResolvedValue(1);
    mocks.listContracts.mockResolvedValue([]);
    mocks.listApprovals.mockResolvedValue([
      { id: 1, type: "EXPENSE", title: "差旅报销", requesterId: 2, approverId: 1, status: "PENDING", createdAt: "2026-08-20T00:00:00Z" },
    ] as never[]);
    mocks.listNotifications.mockResolvedValue([
      { id: 1, tenantId: 1, userId: 1, type: "SYSTEM", title: "欢迎使用", content: "hi", readAt: null, createdAt: "2026-08-20T00:00:00Z" },
    ] as never[]);
    renderWelcome();
    expect(await screen.findByText("待我审批")).toBeInTheDocument();
    expect(screen.getByText("差旅报销")).toBeInTheDocument();
    expect(screen.getByText("最新通知")).toBeInTheDocument();
    expect(screen.getByText("欢迎使用")).toBeInTheDocument();
  });

  it("快捷入口渲染 8 个入口", () => {
    useAuthStore.setState({ user: { userId: 1, username: "u", roles: [] } });
    mocks.countCustomers.mockResolvedValue(0);
    mocks.getApprovalCounts.mockResolvedValue({ inbox: 0, mine: 0 });
    mocks.unreadNotificationCount.mockResolvedValue(0);
    mocks.listContracts.mockResolvedValue([]);
    mocks.listApprovals.mockResolvedValue([]);
    mocks.listNotifications.mockResolvedValue([]);
    renderWelcome();
    expect(screen.getByText("快捷入口")).toBeInTheDocument();
    ["客户管理", "线索管理", "合同管理", "审批流", "库存管理", "记账本", "案件管理", "通知中心"].forEach(
      (label) => {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      },
    );
  });
});
