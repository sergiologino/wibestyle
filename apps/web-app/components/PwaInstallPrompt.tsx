"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@wibestyle/ui";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  const userAgent = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(userAgent);
}

function isYandexBrowser() {
  return /YaBrowser/i.test(window.navigator.userAgent);
}

function isMobileBrowser() {
  return window.matchMedia("(max-width: 767px)").matches || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function PwaInstallPrompt() {
  const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);
  const [visible, setVisible] = useState(false);
  const [manualInstructions, setManualInstructions] = useState(false);
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    if (!isMobileBrowser() || isStandalone()) return;
    setVisible(true);
    if (isIosDevice()) return;
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as DeferredInstallPrompt;
      setInstallReady(true);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
  }

  async function install() {
    if (isIosDevice() || !deferredPrompt.current) {
      setManualInstructions((current) => !current);
      return;
    }
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === "accepted") setVisible(false);
    } catch {
      // Never leave the user with a browser error: switch to the safe manual path.
      deferredPrompt.current = null;
      setInstallReady(false);
      setManualInstructions(true);
    }
  }

  if (!visible) return null;
  return (
    <aside aria-label="Установка приложения" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-3xl border border-white/70 bg-[#302637]/95 p-4 text-white shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:w-[360px]">
      <button aria-label="Закрыть предложение установить приложение" className="absolute right-3 top-2 rounded-full px-2 py-1 text-lg leading-none text-white/75" type="button" onClick={dismiss}>×</button>
      <p className="pr-7 text-base font-semibold">{installReady ? "Установите" : "Добавьте"} «Я на стиле»</p>
      <p className="mt-1 text-sm leading-5 text-white/80">Ярлык появится на экране телефона. В Chrome после установки примерочная будет открываться без панели браузера.</p>
      {manualInstructions ? <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm leading-5">{isIosDevice() ? "Откройте страницу в Safari, нажмите «Поделиться», затем выберите «На экран „Домой“»." : isYandexBrowser() ? "В меню Яндекс Браузера выберите «Добавить на главный экран». Для полноэкранного режима откройте эту страницу в Chrome." : "В Chrome откройте меню ⋮ и выберите «Установить приложение» или «Добавить на главный экран»."}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" size="sm" type="button" onClick={() => void install()}>{manualInstructions ? "Понятно" : installReady ? "Установить" : "Как добавить"}</Button>
        <Button className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" size="sm" type="button" variant="secondary" onClick={dismiss}>Позже</Button>
      </div>
    </aside>
  );
}
