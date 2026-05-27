import { describe, expect, it } from "vitest";
import { galleryReportReasonLabel, galleryReportReasons } from "./gallery-report";

describe("galleryReportReasons", () => {
  it("includes all API-supported reasons", () => {
    expect(galleryReportReasons.map((item) => item.id)).toEqual([
      "inappropriate",
      "harassment",
      "spam",
      "copyright",
      "other",
    ]);
  });

  it("maps reason id to label", () => {
    expect(galleryReportReasonLabel("spam")).toBe("Спам");
    expect(galleryReportReasonLabel("unknown")).toBe("unknown");
  });
});
