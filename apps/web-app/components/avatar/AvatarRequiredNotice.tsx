import Link from "next/link";
import { Camera } from "lucide-react";

export default function AvatarRequiredNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={compact ? "border-b border-[#ffb8e4] bg-[#fff4fb]" : "rounded-[28px] border border-[#ffb8e4] bg-[#fff4fb] p-5"}>
      <div className={compact ? "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8" : "flex flex-wrap items-center justify-between gap-4"}>
        <div>
          <p className="font-bold text-[#302637]">Добавьте фото для аватара</p>
          <p className="mt-1 text-sm text-[#6d6273]">Смотреть приложение можно, но примерка станет доступна после добавления аватара.</p>
        </div>
        <Link href="/settings" className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[#ff1fa2] px-4 text-sm font-medium text-white shadow-[0_8px_20px_rgba(255,31,162,0.25)]">
          <Camera size={17} aria-hidden /> Добавить фото
        </Link>
      </div>
    </aside>
  );
}
