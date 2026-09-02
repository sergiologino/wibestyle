export type AdminButtonTone = "primary" | "secondary" | "active";

export const adminButtonBase =
  "inline-flex max-w-full items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-2 text-center text-sm font-black leading-snug shadow-sm transition-[transform,opacity,background-color,border-color,box-shadow] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

export const adminButtonTones: Record<AdminButtonTone, string> = {
  primary: "border-[#13794e] bg-[#13794e] text-white hover:border-[#0f6042] hover:bg-[#0f6042]",
  secondary: "border-[#94a3b8] bg-white text-[#334155] hover:border-[#64748b] hover:bg-[#f1f5f9]",
  active: "border-[#13794e] bg-[#dff5e9] text-[#0f5132] hover:border-[#0f6042] hover:bg-[#c9efd9]",
};

export function adminButtonClass(tone: AdminButtonTone = "primary", extraClassName = "") {
  return [adminButtonBase, adminButtonTones[tone], extraClassName].filter(Boolean).join(" ");
}
