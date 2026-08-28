"use client";

import Link from "next/link";
import { WandSparkles } from "lucide-react";
import { Button, Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";

export default function StylistEntryCard() {
  const { profile } = useAppSession();

  if (!profile?.stylistAvailable) {
    return null;
  }

  return (
    <Card className="group flex min-h-64 flex-col justify-between border-[#ffd1ed]/80 p-5 transition-transform hover:-translate-y-0.5">
      <div>
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-[#ffd1ed]/80 bg-[#fff4fb] text-[#ff1fa2]">
          <WandSparkles size={22} strokeWidth={1.7} />
        </div>
        <h2 className="text-display-md text-2xl">Подбор образа</h2>
        <p className="text-body mt-2">Выбери событие, получи три стилистических направления и товары-кандидаты.</p>
      </div>
      <Link href="/stylist" className="mt-6 inline-flex">
        <Button size="md" variant="secondary">Открыть стилиста</Button>
      </Link>
    </Card>
  );
}
