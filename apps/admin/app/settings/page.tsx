"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { createAdminApi } from "@/lib/api";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";

export default function AdminSettingsPage() {
  const { adminKey, configured } = useAdminKey();
  const [blockGoogleOAuth, setBlockGoogleOAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const api = createAdminApi();

  const load = useCallback(async (key: string) => {
    const data = await api.getAdminSettings(key);
    setBlockGoogleOAuth(data.blockGoogleOAuth);
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
      const data = await api.updateAdminSettings(adminKey, { blockGoogleOAuth });
      setBlockGoogleOAuth(data.blockGoogleOAuth);
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
    </AdminPageShell>
  );
}
