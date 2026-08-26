/**
 * Desktop Welcome 工作台单测（P0 · 三端补测试）.
 *
 * 验证：欢迎语显示当前用户；拉取客户计数/列表并渲染最近客户。
 * customer service 被 mock（不真正请求）。
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Welcome from "./Welcome";
import { useAuthStore } from "../stores/auth";

const { mockCount, mockList } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockList: vi.fn(),
}));

vi.mock("../services/customer", () => ({
  countCustomers: mockCount,
  listCustomers: mockList,
}));

describe("desktop Welcome", () => {
  it("显示当前用户名", () => {
    useAuthStore.setState({ user: { userId: 1, username: "futurewl", roles: ["USER"] } });
    mockCount.mockResolvedValue(0);
    mockList.mockResolvedValue([]);
    render(<Welcome />);
    expect(screen.getByText(/欢迎回来，futurewl/)).toBeInTheDocument();
  });

  it("无客户时显示空态", async () => {
    useAuthStore.setState({ user: { userId: 1, username: "u", roles: [] } });
    mockCount.mockResolvedValue(0);
    mockList.mockResolvedValue([]);
    render(<Welcome />);
    expect(await screen.findByText("暂无客户数据")).toBeInTheDocument();
  });

  it("有客户时渲染最近客户（按创建时间倒序取前 5）", async () => {
    useAuthStore.setState({ user: { userId: 1, username: "u", roles: [] } });
    mockCount.mockResolvedValue(3);
    mockList.mockResolvedValue([
      { id: 1, name: "老客户", status: "CONVERTED", createdAt: "2026-08-01T00:00:00Z", tenantId: 1 },
      { id: 2, name: "新客户", status: "NEW", createdAt: "2026-08-20T00:00:00Z", tenantId: 1 },
    ]);
    render(<Welcome />);
    expect(await screen.findByText(/新客户/)).toBeInTheDocument();
    expect(screen.getByText(/老客户/)).toBeInTheDocument();
    // 倒序：新客户在前
    const names = screen.getAllByText(/客户/).map((n) => n.textContent);
    expect(names.indexOf("新客户")).toBeLessThan(names.indexOf("老客户"));
  });
});
