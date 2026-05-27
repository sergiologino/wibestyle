"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card, Pill } from "@wibestyle/ui";
import { createAdminApi } from "@/lib/api";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";

const VTON_KEY = "vton.base_ru";

type AiPromptTemplate = {
  key: string;
  title: string;
  description?: string | null;
  body: string;
  updatedAt: string;
};

export default function AdminAiPromptsPage() {
  const { adminKey, configured } = useAdminKey();
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
      void load(adminKey, VTON_KEY).catch(() => setError("Не удалось загрузить шаблон промпта"));
    }
  }, [load, configured, adminKey]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api.updateAdminAiPrompt(adminKey, VTON_KEY, { body });
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
      title="Промпт примерки"
      description="Базовая неизменяемая часть на русском. К каждому запросу система допишет блок ДАННЫЕ ПРИМЕРКИ (JSON) с товаром, размерами и фигурой."
    >
      {!configured ? (
        <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p>
      ) : null}

      <Card>
        <h2 className="text-xl font-black">{template?.title ?? "Примерка — базовый промпт"}</h2>
        {template?.description ? (
          <p className="mt-2 font-bold text-[#6d6273]">{template.description}</p>
        ) : null}
        <p className="mt-2 text-sm font-bold text-[#6d6273]">
          Упоминайте image1 (покупатель) и image2 (товар). Grok Imagine получает этот текст + JSON с сессии.
        </p>
        {template?.updatedAt ? (
          <p className="mt-1 text-sm text-[#6d6273]">
            В БД обновлён: {new Date(template.updatedAt).toLocaleString("ru-RU")}
            {savedAt ? ` · сохранено сейчас: ${savedAt}` : null}
          </p>
        ) : null}

        <form className="mt-4 grid gap-3" onSubmit={onSave}>
          <label className="grid gap-2">
            <span className="text-sm font-black uppercase tracking-wide text-[#6d6273]">Базовый промпт (русский)</span>
            <textarea
              className="min-h-[320px] rounded-2xl border border-[#ffd1ed] px-4 py-3 font-mono text-sm leading-relaxed"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={12000}
            />
          </label>
          <p className="text-sm font-bold text-[#6d6273]">
            После сохранения к тексту автоматически добавляется раздел «ДАННЫЕ ПРИМЕРКИ (JSON)» — его в админке не
            редактируют.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !configured}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
            <Pill tone="soft">{body.length} / 12000</Pill>
          </div>
        </form>
        {error ? <p className="mt-3 font-bold text-red-600">{error}</p> : null}
      </Card>
    </AdminPageShell>
  );
}
