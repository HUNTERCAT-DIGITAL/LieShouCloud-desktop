/**
 * Desktop notification service（个人模块 · 站内通知）.
 */
import { request } from "@lieshoucloud/contract-api";

export interface NotificationItem {
  id: number;
  tenantId: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  bizType?: string | null;
  bizId?: number | null;
  readAt?: string | null;
  createdAt: string;
}

/** GET /notifications — 我的通知（未读优先,新→旧） */
export async function listNotifications(params?: { page?: number; size?: number }): Promise<NotificationItem[]> {
  const qs = new URLSearchParams();
  qs.set("page", String(params?.page ?? 0));
  qs.set("size", String(params?.size ?? 50));
  return request<NotificationItem[]>({ method: "GET", path: `/api/notifications?${qs.toString()}` });
}

/** GET /notifications/unread-count — 未读数 */
export async function unreadNotificationCount(): Promise<number> {
  const r = await request<{ unread: number }>({ method: "GET", path: "/api/notifications/unread-count" });
  return r.unread;
}

/** POST /notifications/{id}/read — 标记单条已读 */
export async function markNotificationRead(id: number): Promise<void> {
  await request<void>({ method: "POST", path: `/api/notifications/${id}/read` });
}

/** POST /notifications/read-all — 全部已读 */
export async function markAllNotificationsRead(): Promise<number> {
  const r = await request<{ updated: number }>({ method: "POST", path: "/api/notifications/read-all" });
  return r.updated;
}
