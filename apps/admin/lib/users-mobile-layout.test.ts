import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile users list", () => {
  it("keeps the mobile card to the operational essentials and retains compact actions", () => {
    const source = readFileSync(join(process.cwd(), "app", "users", "page.tsx"), "utf8");
    expect(source).toContain('className="grid gap-1 text-xs font-bold text-[#6d6273] md:hidden"');
    expect(source).toContain("Зарегистрирован:");
    expect(source).toContain("Осталось примерок:");
    expect(source).toContain('className="hidden md:block"');
    expect(source).toContain('size="sm"');
  });
});
