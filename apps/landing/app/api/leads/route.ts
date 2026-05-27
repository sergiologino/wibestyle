import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function GET() {
  const response = await fetch(`${apiBase}/api/v1/landing/leads`, { cache: "no-store" });
  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const response = await fetch(`${apiBase}/api/v1/landing/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}
