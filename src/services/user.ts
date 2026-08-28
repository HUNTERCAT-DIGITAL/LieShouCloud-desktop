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
  return request<User[]>({ method: "GET", path: "/users" });
}

/** POST /users — 新建用户 */
export async function createUser(body: CreateUserRequest): Promise<User> {
  return request<User>({ method: "POST", path: "/users", body });
}

/** PUT /users/{id} — 编辑用户（password 传入才改） */
export async function updateUser(id: number, body: UpdateUserRequest): Promise<User> {
  return request<User>({ method: "PUT", path: `/users/${id}`, body });
}

/** DELETE /users/{id} — 删除用户 */
export async function deleteUser(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/users/${id}` });
}
