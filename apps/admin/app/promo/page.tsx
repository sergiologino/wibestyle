"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card, Pill } from "@wibestyle/ui";
import type { PromoCodeRecord } from "@wibestyle/shared-types";
import { buildPromoDeepLink } from "@wibestyle/shared-types";
import { APP_BASE_URL, createAdminApi } from "@/lib/api";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminField } from "@/components/admin-field";
import { useAdminKey } from "@/components/admin-key-provider";
import { promoLinkInstructions } from "@/lib/promo-link-instructions";

export default function AdminPromoPage() {
  const { adminKey, configured } = useAdminKey();
  const [items, setItems] = useState<PromoCodeRecord[]>([]);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState("");
  const [label, setLabel] = useState("VK early users");
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const api = createAdminApi();

  const load = useCallback(async (key: string) => {
    const data = await api.listAdminPromoCodes(key);
    setItems(data.items);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey).catch(() => setError("Не удалось загрузить промокоды"));
    }
  }, [load, configured, adminKey]);

  async function onGenerateCode() {
    try {
      const result = await api.generateAdminPromoCode(adminKey);
      setCode(result.code);
    } catch {
      setError("Не удалось сгенерировать код");
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.createAdminPromoCode(adminKey, {
        code: code || undefined,
        discountPercent,
        maxUses,
        expiresAt: new Date(expiresAt).toISOString(),
        label,
      });
      setCode("");
      await load(adminKey);
    } catch {
      setError("Не удалось создать промокод");
    }
  }

  async function onRevoke(promoId: string) {
    try {
      await api.revokeAdminPromoCode(adminKey, promoId);
      await load(adminKey);
    } catch {
      setError("Не удалось отменить промокод");
    }
  }

  const instructions = selectedCode ? promoLinkInstructions(selectedCode) : null;

  return (
    <AdminPageShell pill="Promo" title="Промокоды" description="Создание кодов, лимиты и ссылки для VK.">
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}

      <Card>
        <h2 className="text-xl font-black">Создать промокод</h2>
        <p className="mt-2 font-bold text-[#6d6273]">Формат: латиница A–Z и цифры (CAPS). Можно сгенерировать или ввести вручную.</p>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <AdminField label="Код промо" hint="Пусто — автогенерация" className="md:col-span-2">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold uppercase"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button type="button" variant="secondary" onClick={() => void onGenerateCode()}>Сгенерировать</Button>
            </div>
          </AdminField>
          <AdminField label="Скидка, %">
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            type="number"
            min={1}
            max={90}
            value={discountPercent}
            onChange={(event) => setDiscountPercent(Number(event.target.value))}
          />
          </AdminField>
          <AdminField label="Лимит регистраций">
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            type="number"
            min={1}
            value={maxUses}
            onChange={(event) => setMaxUses(Number(event.target.value))}
          />
          </AdminField>
          <AdminField label="Действует до">
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            required
          />
          </AdminField>
          <AdminField label="Метка кампании">
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          </AdminField>
          <div className="md:col-span-2">
            <Button type="submit">Создать промокод</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-black">Активные и архивные коды</h2>
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-[#ffd1ed] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-black tracking-wide">{item.code}</p>
                  <p className="font-bold text-[#6d6273]">
                    −{item.discountPercent}% · {item.usesCount}/{item.maxUses} · до {new Date(item.expiresAt).toLocaleDateString("ru-RU")}
                    {item.label ? ` · ${item.label}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="md" variant="secondary" onClick={() => setSelectedCode(item.code)}>
                    Ссылки
                  </Button>
                  {item.active ? (
                    <Button size="md" variant="secondary" onClick={() => void onRevoke(item.id)}>
                      Аннулировать
                    </Button>
                  ) : (
                    <Pill tone="soft">Отменён</Pill>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!items.length ? <p className="font-bold text-[#6d6273]">Промокодов пока нет.</p> : null}
        </div>
      </Card>

      {instructions ? (
        <Card>
          <h2 className="text-xl font-black">Ссылки для {selectedCode}</h2>
          <p className="mt-3 font-bold">Welcome: <code className="break-all">{instructions.welcomeLink}</code></p>
          <p className="mt-2 font-bold">Auth: <code className="break-all">{instructions.authLink}</code></p>
          <p className="mt-2 font-bold">VK пост: {instructions.vkExample}</p>
          <p className="mt-2 font-bold">Base app URL: {APP_BASE_URL}</p>
          <p className="mt-2 font-bold">Шаблон: {buildPromoDeepLink(APP_BASE_URL, selectedCode!, "/welcome")}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 font-bold text-[#6d6273]">
            {instructions.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
    </AdminPageShell>
  );
}
