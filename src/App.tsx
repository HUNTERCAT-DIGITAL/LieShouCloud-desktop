/**
 * 桌面端 App 入口.
 */
import { useEffect } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";

import { UpdaterProvider, useUpdaterContext } from "./components/Updater";
import { routes } from "./routes";

/** 启动自动检查更新（静默：有更新才弹窗，无更新/失败不打扰） */
function AutoCheckUpdater() {
  const updater = useUpdaterContext();
  useEffect(() => {
    void updater.checkForUpdates(true);
  }, [updater]);
  return null;
}

/**
 * 全局导航桥（客户包零路由假设：不 import react-router）。
 * 客户包页面通过 window 派发 CustomEvent("lm:navigate", detail=path) 跳转。
 */
function GlobalNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<string>).detail;
      if (typeof path === "string" && path.startsWith("/")) navigate(path);
    };
    window.addEventListener("lm:navigate", handler);
    return () => window.removeEventListener("lm:navigate", handler);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <UpdaterProvider>
      <BrowserRouter>
        <AutoCheckUpdater />
        <GlobalNavigator />
        {routes}
      </BrowserRouter>
    </UpdaterProvider>
  );
}
