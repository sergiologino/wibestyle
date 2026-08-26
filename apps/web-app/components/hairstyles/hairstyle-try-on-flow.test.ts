import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("hairstyle and hair color try-on flow", () => {
  const source = readFileSync(join(process.cwd(), "components", "hairstyles", "HairstyleTryOnClient.tsx"), "utf8");

  it("supports choosing hairstyle and hair color independently", () => {
    expect(source).toContain('data-testid="hairstyle-tile-gallery"');
    expect(source).toContain('data-testid="hair-color-tile-gallery"');
    expect(source).toContain("selectedStyleId");
    expect(source).toContain("selectedColorId");
    expect(source).toContain("Не менять");
    expect(source).toContain("Выберите причёску, цвет волос или оба пункта");
  });

  it("uses the profile portrait only and keeps a single start action", () => {
    expect(source).toContain('data-testid="hairstyle-portrait-block"');
    expect(source).toContain('data-testid="hairstyle-try-on-start"');
    expect(source).toContain("Используем портрет из профиля");
    expect(source).toContain("Перейти в профиль");
    expect(source).toContain("Запустить примерку");
    expect(source).not.toContain('type="file"');
    expect(source).not.toContain("onPortraitChange");
  });

  it("loads Garnier color catalogue and sends optional style/color ids to the API", () => {
    expect(source).toContain("api.getHairColorCatalog");
    expect(source).toContain("api.createHairstyleTryOn(null, selectedStyleId, selectedColorId)");
    expect(source).toContain("Каталог Garnier");
    expect(source).toContain("router.push(`/try-on/result/${result.session?.id ?? result.id}`)");
  });
});
