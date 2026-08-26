/**
 * Desktop Login 页面单测（P0 · 三端补测试）.
 *
 * 验证：已登录时重定向到 from；提交表单调用 store.login 并导航。
 * store.login 被 spy（不真正请求网络）。
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Login from "./Login";
import { useAuthStore } from "../stores/auth";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<div>工作台页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("desktop Login", () => {
  it("渲染登录表单（用户名/密码/登录按钮）", () => {
    useAuthStore.setState({ isAuthenticated: false });
    renderLogin();
    expect(screen.getByText("登录 · Desktop")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("futurewl")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeInTheDocument();
  });

  it("已登录 → 直接重定向到 /welcome", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "t",
      user: { userId: 1, username: "u", roles: [] },
    });
    renderLogin();
    expect(screen.getByText("工作台页")).toBeInTheDocument();
  });

  it("提交表单 → 调 store.login + 导航到工作台", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const loginSpy = vi.spyOn(useAuthStore.getState(), "login").mockResolvedValue(undefined);

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("futurewl"), { target: { value: "futurewl" } });
    fireEvent.change(screen.getByPlaceholderText("password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));

    // antd Form 提交是异步的，等微任务
    await new Promise((r) => setTimeout(r, 50));
    expect(loginSpy).toHaveBeenCalledWith("futurewl", "pw");
    expect(await screen.findByText("工作台页")).toBeInTheDocument();
  });
});
