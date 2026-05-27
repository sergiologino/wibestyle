"use client";

import { FormEvent, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";

type TryOnReviewFormProps = {
  sessionId: string;
  api: WibeStyleApiClient;
};

export default function TryOnReviewForm({ sessionId, api }: TryOnReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [allowPublish, setAllowPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 10) {
      setError("Напиши хотя бы пару предложений (от 10 символов)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createReview({
        tryOnSessionId: sessionId,
        rating,
        body: body.trim(),
        displayName: displayName.trim() || undefined,
        allowPublish,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить отзыв");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <p className="font-bold text-[#782cff]">
          Спасибо! Отзыв отправлен на модерацию
          {allowPublish ? " — после одобления может появиться на лендинге." : "."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-black">Как тебе результат?</h2>
      <p className="mt-2 font-bold text-[#6d6273]">Помоги нам стать лучше — отзыв увидит команда и модератор.</p>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <label className="font-bold text-[#302637]">
          Оценка
          <select
            className="mt-1 w-full rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}{"☆".repeat(5 - value)} ({value})
              </option>
            ))}
          </select>
        </label>
        <label className="font-bold text-[#302637]">
          Отзыв
          <textarea
            className="mt-1 w-full rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            rows={4}
            maxLength={2000}
            placeholder="Что понравилось? Насколько реалистично село?"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
          />
        </label>
        <label className="font-bold text-[#302637]">
          Имя для публикации (необязательно)
          <input
            className="mt-1 w-full rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold"
            placeholder="Аня"
            maxLength={40}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label className="flex items-start gap-3 font-bold text-[#302637]">
          <input
            checked={allowPublish}
            type="checkbox"
            className="mt-1"
            onChange={(event) => setAllowPublish(event.target.checked)}
          />
          <span>
            Разрешаю опубликовать отзыв на сайте после модерации (без фото и личных данных)
          </span>
        </label>
        {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
        <Button disabled={submitting} size="lg" type="submit">
          {submitting ? "Отправляем…" : "Отправить отзыв"}
        </Button>
      </form>
    </Card>
  );
}
