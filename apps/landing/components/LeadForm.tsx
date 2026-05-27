"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@wibestyle/api-client";
import { createLandingApi, readLandingAttribution } from "@/lib/api";
import { formatRub } from "@/lib/utils";

export type LeadInterest = "clothing" | "makeup" | "hairstyle" | "full-look";

type LeadFormProps = {
  interest?: LeadInterest;
  variant?: "compact" | "full";
  className?: string;
};

export default function LeadForm({ interest = "clothing", variant = "full", className }: LeadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void createLandingApi()
      .getLeadStats()
      .then((data) => setRemaining(data.remainingSpots))
      .catch(() => setRemaining(null));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phoneOrEmail = String(formData.get("phoneOrEmail") ?? "").trim();
    const consent = formData.get("consent");

    if (!phoneOrEmail) {
      setError("Укажите телефон или email.");
      setSubmitting(false);
      return;
    }
    if (!consent) {
      setError("Подтвердите согласие на обработку данных.");
      setSubmitting(false);
      return;
    }

    try {
      const attribution = readLandingAttribution();
      const result = await createLandingApi().createLead({
        name: String(formData.get("name") ?? "").trim() || undefined,
        phoneOrEmail,
        gender: String(formData.get("gender") ?? "") || undefined,
        favoriteMarketplace: String(formData.get("favoriteMarketplace") ?? "") || undefined,
        interest,
        consent: true,
        ...attribution,
      });

      setRemaining(result.remainingSpots);

      if (result.hasDiscount) {
        setStatus(
          `Вы №${result.spotNumber} в раннем доступе! Скидка 50% на год: ${formatRub(result.priceWithDiscount)} вместо ${formatRub(result.priceAnnual)}.`,
        );
      } else {
        setStatus(`Заявка принята (№${result.spotNumber}). Годовая подписка — ${formatRub(result.priceAnnual)}.`);
      }

      form.reset();
      if (typeof window !== "undefined" && window.ym && process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID) {
        window.ym(Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID), "reachGoal", `lead_submit_${interest}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка отправки.");
    } finally {
      setSubmitting(false);
    }
  }

  const formClass = variant === "compact" ? "lead-form" : "lead-form-full";

  return (
    <form className={`${formClass} ${className ?? ""}`.trim()} onSubmit={onSubmit} aria-label="Регистрация раннего доступа">
      {remaining !== null && remaining > 0 ? (
        <p className="spots" style={{ margin: 0, fontWeight: 800 }}>
          Осталось мест со скидкой 50%: {remaining} из 100
        </p>
      ) : null}

      {variant === "full" ? (
        <>
          <input name="name" type="text" placeholder="Имя (необязательно)" />
          <div className="form-row">
            <select name="gender" defaultValue="">
              <option value="">Пол</option>
              <option value="female">Я девушка</option>
              <option value="male">Я мужчина</option>
              <option value="other">Не указывать</option>
            </select>
            <select name="favoriteMarketplace" defaultValue="" aria-label="Любимый маркетплейс, необязательно">
              <option value="">Любимый маркетплейс (необязательно)</option>
              <option value="wildberries">Wildberries</option>
              <option value="ozon">Ozon</option>
              <option value="yandex-market">Яндекс Маркет</option>
              <option value="aliexpress">AliExpress</option>
              <option value="other">Другой</option>
            </select>
          </div>
        </>
      ) : null}

      <input name="phoneOrEmail" type="text" required placeholder="Телефон или email *" />
      {variant === "full" ? (
        <label className="consent">
          <input name="consent" type="checkbox" required />
          <span>Согласен(а) на обработку персональных данных</span>
        </label>
      ) : null}

      {error ? <span className="form-status" style={{ color: "#ffb4b4" }}>{error}</span> : null}
      {status ? <span className="form-status">{status}</span> : null}

      <button type="submit" disabled={submitting} data-analytics={`lead_submit_${interest}`}>
        {submitting ? "Отправляем…" : "Получить ранний доступ ✨"}
      </button>
    </form>
  );
}

declare global {
  interface Window {
    ym?: (id: number, method: string, goal: string) => void;
  }
}
