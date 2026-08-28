/**
 * Desktop 在线升级（2026-09 · Tauri 2 updater 插件）.
 *
 * 入口：BasicLayout 用户菜单「检查更新」。
 * 流程（对话框四态）：
 *   1. checking — 点击后立即弹出「正在检查更新…」（loading）
 *   2. found    — 有更新：当前版本 → 新版本 + 「立即更新」（下载 → 自动重启安装）
 *   3. latest   — 无更新：「当前已是最新版本」
 *   4. error    — 检查失败：提示原因
 *
 * 升级端点：构建期由客户仓 tauri.<client>.conf.json 注入（plugins.updater.endpoints），
 * 发布流程见客户仓 deploy/README.md「桌面端升级发布」；上游 base 配置只留中性占位。
 *
 * @note dev / debug 构建下 updater 默认禁用，check() 会抛错，对话框走 error 态兜底。
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, Modal, Progress, Space, Spin, Typography, message } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** 对话框阶段：检查中 / 发现更新 / 已是最新 / 检查失败 */
type UpdatePhase = "checking" | "found" | "latest" | "error";

export interface UpdaterApi {
  /** 触发检查（BasicLayout 用户菜单调用） */
  checkForUpdates: () => Promise<void>;
  /** Modal + 进度 UI（渲染到布局根部） */
  renderModal: () => ReactNode;
}

export function useUpdater(): UpdaterApi {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UpdatePhase>("checking");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string>("—");
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 已检查到的更新实例（startDownload 直接复用，避免二次检查） */
  const updateRef = useRef<Update | null>(null);

  const checkForUpdates = async (): Promise<void> => {
    updateRef.current = null;
    setError(null);
    setCurrent("—");
    setNext(null);
    setPhase("checking");
    setOpen(true);
    try {
      const update = await check();
      if (!update) {
        setPhase("latest");
        return;
      }
      updateRef.current = update;
      let ver = "—";
      try {
        ver = await getVersion();
      } catch {
        /* 版本读取失败不阻塞升级 */
      }
      setCurrent(ver);
      setNext(update.version);
      setPhase("found");
    } catch (e) {
      console.warn("[updater] check 不可用（dev 构建或升级服务未就绪）", e);
      setError("检查更新失败：当前环境暂不支持在线更新（开发构建或升级服务未就绪），请确认网络后重试");
      setPhase("error");
    }
  };

  const startDownload = async (): Promise<void> => {
    const update = updateRef.current;
    if (!update) {
      setError("更新信息已失效，请重新检查");
      setPhase("error");
      return;
    }
    setError(null);
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

  const close = (): void => {
    if (!busy) setOpen(false);
  };

  const renderModal = (): ReactNode => {
    let title = "软件更新";
    let content: ReactNode = null;
    let footer: ReactNode = null;

    switch (phase) {
      case "checking":
        title = "检查更新";
        content = (
          <Space size="middle">
            <Spin />
            <Typography.Text>正在检查更新…</Typography.Text>
          </Space>
        );
        footer = null;
        break;

      case "found":
        title = "发现新版本";
        content = (
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
        );
        footer = busy ? null : (
          <>
            <Button onClick={close}>稍后再说</Button>
            <Button type="primary" onClick={() => void startDownload()}>
              立即更新
            </Button>
          </>
        );
        break;

      case "latest":
        title = "检查更新";
        content = (
          <Space>
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 18 }} />
            <Typography.Text>当前已是最新版本</Typography.Text>
          </Space>
        );
        footer = (
          <Button type="primary" onClick={close}>
            知道了
          </Button>
        );
        break;

      case "error":
        title = "检查更新";
        content = (
          <Space align="start">
            <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 18, marginTop: 3 }} />
            <Typography.Text type="danger">{error ?? "检查更新失败，请稍后重试"}</Typography.Text>
          </Space>
        );
        footer = (
          <Button type="primary" onClick={close}>
            知道了
          </Button>
        );
        break;
    }

    return (
      <Modal
        title={title}
        open={open}
        closable={!busy}
        maskClosable={!busy}
        footer={footer}
        onCancel={close}
        width={420}
      >
        {content}
      </Modal>
    );
  };

  return { checkForUpdates, renderModal };
}
