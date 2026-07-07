"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { createAdminApi } from "@/lib/api";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";

const sceneFields = [
  ["outerwear", "Верхняя одежда"],
  ["office", "Офисная и деловая одежда"],
  ["casual", "Повседневная одежда"],
  ["homewear", "Домашняя одежда"],
  ["sleepwear", "Ночная одежда и пеньюары"],
  ["evening", "Вечерняя одежда"],
  ["sportswear", "Спортивная одежда"],
  ["shoes", "Обувь"],
  ["revealing", "Бельё и купальники"],
  ["default", "Остальные категории"],
] as const;

export default function AdminSettingsPage() {
  const { adminKey, configured } = useAdminKey();
  const [blockGoogleOAuth, setBlockGoogleOAuth] = useState(false);
  const [tryOnScenesEnabled, setTryOnScenesEnabled] = useState(true);
  const [tryOnPoseChangeEnabled, setTryOnPoseChangeEnabled] = useState(true);
  const [tryOnScenePrompts, setTryOnScenePrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const api = createAdminApi();

  const load = useCallback(async (key: string) => {
    const data = await api.getAdminSettings(key);
    setBlockGoogleOAuth(data.blockGoogleOAuth);
    setTryOnScenesEnabled(data.tryOnScenesEnabled);
    setTryOnPoseChangeEnabled(data.tryOnPoseChangeEnabled);
    setTryOnScenePrompts(data.tryOnScenePrompts);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey).catch(() => setError("Не удалось загрузить настройки"));
    }
  }, [load, configured, adminKey]);

  async function onSave() {
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const data = await api.updateAdminSettings(adminKey, {
        blockGoogleOAuth,
        tryOnScenesEnabled,
        tryOnPoseChangeEnabled,
        tryOnScenePrompts,
      });
      setBlockGoogleOAuth(data.blockGoogleOAuth);
      setTryOnScenesEnabled(data.tryOnScenesEnabled);
      setTryOnPoseChangeEnabled(data.tryOnPoseChangeEnabled);
      setTryOnScenePrompts(data.tryOnScenePrompts);
      setSaved(true);
    } catch {
      setError("Не удалось сохранить настройки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPageShell
      pill="Settings"
      title="Настройки платформы"
      description="Глобальные опции авторизации и доступа."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}

      <Card>
        <h2 className="text-xl font-black">OAuth</h2>
        <label className="mt-4 flex items-center gap-3 font-bold text-[#302637]">
          <input
            type="checkbox"
            checked={blockGoogleOAuth}
            onChange={(event) => setBlockGoogleOAuth(event.target.checked)}
          />
          Блокировать Google (скрыть кнопку входа через Google)
        </label>
        <p className="mt-2 text-sm font-bold text-[#6d6273]">
          Google также скрывается автоматически для пользователей с IP России (требование закона).
        </p>
        <Button className="mt-4" disabled={loading || !configured} onClick={() => void onSave()}>
          {loading ? "Сохраняем…" : "Сохранить"}
        </Button>
        {saved ? <p className="mt-3 font-bold text-[#782cff]">Сохранено</p> : null}
        {error ? <p className="mt-3 font-bold text-[#ff1fa2]">{error}</p> : null}
      </Card>

      <Card>
        <h2 className="text-xl font-black">Локации фото-примерки</h2>
        <p className="mt-2 text-sm font-bold text-[#6d6273]">
          Система выбирает сценарий по категории и названию вещи. Поля ниже передаются нейросети как описание
          окружения. Каждый вариант указывайте с новой строки: для одной сессии вариант выбирается стабильно.
          Для отката достаточно отключить тематические локации.
        </p>

        <label className="mt-4 flex items-center gap-3 font-bold text-[#302637]">
          <input
            type="checkbox"
            checked={tryOnScenesEnabled}
            onChange={(event) => setTryOnScenesEnabled(event.target.checked)}
          />
          Использовать тематические локации
        </label>
        <label className="mt-3 flex items-center gap-3 font-bold text-[#302637]">
          <input
            type="checkbox"
            checked={tryOnPoseChangeEnabled}
            disabled={!tryOnScenesEnabled}
            onChange={(event) => setTryOnPoseChangeEnabled(event.target.checked)}
          />
          Разрешить небольшое изменение позы
        </label>
        <p className="mt-2 text-xs font-bold text-[#6d6273]">
          Лицо, фигура, антропометрия и детали одежды всегда остаются под жёсткой защитой промпта.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sceneFields.map(([key, label]) => (
            <label key={key} className="grid gap-1 text-sm font-black text-[#302637]">
              {label}
              <textarea
                className="min-h-24 rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                value={tryOnScenePrompts[key] ?? ""}
                disabled={!tryOnScenesEnabled}
                maxLength={1000}
                onChange={(event) => setTryOnScenePrompts((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
              />
            </label>
          ))}
        </div>

        <Button className="mt-5" disabled={loading || !configured} onClick={() => void onSave()}>
          {loading ? "Сохраняем…" : "Сохранить настройки примерки"}
        </Button>
      </Card>
    </AdminPageShell>
  );
}
