/**
 * edu-desktop 行业 API 层.
 * 共享 api-client 的 request() 适配行业包 IndustryHttpClient（去 /api 双前缀）。
 */
import { request } from "@lieshoucloud/api-client";
import { createEduApi, type IndustryHttpClient } from "@lieshoucloud/industry-edu";

const stripApi = (p: string) => p.replace(/^\/api/, "");

const http: IndustryHttpClient = {
  get: (path, query) =>
    request({
      method: "GET",
      path: stripApi(path),
      query: query as Record<string, string | number | boolean> | undefined,
    }),
  post: (path, body) => request({ method: "POST", path: stripApi(path), body }),
  put: (path, body) => request({ method: "PUT", path: stripApi(path), body }),
  delete: (path) => request({ method: "DELETE", path: stripApi(path) }),
};

export const eduApi = createEduApi(http);
