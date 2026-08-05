"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminMediaImage } from "@/components/admin-media-image";
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
  activeAvatarPhotoUrl?: string;
  devices?: Array<{
    deviceHash: string;
    deviceHashShort: string;
    registrationCount: number;
    deletedAccountCount: number;
    lastAccountDeletedAt?: string;
    trialGenerationsUsed: number;
    trialGenerationsLeft: number;
  }>;
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
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<AdminUserItem | null>(null);

  const api = createAdminApi();

  const load = useCallback(async (nextPage = 0, nextQuery = query) => {
    if (!configured || !adminKey) return;
    setLoading(true);
    setLocalError(null);
    try {
      const data = await api.listAdminUsers(adminKey, { page: nextPage, limit: 30, search: nextQuery.trim() });
      setItems(data.items);
      setPage(data.page);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setHasMore(data.hasMore);
    } catch {
      setLocalError("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }, [adminKey, configured, api, query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load(0, query);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [load, query]);

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
      await load(page, query);
    } catch {
      setLocalError("Не удалось изменить тариф");
    } finally {
      setActionUserId(null);
    }
  }

  async function impersonate(user: AdminUserItem) {
    setActionUserId(user.id);
    setLocalError(null);
    setMessage(null);
    const popup = window.open("about:blank", "_blank");
    try {
      const result = await api.impersonateAdminUser(adminKey, user.id);
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: String(result.expiresIn),
        newUser: "false",
      });
      const url = `${APP_BASE_URL}/auth/oauth/callback?${params.toString()}`;
      if (popup) {
        popup.opener = null;
        popup.location.replace(url);
      } else {
        window.location.assign(url);
      }
      setMessage(`Открыта web-app под пользователем ${user.login ?? user.email ?? user.id.slice(0, 8)}`);
    } catch {
      popup?.close();
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
      await load(page, query);
    } catch {
      setLocalError("Не удалось удалить пользователя");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <AdminPageShell
      title="Пользователи"
      description="Тарифы, impersonation, поддержка профилей и удаление аккаунтов."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {message ? <p className="font-bold text-[#782cff]">{message}</p> : null}
      {localError ? <p className="font-bold text-[#ff1fa2]">{localError}</p> : null}

      <label className="grid max-w-xl gap-1 text-sm font-bold">
        Поиск по телефону, email, логину, имени или ID
        <input
          className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например +7999 или user@mail.ru"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#6d6273]">
        <span>
          Found: {total}
          {totalPages > 0 ? ` · page ${page + 1} of ${totalPages}` : ""}
        </span>
        <div className="flex gap-2">
          <Button
            size="md"
            variant="secondary"
            disabled={loading || page <= 0}
            onClick={() => void load(page - 1, query)}
          >
            Back
          </Button>
          <Button
            size="md"
            variant="secondary"
            disabled={loading || !hasMore}
            onClick={() => void load(page + 1, query)}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? <p className="font-bold text-[#6d6273]">Загружаем…</p> : null}
        {!loading && items.length === 0 ? <p className="font-bold text-[#6d6273]">No users found.</p> : null}
        {items.map((user) => (
          <Card key={user.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
              <div className="flex min-w-0 flex-1 gap-3 md:gap-4">
                <button
                  type="button"
                  className="h-20 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] disabled:cursor-default md:h-28 md:w-20"
                  disabled={!user.activeAvatarPhotoUrl}
                  title={user.activeAvatarPhotoUrl ? "Открыть аватар" : "У пользователя нет активного аватара"}
                  onClick={() => setPreviewUser(user)}
                >
                  <AdminMediaImage
                    adminKey={adminKey}
                    alt={`Аватар ${user.displayName ?? user.login ?? user.phone ?? user.id}`}
                    className="h-full w-full object-cover"
                    path={user.activeAvatarPhotoUrl}
                  />
                </button>
                <div className="min-w-0">
                  <div className="grid gap-1 text-xs font-bold text-[#6d6273] md:hidden">
                    <p>Зарегистрирован: {new Date(user.createdAt).toLocaleString("ru-RU")}</p>
                    <p>Тариф: {user.plan ?? "—"}</p>
                    <p>Осталось примерок: {user.plan === "trial" ? user.trialGenerationsLeft ?? 0 : user.planGenerationsLeft ?? 0}</p>
                  </div>
                  <div className="hidden md:block">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#782cff]">{user.primaryAuth ?? "user"}</p>
                  <h2 className="break-words text-xl font-black">{user.displayName ?? user.login ?? user.email ?? user.phone ?? "Без имени"}</h2>
                  <p className="mt-1 break-words text-sm font-bold text-[#6d6273]">
                    {user.login ? `@${user.login}` : null}
                    {user.email ? ` · ${user.email}` : null}
                    {user.phone ? ` · ${user.phone}` : null}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#6d6273]">
                    Тариф: {user.plan ?? "—"}
                    {user.plan === "trial" ? ` · trial ${user.trialGenerationsLeft ?? 0}` : ` · gen ${user.planGenerationsLeft ?? 0}`}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#6d6273]">
                    Создан: {new Date(user.createdAt).toLocaleString("ru-RU")}
                  </p>
                  {user.devices?.length ? (
                    <div className="mt-2 grid gap-1 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-3 text-xs font-bold text-[#6d6273]">
                      {user.devices.map((device) => (
                        <div key={device.deviceHash} className="break-words">
                          <span className="text-[#782cff]">device {device.deviceHashShort}</span>
                          <span className="block break-all font-mono font-normal text-[#9a8f99]">{device.deviceHash}</span>
                          {" · "}регистраций: {device.registrationCount}
                          {" · "}удалений: {device.deletedAccountCount}
                          {" · "}trial: {device.trialGenerationsUsed} использ. / {device.trialGenerationsLeft} осталось
                          {device.lastAccountDeletedAt ? (
                            <>{" · "}последнее удаление: {new Date(device.lastAccountDeletedAt).toLocaleString("ru-RU")}</>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs font-bold text-[#9a8f99]">Device ID: нет данных</p>
                  )}
                  <p className="mt-1 break-all text-xs font-bold text-[#6d6273]">ID: {user.id}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:flex-col">
                <Link href={`/users/${user.id}`}>
                  <Button size="md">Поддержка</Button>
                </Link>
                <div className="flex flex-wrap gap-2">
                  {planPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      className="md:min-h-9 md:px-4 md:py-2 md:text-sm"
                      size="sm"
                      variant="secondary"
                      disabled={actionUserId === user.id || !configured}
                      onClick={() => void applyPlan(user, preset.id)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <button
                  type="button"
                  className="min-h-8 rounded-xl border-2 border-[#782cff] bg-white px-3 py-1.5 text-xs font-black text-[#782cff] underline decoration-2 underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9 md:px-4 md:py-2 md:text-sm"
                  disabled={actionUserId === user.id || !configured}
                  onClick={() => void impersonate(user)}
                >
                  Войти как пользователь
                </button>
                <Button className="md:min-h-9 md:px-4 md:py-2 md:text-sm" disabled={actionUserId === user.id || !configured} size="sm" variant="secondary" onClick={() => void deleteUser(user)}>
                  Удалить полностью
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {previewUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Аватар пользователя"
          onClick={() => setPreviewUser(null)}
        >
          <div className="max-h-[92vh] max-w-3xl overflow-hidden rounded-3xl bg-white p-3" onClick={(event) => event.stopPropagation()}>
            <AdminMediaImage
              adminKey={adminKey}
              alt={`Аватар ${previewUser.displayName ?? previewUser.login ?? previewUser.phone ?? previewUser.id}`}
              className="max-h-[82vh] w-full rounded-2xl object-contain"
              path={previewUser.activeAvatarPhotoUrl}
            />
            <div className="mt-3 flex justify-end">
              <Button size="md" variant="secondary" onClick={() => setPreviewUser(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
