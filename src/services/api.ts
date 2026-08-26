import { invoke } from "@tauri-apps/api/core";
import { request } from "@lieshoucloud/api-client";
import type { HealthStatus } from "@lieshoucloud/types";

/**
 * Desktop API 客户端 - 双通道:
 *
 *   1. Tauri command (Rust IPC bridge)
 *      - 通过 `invoke('cmd_name')` 调用 Rust 端的 #[tauri::command]
 *      - 适合本地 native 操作（fs / dialog / shell）
 *
 *   2. HTTP fetch (与 web admin 共享)
 *      - 通过 @lieshoucloud/api-client 的 request<T>()
 *      - 适合调 Spring Cloud Gateway
 */

const GATEWAY_BASE = "http://localhost:9000";

/** Tauri command - 调用 Rust 端 fetch_health */
export async function fetchTauriBridgeHealth(): Promise<{
  status: string;
  service: string;
}> {
  return await invoke<{ status: string; service: string }>("fetch_health");
}

/** HTTP - 调用 /actuator/health */
export async function fetchGatewayHealth(): Promise<HealthStatus> {
  try {
    const data = await request<{ status: HealthStatus }>({
      method: "GET",
      path: `${GATEWAY_BASE}/actuator/health`,
    });
    return data.status;
  } catch {
    return "down";
  }
}
