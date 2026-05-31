"use client";

import Link from "next/link";
import { Button, Card } from "@wibestyle/ui";
import { clearCheckoutId } from "@/lib/billing-plan";

export default function PaywallCancelClient() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Card>
        <p className="text-eyebrow">Оплата</p>
        <h1 className="text-display mt-4 text-3xl">Оплата не завершена</h1>
        <p className="text-body mt-3">
          Платёж отменён или прерван. Подписка не активирована — можно вернуться к тарифам и попробовать снова.
        </p>
        <Link href="/paywall" onClick={() => clearCheckoutId()}>
          <Button className="mt-6" size="md">Вернуться к тарифам</Button>
        </Link>
        <Link href="/home" className="text-link mt-4 inline-block text-sm" onClick={() => clearCheckoutId()}>
          На главную
        </Link>
      </Card>
    </div>
  );
}
