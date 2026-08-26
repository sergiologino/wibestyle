import { NextRequest, NextResponse } from "next/server";

const PUBLIC_HOSTS = new Set(["vibestyle.art", "www.vibestyle.art", "yanastile.app", "www.yanastile.app"]);
const HSTS = "max-age=31536000; includeSubDomains; preload";

function normalizeHost(host: string | null): string {
  return (host ?? "").split(":")[0].toLowerCase();
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  const response = NextResponse.next();
  if (PUBLIC_HOSTS.has(normalizeHost(host))) {
    response.headers.set("Strict-Transport-Security", HSTS);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|icon.svg|apple-icon.png).*)"],
};
