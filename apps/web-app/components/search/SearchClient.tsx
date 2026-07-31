"use client";

import Link from "next/link";
import { Bell, Search, Sparkles } from "lucide-react";
import { Button, Card, Pill } from "@wibestyle/ui";

export default function SearchClient() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-white via-[#fff8fd] to-[#f6fbef] shadow-none">
        <div className="flex flex-col gap-6 p-2 md:p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-3xl border border-[#ffd1ed] bg-white/80 text-[#ff1fa2]">
              <Search size={22} />
            </div>
            <Pill tone="soft">Скоро</Pill>
          </div>

          <div>
            <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-semibold tracking-tight md:text-4xl">
              Поиск товаров ещё в разработке
            </h1>
            <p className="mt-4 max-w-2xl text-base font-normal leading-7 text-[#6d6273]">
              Мы готовим раздел, где можно будет искать вещи по WB и Ozon, сохранять находки и сразу отправлять их
              на примерку. Пока функция не готова к стабильному запуску, поэтому не показываем сырой поиск.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-[#ffd1ed]/80 bg-white/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#c01278]">
                <Sparkles size={18} />
                Что появится
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6d6273]">
                Умный подбор товаров, быстрый переход к примерке и сохранение понравившихся вещей.
              </p>
            </div>
            <div className="rounded-3xl border border-[#dcefc8] bg-white/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#4f6f2d]">
                <Bell size={18} />
                Уведомим сразу
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6d6273]">
                Как только поиск будет готов, мы сообщим об этом в приложении — отдельное действие сейчас не нужно.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/try-on/link">
              <Button size="lg">Примерить по ссылке WB / Ozon</Button>
            </Link>
            <Link href="/home" className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-[#6d6273]">
              На главную
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
