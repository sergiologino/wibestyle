import Link from "next/link";
import { Camera, Link2, Sparkles } from "lucide-react";
import { Button, Card } from "@wibestyle/ui";
import TryOnGateClient from "@/components/try-on/TryOnGateClient";

const tryOnOptions = [
  {
    href: "/try-on/link",
    title: "Ссылка WB / Ozon",
    description: "Вставь карточку товара, выбери размер и запусти примерку на своём аватаре.",
    cta: "Вставить ссылку",
    icon: Link2,
    variant: "primary" as const,
  },
  {
    href: "/try-on/photo",
    title: "Фото из галереи",
    description: "Загрузи фото вещи, укажи категорию и получи результат без ссылки на маркетплейс.",
    cta: "Загрузить фото",
    icon: Camera,
    variant: "secondary" as const,
  },
];

export default function TryOnHubPage() {
  return (
    <TryOnGateClient>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
        <div className="app-surface overflow-hidden rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-eyebrow">AI-примерка</p>
              <h1 className="text-display mt-2 text-4xl md:text-5xl">Выбери способ примерки</h1>
              <p className="text-body mt-3 max-w-2xl">
                Держим фокус на твоём аватаре, размере и товаре: ссылка быстрее, фото выручает,
                когда карточка недоступна.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#ffd1ed]/80 bg-white px-3 py-2 text-sm text-[#6d6273]">
              <Sparkles size={16} strokeWidth={1.6} className="text-[#ff1fa2]" />
              Результат сохраняется в истории
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {tryOnOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.href} className="group flex min-h-64 flex-col justify-between border-[#ffd1ed]/80 p-5 transition-transform hover:-translate-y-0.5">
                <div>
                  <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-[#ffd1ed]/80 bg-[#fff4fb] text-[#ff1fa2]">
                    <Icon size={22} strokeWidth={1.7} />
                  </div>
                  <h2 className="text-display-md text-2xl">{option.title}</h2>
                  <p className="text-body mt-2">{option.description}</p>
                </div>
                <Link href={option.href} className="mt-6 inline-flex">
                  <Button size="md" variant={option.variant}>{option.cta}</Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </TryOnGateClient>
  );
}
