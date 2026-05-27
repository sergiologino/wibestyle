"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { handleHashLinkClick } from "@/lib/navigation";

type HashLinkProps = ComponentProps<typeof Link>;

export default function HashLink({ href, onClick, ...props }: HashLinkProps) {
  const pathname = usePathname();
  const hrefValue = typeof href === "string" ? href : href.pathname ?? "/";

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          handleHashLinkClick(event, hrefValue, pathname);
        }
      }}
    />
  );
}
