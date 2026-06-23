const configuredCounterId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "109999858");

export const YANDEX_METRIKA_ID = Number.isFinite(configuredCounterId)
  ? configuredCounterId
  : 109999858;
