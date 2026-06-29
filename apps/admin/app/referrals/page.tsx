"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminReferralReport, AdminReferralRecord } from "@wibestyle/shared-types";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type Filter = "all" | "purchased" | "rewarded" | "not_rewarded";

export default function AdminReferralsPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [report, setReport] = useState<AdminReferralReport | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await api.listAdminReferrals(adminKey));
    } catch {
      setError("Не удалось загрузить реферальный отчёт.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api]);

  useEffect(() => {
    if (configured) void load();
  }, [configured, load]);

  const items = useMemo(() => (report?.items ?? []).filter((item) => {
    if (filter === "purchased") return item.purchased;
    if (filter === "rewarded") return item.rewarded;
    if (filter === "not_rewarded") return item.purchased && !item.rewarded;
    return true;
  }), [filter, report]);

  return (
    <AdminPageShell
      pill="Рефералы"
      title="Реферальные приглашения"
      description="Кто поделился ссылкой, кто зарегистрировался, оплатил подписку и получил ли отправитель бонус."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {report ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Приглашений" value={report.summary.invites} />
          <Summary label="Купили подписку" value={report.summary.purchases} />
          <Summary label="Начислен бонус" value={report.summary.rewarded} />
          <Summary label="Выдано примерок" value={report.summary.generationsAwarded} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "Все"],
          ["purchased", "Купили подписку"],
          ["rewarded", "Бонус начислен"],
          ["not_rewarded", "Без начисления"],
        ] as const).map(([value, label]) => (
          <Button key={value} size="sm" variant={filter === value ? "primary" : "secondary"} onClick={() => setFilter(value)}>
            {label}
          </Button>
        ))}
        <Button size="sm" variant="secondary" disabled={!configured || loading} onClick={() => void load()}>
          Обновить
        </Button>
      </div>

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}

      <div className="grid gap-4">
        {items.map((item) => <ReferralCard key={item.referredUserId} item={item} />)}
        {!loading && report && items.length === 0 ? <p className="font-bold text-[#6d6273]">Записей пока нет.</p> : null}
      </div>
    </AdminPageShell>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm font-bold text-[#6d6273]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#302637]">{value}</p>
    </Card>
  );
}

function ReferralCard({ item }: { item: AdminReferralRecord }) {
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#782cff]">Отправитель</p>
          <p className="mt-1 text-lg font-black">{item.sender}</p>
          <p className="text-xs font-bold text-[#6d6273]">ID: {item.senderUserId}</p>
          <p className="mt-2 text-sm font-bold text-[#ff1fa2]">Код: {item.referralCode}</p>
        </div>
        <div className="text-2xl text-[#ff1fa2]" aria-hidden>→</div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#782cff]">Приглашённый</p>
          <p className="mt-1 text-lg font-black">{item.referred}</p>
          <p className="text-xs font-bold text-[#6d6273]">Регистрация: {formatLocalDateTime(item.referredAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-[#fff8fd] p-4 md:grid-cols-2">
        <Status
          ok={item.purchased}
          title={item.purchased ? "Подписка куплена" : "Подписка не куплена"}
          detail={item.purchased
            ? `${item.purchasePlan?.toUpperCase()} · ${item.purchasePeriod === "annual" ? "год" : "месяц"} · ${item.purchaseAmountRub} ₽ · ${formatLocalDateTime(item.purchasedAt!)}`
            : "Успешной оплаты пока нет"}
        />
        <Status
          ok={item.rewarded}
          title={item.rewarded ? "Доп. примерки начислены" : "Доп. примерки не начислены"}
          detail={item.rewarded
            ? `+${item.rewardGenerations} · ${formatLocalDateTime(item.rewardedAt!)}`
            : item.purchased
              ? "У отправителя не было активной подписки на момент оплаты"
              : "Ожидаем оплату приглашённого"}
        />
      </div>
    </Card>
  );
}

function Status({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div>
      <p className={`font-black ${ok ? "text-[#24875d]" : "text-[#8a6f58]"}`}>{ok ? "✓" : "○"} {title}</p>
      <p className="mt-1 text-sm font-bold text-[#6d6273]">{detail}</p>
    </div>
  );
}
