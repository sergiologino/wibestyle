import { NextRequest, NextResponse } from "next/server";

const PUBLIC_HOSTS = new Set(["vibestyle.art", "www.vibestyle.art", "yanastile.app", "www.yanastile.app"]);
const HSTS = "max-age=31536000; includeSubDomains; preload";

function normalizeHost(host: string | null): string {
  return (host ?? "").split(":")[0].toLowerCase();
}

export function buildPublicHttpsUrl(host: string, pathname: string, search: string): string {
  return `https://${host}${pathname}${search}`;
}

export function shouldForceHttps(host: string | null, forwardedProto: string | null, protocol: string): boolean {
  const normalizedHost = normalizeHost(host);
  if (!PUBLIC_HOSTS.has(normalizedHost)) return false;
  return forwardedProto === "http" || protocol === "http:";
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (shouldForceHttps(host, forwardedProto, request.nextUrl.protocol)) {
    const url = buildPublicHttpsUrl(host ?? request.nextUrl.host, request.nextUrl.pathname, request.nextUrl.search);
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  if (PUBLIC_HOSTS.has(normalizeHost(host))) {
    response.headers.set("Strict-Transport-Security", HSTS);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|icon.svg|apple-icon.png).*)"],
};
