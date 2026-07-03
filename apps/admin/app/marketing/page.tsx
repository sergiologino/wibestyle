"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

const channelPresets: Array<{ label: string; value: MarketingChannelPayload }> = [
  {
    label: "X",
    value: {
      code: "x_social",
      displayName: "X / обычные публикации",
      utmSource: "x",
      utmMedium: "social",
      description: "Бесплатные публикации и ссылки в профиле X",
      enabled: true,
    },
  },
  {
    label: "Pinterest",
    value: {
      code: "pinterest_social",
      displayName: "Pinterest / обычные пины",
      utmSource: "pinterest",
      utmMedium: "social",
      description: "Бесплатные пины и ссылки из профиля Pinterest",
      enabled: true,
    },
  },
  {
    label: "Одноклассники",
    value: {
      code: "ok_social",
      displayName: "Одноклассники / обычные публикации",
      utmSource: "ok",
      utmMedium: "social",
      description: "Бесплатные публикации и ссылки в Одноклассниках",
      enabled: true,
    },
  },
];

const inputClassName = "rounded-xl border border-[#ffd1ed] px-3 py-2 outline-none focus:border-[#ff1fa2]";

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
  const [targetUrl, setTargetUrl] = useState("https://app.vibestyle.art/welcome");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [channelSaved, setChannelSaved] = useState(false);
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

  const trackingUrl = useMemo(() => {
    try {
      const url = new URL(targetUrl);
      if (draft.utmSource) url.searchParams.set("utm_source", draft.utmSource);
      if (draft.utmMedium) url.searchParams.set("utm_medium", draft.utmMedium);
      if (campaign) url.searchParams.set("utm_campaign", campaign);
      if (content) url.searchParams.set("utm_content", content);
      if (term) url.searchParams.set("utm_term", term);
      return url.toString();
    } catch {
      return "";
    }
  }, [campaign, content, draft.utmMedium, draft.utmSource, targetUrl, term]);

  useEffect(() => {
    setCopied(false);
  }, [trackingUrl]);

  async function saveChannel(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setChannelSaved(false);
    try {
      const saved = editingId
        ? await api.updateAdminMarketingChannel(adminKey, editingId, draft)
        : await api.createAdminMarketingChannel(adminKey, draft);
      setEditingId(saved.id);
      setDraft({
        code: saved.code,
        displayName: saved.displayName,
        utmSource: saved.utmSource,
        utmMedium: saved.utmMedium,
        description: saved.description,
        enabled: saved.enabled,
      });
      setChannelSaved(true);
      await load();
    } catch {
      setError("Не удалось сохранить канал. Проверьте уникальность кода и пары source/medium.");
    }
  }

  function editChannel(channel: MarketingChannel) {
    setChannelSaved(false);
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

  function applyPreset(value: MarketingChannelPayload) {
    setEditingId(null);
    setChannelSaved(false);
    setDraft(value);
  }

  function startNewChannel() {
    setEditingId(null);
    setChannelSaved(false);
    setDraft(emptyChannel);
  }

  async function copyTrackingUrl() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
    } catch {
      setError("Не удалось скопировать ссылку. Выделите её и скопируйте вручную.");
    }
  }

  return (
    <AdminPageShell
      pill="Маркетинг"
      title="Источники и UTM-атрибуция"
      description="First-touch статистика по визитам, регистрациям и подтвержденным оплатам."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-4">
        <p className="text-sm font-bold text-[#302637]">
          Можно добавить любую площадку: X, Pinterest, Одноклассники или свой источник.
        </p>
        <a href="#channel-builder" className="rounded-xl bg-[#ff1fa2] px-4 py-2 text-sm font-black text-white">
          Создать канал и ссылку ↓
        </a>
      </div>
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
          <p className="text-xs leading-5 text-[#6d6273] md:col-span-2">
            Включите, чтобы разбить результаты одной кампании по отдельным публикациям, баннерам,
            аудиториям или ключевым словам.
          </p>
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

      <h2 id="channel-builder" className="scroll-mt-24 text-2xl font-black">Создать свой канал и ссылку</h2>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <div className="grid gap-5">
          <form onSubmit={saveChannel}>
            <Card>
              <p className="text-sm font-black text-[#302637]">1. Выберите пример или заполните канал вручную</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {channelPresets.map((preset) => (
                  <Button key={preset.label} type="button" variant="secondary" onClick={() => applyPreset(preset.value)}>
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold">
                  Внутренний код
                  <input required pattern="[a-z0-9_]+" className={inputClassName}
                    placeholder="x_social" value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value.toLowerCase() })} />
                  <span className="text-xs font-normal text-[#6d6273]">Только для админки, в ссылку не попадёт.</span>
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Понятное название
                  <input required className={inputClassName}
                    placeholder="X / обычные публикации" value={draft.displayName}
                    onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
                  <span className="text-xs font-normal text-[#6d6273]">Так канал будет называться в отчёте.</span>
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  utm_source — площадка
                  <input required pattern="[a-z0-9_]+" className={inputClassName}
                    placeholder="x" value={draft.utmSource}
                    onChange={(e) => setDraft({ ...draft, utmSource: e.target.value.toLowerCase() })} />
                  <span className="text-xs font-normal text-[#6d6273]">Например: x, pinterest, ok, telegram.</span>
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  utm_medium — тип размещения
                  <input required pattern="[a-z0-9_]+" className={inputClassName}
                    placeholder="social" value={draft.utmMedium}
                    onChange={(e) => setDraft({ ...draft, utmMedium: e.target.value.toLowerCase() })} />
                  <span className="text-xs font-normal text-[#6d6273]">social — бесплатно, paid_social — реклама.</span>
                </label>
                <label className="grid gap-1 text-sm font-bold md:col-span-2">
                  Описание
                  <input className={inputClassName}
                    placeholder="Где именно будет размещаться ссылка" value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Канал активен
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">{editingId ? "Сохранить изменения" : "Создать канал"}</Button>
                  {editingId ? (
                    <Button type="button" variant="secondary" onClick={startNewChannel}>
                      Новый канал
                    </Button>
                  ) : null}
                </div>
                {channelSaved ? (
                  <p className="text-sm font-bold text-[#2f7d4a] md:col-span-2">
                    Канал сохранён. Теперь соберите и скопируйте ссылку ниже.
                  </p>
                ) : null}
              </div>
            </Card>
          </form>

          <Card>
            <p className="text-sm font-black text-[#302637]">2. Соберите ссылку для конкретной публикации</p>
            <p className="mt-1 text-xs leading-5 text-[#6d6273]">
              Канал сохраняет source и medium. Campaign, content и term задаются отдельно для каждой ссылки.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold md:col-span-2">
                Куда ведёт ссылка
                <input className={inputClassName} value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://app.vibestyle.art/welcome" />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                utm_campaign — название активности
                <input pattern="[a-z0-9_]*" className={inputClassName} value={campaign}
                  onChange={(e) => setCampaign(e.target.value.toLowerCase())} placeholder="summer_launch" />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                utm_content — конкретный материал
                <input pattern="[a-z0-9_]*" className={inputClassName} value={content}
                  onChange={(e) => setContent(e.target.value.toLowerCase())} placeholder="post_01" />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                utm_term — ключ или аудитория
                <input pattern="[a-z0-9_]*" className={inputClassName} value={term}
                  onChange={(e) => setTerm(e.target.value.toLowerCase())} placeholder="women_25_34" />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-3">
              <p className="text-xs font-black uppercase tracking-wide text-[#782cff]">Готовая ссылка</p>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-[#302637]">
                {trackingUrl || "Укажите корректный адрес и заполните source / medium."}
              </p>
              <Button className="mt-3" type="button" disabled={!trackingUrl} onClick={() => void copyTrackingUrl()}>
                {copied ? "Скопировано" : "Скопировать ссылку"}
              </Button>
            </div>
          </Card>
        </div>

        <Card id="utm-cheatsheet" className="xl:sticky xl:top-24">
          <p className="text-eyebrow text-[#782cff]">Шпаргалка для новичка</p>
          <h3 className="mt-2 text-2xl font-black">Как работает UTM</h3>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-[#302637]">
            <li><strong>1. Создайте канал один раз.</strong> Например, X + social.</li>
            <li><strong>2. Соберите ссылку.</strong> Добавьте кампанию и при необходимости номер публикации.</li>
            <li><strong>3. Разместите именно эту ссылку.</strong> Параметры после знака ? сообщат приложению, откуда пришёл человек.</li>
            <li><strong>4. Смотрите отчёт.</strong> Визит свяжется с регистрацией и первой подтверждённой оплатой.</li>
          </ol>

          <div className="mt-5 grid gap-3 text-sm">
            <div><strong>utm_source</strong><p className="text-[#6d6273]">Где размещено: x, pinterest, ok.</p></div>
            <div><strong>utm_medium</strong><p className="text-[#6d6273]">Как размещено: social — бесплатно, paid_social — платная реклама.</p></div>
            <div><strong>utm_campaign</strong><p className="text-[#6d6273]">Какая акция: summer_launch, first100. Одинаковое имя объединяет ссылки в кампанию.</p></div>
            <div><strong>utm_content</strong><p className="text-[#6d6273]">Какой именно пост или баннер: post_01, red_banner. Поле необязательное.</p></div>
            <div><strong>utm_term</strong><p className="text-[#6d6273]">Ключевое слово или аудитория рекламы. Для обычных публикаций оставьте пустым.</p></div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#fff0f9] p-4 text-sm leading-6">
            <p className="font-black">Что делает «Детализация content / term»?</p>
            <p className="mt-1 text-[#6d6273]">
              Без флага все публикации одной кампании собраны в строку. С флагом отчёт покажет отдельно каждый
              content и term — удобно сравнивать посты, баннеры и аудитории.
            </p>
          </div>

          <div className="mt-5 text-sm leading-6">
            <p><strong>First touch</strong> — первый источник, с которого пользователь познакомился с приложением.</p>
            <p className="mt-2"><strong>Last touch</strong> — последний источник перед регистрацией.</p>
          </div>
        </Card>
      </div>

      <h2 className="text-2xl font-black">Сохранённые каналы</h2>
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
