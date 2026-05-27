export function buildAuthRedirectPath(nextPath: string) {
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/home";
  return `/auth?next=${encodeURIComponent(safeNext)}`;
}
