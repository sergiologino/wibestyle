import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("marketplace try-on entry points", () => {
  it("keeps a direct WB/Ozon action on the authenticated home", () => {
    const home = readFileSync(join(process.cwd(), "components", "home", "HomeDashboardClient.tsx"), "utf8");

    expect(home).toContain('data-testid="marketplace-try-on-primary"');
    expect(home).toContain('data-testid="photo-try-on-primary"');
    expect(home).toContain('href="/try-on/link"');
    expect(home).toContain("const INITIAL_HISTORY_LIMIT = 6");
    expect(home).toContain("const HISTORY_PAGE_SIZE = 12");
    expect(home).toContain("api.listMyTryOnSessions({ limit: INITIAL_HISTORY_LIMIT })");
    expect(home).toContain("readFeedCache");
    expect(home).toContain("writeFeedCache");
    expect(home).toContain("homeHistoryCacheKey");
    expect(home).toContain("sm:grid-cols-2");
    expect(home).not.toContain("bg-[var(--pink)] p-5");
  });

  it("shows published reviews on the authenticated home below try-on history", () => {
    const home = readFileSync(join(process.cwd(), "components", "home", "HomeDashboardClient.tsx"), "utf8");

    expect(home).toContain("PublishedReview");
    expect(home).toContain("api.listPublishedReviews()");
    expect(home).toContain("<h2 className=\"text-display-md text-3xl\">Отзывы</h2>");
    expect(home).toContain('{"★".repeat(review.rating)}');
  });

  it("keeps the link scenario on the try-on hub", () => {
    const hub = readFileSync(join(process.cwd(), "app", "try-on", "page.tsx"), "utf8");
    expect(hub).toContain('href: "/try-on/link"');
    expect(hub).toContain('data-testid="marketplace-try-on-hub"');
  });
});
