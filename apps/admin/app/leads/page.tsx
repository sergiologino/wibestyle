"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import type { LandingLeadRecord, LandingLeadStatus } from "@wibestyle/shared-types";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminField } from "@/components/admin-field";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

const statuses: LandingLeadStatus[] = ["new", "contacted", "converted", "rejected"];

export default function AdminLeadsPage() {
  const { adminKey, configured } = useAdminKey();
  const [items, setItems] = useState<LandingLeadRecord[]>([]);
  const [remainingSpots, setRemainingSpots] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LandingLeadStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const api = createAdminApi();

  const load = useCallback(async (key: string, status?: LandingLeadStatus) => {
    setLoading(true);
    const data = await api.listAdminLeads(key, status);
    setItems(data.items);
    setRemainingSpots(data.remainingSpots);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey).catch(() => setError("Не удалось загрузить заявки"));
    }
  }, [load, configured, adminKey]);

  async function onFilterChange(next: LandingLeadStatus | "") {
    setStatusFilter(next);
    if (!adminKey) return;
    try {
      await load(adminKey, next || undefined);
    } catch {
      setError("Не удалось применить фильтр");
    }
  }

  async function onStatusChange(leadId: string, status: LandingLeadStatus) {
    try {
      await api.updateAdminLeadStatus(adminKey, leadId, status);
      await load(adminKey, statusFilter || undefined);
    } catch {
      setError("Не удалось обновить статус");
    }
  }

  async function onExportCsv() {
    try {
      const csv = await api.exportAdminLeadsCsv(adminKey, statusFilter || undefined);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "landing-leads.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось экспортировать CSV");
    }
  }

  return (
    <AdminPageShell
      pill="Заявки"
      title="Leads с лендинга"
      description={`Осталось мест со скидкой: ${remainingSpots}`}
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!configured} onClick={() => void onExportCsv()}>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={statusFilter === "" ? "primary" : "secondary"} onClick={() => void onFilterChange("")}>
          Все
        </Button>
        {statuses.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "primary" : "secondary"}
            onClick={() => void onFilterChange(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#782cff]">
                  №{item.spotNumber} · {item.status}
                </p>
                <p className="mt-2 text-xl font-black">{item.phoneOrEmail}</p>
                {item.name ? <p className="font-bold text-[#302637]">{item.name}</p> : null}
                <p className="mt-2 text-sm font-bold text-[#6d6273]">
                  {item.interest ?? "clothing"} · {item.favoriteMarketplace ?? "—"} ·{" "}
                  {formatLocalDateTime(item.createdAt)}
                </p>
                {item.page ? <p className="text-sm font-bold text-[#6d6273]">page: {item.page}</p> : null}
              </div>
              <AdminField label="Статус заявки">
              <select
                className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold"
                value={item.status}
                onChange={(event) => void onStatusChange(item.id, event.target.value as LandingLeadStatus)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              </AdminField>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 ? (
          <p className="font-bold text-[#6d6273]">Заявок пока нет</p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
