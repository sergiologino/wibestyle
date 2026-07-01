"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import type { AiProviderOperation, AiProviderPriorityRecord } from "@wibestyle/api-client";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";

const operations: Array<{ key: AiProviderOperation; title: string; description: string }> = [
  {
    key: "VIRTUAL_TRY_ON_PHOTO",
    title: "Фото примерка",
    description: "Очередь для генерации результата примерки по фото пользователя и фото товара.",
  },
  {
    key: "VIRTUAL_TRY_ON_VIDEO",
    title: "Видео примерка",
    description: "Очередь для season-hit video после готовой AI-примерки.",
  },
];

function sorted(items: AiProviderPriorityRecord[]) {
  return [...items].sort(
    (a, b) => a.priorityOrder - b.priorityOrder || a.networkName.localeCompare(b.networkName),
  );
}

function roleLabel(index: number, enabled: boolean) {
  if (!enabled) return "выключена";
  if (index === 0) return "основная";
  if (index === 1) return "запасная";
  return "последняя";
}

export default function AdminAiProvidersPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [items, setItems] = useState<Record<AiProviderOperation, AiProviderPriorityRecord[]>>({
    VIRTUAL_TRY_ON_PHOTO: [],
    VIRTUAL_TRY_ON_VIDEO: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<AiProviderOperation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<AiProviderOperation | null>(null);

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminAiProviders(adminKey);
      setItems({
        VIRTUAL_TRY_ON_PHOTO: sorted(data.VIRTUAL_TRY_ON_PHOTO ?? []),
        VIRTUAL_TRY_ON_VIDEO: sorted(data.VIRTUAL_TRY_ON_VIDEO ?? []),
      });
    } catch {
      setError("Не удалось загрузить приоритеты нейросетей.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api, configured]);

  useEffect(() => {
    void load();
  }, [load]);

  const enabledRoutes = useMemo(() => {
    return {
      VIRTUAL_TRY_ON_PHOTO: sorted(items.VIRTUAL_TRY_ON_PHOTO).filter((item) => item.enabled),
      VIRTUAL_TRY_ON_VIDEO: sorted(items.VIRTUAL_TRY_ON_VIDEO).filter((item) => item.enabled),
    };
  }, [items]);

  function updateItem(operation: AiProviderOperation, index: number, patch: Partial<AiProviderPriorityRecord>) {
    setItems((current) => ({
      ...current,
      [operation]: current[operation].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  async function saveOperation(operation: AiProviderOperation) {
    setSaving(operation);
    setSaved(null);
    setError(null);
    try {
      const response = await api.updateAdminAiProviders(adminKey, operation, sorted(items[operation]));
      setItems((current) => ({ ...current, [operation]: sorted(response.items) }));
      setSaved(operation);
    } catch {
      setError("Не удалось сохранить приоритеты. Проверьте X-Admin-Key и значения полей.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminPageShell
      pill="Admin · AI"
      title="Приоритеты нейросетей"
      description="Все генерации идут через noteapp-ai-integration. Здесь задаётся порядок networkName: основная нейросеть, запасная и последняя попытка."
    >
      {!configured ? (
        <p className="font-bold text-[#6d6273]">Сначала сохраните X-Admin-Key в верхней панели.</p>
      ) : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загружаем провайдеров...</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {operations.map((operation) => (
          <Card key={operation.key} className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-[#302637]">{operation.title}</h2>
              <p className="mt-1 text-sm font-bold text-[#6d6273]">{operation.description}</p>
            </div>

            <div className="rounded-2xl border border-[#ffd1ed] bg-[#fff7fc] p-3 text-sm font-bold text-[#6d6273]">
              Активная цепочка:{" "}
              {enabledRoutes[operation.key].length > 0
                ? enabledRoutes[operation.key].map((item) => item.displayName).join(" → ")
                : "нет включённых провайдеров"}
            </div>

            <div className="grid gap-3">
              {items[operation.key].map((item, index) => (
                <div key={item.networkName} className="rounded-2xl border border-[#f0dce8] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#ff1fa2]">
                        {roleLabel(
                          enabledRoutes[operation.key].findIndex((route) => route.networkName === item.networkName),
                          item.enabled,
                        )}
                      </p>
                      <p className="font-mono text-xs font-bold text-[#6d6273]">{item.networkName}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-black text-[#302637]">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(event) => updateItem(operation.key, index, { enabled: event.target.checked })}
                      />
                      включена
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-wide text-[#6d6273]">Название в админке</span>
                      <input
                        className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold text-[#302637] outline-none focus:border-[#ff1fa2]"
                        value={item.displayName}
                        maxLength={160}
                        onChange={(event) => updateItem(operation.key, index, { displayName: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-wide text-[#6d6273]">
                        Приоритет (1 — первый)
                      </span>
                      <input
                        className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold text-[#302637] outline-none focus:border-[#ff1fa2]"
                        type="number"
                        min={1}
                        max={999}
                        value={item.priorityOrder}
                        onChange={(event) =>
                          updateItem(operation.key, index, { priorityOrder: Number(event.target.value) || 1 })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={!configured || saving === operation.key}
                onClick={() => void saveOperation(operation.key)}
              >
                {saving === operation.key ? "Сохраняем..." : "Сохранить порядок"}
              </Button>
              {saved === operation.key ? <span className="font-bold text-[#782cff]">Сохранено</span> : null}
            </div>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
