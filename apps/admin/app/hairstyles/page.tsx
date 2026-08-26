"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Pill } from "@wibestyle/ui";
import { AdminField } from "@/components/admin-field";
import { useAdminKey } from "@/components/admin-key-provider";
import { AdminMediaImage } from "@/components/admin-media-image";
import { AdminPageShell } from "@/components/admin-page-shell";
import { ADMIN_API_BASE_URL } from "@/lib/api";

type CatalogKind = "hairstyles" | "hair-colors";

type CatalogItem = {
  id: string;
  title: string;
  description: string;
  type?: string;
  family?: string;
  masterNote?: string;
  aiDirective: string;
  imagePath: string;
  imageUrl: string;
  adminImageUrl: string;
  sourceBrand?: string;
  sourceUrl?: string;
  attributionText?: string;
  sortOrder: number;
  active: boolean;
};

type Draft = {
  slug: string;
  title: string;
  description: string;
  type: string;
  family: string;
  masterNote: string;
  aiDirective: string;
  sourceBrand: string;
  sourceUrl: string;
  attributionText: string;
  sortOrder: string;
  active: boolean;
};

const emptyDraft: Draft = {
  slug: "",
  title: "",
  description: "",
  type: "medium",
  family: "Другие",
  masterNote: "",
  aiDirective: "",
  sourceBrand: "Custom",
  sourceUrl: "",
  attributionText: "Фото оттенка добавлено администратором.",
  sortOrder: "999",
  active: true,
};

const tabs: Array<{ id: CatalogKind; label: string; endpoint: string; title: string }> = [
  { id: "hairstyles", label: "Причёски", endpoint: "/api/v1/admin/hairstyles", title: "прическу" },
  { id: "hair-colors", label: "Цвета волос", endpoint: "/api/v1/admin/hair-colors", title: "цвет" },
];

function draftFromItem(item: CatalogItem): Draft {
  return {
    slug: item.id,
    title: item.title,
    description: item.description,
    type: item.type ?? "medium",
    family: item.family ?? "Другие",
    masterNote: item.masterNote ?? "",
    aiDirective: item.aiDirective ?? "",
    sourceBrand: item.sourceBrand ?? "Custom",
    sourceUrl: item.sourceUrl ?? "",
    attributionText: item.attributionText ?? "Фото оттенка добавлено администратором.",
    sortOrder: String(item.sortOrder),
    active: item.active,
  };
}

function payload(kind: CatalogKind, draft: Draft) {
  const base = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    aiDirective: draft.aiDirective.trim(),
    sortOrder: draft.sortOrder,
    active: String(draft.active),
  };
  if (kind === "hairstyles") {
    return {
      ...base,
      slug: draft.slug.trim(),
      type: draft.type.trim() || "medium",
      masterNote: draft.masterNote.trim(),
    };
  }
  return {
    ...base,
    slug: draft.slug.trim(),
    family: draft.family.trim() || "Другие",
    sourceBrand: draft.sourceBrand.trim() || "Custom",
    sourceUrl: draft.sourceUrl.trim(),
    attributionText: draft.attributionText.trim() || "Фото оттенка добавлено администратором.",
  };
}

function inputClass() {
  return "rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold outline-none focus:border-[#ff1fa2]";
}

function withLocalImageVersion(path: string, version: number) {
  return `${path}${path.includes("?") ? "&" : "?"}adminV=${version}`;
}

