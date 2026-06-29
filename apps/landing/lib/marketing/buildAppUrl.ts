import { getOrCreateVisitorId } from "./attribution";

export function buildAttributedAppUrl(url: string): string {
  try {
    const target = new URL(url, window.location.href);
    target.searchParams.set("visitor_id", getOrCreateVisitorId());
    return target.toString();
  } catch {
    return url;
  }
}
