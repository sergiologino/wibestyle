import type { ReactNode } from "react";

type AdminFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function AdminField({ label, htmlFor, hint, children, className = "" }: AdminFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#6d6273]">{label}</span>
      {children}
      {hint ? <span className="text-[11px] font-bold text-[#9a8fa3]">{hint}</span> : null}
    </label>
  );
}
