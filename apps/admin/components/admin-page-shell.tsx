"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Pill } from "@wibestyle/ui";

type AdminPageShellProps = {
  pill?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminPageShell({ pill = "Admin", title, description, children }: AdminPageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Pill>{pill}</Pill>
          <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
          {description ? <p className="mt-2 font-bold text-[#6d6273]">{description}</p> : null}
        </div>
        <Link href="/" className="shrink-0 font-bold text-[#ff1fa2]">
          ← Разделы
        </Link>
      </div>
      {children}
    </div>
  );
}
