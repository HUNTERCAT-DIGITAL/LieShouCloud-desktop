/**
 * columnPrefs 工具单测.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadColumnPrefs, saveColumnPrefs } from "./columnPrefs";

const ALL = ["caseType", "stage", "status", "priority", "responsibleLawyer", "createdAt"];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadColumnPrefs", () => {
  it("无存储 → 返回全量", () => {
    expect(loadColumnPrefs("k", ALL)).toEqual(ALL);
  });

  it("有存储 → 返回已存列(过滤非法值)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify(["stage", "status", "hacker"]),
      setItem: vi.fn(),
    });
    expect(loadColumnPrefs("k", ALL)).toEqual(["stage", "status"]);
  });

  it("存储全隐藏 → 回退全量(防空表)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify([]),
      setItem: vi.fn(),
    });
    expect(loadColumnPrefs("k", ALL)).toEqual(ALL);
  });

  it("存储损坏(非法 JSON) → 回退全量", () => {
    vi.stubGlobal("localStorage", { getItem: () => "not-json{{", setItem: vi.fn() });
    expect(loadColumnPrefs("k", ALL)).toEqual(ALL);
  });
});

describe("saveColumnPrefs", () => {
  it("持久化 JSON 数组", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem });
    saveColumnPrefs("k", ["stage"]);
    expect(setItem).toHaveBeenCalledWith("k", JSON.stringify(["stage"]));
  });
});
