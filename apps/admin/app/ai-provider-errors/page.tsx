"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import type {
  AiProviderErrorMappingPayload,
  AiProviderErrorMappingRecord,
} from "@wibestyle/api-client";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";

const emptyMapping: AiProviderErrorMappingPayload = {
  errorText: "",
  description: "",
  enabled: true,
};

export default function AdminAiProviderErrorsPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [items, setItems] = useState<AiProviderErrorMappingRecord[]>([]);
  const [draft, setDraft] = useState<AiProviderErrorMappingPayload>(emptyMapping);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.listAdminAiProviderErrors(adminKey);
      setItems(response.items);
    } catch {
      setError("Не удалось загрузить реестр ошибок нейросетей.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api, configured]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateItem(id: string, patch: Partial<AiProviderErrorMappingRecord>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function createMapping() {
    if (!draft.errorText.trim() || !draft.description.trim()) {
      setError("Заполните текст ошибки и сообщение пользователю.");
      return;
    }
    setSaving("new");
    setError(null);
    try {
      const created = await api.createAdminAiProviderError(adminKey, draft);
      setItems((current) => [...current, created]);
      setDraft(emptyMapping);
    } catch {
      setError("Не удалось добавить запись. Такой текст ошибки уже может существовать.");
    } finally {
      setSaving(null);
    }
  }

  async function saveMapping(item: AiProviderErrorMappingRecord) {
    setSaving(item.id);
    setError(null);
    try {
      const updated = await api.updateAdminAiProviderError(adminKey, item.id, item);
      setItems((current) => current.map((value) => (value.id === item.id ? updated : value)));
    } catch {
      setError("Не удалось сохранить запись.");
    } finally {
      setSaving(null);
    }
  }

  async function deleteMapping(item: AiProviderErrorMappingRecord) {
    if (!window.confirm("Удалить это правило распознавания ошибки?")) return;
    setSaving(item.id);
    setError(null);
    try {
      await api.deleteAdminAiProviderError(adminKey, item.id);
      setItems((current) => current.filter((value) => value.id !== item.id));
    } catch {
      setError("Не удалось удалить запись.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminPageShell
      pill="Admin · AI"
      title="Ошибки нейросетей"
      description="Если ответ провайдера содержит указанный текст, пользователь увидит заданное сообщение. Сравнение выполняется без учёта регистра, текст может быть частью более длинной ошибки."
    >
      {!configured ? (
        <p className="font-bold text-[#6d6273]">Сначала сохраните X-Admin-Key в верхней панели.</p>
      ) : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загружаем реестр...</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}

      <Card className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-[#302637]">Добавить ошибку</h2>
          <p className="mt-1 text-sm font-bold text-[#6d6273]">
            Скопируйте устойчивую часть ошибки из логов AI и напишите понятное сообщение для пользователя.
          </p>
        </div>
        <MappingFields value={draft} onChange={setDraft} />
        <Button
          type="button"
          disabled={!configured || saving === "new"}
          onClick={() => void createMapping()}
        >
          {saving === "new" ? "Добавляем..." : "Добавить в реестр"}
        </Button>
      </Card>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="space-y-4">
            <MappingFields
              value={item}
              onChange={(patch) => updateItem(item.id, patch)}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={saving === item.id}
                onClick={() => void saveMapping(item)}
              >
                {saving === item.id ? "Сохраняем..." : "Сохранить"}
              </Button>
              <button
                type="button"
                className="rounded-xl border border-[#ff1fa2] px-4 py-2 font-black text-[#ff1fa2]"
                disabled={saving === item.id}
                onClick={() => void deleteMapping(item)}
              >
                Удалить
              </button>
            </div>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}

function MappingFields({
  value,
  onChange,
}: {
  value: AiProviderErrorMappingPayload;
  onChange: (value: AiProviderErrorMappingPayload) => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-xs font-black uppercase tracking-wide text-[#6d6273]">
          Текст ошибки нейросети
        </span>
        <textarea
          className="min-h-24 rounded-xl border border-[#ffd1ed] px-3 py-2 font-mono text-sm font-bold text-[#302637] outline-none focus:border-[#ff1fa2]"
          maxLength={1000}
          value={value.errorText}
          onChange={(event) => onChange({ ...value, errorText: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-black uppercase tracking-wide text-[#6d6273]">
          Сообщение пользователю
        </span>
        <textarea
          className="min-h-28 rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold text-[#302637] outline-none focus:border-[#ff1fa2]"
          maxLength={1500}
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 font-black text-[#302637]">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
        />
        правило включено
      </label>
    </div>
  );
}
