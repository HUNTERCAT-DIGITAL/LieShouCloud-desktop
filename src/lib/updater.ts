/**
 * 桌面端在线升级（Tauri updater · 通用能力）.
 *
 * - Tauri 环境（window.__TAURI_INTERNALS__）才可用；浏览器版（/desktop/ 静态）守卫跳过。
 * - 检查 → 有更新弹确认 → 下载安装 → relaunch 重启。
 * - 发布链路：deploy/publish-desktop-update.sh（Win11 构建签名 → deploy/updates/
 *   → nginx /updates/ 托管 → 客户端轮询 tauri.conf plugins.updater.endpoints）。
 */
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { message, Modal } from 'antd';

/** 是否运行在 Tauri WebView（浏览器/静态部署无 Tauri API） */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 检查更新。silent=true 无更新时不打扰（启动自动检查）；false 显示「已是最新」。
 */
export async function checkForUpdates(silent = true): Promise<void> {
  if (!isTauri()) {
    // 浏览器形态：无桌面升级能力（不提示，避免误导）
    return;
  }
  try {
    const update = await check();
    if (!update) {
      if (!silent) message.info('已是最新版本');
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '发现新版本',
        content: `电网监控 ${update.version} 已可用（当前 ${update.currentVersion}），是否下载并安装？`,
        okText: '下载安装',
        cancelText: '稍后',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;
    message.loading({ content: '正在下载更新…', key: 'updater' });
    await update.downloadAndInstall();
    message.success({ content: '更新已就绪，正在重启…', key: 'updater' });
    await relaunch();
  } catch (e) {
    if (!silent) {
      message.error(e instanceof Error ? `检查更新失败：${e.message}` : '检查更新失败');
    }
  }
}
