"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AdminStatisticsDashboard } from "@wibestyle/api-client";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type TableColumn<T> = {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
};

export default function AdminStatisticsPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [data, setData] = useState<AdminStatisticsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenFilter, setScreenFilter] = useState<"all" | "visited" | "empty">("all");

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.getAdminStatistics(adminKey));
    } catch {
      setError("Не удалось загрузить статистику.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api]);

  useEffect(() => {
    if (configured) void load();
  }, [configured, load]);

  const screens = useMemo(() => {
    const items = data?.screens ?? [];
    if (screenFilter === "visited") return items.filter((item) => item.visited);
    if (screenFilter === "empty") return items.filter((item) => !item.visited);
    return items;
  }, [data?.screens, screenFilter]);

  return (
    <AdminPageShell
      pill="Статистика"
      title="Статистика приложения"
      description="Сводка по регистрациям, оплатам, активности, экранам, Telegram и реферальной программе."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#6d6273]">
          Активность считается по событиям app_opened и screen_view. Статистика экранов и Telegram начнет полноценно наполняться после релиза этой версии.
        </p>
        <Button type="button" disabled={!configured || loading} onClick={() => void load()}>
          {loading ? "Загрузка..." : "Обновить"}
        </Button>
      </div>
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}

      {data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric title="Всего регистраций" value={data.summary.totalRegistrations} detail={`+${data.summary.registrationsToday} за 24ч`} />
            <Metric title="Регистрации 7 / 30 дней" value={`${data.summary.registrations7d} / ${data.summary.registrations30d}`} />
            <Metric title="Активны 24ч / 7д" value={`${data.summary.activeUsers24h} / ${data.summary.activeUsers7d}`} />
            <Metric title="Trial закончился" value={data.summary.trialExhaustedNoPurchase} detail="без покупки" warning />
            <Metric title="Выручка" value={`${data.summary.revenueRub.toLocaleString("ru-RU")} ₽`} detail={`${data.summary.completedPayments} оплат`} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.65fr)]">
            <Card>
              <SectionTitle title="Подписки" detail="Какие тарифы и периоды реально купили" />
              <DataTable
                minWidth={720}
                items={data.subscriptions}
                empty="Оплат пока нет."
                columns={[
                  { key: "plan", title: "Тариф", render: (item) => item.plan },
                  { key: "period", title: "Период", render: (item) => periodLabel(item.period) },
                  { key: "type", title: "Тип", render: (item) => checkoutTypeLabel(item.checkoutType) },
                  { key: "purchases", title: "Покупки", render: (item) => item.purchases },
                  { key: "buyers", title: "Покупатели", render: (item) => item.buyers },
                  { key: "revenue", title: "Выручка", render: (item) => `${item.revenueRub.toLocaleString("ru-RU")} ₽` },
                ]}
              />
            </Card>

            <Card>
              <SectionTitle title="Рефералки" detail="Кто приводит пользователей и покупки" />
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric label="Инвайты" value={data.referrals.summary.invites} />
                <MiniMetric label="Покупки" value={data.referrals.summary.purchases} />
                <MiniMetric label="Бонусы" value={data.referrals.summary.rewarded} />
                <MiniMetric label="Примерки" value={data.referrals.summary.generationsAwarded} />
              </div>
            </Card>
          </section>

          <Card>
            <SectionTitle title="Trial закончился, подписки нет" detail="Пользователи, которых стоит догонять оффером или пушем" />
            <DataTable
              minWidth={920}
              items={data.trialExhaustedUsers}
              empty="Нет пользователей с исчерпанным trial без покупки."
              columns={[
                { key: "user", title: "Пользователь", render: (item) => <UserCell item={item} /> },
                { key: "created", title: "Создан", render: (item) => formatLocalDateTime(item.createdAt) },
                { key: "last", title: "Последняя активность", render: (item) => formatLocalDateTime(item.lastActivityAt) },
                { key: "trial", title: "Trial", render: (item) => item.trialGenerationsLeft },
                { key: "bonus", title: "Бонус", render: (item) => item.bonusGenerationsLeft },
              ]}
            />
          </Card>

          <Card>
            <SectionTitle title="Активные за сутки" detail="Заходили или переходили по экранам за последние 24 часа" />
            <DataTable
              minWidth={920}
              items={data.activeUsers}
              empty="За последние сутки активных авторизованных пользователей нет."
              columns={[
                { key: "user", title: "Пользователь", render: (item) => <UserCell item={item} /> },
                { key: "plan", title: "Тариф", render: (item) => item.plan || "—" },
                { key: "trial", title: "Trial", render: (item) => item.trialGenerationsLeft },
                { key: "events", title: "События", render: (item) => item.events24h },
                { key: "last", title: "Последняя активность", render: (item) => formatLocalDateTime(item.lastActivityAt) },
              ]}
            />
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle title="Экраны и страницы" detail="Частые, редкие и пустые точки приложения" />
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "Все"],
                  ["visited", "С посещениями"],
                  ["empty", "Без посещений"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-sm font-black ${screenFilter === value ? "bg-[#ff1fa2] text-white" : "bg-[#fff0f9] text-[#302637]"}`}
                    onClick={() => setScreenFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <DataTable
              minWidth={720}
              items={screens}
              empty="Нет экранов в выбранном фильтре."
              columns={[
                { key: "screen", title: "Экран", render: (item) => <><strong>{item.label}</strong><br /><span className="font-mono text-xs text-[#6d6273]">{item.key}</span></> },
                { key: "views", title: "Просмотры", render: (item) => item.views },
                { key: "users", title: "Пользователи", render: (item) => item.users },
                { key: "status", title: "Статус", render: (item) => item.visited ? "есть трафик" : "пусто" },
              ]}
            />
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle title="Лидеры рефералок" detail="Кто поделился, кто привел регистрации и покупки" />
              <DataTable
                minWidth={760}
                items={data.referrals.leaders}
                empty="Реферальных регистраций пока нет."
                columns={[
                  { key: "user", title: "Пользователь", render: (item) => <UserCell item={item} /> },
                  { key: "code", title: "Код", render: (item) => item.referralCode },
                  { key: "invites", title: "Рег.", render: (item) => item.invites },
                  { key: "purchases", title: "Купили", render: (item) => item.purchases },
                  { key: "reward", title: "Бонус", render: (item) => `+${item.rewardGenerations}` },
                ]}
              />
            </Card>

            <Card>
              <SectionTitle title="Telegram" detail="Кто перешел в канал из приложения" />
              <DataTable
                minWidth={680}
                items={data.telegramClicks}
                empty="Кликов по Telegram пока нет."
                columns={[
                  { key: "user", title: "Пользователь", render: (item) => <UserCell item={item} /> },
                  { key: "clicks", title: "Клики", render: (item) => item.clicks },
                  { key: "last", title: "Последний клик", render: (item) => formatLocalDateTime(item.lastClickedAt) },
                ]}
              />
            </Card>
          </section>
        </>
      ) : !loading ? (
        <p className="font-bold text-[#6d6273]">Данных пока нет.</p>
      ) : null}
    </AdminPageShell>
  );
}

function Metric({ title, value, detail, warning = false }: { title: string; value: ReactNode; detail?: string; warning?: boolean }) {
  return (
    <Card>
      <p className="text-sm font-bold text-[#6d6273]">{title}</p>
      <p className={`mt-2 text-3xl font-black ${warning ? "text-[#c0446b]" : "text-[#302637]"}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs font-bold text-[#6d6273]">{detail}</p> : null}
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#fff0f9] p-3">
      <p className="text-xs font-bold text-[#6d6273]">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-[#302637]">{title}</h2>
      <p className="mt-1 text-sm font-bold text-[#6d6273]">{detail}</p>
    </div>
  );
}

function DataTable<T>({ items, columns, empty, minWidth }: { items: T[]; columns: Array<TableColumn<T>>; empty: string; minWidth: number }) {
  if (items.length === 0) {
    return <p className="font-bold text-[#6d6273]">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ffd1ed] bg-white">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <thead className="bg-[#fff0f9]">
          <tr>
            {columns.map((column) => <th key={column.key} className="px-3 py-3 font-black">{column.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t border-[#ffe5f4] align-top">
              {columns.map((column) => <td key={column.key} className="px-3 py-3">{column.render(item)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserCell({ item }: { item: { userId: string; label: string; phone?: string; email?: string } }) {
  return (
    <div>
      <p className="font-black">{item.label || "—"}</p>
      <p className="font-mono text-xs text-[#6d6273]">{item.userId}</p>
      {item.phone || item.email ? <p className="text-xs font-bold text-[#6d6273]">{item.phone || item.email}</p> : null}
    </div>
  );
}

function periodLabel(period: string) {
  if (period === "annual") return "год";
  if (period === "monthly") return "месяц";
  return period || "—";
}

function checkoutTypeLabel(type: string) {
  if (type === "renewal") return "продление";
  if (type === "initial") return "первая";
  return type || "—";
}
