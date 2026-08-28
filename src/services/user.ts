/**
 * Desktop user service（平台管理 · 用户 CRUD）.
 * 通道:contract-api request(baseUrl 含 /api,path 不含 /api)。
 */
import { request } from "@lieshoucloud/contract-api";
import type { CreateUserRequest, UpdateUserRequest, User } from "@lieshoucloud/contract-types/business/user";

/** 轻量用户选项（审批人下拉等场景） */
export interface UserOption {
  id: number;
  username: string;
  displayName?: string | null;
  status?: string;
}

/** GET /users — 用户列表（含完整字段,供平台管理） */
export async function listUsers(): Promise<User[]> {
  return request<User[]>({ method: "GET", path: "/api/users" });
}

/** POST /users — 新建用户 */
export async function createUser(body: CreateUserRequest): Promise<User> {
  return request<User>({ method: "POST", path: "/api/users", body });
}

/** PUT /users/{id} — 编辑用户（password 传入才改） */
export async function updateUser(id: number, body: UpdateUserRequest): Promise<User> {
  return request<User>({ method: "PUT", path: `/api/users/${id}`, body });
}

/** PUT /users/me/password — 自助修改密码(校验原密码,framework 业务源) */
export async function changeMyPassword(oldPassword: string, newPassword: string): Promise<void> {
  await request<void>({
    method: "PUT",
    path: "/api/users/me/password",
    body: { oldPassword, newPassword },
  });
}

/** DELETE /users/{id} — 删除用户 */
export async function deleteUser(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/users/${id}` });
}
