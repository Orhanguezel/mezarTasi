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
  useAdminListAccessoriesQuery,
  useAdminDeleteAccessoryMutation,
} from "@/integrations/metahub/rtk/endpoints/accessories.endpoints";
import type { AccessoriesAdminListParams, AccessoryAdminView, AccessoryKey } from "@/integrations/metahub/db/types/accessories";

const CATEGORIES: AccessoryKey[] = ["suluk", "sutun", "vazo", "aksesuar"];

export function TabsAccessories() {
  const navigate = useNavigate();

  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<AccessoryKey | "">("");
  const [onlyActive, setOnlyActive] = React.useState<boolean>(true);

  const params = React.useMemo<AccessoriesAdminListParams>(() => {
  const p: AccessoriesAdminListParams = {
    sort: "display_order",
    order: "asc",
    limit: 100,
    offset: 0,
  };

  if (q) p.q = q;
  if (category) p.category = category as AccessoryKey;
  if (onlyActive) p.is_active = true; 

  return p;
}, [q, category, onlyActive]);

  const { data, isFetching, refetch } = useAdminListAccessoriesQuery(params);
  const [removeRow, { isLoading: deleting }] = useAdminDeleteAccessoryMutation();

  const onDelete = async (row: AccessoryAdminView) => {
    if (!window.confirm(`Silinsin mi?\n${row.name}`)) return;
    try {
      await removeRow(String(row.id)).unwrap();
      toast.success("Silindi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Silme hatası");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border border-gray-200 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <div className="grid gap-1">
                <Label>Arama</Label>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="İsimle ara…"
                />
              </div>
              <div className="grid gap-1">
                <Label>Kategori</Label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="">Tümü</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5 sm:pt-0">
                <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
                <span className="text-sm">Sadece aktifler</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => navigate("/admin/accessories/new")}>Yeni Aksesuar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Ad</th>
              <th className="px-3 py-2 font-medium">Kategori</th>
              <th className="px-3 py-2 font-medium">Fiyat</th>
              <th className="px-3 py-2 font-medium">Öne Çıkar</th>
              <th className="px-3 py-2 font-medium">Aktif</th>
              <th className="px-3 py-2 font-medium">Sıra</th>
              <th className="px-3 py-2 font-medium">Güncellendi</th>
              <th className="px-3 py-2 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(data || []).map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {row.image_effective_url ? (
                      <img
                        src={row.image_effective_url}
                        crossOrigin="anonymous"
                        className="h-8 w-8 rounded object-cover ring-1 ring-gray-200"
                        alt={row.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gray-100 ring-1 ring-gray-200" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.name}</div>
                      <div className="truncate text-xs text-gray-500">{row.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{row.category}</td>
                <td className="px-3 py-2">{row.price}</td>
                <td className="px-3 py-2">{row.featured ? "Evet" : "Hayır"}</td>
                <td className="px-3 py-2">{row.is_active ? "Evet" : "Hayır"}</td>
                <td className="px-3 py-2">{row.display_order}</td>
                <td className="px-3 py-2">
                  <time dateTime={row.updated_at}>
                    {new Date(row.updated_at).toLocaleString()}
                  </time>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/admin/accessories/${row.id}`)}>
                      Düzenle
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onDelete(row)}
                      disabled={deleting || isFetching}
                    >
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

export default TabsAccessories;
