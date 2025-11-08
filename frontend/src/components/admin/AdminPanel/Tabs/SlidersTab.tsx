"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAdminListSlidesQuery,
  useAdminDeleteSlideMutation,
  useAdminReorderSlidesMutation,
  useAdminSetSlideStatusMutation,
} from "@/integrations/metahub/rtk/endpoints/slider.endpoints";
import type { SliderAdminListParams, SliderAdminView } from "@/integrations/metahub/db/types/slider";

export function TabsSliders() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [onlyActive, setOnlyActive] = React.useState<boolean>(true);

  const params = React.useMemo<SliderAdminListParams>(() => {
    const p: SliderAdminListParams = { sort: "display_order", order: "asc", limit: 200, offset: 0 };
    if (q.trim()) p.q = q.trim();
    if (onlyActive) p.is_active = true;
    return p;
  }, [q, onlyActive]);

  const { data, isFetching, refetch } = useAdminListSlidesQuery(params);
  const [removeRow, { isLoading: deleting }] = useAdminDeleteSlideMutation();
  const [reorder, { isLoading: reordering }] = useAdminReorderSlidesMutation();
  const [setStatus, { isLoading: toggling }] = useAdminSetSlideStatusMutation();

  const onDelete = async (row: SliderAdminView) => {
    if (!window.confirm(`Silinsin mi?\n${row.name}`)) return;
    try {
      await removeRow(String(row.id)).unwrap();
      toast.success("Silindi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Silme hatası");
    }
  };

  const applyReorder = async (next: SliderAdminView[]) => {
    try {
      const ids = next.map((x) => x.id);
      await reorder({ ids }).unwrap();
      toast.success("Sıralama güncellendi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Sıralama hatası");
    }
  };

  // ✅ TS: noUncheckedIndexedAccess güvenli swap
  const move = (row: SliderAdminView, dir: -1 | 1) => {
    const base = (data ?? []).slice().sort((a, b) => a.display_order - b.display_order);
    const i = base.findIndex((x) => x.id === row.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= base.length) return;
    const a = base[i];
    const b = base[j];
    if (!a || !b) return;
    const next = base.slice();
    next[i] = b;
    next[j] = a;
    applyReorder(next);
  };

  const onToggleActive = async (row: SliderAdminView, v: boolean) => {
    try {
      await setStatus({ id: String(row.id), body: { is_active: v } }).unwrap();
      toast.success(v ? "Aktif edildi" : "Pasif edildi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Durum güncelleme hatası");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
              <div className="grid gap-1">
                <Label>Arama</Label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Başlıkla ara…" />
              </div>
              <div className="flex items-center gap-2 pt-5 sm:pt-0">
                <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
                <span className="text-sm">Sadece aktifler</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => navigate("/admin/sliders/new")}>Yeni Slider</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Görsel</th>
              <th className="px-3 py-2 font-medium">Ad</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Aktif</th>
              <th className="px-3 py-2 font-medium">Öne Çıkar</th>
              <th className="px-3 py-2 font-medium">Sıra</th>
              <th className="px-3 py-2 font-medium">Güncellendi</th>
              <th className="px-3 py-2 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  {row.image_effective_url ? (
                    <img
                      src={row.image_effective_url}
                      crossOrigin="anonymous"
                      className="h-10 w-16 rounded object-cover ring-1 ring-gray-200"
                      alt={row.alt || row.name}
                    />
                  ) : (
                    <div className="h-10 w-16 rounded bg-gray-100 ring-1 ring-gray-200" />
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.name}</div>
                    <div className="truncate text-xs text-gray-500">{row.description || ""}</div>
                  </div>
                </td>
                <td className="px-3 py-2">{row.slug}</td>
                <td className="px-3 py-2">
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={(v) => onToggleActive(row, v)}
                    disabled={toggling || isFetching}
                  />
                </td>
                <td className="px-3 py-2">{row.featured ? "Evet" : "Hayır"}</td>
                <td className="px-3 py-2">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => move(row, -1)} disabled={reordering || isFetching}>
                      ↑
                    </Button>
                    <span>{row.display_order}</span>
                    <Button size="sm" variant="secondary" onClick={() => move(row, +1)} disabled={reordering || isFetching}>
                      ↓
                    </Button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <time dateTime={row.updated_at}>{new Date(row.updated_at).toLocaleString()}</time>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/admin/sliders/${row.id}`)}>
                      Düzenle
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(row)} disabled={deleting || isFetching}>
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {!isFetching && (data?.length ?? 0) === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  Kayıt yok.
                </td>
              </tr>
            )}
            {isFetching && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  Yükleniyor…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TabsSliders;
