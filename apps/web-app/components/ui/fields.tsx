import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const fieldClassName =
  "w-full rounded-2xl border border-[#e8d4e3] bg-white/90 px-4 py-3 text-[15px] font-normal text-[#302637] shadow-sm outline-none transition placeholder:text-[#a89aad] focus:border-[#ff1fa2]/60 focus:ring-2 focus:ring-[#ff1fa2]/15";

export const labelClassName = "text-sm font-medium text-[#4a4150]";

export const fieldCaptionClassName = "text-xs font-medium text-[#6d6273]";

export const sectionTitleClassName = "text-xl font-semibold tracking-tight text-[#302637]";

export const mutedTextClassName = "text-sm font-normal leading-relaxed text-[#6d6273]";

export function FieldCaption({ children }: { children: ReactNode }) {
  return <span className={fieldCaptionClassName}>{children}</span>;
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className={`grid gap-1.5 ${labelClassName}`} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClassName} {...props} />;
}

export function FieldSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={fieldClassName} {...props} />;
}

export function FieldTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClassName} min-h-[96px] resize-y`} {...props} />;
}

export function FieldCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-[#f0dce8] bg-white/70 px-3 py-2.5 transition ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#ffb8e4]/80"
      }`}
    >
      <input
        checked={checked}
        className="mt-1 size-4 rounded border-[#e8d4e3] text-[#ff1fa2] focus:ring-[#ff1fa2]/30 disabled:cursor-not-allowed"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-[#302637]">{label}</span>
        {description ? <span className="text-xs font-normal text-[#6d6273]">{description}</span> : null}
      </span>
    </label>
  );
}
