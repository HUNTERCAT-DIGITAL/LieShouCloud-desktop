/**
 * Desktop AuthGuard 路由守卫单测（P0 · 三端补测试）.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthGuard } from "./AuthGuard";
import { useAuthStore } from "../stores/auth";

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/welcome"]}>
      <Routes>
        <Route
          path="/welcome"
          element={
            <AuthGuard>
              <div>受保护内容</div>
            </AuthGuard>
          }
        />
        <Route path="/login" element={<div>登录页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("desktop AuthGuard", () => {
  it("未登录 → 重定向到 /login，不渲染子内容", () => {
    useAuthStore.setState({ isAuthenticated: false });
    renderGuard();
    expect(screen.getByText("登录页")).toBeInTheDocument();
    expect(screen.queryByText("受保护内容")).not.toBeInTheDocument();
  });

  it("已登录 → 渲染子内容，不跳登录", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "t",
      user: { userId: 1, username: "u", roles: [] },
    });
    renderGuard();
    expect(screen.getByText("受保护内容")).toBeInTheDocument();
    expect(screen.queryByText("登录页")).not.toBeInTheDocument();
  });
});
