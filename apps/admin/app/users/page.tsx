"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi, APP_BASE_URL } from "@/lib/api";

type AdminUserItem = {
  id: string;
  phone?: string;
  email?: string;
  login?: string;
  plan?: string;
  trialGenerationsLeft?: number;
  planGenerationsLeft?: number;
  displayName?: string;
  primaryAuth?: string;
  createdAt: string;
};

const planPresets = [
  { id: "trial", label: "Trial (5 gen)" },
  { id: "wibe", label: "Wibe" },
  { id: "elite", label: "Elite" },
  { id: "none", label: "Без подписки" },
] as const;

export default function AdminUsersPage() {
  const { adminKey, configured } = useAdminKey();
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const api = createAdminApi();

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    setLoading(true);
    setLocalError(null);
    try {
      const data = await api.listAdminUsers(adminKey);
      setItems(data.items);
    } catch {
      setLocalError("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }, [adminKey, configured, api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyPlan(user: AdminUserItem, plan: string) {
    setActionUserId(user.id);
    setMessage(null);
    setLocalError(null);
    try {
      const payload =
        plan === "trial"
          ? { plan: "trial" as const, trialGenerationsLeft: 5, planGenerationsLeft: 0 }
          : plan === "wibe"
            ? { plan: "wibe" as const, planGenerationsLeft: 20, trialGenerationsLeft: 0 }
            : plan === "elite"
              ? { plan: "elite" as const, planGenerationsLeft: 100, trialGenerationsLeft: 0 }
              : { plan: "trial" as const, trialGenerationsLeft: 0, planGenerationsLeft: 0 };
      await api.updateAdminUserSubscription(adminKey, user.id, payload);
      setMessage(`Тариф ${plan} применён для ${user.login ?? user.email ?? user.phone ?? user.id.slice(0, 8)}`);
      await load();
    } catch {
      setLocalError("Не удалось изменить тариф");
    } finally {
      setActionUserId(null);
    }
  }

  async function impersonate(user: AdminUserItem) {
    setActionUserId(user.id);
    setLocalError(null);
    try {
      const result = await api.impersonateAdminUser(adminKey, user.id);
      const url = `${APP_BASE_URL}/auth/oauth/callback?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}&newUser=false`;
      window.open(url, "_blank", "noopener,noreferrer");
      setMessage(`Открыта web-app под пользователем ${user.login ?? user.email ?? user.id.slice(0, 8)}`);
    } catch {
      setLocalError("Не удалось войти как пользователь");
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteUser(user: AdminUserItem) {
    const label = user.login ?? user.email ?? user.phone ?? user.id;
    if (!window.confirm(`Полностью удалить пользователя ${label} и все данные?`)) return;
    setActionUserId(user.id);
    setLocalError(null);
    try {
      await api.deleteAdminUser(adminKey, user.id);
      setMessage(`Пользователь ${label} удалён`);
      await load();
    } catch {
      setLocalError("Не удалось удалить пользователя");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <AdminPageShell
      title="Пользователи"
      description="Тестовые тарифы, impersonation и полное удаление аккаунтов."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {message ? <p className="font-bold text-[#782cff]">{message}</p> : null}
      {localError ? <p className="font-bold text-[#ff1fa2]">{localError}</p> : null}

      <div className="grid gap-4">
        {loading ? <p className="font-bold text-[#6d6273]">Загружаем…</p> : null}
        {items.map((user) => (
          <Card key={user.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#782cff]">{user.primaryAuth ?? "user"}</p>
                <h2 className="text-xl font-black">{user.displayName ?? user.login ?? user.email ?? user.phone ?? "Без имени"}</h2>
                <p className="mt-1 text-sm font-bold text-[#6d6273]">
                  {user.login ? `@${user.login}` : null}
                  {user.email ? ` · ${user.email}` : null}
                  {user.phone ? ` · ${user.phone}` : null}
                </p>
                <p className="mt-1 text-sm font-bold text-[#6d6273]">
                  Тариф: {user.plan ?? "—"}
                  {user.plan === "trial" ? ` · trial ${user.trialGenerationsLeft ?? 0}` : ` · gen ${user.planGenerationsLeft ?? 0}`}
                </p>
                <p className="mt-1 text-xs font-bold text-[#6d6273]">ID: {user.id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {planPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      size="md"
                      variant="secondary"
                      disabled={actionUserId === user.id || !configured}
                      onClick={() => void applyPlan(user, preset.id)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Button disabled={actionUserId === user.id || !configured} onClick={() => void impersonate(user)}>
                  Войти как пользователь
                </Button>
                <Button disabled={actionUserId === user.id || !configured} variant="secondary" onClick={() => void deleteUser(user)}>
                  Удалить полностью
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
