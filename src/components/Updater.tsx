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
import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, Modal, Progress, Space, Spin, Typography, message } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** 对话框阶段：检查中 / 发现更新 / 已是最新 / 检查失败 */
type UpdatePhase = "checking" | "found" | "latest" | "error";

export interface UpdaterApi {
  /**
   * 触发检查。
   * silent=true（启动自动检查）：仅在有更新时弹窗，无更新/失败静默不打扰；
   * 默认 false（用户手动触发）：完整对话框（检查中 → 结果）。
   */
  checkForUpdates: (silent?: boolean) => Promise<void>;
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
  /** 下载进度（字节）：Started 事件给总量 contentLength,Progress 累计 chunkLength */
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(0);
  /** 已检查到的更新实例（startDownload 直接复用，避免二次检查） */
  const updateRef = useRef<Update | null>(null);

  const checkForUpdates = async (silent = false): Promise<void> => {
    updateRef.current = null;
    setError(null);
    setCurrent("—");
    setNext(null);
    setDownloaded(0);
    setTotal(0);
    if (!silent) {
      // 手动触发：先弹「检查中」对话框
      setPhase("checking");
      setOpen(true);
    }
    try {
      const update = await check();
      if (!update) {
        // 无更新：静默模式直接返回，不打扰用户
        if (silent) return;
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
      setOpen(true); // 有更新必须弹（静默模式也一样）
    } catch (e) {
      console.warn("[updater] check 不可用（dev 构建或升级服务未就绪）", e);
      // 静默模式：失败不打扰
      if (silent) return;
      setError(`检查更新失败：${String(e)}`);
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
    setDownloaded(0);
    setTotal(0);
    try {
      let acc = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setTotal(event.data.contentLength ?? 0);
        } else if (event.event === "Progress") {
          acc += event.data.chunkLength;
          setDownloaded(acc);
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
            {busy &&
              (total > 0 ? (
                <Progress
                  percent={Math.min(99, Math.round((downloaded / total) * 100))}
                  status="active"
                />
              ) : (
                <Progress
                  percent={undefined}
                  status="active"
                  strokeColor={{ from: "#108ee9", to: "#87d068" }}
                />
              ))}
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

// ============================================================
// 全局 UpdaterProvider：登录页 / 主布局 / 启动自动检查共用同一实例
// ============================================================

const UpdaterContext = createContext<UpdaterApi | null>(null);

/** 全局挂载：渲染升级 Modal，并向整棵树提供 checkForUpdates */
export function UpdaterProvider({ children }: { children: ReactNode }) {
  const updater = useUpdater();
  return (
    <UpdaterContext.Provider value={updater}>
      {children}
      {updater.renderModal()}
    </UpdaterContext.Provider>
  );
}

/** 任意页面/组件取检查更新能力（须在 <UpdaterProvider> 内） */
export function useUpdaterContext(): UpdaterApi {
  const ctx = useContext(UpdaterContext);
  if (!ctx) {
    throw new Error("useUpdaterContext 必须在 <UpdaterProvider> 内使用");
  }
  return ctx;
}
