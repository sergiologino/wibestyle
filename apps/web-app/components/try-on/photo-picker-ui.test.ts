import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("photo try-on picker", () => {
  const source = readFileSync(join(process.cwd(), "components", "try-on", "PhotoTryOnClient.tsx"), "utf8");

  it("hides the native file caption and changes the custom label after selection", () => {
    expect(source).toContain('className="sr-only"');
    expect(source).toContain('photoFile ? "Выбрать другое фото" : "Выбрать фото"');
    expect(source).not.toContain("Файл: {photoFile.name}");
  });

  it("shows a selected image thumbnail instead of repeating its filename", () => {
    expect(source).toContain('alt="Выбранное фото одежды"');
    expect(source).toContain("Фото выбрано");
    expect(source).not.toContain("{photoFile.name}</p>");
  });

  it("keeps explicit visible actions for both photo-flow steps", () => {
    expect(source).toContain('data-testid="photo-try-on-continue"');
    expect(source).toContain("Продолжить к примерке");
    expect(source).toContain('data-testid="photo-try-on-start"');
    expect(source).toContain("Примерить эту вещь");
  });
});
