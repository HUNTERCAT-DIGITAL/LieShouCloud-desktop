/**
 * Desktop 业务/个人模块 service 单测（lead/contact/contract/member/quality/notification）.
 * contract-api request 被 mock,验证 method/path/body 拼接。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import { createLead, deleteLead, listLeads } from "./lead";
import { createContact, listContacts } from "./contact";
import { createContract, listContracts, updateContract } from "./contract";
import { createMember, listMembers } from "./member";
import { createBatch, createInspection, listBatches, listInspections } from "./quality";
import { listNotifications, markAllNotificationsRead, unreadNotificationCount } from "./notification";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop lead service", () => {
  it("listLeads 带 keyword+status → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listLeads("张三", "NEW");
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/leads?keyword=%E5%BC%A0%E4%B8%89&status=NEW" });
  });

  it("createLead → POST /leads", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createLead({ name: "线索A" });
    expect(mockRequest).toHaveBeenCalledWith({ method: "POST", path: "/leads", body: { name: "线索A" } });
  });

  it("deleteLead → DELETE /leads/{id}", async () => {
    mockRequest.mockResolvedValue({ deleted: true });
    await deleteLead(5);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/leads/5" });
  });
});

describe("desktop contact service", () => {
  it("listContacts 带 customerId → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listContacts(undefined, 3);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/contacts?customerId=3" });
  });

  it("createContact → POST /contacts", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createContact({ customerId: 3, name: "张三" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/contacts",
      body: { customerId: 3, name: "张三" },
    });
  });
});

describe("desktop contract service", () => {
  it("listContracts 带 status → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listContracts(undefined, "ACTIVE");
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/contracts?status=ACTIVE" });
  });

  it("updateContract → PUT /contracts/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await updateContract(1, { status: "TERMINATED" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/contracts/1",
      body: { status: "TERMINATED" },
    });
  });

  it("createContract → POST /contracts", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createContract({ customerId: 3, contractNo: "HT-001", title: "服务合同" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/contracts",
      body: { customerId: 3, contractNo: "HT-001", title: "服务合同" },
    });
  });
});

describe("desktop member service", () => {
  it("listMembers 带 status → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listMembers("ACTIVE");
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/members?status=ACTIVE" });
  });

  it("createMember → POST /members", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createMember({ customerId: 3, memberNo: "M001", level: "GOLD" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/members",
      body: { customerId: 3, memberNo: "M001", level: "GOLD" },
    });
  });
});

describe("desktop quality service", () => {
  it("listBatches → GET /batches", async () => {
    mockRequest.mockResolvedValue([]);
    await listBatches();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/batches" });
  });

  it("createBatch → POST /batches", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createBatch({ productId: 1, batchNo: "B001", quantity: 100 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/batches",
      body: { productId: 1, batchNo: "B001", quantity: 100 },
    });
  });

  it("listInspections 带 type+result → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listInspections({ type: "IQC", result: "FAIL" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/inspections?type=IQC&result=FAIL",
    });
  });

  it("createInspection → POST /inspections", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createInspection({ productId: 1, batchId: 2, type: "FQC", result: "PASS", quantity: 50 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/inspections",
      body: { productId: 1, batchId: 2, type: "FQC", result: "PASS", quantity: 50 },
    });
  });
});

describe("desktop notification service", () => {
  it("listNotifications → GET /notifications?page=0&size=50", async () => {
    mockRequest.mockResolvedValue([]);
    await listNotifications();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/notifications?page=0&size=50" });
  });

  it("unreadNotificationCount → GET /notifications/unread-count", async () => {
    mockRequest.mockResolvedValue({ unread: 3 });
    await expect(unreadNotificationCount()).resolves.toBe(3);
  });

  it("markAllNotificationsRead → POST /notifications/read-all", async () => {
    mockRequest.mockResolvedValue({ updated: 2 });
    await expect(markAllNotificationsRead()).resolves.toBe(2);
  });
});
