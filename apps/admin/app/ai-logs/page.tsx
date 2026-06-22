"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { ApiError } from "@wibestyle/api-client";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type AiLogItem = {
  id: string;
  tryOnSessionId?: string | null;
  userId?: string | null;
  phase: string;
  title: string;
  body: string;
  modelLabel?: string | null;
  provider?: string | null;
  operation?: string | null;
  attemptNumber?: number | null;
  fallbackReason?: string | null;
  status?: string | null;
  noteappRequestId?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 50;

const phaseLabels: Record<string, string> = {
  request: "Запрос",
  response: "Ответ",
  error: "Ошибка",
};

function userLabel(item: AiLogItem) {
  if (item.userId) return `user ${item.userId}`;
  return "без userId";
}

export default function AdminAiLogsPage() {
  const { adminKey, configured, error, setError } = useAdminKey();
  const [items, setItems] = useState<AiLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const api = createAdminApi();

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAdminAiLogs(adminKey, page, PAGE_SIZE);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const hint =
        err instanceof ApiError && err.status === 401
          ? "Неверный X-Admin-Key. Вверху панели укажите dev-admin-key (или значение WIBESTYLE_ADMIN_API_KEY на API)."
          : "Не удалось загрузить логи AI.";
      setError(hint);
    } finally {
      setLoading(false);
    }
  }, [adminKey, configured, api, page, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageShell
      pill="Admin · AI"
      title="Логи примерки (ai-integration)"
      description="Запросы и ответы noteapp-ai-integration при virtual try-on. Время — в вашем часовом поясе."
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void load()} disabled={!configured || loading}>
          Обновить
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!configured || loading || page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Назад
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!configured || loading || page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Вперёд →
        </Button>
        <span className="self-center text-sm font-bold text-[#6d6273]">
          Стр. {page + 1} из {Math.max(totalPages, 1)} · всего {total}
        </span>
      </div>

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {!configured ? (
        <p className="font-bold text-[#6d6273]">Сначала сохраните X-Admin-Key в верхней панели.</p>
      ) : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загружаем…</p> : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="p-0 overflow-hidden">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#302637]">{userLabel(item)}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-[#6d6273]">{item.title}</p>
                </div>
                <time className="shrink-0 text-[11px] font-bold text-[#6d6273]" dateTime={item.createdAt}>
                  {formatLocalDateTime(item.createdAt)}
                </time>
              </summary>
              <div className="border-t border-[#ffd1ed] px-5 pb-5 pt-3">
                <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#782cff]">
                  {phaseLabels[item.phase] ?? item.phase}
                  {item.status ? ` · ${item.status}` : ""}
                  {item.modelLabel ? ` · ${item.modelLabel}` : ""}
                  {item.operation ? ` · ${item.operation}` : ""}
                  {item.attemptNumber ? ` · попытка ${item.attemptNumber}` : ""}
                </p>
                {item.fallbackReason ? (
                  <p className="mt-1 text-[11px] font-bold text-[#ff1fa2]">fallback: {item.fallbackReason}</p>
                ) : null}
                {item.noteappRequestId ? (
                  <p className="mt-1 text-[11px] font-bold text-[#6d6273]">noteapp requestId: {item.noteappRequestId}</p>
                ) : null}
                {item.tryOnSessionId ? (
                  <p className="text-[11px] font-bold text-[#6d6273]">сессия примерки: {item.tryOnSessionId}</p>
                ) : null}
                {item.body ? (
                  <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-[#faf7f9] p-3 text-xs font-mono leading-relaxed text-[#302637] whitespace-pre-wrap">
                    {item.body}
                  </pre>
                ) : null}
              </div>
            </details>
          </Card>
        ))}
        {!loading && configured && items.length === 0 ? (
          <p className="font-bold text-[#6d6273]">Записей пока нет. Запустите примерку в web-app.</p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
