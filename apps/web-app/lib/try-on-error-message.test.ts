import { describe, expect, it } from "vitest";
import { formatTryOnError } from "./try-on-error-message";

describe("formatTryOnError", () => {
  it("maps AI_NOT_CONFIGURED to a user-facing hint", () => {
    const message = formatTryOnError({
      id: "1",
      userId: "2",
      sourceType: "marketplace_link",
      status: "failed",
      visibility: "private",
      errorCode: "AI_NOT_CONFIGURED",
      errorMessage: "AI service not configured",
      createdAt: "",
      updatedAt: "",
    });
    expect(message).toContain("WIBESTYLE_AI");
  });
});
