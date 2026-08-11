"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@wibestyle/ui";
import { WibeStyleApiClient } from "@wibestyle/api-client";

type CaptchaState = {
  challengeId: string;
  question: string;
};

type MathCaptchaFieldProps = {
  api: WibeStyleApiClient;
  captchaId: string;
  captchaAnswer: string;
  onCaptchaIdChange: (value: string) => void;
  onCaptchaAnswerChange: (value: string) => void;
};

export default function MathCaptchaField({
  api,
  captchaId,
  captchaAnswer,
  onCaptchaIdChange,
  onCaptchaAnswerChange,
}: MathCaptchaFieldProps) {
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
  const [loading, setLoading] = useState(false);
  const onCaptchaIdChangeRef = useRef(onCaptchaIdChange);
  const onCaptchaAnswerChangeRef = useRef(onCaptchaAnswerChange);

  useEffect(() => {
    onCaptchaIdChangeRef.current = onCaptchaIdChange;
    onCaptchaAnswerChangeRef.current = onCaptchaAnswerChange;
  }, [onCaptchaAnswerChange, onCaptchaIdChange]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.getCaptcha();
      setCaptcha({ challengeId: next.challengeId, question: next.question });
      onCaptchaIdChangeRef.current(next.challengeId);
      onCaptchaAnswerChangeRef.current("");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-4">
      <p className="text-sm font-black text-[#302637]">Проверка: {captcha?.question ?? "Загружаем…"}</p>
      <p className="mt-1 text-xs font-bold text-[#6d6273]">Решите простой пример — так мы отличаем людей от ботов.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="w-24 rounded-xl border border-[#ffd1ed] bg-white px-3 py-2 font-normal text-[#302637] outline-none placeholder:font-normal placeholder:text-[#c8bcc8] focus:border-[#ff1fa2]"
          inputMode="numeric"
          placeholder="Ответ"
          value={captchaAnswer}
          onChange={(event) => onCaptchaAnswerChange(event.target.value)}
          required
        />
        <Button disabled={loading} size="md" type="button" variant="secondary" onClick={() => void refresh()}>
          Другой пример
        </Button>
      </div>
      {captchaId ? <input type="hidden" value={captchaId} readOnly /> : null}
    </div>
  );
}
