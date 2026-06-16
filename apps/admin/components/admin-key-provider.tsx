"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@wibestyle/ui";
import { readAdminKey, saveAdminKey, verifyAdminKey } from "@/lib/api";
import { AdminField } from "@/components/admin-field";

type AdminKeyContextValue = {
  adminKey: string;
  configured: boolean;
  error: string | null;
  setError: (message: string | null) => void;
  showKeyPanel: boolean;
  setShowKeyPanel: (open: boolean) => void;
};

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [draftKey, setDraftKey] = useState("");

  useEffect(() => {
    const stored = readAdminKey();
    if (stored) {
      setAdminKey(stored);
      setDraftKey(stored);
      setConfigured(true);
    } else {
      setShowKeyPanel(true);
    }
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const trimmed = draftKey.trim();
    if (!trimmed) {
      setError("Укажите X-Admin-Key");
      return;
    }
    setError(null);
    const verification = await verifyAdminKey(trimmed);
    if (!verification.ok) {
      setError(verification.message);
      return;
    }
    saveAdminKey(trimmed);
    setAdminKey(trimmed);
    setConfigured(true);
    setShowKeyPanel(false);
  }

  return (
    <AdminKeyContext.Provider
      value={{ adminKey, configured, error, setError, showKeyPanel, setShowKeyPanel }}
    >
      {showKeyPanel ? (
        <div className="border-b border-[#ffd1ed] bg-[#fff8fc] px-4 py-4">
          <form className="mx-auto flex max-w-5xl flex-wrap items-end gap-3" onSubmit={onSave}>
            <AdminField label="X-Admin-Key" hint="Значение WIBESTYLE_ADMIN_API_KEY на backend" className="min-w-[280px] flex-1">
              <input
                id="admin-key-global"
                className="rounded-xl border border-[#ffd1ed] px-4 py-2 font-bold"
                value={draftKey}
                onChange={(event) => setDraftKey(event.target.value)}
                placeholder="Введите admin API key"
              />
            </AdminField>
            <Button type="submit">Сохранить ключ</Button>
            {configured ? (
              <Button type="button" variant="secondary" onClick={() => setShowKeyPanel(false)}>
                Отмена
              </Button>
            ) : null}
          </form>
          {error ? <p className="mx-auto mt-2 max-w-5xl text-sm font-bold text-[#ff1fa2]">{error}</p> : null}
        </div>
      ) : configured ? (
        <div className="border-b border-[#ffd1ed] bg-[#fff8fc] px-4 py-2">
          <p className="mx-auto max-w-5xl text-[11px] font-bold text-[#6d6273]">
            Ключ админки сохранён в браузере ·{" "}
            <button
              type="button"
              className="font-black text-[#782cff] underline"
              onClick={() => {
                setDraftKey(adminKey);
                setShowKeyPanel(true);
              }}
            >
              изменить
            </button>
          </p>
        </div>
      ) : null}
      {children}
    </AdminKeyContext.Provider>
  );
}

export function useAdminKey() {
  const ctx = useContext(AdminKeyContext);
  if (!ctx) {
    throw new Error("useAdminKey must be used within AdminKeyProvider");
  }
  return ctx;
}
