import { NextResponse } from "next/server";
import { getRemainingDiscountSpots, registerLead, type LeadPayload } from "@/lib/leads";

export async function GET() {
  const remainingSpots = await getRemainingDiscountSpots();
  return NextResponse.json({ remainingSpots });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LeadPayload>;

    if (!body.phoneOrEmail?.trim()) {
      return NextResponse.json({ error: "Укажите телефон или email." }, { status: 400 });
    }
    if (!body.consent) {
      return NextResponse.json({ error: "Нужно согласие на обработку данных." }, { status: 400 });
    }

    const record = await registerLead({
      name: body.name?.trim(),
      phoneOrEmail: body.phoneOrEmail.trim(),
      gender: body.gender,
      favoriteMarketplace: body.favoriteMarketplace,
      interest: body.interest ?? "clothing",
      consent: true,
      createdAt: new Date().toISOString(),
    });

    const remainingSpots = await getRemainingDiscountSpots();

    return NextResponse.json({
      spotNumber: record.spotNumber,
      hasDiscount: record.hasDiscount,
      priceAnnual: record.priceAnnual,
      priceWithDiscount: record.priceWithDiscount,
      remainingSpots,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сохранения заявки." }, { status: 500 });
  }
}
