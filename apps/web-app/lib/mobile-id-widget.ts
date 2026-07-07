export type MobileIdVerifiedPayload = {
  session_id: string;
  verify_token: string;
  phone: string;
};

export type MobileIdWidgetOptions = {
  tokenUrl: string;
  baseUrl?: string;
  resultView?: "text" | "phone";
  theme?: Record<string, string>;
  onVerified: (payload: MobileIdVerifiedPayload) => void | Promise<void>;
  onError?: (error: { code?: string; message?: string; status?: number }) => void;
  onRejected?: () => void;
  onRateLimit?: () => void;
};

export type MobileIdWidgetInstance = {
  mount: (target: HTMLElement | string) => MobileIdWidgetInstance;
  destroy: () => void;
};

type MobileIdWidgetConstructor = new (options: MobileIdWidgetOptions) => MobileIdWidgetInstance;

declare global {
  interface Window {
    MobileIDWidget?: MobileIdWidgetConstructor;
  }
}

const SCRIPT_URL = "https://cdn.smsaero.ru/mid-widget/1/mobileid-widget.min.js";
let loadPromise: Promise<MobileIdWidgetConstructor> | null = null;

export function loadMobileIdWidget(): Promise<MobileIdWidgetConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MobileID requires a browser"));
  }
  if (window.MobileIDWidget) return Promise.resolve(window.MobileIDWidget);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<MobileIdWidgetConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.MobileIDWidget) resolve(window.MobileIDWidget);
      else reject(new Error("SMS Aero MobileID widget did not initialize"));
    };
    script.onerror = () => reject(new Error("SMS Aero MobileID widget failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export const mobileIdTheme = {
  primaryColor: "#ff1fa2",
  primaryHover: "#e41991",
  primaryText: "#ffffff",
  bgColor: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "#ffd1ed",
  inputBorderFocus: "#ff1fa2",
  inputText: "#221d22",
  labelColor: "#221d22",
  hintColor: "#9a8f99",
  errorColor: "#ff1fa2",
  successColor: "#782cff",
  rejectedColor: "#ff1fa2",
  spinnerColor: "#ff1fa2",
  borderRadius: "16px",
  fontFamily: "Manrope, sans-serif",
  fontSize: "16px",
  padding: "12px 16px",
  gap: "12px",
};
