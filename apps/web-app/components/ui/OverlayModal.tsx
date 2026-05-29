"use client";

import { useEffect, type ReactNode } from "react";
import clsx from "clsx";

type OverlayModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  showCloseButton?: boolean;
};

export default function OverlayModal({
  open,
  onClose,
  children,
  ariaLabel,
  className,
  showCloseButton = true,
}: OverlayModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14101a]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        aria-label={ariaLabel}
        aria-modal="true"
        className={clsx("relative max-h-[92vh] w-full overflow-y-auto", className)}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {showCloseButton ? (
          <button
            aria-label="Закрыть"
            className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/95 text-xl leading-none text-[#302637] shadow-md transition hover:bg-white hover:text-[#ff1fa2]"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
