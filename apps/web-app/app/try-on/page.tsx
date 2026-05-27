import Link from "next/link";
import { Button, Card, Pill } from "@wibestyle/ui";

export default function TryOnHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Pill>Примерка</Pill>
      <h1 className="text-4xl font-black tracking-tight">Как хочешь примерить вещь?</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black">Ссылка WB / Ozon</h2>
          <p className="mt-2 font-bold text-[#6d6273]">Карточка товара, размер, генерация и result screen.</p>
          <Link href="/try-on/link" className="mt-6 inline-block">
            <Button size="lg">Вставить ссылку</Button>
          </Link>
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Фото из галереи</h2>
          <p className="mt-2 font-bold text-[#6d6273]">Загрузи снимок одежды и выбери категорию.</p>
          <Link href="/try-on/photo" className="mt-6 inline-block">
            <Button size="lg" variant="secondary">Загрузить фото</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
