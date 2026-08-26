import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile profile onboarding replay", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");

  it("shows a profile button for opening onboarding again", () => {
    expect(source).toContain('label="Посмотреть онбординг"');
    expect(source).toContain('router.push("/welcome?replay=1" as never)');
  });
});
