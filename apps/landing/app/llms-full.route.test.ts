import { describe, expect, it } from "vitest";
import { GET } from "./llms-full.txt/route";

describe("llms-full.txt", () => {
  it("exposes the AI-indexable FAQ and beauty SEO topics", async () => {
    const body = await (await GET()).text();

    expect(body).toContain("## Индексируемый FAQ для ИИ");
    expect(body).toContain("Можно ли примерить причёску или стрижку онлайн?");
    expect(body).toContain("Будет ли виртуальный макияж онлайн?");
    expect(body).toContain("Ключевые темы:");
    expect(body).toContain("изменить цвет волос онлайн");
    expect(body).toContain("Подписки по срокам нет");
    expect(body).toContain("100 примерок");
    expect(body).toContain("Можно ли сделать видео примерку?");
    expect(body).toContain("Есть ли реферальная система?");
    expect(body).toContain("Полный образ сейчас в работе");
  });
});