export default function AdminHairstylesPage() {
  const { adminKey, configured } = useAdminKey();
  const [kind, setKind] = useState<CatalogKind>("hairstyles");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [createDraft, setCreateDraft] = useState<Draft>(emptyDraft);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [createImage, setCreateImage] = useState<File | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tab = useMemo(() => tabs.find((item) => item.id === kind) ?? tabs[0], [kind]);

  const load = useCallback(async () => {
    if (!configured || !adminKey) return;
    const response = await fetch(`${ADMIN_API_BASE_URL}${tab.endpoint}`, {
      headers: { "X-Admin-Key": adminKey },
    });
    if (!response.ok) throw new Error("catalog load failed");
    const data = await response.json();
    setItems(data.items ?? []);
  }, [adminKey, configured, tab.endpoint]);

  useEffect(() => {
    void load().catch(() => setError("Не удалось загрузить каталог"));
  }, [load]);

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  async function uploadImage(endpoint: string, slug: string, file: File) {
    const form = new FormData();
    form.append("image", file);
    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}/${slug}/image`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
      body: form,
    });
    if (!response.ok) throw new Error("image upload failed");
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    resetMessages();
    try {
      const body = payload(kind, createDraft);
      const response = await fetch(`${ADMIN_API_BASE_URL}${tab.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("create failed");
      const slug = createDraft.slug.trim();
      if (createImage) await uploadImage(tab.endpoint, slug, createImage);
      setCreateDraft({ ...emptyDraft });
      setCreateImage(null);
      setImageVersion((value) => value + 1);
      setMessage(`Добавлено: ${body.title || slug}`);
      await load();
    } catch {
      setError("Не удалось добавить запись. Проверьте slug, обязательные поля и размер изображения.");
    }
  }

  async function onSaveEdit() {
    if (!editSlug || !editDraft) return;
    resetMessages();
    try {
      const body = payload(kind, editDraft);
      const response = await fetch(`${ADMIN_API_BASE_URL}${tab.endpoint}/${editSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("update failed");
      if (editImage) await uploadImage(tab.endpoint, editSlug, editImage);
      setEditSlug(null);
      setEditDraft(null);
      setEditImage(null);
      setImageVersion((value) => value + 1);
      setMessage("Запись обновлена");
      await load();
    } catch {
      setError("Не удалось сохранить запись.");
    }
  }

  async function onDeactivate(slug: string) {
    resetMessages();
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}${tab.endpoint}/${slug}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!response.ok) throw new Error("deactivate failed");
      await load();
    } catch {
      setError("Не удалось отключить запись.");
    }
  }

  function startEdit(item: CatalogItem) {
    setEditSlug(item.id);
    setEditDraft(draftFromItem(item));
    setEditImage(null);
    resetMessages();
  }

  function draftFields(draft: Draft, setDraft: (draft: Draft) => void, mode: "create" | "edit") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <AdminField label="Slug" hint="Латиница, цифры, дефис или underscore">
          <input
            className={inputClass()}
            value={draft.slug}
            disabled={mode === "edit"}
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            required
          />
        </AdminField>
        <AdminField label="Порядок">
          <input
            className={inputClass()}
            type="number"
            value={draft.sortOrder}
            onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })}
          />
        </AdminField>
        <AdminField label="Название">
          <input
            className={inputClass()}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            required
          />
        </AdminField>
        {kind === "hairstyles" ? (
          <AdminField label="Тип">
            <input className={inputClass()} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} />
          </AdminField>
        ) : (
          <AdminField label="Семейство цвета">
            <input className={inputClass()} value={draft.family} onChange={(event) => setDraft({ ...draft, family: event.target.value })} />
          </AdminField>
        )}
        <AdminField label="Описание" className="md:col-span-2">
          <textarea
            className={`${inputClass()} min-h-24`}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </AdminField>
        {kind === "hairstyles" ? (
          <AdminField label="Рекомендация стилиста" className="md:col-span-2">
            <textarea
              className={`${inputClass()} min-h-20`}
              value={draft.masterNote}
              onChange={(event) => setDraft({ ...draft, masterNote: event.target.value })}
            />
          </AdminField>
        ) : (
          <>
            <AdminField label="Правообладатель / бренд">
              <input
                className={inputClass()}
                value={draft.sourceBrand}
                onChange={(event) => setDraft({ ...draft, sourceBrand: event.target.value })}
              />
            </AdminField>
            <AdminField label="Ссылка на источник">
              <input
                className={inputClass()}
                value={draft.sourceUrl}
                onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}
              />
            </AdminField>
            <AdminField label="Атрибуция под палитрой" className="md:col-span-2">
              <textarea
                className={`${inputClass()} min-h-20`}
                value={draft.attributionText}
                onChange={(event) => setDraft({ ...draft, attributionText: event.target.value })}
              />
            </AdminField>
          </>
        )}
        <AdminField label="AI-инструкция" className="md:col-span-2">
          <textarea
            className={`${inputClass()} min-h-24`}
            value={draft.aiDirective}
            onChange={(event) => setDraft({ ...draft, aiDirective: event.target.value })}
          />
        </AdminField>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
          Активно в пользовательском каталоге
        </label>
      </div>
    );
  }

  return (
    <AdminPageShell
      pill="Catalog"
      title="Причёски и цвета волос"
      description="Пополняемые каталоги для примерки: превью лежат в storage, записи управляются через БД."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {message ? <p className="font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-xl border px-4 py-2 font-black ${
              kind === item.id ? "border-[#ff1fa2] bg-[#ffecf7] text-[#3d2332]" : "border-[#ffd1ed] bg-white text-[#6d6273]"
            }`}
            onClick={() => {
              setKind(item.id);
              setCreateDraft({ ...emptyDraft });
              setEditSlug(null);
              setEditDraft(null);
              setError(null);
              setMessage(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-black">Добавить {tab.title}</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onCreate}>
          {draftFields(createDraft, setCreateDraft, "create")}
          <AdminField label="Изображение">
            <input className={inputClass()} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCreateImage(event.target.files?.[0] ?? null)} />
          </AdminField>
          <Button type="submit">Добавить</Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{tab.label}</h2>
          <Pill tone="soft">{items.length} записей</Pill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const editing = editSlug === item.id && editDraft;
            return (
              <article key={item.id} className="rounded-xl border border-[#ffd1ed] bg-white p-4">
                <AdminMediaImage
                  adminKey={adminKey}
                  path={withLocalImageVersion(item.adminImageUrl, imageVersion)}
                  alt={item.title}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                {!editing ? (
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="text-xs font-bold text-[#6d6273]">
                          {item.id} · {item.type ?? item.family} · {item.imagePath}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.active ? "bg-emerald-50 text-emerald-700" : "bg-[#f8f4f7] text-[#6d6273]"
                        }`}
                      >
                        {item.active ? "Активно" : "Скрыто"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#6d6273]">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="md" variant="secondary" onClick={() => startEdit(item)}>
                        Редактировать
                      </Button>
                      {item.active ? (
                        <Button size="md" variant="secondary" onClick={() => void onDeactivate(item.id)}>
                          Скрыть
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-4">
                    {draftFields(editDraft, setEditDraft, "edit")}
                    <AdminField label="Заменить изображение">
                      <input
                        className={inputClass()}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setEditImage(event.target.files?.[0] ?? null)}
                      />
                    </AdminField>
                    <div className="flex flex-wrap gap-2">
                      <Button size="md" onClick={() => void onSaveEdit()}>
                        Сохранить
                      </Button>
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => {
                          setEditSlug(null);
                          setEditDraft(null);
                          setEditImage(null);
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {!items.length ? <p className="font-bold text-[#6d6273]">Записей пока нет.</p> : null}
        </div>
      </Card>
    </AdminPageShell>
  );
}
