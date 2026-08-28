/**
 * Desktop member service（业务模块 · 会员）.
 */
import { request } from "@lieshoucloud/contract-api";
import type {
  CreateMemberRequest,
  Member,
  MemberStatus,
  UpdateMemberRequest,
} from "@lieshoucloud/contract-types/business/member";

/** GET /members — 会员列表 */
export async function listMembers(status?: MemberStatus, keyword?: string): Promise<Member[]> {
  const params: string[] = [];
  if (status) params.push(`status=${status}`);
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return request<Member[]>({ method: "GET", path: `/members${qs}` });
}

/** POST /members — 新建会员 */
export async function createMember(body: CreateMemberRequest): Promise<Member> {
  return request<Member>({ method: "POST", path: "/members", body });
}

/** PUT /members/{id} — 更新会员 */
export async function updateMember(id: number, body: UpdateMemberRequest): Promise<Member> {
  return request<Member>({ method: "PUT", path: `/members/${id}`, body });
}

/** DELETE /members/{id} — 删除会员 */
export async function deleteMember(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/members/${id}` });
}
