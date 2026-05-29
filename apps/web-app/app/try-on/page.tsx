import Link from "next/link";
import { Button, Card } from "@wibestyle/ui";
import TryOnGateClient from "@/components/try-on/TryOnGateClient";

export default function TryOnHubPage() {
  return (
    <TryOnGateClient>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-display text-4xl">Примерка</h1>
        <p className="text-body mt-2">Как хочешь примерить вещь?</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-display-md text-2xl">Ссылка WB / Ozon</h2>
          <p className="text-body mt-2">Карточка товара, размер, генерация и result screen.</p>
          <Link href="/try-on/link" className="mt-6 inline-block">
            <Button size="md">Вставить ссылку</Button>
          </Link>
        </Card>
        <Card>
          <h2 className="text-display-md text-2xl">Фото из галереи</h2>
          <p className="text-body mt-2">Загрузи снимок одежды и выбери категорию.</p>
          <Link href="/try-on/photo" className="mt-6 inline-block">
            <Button size="md" variant="secondary">Загрузить фото</Button>
          </Link>
        </Card>
      </div>
      </div>
    </TryOnGateClient>
  );
}
