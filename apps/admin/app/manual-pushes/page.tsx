"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ManualPushAudience, ManualPushCampaign } from "@wibestyle/api-client";
import { Button, Card } from "@wibestyle/ui";
import { AdminField } from "@/components/admin-field";
import { useAdminKey } from "@/components/admin-key-provider";
import { AdminPageShell } from "@/components/admin-page-shell";
import { createAdminApi } from "@/lib/api";

const TITLE_LIMIT = 80;
const BODY_LIMIT = 240;

const audiences: Array<{ value: ManualPushAudience; label: string }> = [
  { value: "all", label: "Все пользователи" },
  { value: "paid", label: "Все платные" },
  { value: "wibe", label: "Только Wibe" },
  { value: "elite", label: "Только Elite" },
  { value: "trial", label: "Бесплатные trial" },
];

function defaultDateTimeLocal() {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  date.setSeconds(0, 0);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU");
}

function statusLabel(status: ManualPushCampaign["status"]) {
  switch (status) {
    case "scheduled":
      return "Запланирована";
    case "sending":
      return "В очереди / отправляется";
    case "sent":
      return "Принята провайдером";
    case "cancelled":
      return "Отменена";
    default:
      return status;
  }
}

function audienceLabel(value: ManualPushAudience) {
  return audiences.find((item) => item.value === value)?.label ?? value;
}

export default function AdminManualPushesPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [items, setItems] = useState<ManualPushCampaign[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<ManualPushAudience>("all");
  const [scheduledAt, setScheduledAt] = useState(defaultDateTimeLocal);
  const [actionUrl, setActionUrl] = useState("/profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!title.trim()) return "Укажите заголовок";
    if (title.trim().length > TITLE_LIMIT) return `Заголовок длиннее ${TITLE_LIMIT} символов`;
    if (!body.trim()) return "Укажите текст сообщения";
    if (body.trim().length > BODY_LIMIT) return `Текст длиннее ${BODY_LIMIT} символов`;
    if (!scheduledAt) return "Укажите дату и время";
    const scheduledMs = new Date(scheduledAt).getTime();
    if (Number.isNaN(scheduledMs)) return "Дата и время указаны неверно";
    if (scheduledMs < Date.now()) return "Нельзя запланировать рассылку в прошлом";
    return null;
  }, [title, body, scheduledAt]);

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    setLoading(true);
    try {
      setItems(await api.listAdminManualPushes(adminKey));
      setError(null);
    } catch {
      setError("Не удалось загрузить историю push-рассылок");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api, configured]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      const created = await api.createAdminManualPush(adminKey, {
        title: title.trim(),
        body: body.trim(),
        audience,
        scheduledAt: new Date(scheduledAt).toISOString(),
        actionUrl: actionUrl.trim() || undefined,
      });
      setItems((current) => [created, ...current]);
      setTitle("");
      setBody("");
      setScheduledAt(defaultDateTimeLocal());
      setMessage(`Рассылка запланирована. Получателей: ${created.targetedUsers}`);
    } catch {
      setError("Не удалось создать рассылку. Проверьте дату, длину текста и X-Admin-Key.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      pill="Admin · Push"
      title="Push-рассылки"
      description="Ручные уведомления пользователям по сегментам с очередью повторной доставки."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {message ? <p className="font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}

      <Card>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="Сегмент">
              <select
                className="rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-bold"
                value={audience}
                onChange={(event) => setAudience(event.target.value as ManualPushAudience)}
              >
                {audiences.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Дата и время отправки" hint="Прошедшее время не принимается">
              <input
                type="datetime-local"
                className="rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-bold"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </AdminField>
          </div>

          <AdminField label="Заголовок" hint={`${title.trim().length}/${TITLE_LIMIT}`}>
            <input
              className="rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-bold"
              value={title}
              maxLength={TITLE_LIMIT}
              placeholder="Например: Новая примерка уже доступна"
              onChange={(event) => setTitle(event.target.value)}
            />
          </AdminField>

          <AdminField label="Текст push" hint={`${body.trim().length}/${BODY_LIMIT}`}>
            <textarea
              className="min-h-[120px] rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-bold"
              value={body}
              maxLength={BODY_LIMIT}
              placeholder="Коротко напишите, что пользователь увидит в уведомлении."
              onChange={(event) => setBody(event.target.value)}
            />
          </AdminField>

          <AdminField label="Ссылка при открытии" hint="Можно оставить пустой. Например: /profile, /try-on">
            <input
              className="rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-bold"
              value={actionUrl}
              maxLength={512}
              onChange={(event) => setActionUrl(event.target.value)}
            />
          </AdminField>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!configured || saving || Boolean(validationError)} type="submit">
              {saving ? "Планирую…" : "Запланировать рассылку"}
            </Button>
            {validationError ? <span className="text-sm font-bold text-[#ff1fa2]">{validationError}</span> : null}
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-[#302637]">История</h2>
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => void load()}>
          Обновить
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#782cff]">
                  {audienceLabel(item.audience)} · {statusLabel(item.status)}
                </p>
                <h3 className="mt-1 text-xl font-black text-[#302637]">{item.title}</h3>
                <p className="mt-2 font-bold text-[#6d6273]">{item.body}</p>
                <p className="mt-2 text-sm font-bold text-[#9a8fa3]">
                  Запланирована: {formatDate(item.scheduledAt)} · Создана: {formatDate(item.createdAt)}
                </p>
                {item.actionUrl ? <p className="mt-1 text-sm font-bold text-[#9a8fa3]">Переход: {item.actionUrl}</p> : null}
                {item.lastError ? <p className="mt-1 text-sm font-bold text-[#ff1fa2]">Последняя ошибка: {item.lastError}</p> : null}
              </div>
              <div className="grid min-w-[280px] grid-cols-2 gap-2 text-sm font-bold text-[#302637]">
                <Metric label="Получателей" value={item.targetedUsers} />
                <Metric label="Принято" value={item.acceptedUsers} />
                <Metric label="В очереди" value={item.queuedUsers} />
                <Metric label="Нет токена" value={item.noDeviceUsers} />
                <Metric label="Ошибки" value={item.errorUsers} />
                <Metric label="Завершена" value={item.finishedAt ? formatDate(item.finishedAt) : "—"} wide />
              </div>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 ? (
          <p className="font-bold text-[#6d6273]">Рассылок пока нет.</p>
        ) : null}
        {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}
      </div>
    </AdminPageShell>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: number | string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[#ffd1ed] bg-white px-3 py-2 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9a8fa3]">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
