"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import type { MarketingChannel, MarketingChannelPayload, MarketingRegistration, MarketingStatsRow } from "@wibestyle/shared-types";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";

const emptyChannel: MarketingChannelPayload = {
  code: "",
  displayName: "",
  utmSource: "",
  utmMedium: "",
  description: "",
  enabled: true,
};

function dateBoundary(value: string, addDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (addDay) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export default function AdminMarketingPage() {
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();
  const [stats, setStats] = useState<MarketingStatsRow[]>([]);
  const [channels, setChannels] = useState<MarketingChannel[]>([]);
  const [registrations, setRegistrations] = useState<MarketingRegistration[]>([]);
  const [filters, setFilters] = useState({ from: "", to: "", source: "", medium: "", campaign: "", detailed: false });
  const [draft, setDraft] = useState<MarketingChannelPayload>(emptyChannel);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const [statsResult, channelsResult, registrationsResult] = await Promise.all([
        api.getAdminMarketingStats(adminKey, {
          from: dateBoundary(filters.from),
          to: dateBoundary(filters.to, true),
          source: filters.source || undefined,
          medium: filters.medium || undefined,
          campaign: filters.campaign || undefined,
          detailed: filters.detailed,
        }),
        api.listAdminMarketingChannels(adminKey),
        api.listAdminMarketingRegistrations(adminKey),
      ]);
      setStats(statsResult.items);
      setChannels(channelsResult.items);
      setRegistrations(registrationsResult.items);
    } catch {
      setError("Не удалось загрузить маркетинговую статистику");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api, filters]);

  useEffect(() => {
    if (configured) void load();
  }, [configured, load]);

  async function saveChannel(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) await api.updateAdminMarketingChannel(adminKey, editingId, draft);
      else await api.createAdminMarketingChannel(adminKey, draft);
      setDraft(emptyChannel);
      setEditingId(null);
      await load();
    } catch {
      setError("Не удалось сохранить канал. Проверьте уникальность кода и пары source/medium.");
    }
  }

  function editChannel(channel: MarketingChannel) {
    setEditingId(channel.id);
    setDraft({
      code: channel.code,
      displayName: channel.displayName,
      utmSource: channel.utmSource,
      utmMedium: channel.utmMedium,
      description: channel.description,
      enabled: channel.enabled,
    });
  }

  return (
    <AdminPageShell
      pill="Маркетинг"
      title="Источники и UTM-атрибуция"
      description="First-touch статистика по визитам, регистрациям и подтвержденным оплатам."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <input type="date" className="rounded-xl border border-[#ffd1ed] px-3 py-2" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} aria-label="Дата с" />
          <input type="date" className="rounded-xl border border-[#ffd1ed] px-3 py-2" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} aria-label="Дата по" />
          {(["source", "medium", "campaign"] as const).map((field) => (
            <input key={field} className="rounded-xl border border-[#ffd1ed] px-3 py-2"
              placeholder={`utm_${field}`} value={filters[field]}
              onChange={(e) => setFilters({ ...filters, [field]: e.target.value.toLowerCase() })} />
          ))}
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={filters.detailed}
              onChange={(e) => setFilters({ ...filters, detailed: e.target.checked })} />
            Детализация content / term
          </label>
          <Button type="button" disabled={!configured || loading} onClick={() => void load()}>
            Применить
          </Button>
        </div>
      </Card>

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[#ffd1ed] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#fff0f9]">
            <tr>{["Источник", "Medium", "Campaign", ...(filters.detailed ? ["Content", "Term"] : []),
              "Визиты", "Регистрации", "CR рег.", "Оплаты", "CR оплат"].map((label) => (
              <th key={label} className="px-3 py-3 font-black">{label}</th>
            ))}</tr>
          </thead>
          <tbody>
            {stats.map((row, index) => (
              <tr key={`${row.source}-${row.medium}-${row.campaign}-${row.content}-${index}`} className="border-t border-[#ffe5f4]">
                <td className="px-3 py-3">{row.channelName ? <><strong>{row.channelName}</strong><br /><span className="text-xs text-[#6d6273]">{row.source}</span></> : row.source}</td>
                <td className="px-3 py-3">{row.medium}</td>
                <td className="px-3 py-3">{row.campaign || "—"}</td>
                {filters.detailed ? <><td className="px-3 py-3">{row.content || "—"}</td><td className="px-3 py-3">{row.term || "—"}</td></> : null}
                <td className="px-3 py-3">{row.visits}</td><td className="px-3 py-3">{row.registrations}</td>
                <td className="px-3 py-3">{row.registrationConversion}%</td><td className="px-3 py-3">{row.payments}</td>
                <td className="px-3 py-3">{row.paymentConversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-black">Последние регистрации: first / last touch</h2>
      <div className="overflow-x-auto rounded-2xl border border-[#ffd1ed] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#fff0f9]"><tr>
            {["Дата", "User ID", "First source", "First medium", "First campaign", "Last source", "Last medium", "Last campaign"].map((label) => (
              <th key={label} className="px-3 py-3 font-black">{label}</th>
            ))}
          </tr></thead>
          <tbody>{registrations.map((item) => (
            <tr key={item.userId} className="border-t border-[#ffe5f4]">
              <td className="px-3 py-3">{new Date(item.registeredAt).toLocaleString("ru-RU")}</td>
              <td className="px-3 py-3 font-mono text-xs">{item.userId}</td>
              <td className="px-3 py-3">{item.firstSource}</td><td className="px-3 py-3">{item.firstMedium}</td>
              <td className="px-3 py-3">{item.firstCampaign || "—"}</td><td className="px-3 py-3">{item.lastSource}</td>
              <td className="px-3 py-3">{item.lastMedium}</td><td className="px-3 py-3">{item.lastCampaign || "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <h2 className="text-2xl font-black">Справочник каналов</h2>
      <form onSubmit={saveChannel}>
        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            <input required pattern="[a-z0-9_]+" className="rounded-xl border border-[#ffd1ed] px-3 py-2"
              placeholder="Код: telegram_ads" value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toLowerCase() })} />
            <input required className="rounded-xl border border-[#ffd1ed] px-3 py-2"
              placeholder="Название канала" value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
            <input pattern="[a-z0-9_]*" className="rounded-xl border border-[#ffd1ed] px-3 py-2"
              placeholder="utm_source" value={draft.utmSource}
              onChange={(e) => setDraft({ ...draft, utmSource: e.target.value.toLowerCase() })} />
            <input pattern="[a-z0-9_]*" className="rounded-xl border border-[#ffd1ed] px-3 py-2"
              placeholder="utm_medium" value={draft.utmMedium}
              onChange={(e) => setDraft({ ...draft, utmMedium: e.target.value.toLowerCase() })} />
            <input className="rounded-xl border border-[#ffd1ed] px-3 py-2 md:col-span-2"
              placeholder="Описание" value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Активен
            </label>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Сохранить" : "Добавить канал"}</Button>
              {editingId ? <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setDraft(emptyChannel); }}>Отмена</Button> : null}
            </div>
          </div>
        </Card>
      </form>
      <div className="grid gap-3">
        {channels.map((channel) => (
          <Card key={channel.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-black">{channel.displayName} {!channel.enabled ? "(выключен)" : ""}</p>
                <p className="text-sm text-[#6d6273]">{channel.code} · {channel.utmSource || "—"} / {channel.utmMedium || "—"}</p>
                {channel.description ? <p className="mt-1 text-sm">{channel.description}</p> : null}
              </div>
              <Button type="button" variant="secondary" onClick={() => editChannel(channel)}>Редактировать</Button>
            </div>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
