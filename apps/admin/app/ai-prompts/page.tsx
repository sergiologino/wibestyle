"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Card, Pill } from "@wibestyle/ui";
import { createAdminApi } from "@/lib/api";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";

const PROMPT_TEMPLATES = [
  { key: "vton.base_ru", label: "Примерка" },
  { key: "avatar.quality_analysis", label: "Анализ аватара" },
  { key: "stylist.avatar_analysis_ru", label: "Стилист: аватар" },
  { key: "stylist.trends_ru", label: "Стилист: тренды" },
  { key: "stylist.preview_tryon_ru", label: "Стилист: превью" },
] as const;

type AiPromptTemplate = {
  key: string;
  title: string;
  description?: string | null;
  body: string;
  updatedAt: string;
};

export default function AdminAiPromptsPage() {
  const { adminKey, configured } = useAdminKey();
  const [selectedKey, setSelectedKey] = useState<(typeof PROMPT_TEMPLATES)[number]["key"]>("vton.base_ru");
  const [template, setTemplate] = useState<AiPromptTemplate | null>(null);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const api = createAdminApi();

  const load = useCallback(async (key: string, templateKey: string) => {
    const data = await api.getAdminAiPrompt(key, templateKey);
    setTemplate(data.template);
    setBody(data.template.body);
    setError(null);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey, selectedKey).catch(() => setError("Не удалось загрузить шаблон промпта"));
    }
  }, [load, configured, adminKey, selectedKey]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api.updateAdminAiPrompt(adminKey, selectedKey, { body });
      setTemplate(data.template);
      setBody(data.template.body);
      setSavedAt(new Date().toLocaleString("ru-RU"));
    } catch {
      setError("Не удалось сохранить промпт");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      pill="AI"
      title="AI-промпты"
      description="Редактируемая текстовая часть промптов. Технические данные, JSON, аватар и служебные ограничения система добавляет отдельно."
    >
      {!configured ? (
        <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {PROMPT_TEMPLATES.map((item) => {
            const active = selectedKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={[
                  "min-h-8 rounded-2xl px-3 py-1.5 text-xs font-black shadow-sm transition active:scale-[0.97]",
                  active
                    ? "border border-[#ff1fa2] bg-[#ff1fa2] text-[#14101a] hover:bg-[#ff4db5]"
                    : "border border-[#ffd1ed] bg-white text-[#302637] hover:bg-[#fff4fb]",
                ].join(" ")}
                onClick={() => {
                  setSelectedKey(item.key);
                  setSavedAt(null);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <h2 className="text-xl font-black">{template?.title ?? "AI-промпт"}</h2>
        {template?.description ? (
          <p className="mt-2 font-bold text-[#6d6273]">{template.description}</p>
        ) : null}
        <p className="mt-2 text-sm font-bold text-[#6d6273]">
          Для примерки можно упоминать image1 (покупатель) и image2 (товар). Для стилиста пишите только смысловую часть:
          анализ, тренды или визуальный образ; техническую привязку к аватару система добавит сама.
        </p>
        {template?.updatedAt ? (
          <p className="mt-1 text-sm text-[#6d6273]">
            В БД обновлён: {new Date(template.updatedAt).toLocaleString("ru-RU")}
            {savedAt ? ` · сохранено сейчас: ${savedAt}` : null}
          </p>
        ) : null}

        <form className="mt-4 grid gap-3" onSubmit={onSave}>
          <label className="grid gap-2">
            <span className="text-sm font-black uppercase tracking-wide text-[#6d6273]">Текстовая часть промпта</span>
            <textarea
              className="min-h-[320px] rounded-2xl border border-[#ffd1ed] px-4 py-3 font-mono text-sm leading-relaxed"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={12000}
            />
          </label>
          <p className="text-sm font-bold text-[#6d6273]">
            Служебные поля, JSON, изображения и ограничения безопасности в админке не редактируют.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !configured}
              className="inline-flex min-h-9 items-center justify-center rounded-2xl bg-[#ff1fa2] px-4 py-2 text-sm font-black text-[#14101a] shadow-sm transition hover:bg-[#ff4db5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <Pill tone="soft">{body.length} / 12000</Pill>
          </div>
        </form>
        {error ? <p className="mt-3 font-bold text-red-600">{error}</p> : null}
      </Card>
    </AdminPageShell>
  );
}
