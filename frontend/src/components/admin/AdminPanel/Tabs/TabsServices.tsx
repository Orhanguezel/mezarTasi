// src/components/admin/AdminPanel/Tabs/CampaignsTab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useListCampaignsAdminQuery,
  useUpdateCampaignAdminMutation,
  useDeleteCampaignAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/campaigns_admin.endpoints";
import type { SimpleCampaignView, AdminListParams } from "@/integrations/metahub/db/types/campaigns";
import { toast } from "sonner";

export default function TabsCampaigns() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const params = useMemo<AdminListParams>(() => {
    const o: AdminListParams = { sort: "updated_at", order: "desc", limit: 50, offset: 0 };
    const qv = q.trim();
    if (qv) o.q = qv;
    if (onlyActive) o.is_active = true;
    return o;
  }, [q, onlyActive]);

  const { data, isFetching, refetch } = useListCampaignsAdminQuery(params);
  const [updateCampaign, { isLoading: updating }] = useUpdateCampaignAdminMutation();
  const [deleteCampaign, { isLoading: deleting }] = useDeleteCampaignAdminMutation();

  async function handleToggleActive(row: SimpleCampaignView) {
    try {
      await updateCampaign({ id: row.id, body: { is_active: !row.is_active } }).unwrap();
      toast.success(row.is_active ? "Pasifleştirildi." : "Aktifleştirildi.");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Güncellenemedi.");
    }
  }

  async function handleDelete(row: SimpleCampaignView) {
    if (!confirm(`"${row.title}" kampanyasını silmek istiyor musunuz?`)) return;
    try {
      await deleteCampaign(row.id).unwrap();
      toast.success("Silindi.");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Silinemedi.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kampanya ara..." />
          </div>
          <div className="flex items-center gap-2 rounded-md border px-3 h-10">
            <Label htmlFor="onlyActive" className="text-sm text-gray-600">Sadece aktif</Label>
            <Switch id="onlyActive" checked={onlyActive} onCheckedChange={setOnlyActive} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/admin/campaigns/new")}>Yeni Kampanya</Button>
          <Button variant="secondary" onClick={() => refetch()}>Yenile</Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left w-16">Görsel</th>
              <th className="px-3 py-2 text-left">Başlık</th>
              <th className="px-3 py-2 text-left">Açıklama</th>
              <th className="px-3 py-2 text-left">Aktif</th>
              <th className="px-3 py-2 text-left">Güncellendi</th>
              <th className="px-3 py-2 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  {row.image_effective_url || row.image_url ? (
                    <img
                      src={(row.image_effective_url || row.image_url) as string}
                      alt={(row as any).alt || "campaign"}
                      className="h-12 w-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100 grid place-items-center text-[10px] text-gray-400">—</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {(row.seo_keywords || []).slice(0, 4).join(", ")}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="max-w-[360px] text-gray-700 line-clamp-2">{row.description}</div>
                </td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    variant={row.is_active ? "secondary" : "outline"}
                    disabled={isFetching || updating}
                    onClick={() => handleToggleActive(row)}
                  >
                    {row.is_active ? "Aktif" : "Pasif"}
                  </Button>
                </td>
                <td className="px-3 py-2 text-gray-600">
                  <div className="text-xs">{row.updated_at || "—"}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/campaigns/${encodeURIComponent(row.id)}`)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isFetching || deleting}
                      onClick={() => handleDelete(row)}
                    >
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {!isFetching && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-gray-500">Kayıt bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
