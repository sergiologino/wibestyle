export function splitPathAndHash(href: string): { pathname: string; hash: string | null } {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { pathname: href, hash: null };
  }

  const pathname = href.slice(0, hashIndex) || "/";
  const hash = href.slice(hashIndex + 1);
  return { pathname, hash: hash || null };
}

export function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth"): boolean {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id || typeof document === "undefined") {
    return false;
  }

  const target = document.getElementById(id);
  if (!target) {
    return false;
  }

  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function shouldHandleHashLocally(href: string, currentPathname: string): boolean {
  const { pathname, hash } = splitPathAndHash(href);
  if (!hash) {
    return false;
  }

  return pathname === currentPathname;
}

export function handleHashLinkClick(
  event: { preventDefault: () => void },
  href: string,
  currentPathname: string,
): boolean {
  if (!shouldHandleHashLocally(href, currentPathname)) {
    return false;
  }

  const { hash } = splitPathAndHash(href);
  if (!hash) {
    return false;
  }

  event.preventDefault();
  scrollToHash(hash);

  if (typeof window !== "undefined") {
    window.history.pushState(null, "", `#${hash}`);
  }

  return true;
}
