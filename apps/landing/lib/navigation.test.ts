import { describe, expect, it, vi } from "vitest";
import {
  handleHashLinkClick,
  shouldHandleHashLocally,
  splitPathAndHash,
} from "./navigation";

describe("splitPathAndHash", () => {
  it("splits pathname and hash", () => {
    expect(splitPathAndHash("/#examples")).toEqual({ pathname: "/", hash: "examples" });
    expect(splitPathAndHash("/faq")).toEqual({ pathname: "/faq", hash: null });
  });
});

describe("shouldHandleHashLocally", () => {
  it("matches hash links on the current page", () => {
    expect(shouldHandleHashLocally("/#examples", "/")).toBe(true);
    expect(shouldHandleHashLocally("/#lead", "/kak-rabotaet")).toBe(false);
  });
});

describe("handleHashLinkClick", () => {
  it("handles same-page hash links when target exists", () => {
    const scrollIntoView = vi.fn();
    const target = { scrollIntoView } as unknown as HTMLElement;

    vi.stubGlobal("document", {
      getElementById: (id: string) => (id === "examples" ? target : null),
    });
    vi.stubGlobal("window", {
      history: { pushState: vi.fn() },
    });

    const preventDefault = vi.fn();
    const handled = handleHashLinkClick({ preventDefault }, "/#examples", "/");

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    vi.unstubAllGlobals();
  });

  it("ignores cross-page hash links", () => {
    const preventDefault = vi.fn();

    const handled = handleHashLinkClick({ preventDefault }, "/#examples", "/faq");

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
