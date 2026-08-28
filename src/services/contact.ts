/**
 * Desktop contact service（业务模块 · 联系人）.
 */
import { request } from "@lieshoucloud/contract-api";
import type { Contact, CreateContactRequest, UpdateContactRequest } from "@lieshoucloud/contract-types/business/contact";

/** GET /contacts — 联系人列表 */
export async function listContacts(keyword?: string, customerId?: number): Promise<Contact[]> {
  const params: string[] = [];
  if (customerId) params.push(`customerId=${customerId}`);
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return request<Contact[]>({ method: "GET", path: `/api/contacts${qs}` });
}

/** POST /contacts — 新建联系人 */
export async function createContact(body: CreateContactRequest): Promise<Contact> {
  return request<Contact>({ method: "POST", path: "/api/contacts", body });
}

/** PUT /contacts/{id} — 更新联系人 */
export async function updateContact(id: number, body: UpdateContactRequest): Promise<Contact> {
  return request<Contact>({ method: "PUT", path: `/api/contacts/${id}`, body });
}

/** DELETE /contacts/{id} — 删除联系人 */
export async function deleteContact(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/contacts/${id}` });
}
