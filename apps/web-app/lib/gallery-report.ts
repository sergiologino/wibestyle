export const galleryReportReasons = [
  { id: "inappropriate", label: "Неприемлемый контент" },
  { id: "harassment", label: "Оскорбления / harassment" },
  { id: "spam", label: "Спам" },
  { id: "copyright", label: "Нарушение авторских прав" },
  { id: "other", label: "Другое" },
] as const;

export type GalleryReportReason = (typeof galleryReportReasons)[number]["id"];

export function galleryReportReasonLabel(reason: string) {
  return galleryReportReasons.find((item) => item.id === reason)?.label ?? reason;
}
