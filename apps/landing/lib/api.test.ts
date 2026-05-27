import { describe, expect, it } from "vitest";
import { readLandingAttribution } from "./api";

describe("readLandingAttribution", () => {
  it("returns empty values on server", () => {
    expect(readLandingAttribution()).toEqual({
      page: undefined,
      utmSource: undefined,
      utmCampaign: undefined,
      referrer: undefined,
    });
  });
});
