"use client";



import { FormEvent, useState } from "react";

import Link from "next/link";

import { Button } from "@wibestyle/ui";

import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";

import { galleryReportReasons, type GalleryReportReason } from "@/lib/gallery-report";



type ReportPostButtonProps = {

  postId: string;

  accessToken: string | null;

  api: WibeStyleApiClient;

  returnPath?: string;

};



export default function ReportPostButton({ postId, accessToken, api, returnPath }: ReportPostButtonProps) {

  const [open, setOpen] = useState(false);

  const [reason, setReason] = useState<GalleryReportReason>("inappropriate");

  const [details, setDetails] = useState("");

  const [contact, setContact] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [done, setDone] = useState(false);

  const [error, setError] = useState<string | null>(null);



  async function onSubmit(event: FormEvent) {

    event.preventDefault();

    setSubmitting(true);

    setError(null);

    try {

      const reportDetails = [details.trim(), !accessToken && contact.trim() ? `Контакт: ${contact.trim()}` : ""]

        .filter(Boolean)

        .join("\n");

      await api.reportGalleryPost(postId, reason, reportDetails || undefined);

      setDone(true);

      setOpen(false);

    } catch (err) {

      setError(err instanceof ApiError ? err.message : "Не удалось отправить жалобу");

    } finally {

      setSubmitting(false);

    }

  }



  if (done) {

    return <p className="text-sm font-bold text-[#782cff]">Жалоба отправлена. Спасибо — модератор проверит пост.</p>;

  }



  if (!open) {

    return (

      <button

        type="button"

        className="text-sm font-bold text-[#6d6273] underline hover:text-[#ff1fa2]"

        onClick={() => setOpen(true)}

      >

        Пожаловаться

      </button>

    );

  }



  return (

    <form onSubmit={onSubmit} className="rounded-[24px] border border-[#ffd1ed] bg-[#fff8fd] p-4">

      <p className="font-black text-[#302637]">Пожаловаться на пост</p>

      {!accessToken ? (

        <p className="mt-2 text-sm font-bold text-[#6d6273]">

          Можно без регистрации.{" "}

          <Link href={returnPath ? `/auth?next=${encodeURIComponent(returnPath)}` : "/auth"} className="text-[#ff1fa2] underline">

            Войти

          </Link>{" "}

          — если уже есть аккаунт.

        </p>

      ) : null}

      <label className="mt-3 block font-bold text-[#6d6273]">

        Причина

        <select

          className="mt-1 w-full rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold"

          value={reason}

          onChange={(event) => setReason(event.target.value as GalleryReportReason)}

        >

          {galleryReportReasons.map((item) => (

            <option key={item.id} value={item.id}>

              {item.label}

            </option>

          ))}

        </select>

      </label>

      <label className="mt-3 block font-bold text-[#6d6273]">

        Комментарий (необязательно)

        <textarea

          className="mt-1 w-full rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold"

          rows={3}

          maxLength={1000}

          value={details}

          onChange={(event) => setDetails(event.target.value)}

        />

      </label>

      {!accessToken ? (

        <label className="mt-3 block font-bold text-[#6d6273]">

          Email или телефон для связи (необязательно)

          <input

            className="mt-1 w-full rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold"

            placeholder="anna@mail.ru"

            value={contact}

            onChange={(event) => setContact(event.target.value)}

          />

        </label>

      ) : null}

      {error ? <p className="mt-2 font-bold text-[#ff1fa2]">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">

        <Button type="submit" size="sm" disabled={submitting}>

          {submitting ? "Отправляем…" : "Отправить жалобу"}

        </Button>

        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>

          Отмена

        </Button>

      </div>

    </form>

  );

}

