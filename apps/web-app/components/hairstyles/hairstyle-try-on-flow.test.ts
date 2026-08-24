import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("hairstyle try-on flow", () => {
  const source = readFileSync(join(process.cwd(), "components", "hairstyles", "HairstyleTryOnClient.tsx"), "utf8");

  it("shows a portrait block after style selection and starts try-on from it", () => {
    expect(source).toContain('data-testid="hairstyle-portrait-block"');
    expect(source).toContain('data-testid="hairstyle-try-on-start"');
    expect(source).toContain("Портрет для примерки");
    expect(source).toContain("Отправить на примерку");
  });

  it("routes generated hairstyles through the shared before-after result screen", () => {
    expect(source).toContain("api.createHairstyleTryOn");
    expect(source).toContain("router.push(`/try-on/result/${result.session?.id ?? result.id}`)");
  });
});
