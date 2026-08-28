/**
 * 桌面端 App 入口.
 */
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

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

export default function App() {
  return (
    <UpdaterProvider>
      <BrowserRouter>
        <AutoCheckUpdater />
        {routes}
      </BrowserRouter>
    </UpdaterProvider>
  );
}
