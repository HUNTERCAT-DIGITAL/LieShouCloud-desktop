/**
 * Desktop 在线升级（2026-09 · Tauri 2 updater 插件）.
 *
 * 入口：BasicLayout 用户菜单「检查更新」。
 * 流程：check() → 无更新提示 / 有更新弹 Modal → 下载进度 → 自动重启安装。
 * 升级清单：https://legalmind.lieshoucloud.huntercat.cn/updates/latest.json（客户仓 nginx /updates/）
 * 发布流程：见客户仓 deploy/README.md「桌面端升级发布」。
 *
 * @note dev / debug 构建下 updater 默认禁用，check() 会抛错，此处兜底提示。
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Button, Modal, Progress, Space, Typography, message } from "antd";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdaterApi {
  /** 触发检查（BasicLayout 用户菜单调用） */
  checkForUpdates: () => Promise<void>;
  /** Modal + 进度 UI（渲染到布局根部） */
  renderModal: () => ReactNode;
}

export function useUpdater(): UpdaterApi {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string>("—");
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async (): Promise<void> => {
    setError(null);
    let update: Update | null = null;
    try {
      update = await check();
    } catch (e) {
      console.warn("[updater] check 不可用（dev 构建或升级服务未就绪）", e);
      message.info("当前环境暂不支持在线检查更新（开发构建或升级服务未就绪）");
      return;
    }
    if (!update) {
      message.success("已是最新版本");
      return;
    }
    let ver = "—";
    try {
      ver = await getVersion();
    } catch {
      /* 版本读取失败不阻塞升级 */
    }
    setCurrent(ver);
    setNext(update.version);
    setOpen(true);
  };

  const startDownload = async (): Promise<void> => {
    setError(null);
    let update: Update | null = null;
    try {
      update = await check();
    } catch {
      setError("检查更新失败，请确认网络连接后重试");
      return;
    }
    if (!update) {
      setOpen(false);
      message.success("已是最新版本");
      return;
    }
    setBusy(true);
    try {
      await update.downloadAndInstall((event) => {
        // 当前插件 Progress 仅上报 chunkLength（增量），无总量，进度条用不确定模式
        if (event.event === "Progress") {
          console.debug("[updater] downloading chunk", event.data.chunkLength);
        }
      });
      message.loading({ content: "升级包已就绪，正在重启完成安装…", duration: 0 });
      await relaunch();
    } catch (e) {
      console.error("[updater] 下载/安装失败", e);
      setError("下载或安装失败，请稍后重试");
      setBusy(false);
    }
  };

  const renderModal = (): ReactNode => (
    <Modal
      title="发现新版本"
      open={open}
      closable={!busy}
      maskClosable={!busy}
      footer={
        busy ? null : (
          <Button type="primary" onClick={() => void startDownload()}>
            立即更新
          </Button>
        )
      }
      onCancel={() => setOpen(false)}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Typography.Text>
          当前版本 <Typography.Text strong>{current}</Typography.Text> → 新版本{" "}
          <Typography.Text strong>{next ?? "—"}</Typography.Text>
        </Typography.Text>
        {busy && (
          <Progress
            percent={undefined}
            status="active"
            strokeColor={{ from: "#108ee9", to: "#87d068" }}
          />
        )}
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
      </Space>
    </Modal>
  );

  return { checkForUpdates, renderModal };
}
