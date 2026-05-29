"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import type { UpdateProfilePayload, UserProfile } from "@wibestyle/shared-types";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminMediaImage } from "@/components/admin-media-image";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type AdminAvatarItem = {
  id: string;
  status: string;
  active: boolean;
  qualityScore?: number;
  warnings?: string[];
  createdAt: string;
  adminOriginalPhotoUrl?: string;
  adminProcessedPhotoUrl?: string;
};

type AdminTryOnItem = {
  sessionId: string;
  status: string;
  sourceType: string;
  visibility?: string;
  productTitle: string;
  productUrl?: string;
  marketplace?: string;
  selectedSize?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  galleryPostId?: string;
  galleryVisibility?: string;
  adminAfterPhotoUrl?: string;
  adminGarmentPhotoUrl?: string;
};

type AdminUserDetail = {
  user: {
    id: string;
    phone?: string;
    email?: string;
    login?: string;
    primaryAuth?: string;
    createdAt: string;
  };
  profile: UserProfile;
  avatars: { items: AdminAvatarItem[] };
  tryOnSessions: { items: AdminTryOnItem[] };
};

const statusLabels: Record<string, string> = {
  ready: "Готово",
  failed: "Ошибка",
  generating: "Генерация",
  draft: "Черновик",
};

export default function AdminUserSupportPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { adminKey, configured } = useAdminKey();
  const api = createAdminApi();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [shoeSizeEu, setShoeSizeEu] = useState("");

  const userLabel = useMemo(() => {
    if (!detail) return userId;
    const u = detail.user;
    return detail.profile.displayName ?? u.login ?? u.email ?? u.phone ?? u.id.slice(0, 8);
  }, [detail, userId]);

  const load = useCallback(async () => {
    if (!configured || !adminKey || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUserDetail(adminKey, userId);
      setDetail(data);
      const profile = data.profile;
      setDisplayName(profile.displayName ?? "");
      setGender(profile.gender ?? "");
      setHeightCm(profile.anthropometry?.heightCm ? String(profile.anthropometry.heightCm) : "");
      setWeightKg(profile.anthropometry?.weightKg ? String(profile.anthropometry.weightKg) : "");
      setBustCm(profile.anthropometry?.bustCm ? String(profile.anthropometry.bustCm) : "");
      setWaistCm(profile.anthropometry?.waistCm ? String(profile.anthropometry.waistCm) : "");
      setHipsCm(profile.anthropometry?.hipsCm ? String(profile.anthropometry.hipsCm) : "");
      setClothingSize(profile.anthropometry?.clothingSize ?? "");
      setShoeSizeEu(profile.anthropometry?.shoeSizeEu ? String(profile.anthropometry.shoeSizeEu) : "");
    } catch {
      setError("Не удалось загрузить данные пользователя");
    } finally {
      setLoading(false);
    }
  }, [adminKey, api, configured, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!adminKey || !userId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: UpdateProfilePayload = {
      displayName: displayName.trim() || undefined,
      gender: gender || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      bustCm: bustCm ? Number(bustCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      clothingSize: clothingSize || undefined,
      shoeSizeEu: shoeSizeEu ? Number(shoeSizeEu) : undefined,
    };
    try {
      await api.updateAdminUserProfile(adminKey, userId, payload);
      setMessage("Профиль сохранён");
      await load();
    } catch {
      setError("Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAvatar(avatar: AdminAvatarItem) {
    if (!adminKey || !userId) return;
    if (!window.confirm(`Удалить аватар ${avatar.id.slice(0, 8)}?`)) return;
    setActionId(avatar.id);
    setError(null);
    setMessage(null);
    try {
      await api.deleteAdminUserAvatar(adminKey, userId, avatar.id);
      setMessage("Аватар удалён");
      await load();
    } catch {
      setError("Не удалось удалить аватар (возможно, это единственный)");
    } finally {
      setActionId(null);
    }
  }

  async function onDeleteTryOn(session: AdminTryOnItem) {
    if (!adminKey || !userId) return;
    if (!window.confirm(`Удалить примерку «${session.productTitle}»?`)) return;
    setActionId(session.sessionId);
    setError(null);
    setMessage(null);
    try {
      await api.deleteAdminUserTryOnSession(adminKey, userId, session.sessionId);
      setMessage("Примерка удалена");
      await load();
    } catch {
      setError("Не удалось удалить примерку");
    } finally {
      setActionId(null);
    }
  }

  const avatarCount = detail?.avatars.items.length ?? 0;

  return (
    <AdminPageShell
      title="Поддержка пользователя"
      description="Профиль, аватары и все примерки (включая неопубликованные)."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/users" className="font-bold text-[#ff1fa2]">
          ← К списку
        </Link>
        {detail ? (
          <span className="text-sm font-bold text-[#6d6273]">
            {userLabel} · {detail.user.phone ?? detail.user.email ?? detail.user.login ?? detail.user.id}
          </span>
        ) : null}
      </div>

      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {message ? <p className="font-bold text-[#782cff]">{message}</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загружаем…</p> : null}

      {detail && !loading ? (
        <div className="grid gap-6">
          <Card>
            <h2 className="text-xl font-black">Профиль</h2>
            <p className="mt-1 text-sm font-bold text-[#6d6273]">
              Тариф: {detail.profile.plan}
              {detail.profile.plan === "trial"
                ? ` · trial ${detail.profile.trialGenerationsLeft}`
                : ` · gen ${detail.profile.planGenerationsLeft ?? 0}`}
              {" · "}регистрация {formatLocalDateTime(detail.user.createdAt)}
            </p>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSaveProfile}>
              <label className="grid gap-1 text-sm font-bold">
                Имя
                <input
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Пол
                <select
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as typeof gender)}
                >
                  <option value="">—</option>
                  <option value="female">Женский</option>
                  <option value="male">Мужской</option>
                  <option value="other">Другой</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Рост (см)
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Вес (кг)
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Грудь (см)
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={bustCm}
                  onChange={(e) => setBustCm(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Талия (см)
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Бёдра (см)
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Размер одежды
                <input
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={clothingSize}
                  onChange={(e) => setClothingSize(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Обувь EU
                <input
                  type="number"
                  className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-normal"
                  value={shoeSizeEu}
                  onChange={(e) => setShoeSizeEu(e.target.value)}
                />
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving || !configured}>
                  {saving ? "Сохраняем…" : "Сохранить профиль"}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Аватары ({avatarCount})</h2>
            <p className="mt-1 text-sm font-bold text-[#6d6273]">
              Единственный аватар удалить нельзя.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detail.avatars.items.map((avatar) => (
                <div key={avatar.id} className="rounded-2xl border border-[#ffd1ed] p-3">
                  <AdminMediaImage
                    adminKey={adminKey}
                    path={avatar.adminProcessedPhotoUrl ?? avatar.adminOriginalPhotoUrl}
                    alt="Аватар"
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 text-xs font-bold text-[#6d6273]">
                    {avatar.active ? "Активный · " : ""}
                    {avatar.status}
                    {avatar.qualityScore != null ? ` · q=${avatar.qualityScore.toFixed(2)}` : ""}
                  </p>
                  <p className="text-xs font-bold text-[#6d6273]">{formatLocalDateTime(avatar.createdAt)}</p>
                  <Button
                    size="md"
                    variant="secondary"
                    className="mt-2 w-full"
                    disabled={avatarCount <= 1 || actionId === avatar.id || !configured}
                    onClick={() => void onDeleteAvatar(avatar)}
                  >
                    {avatarCount <= 1 ? "Единственный" : "Удалить"}
                  </Button>
                </div>
              ))}
              {detail.avatars.items.length === 0 ? (
                <p className="text-sm font-bold text-[#6d6273]">Нет аватаров</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Примерки ({detail.tryOnSessions.items.length})</h2>
            <p className="mt-1 text-sm font-bold text-[#6d6273]">
              Все сессии пользователя — опубликованные в галерее и приватные.
            </p>
            <div className="mt-4 grid gap-4">
              {detail.tryOnSessions.items.map((session) => (
                <div
                  key={session.sessionId}
                  className="grid gap-4 rounded-2xl border border-[#ffd1ed] p-4 md:grid-cols-[160px_1fr_auto]"
                >
                  <AdminMediaImage
                    adminKey={adminKey}
                    path={session.adminAfterPhotoUrl ?? session.adminGarmentPhotoUrl}
                    alt={session.productTitle}
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-black">{session.productTitle}</p>
                    <p className="mt-1 text-sm font-bold text-[#6d6273]">
                      {statusLabels[session.status] ?? session.status}
                      {" · "}
                      {formatLocalDateTime(session.createdAt)}
                    </p>
                    {session.selectedSize ? (
                      <p className="text-sm font-bold text-[#6d6273]">Размер: {session.selectedSize}</p>
                    ) : null}
                    {session.marketplace ? (
                      <p className="text-sm font-bold text-[#6d6273]">Маркетплейс: {session.marketplace}</p>
                    ) : null}
                    {session.galleryPostId ? (
                      <p className="text-sm font-bold text-[#782cff]">
                        В галерее ({session.galleryVisibility ?? "—"})
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-[#6d6273]">Не в галерее</p>
                    )}
                    {session.errorMessage ? (
                      <p className="mt-1 text-sm font-bold text-[#ff1fa2]">{session.errorMessage}</p>
                    ) : null}
                    {session.productUrl ? (
                      <a
                        href={session.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm font-bold text-[#ff1fa2] underline"
                      >
                        Карточка товара
                      </a>
                    ) : null}
                  </div>
                  <Button
                    size="md"
                    variant="secondary"
                    disabled={actionId === session.sessionId || !configured}
                    onClick={() => void onDeleteTryOn(session)}
                  >
                    Удалить
                  </Button>
                </div>
              ))}
              {detail.tryOnSessions.items.length === 0 ? (
                <p className="text-sm font-bold text-[#6d6273]">Нет примерок</p>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
