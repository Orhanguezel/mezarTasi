"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useListAnnouncementsAdminQuery,
  useDeleteAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints";
import type { AdminAnnouncementsListQuery } from "@/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints";

export default function TabsAnnouncements() {
  const navigate = useNavigate();

  const [search, setSearch] = React.useState("");
  const [activeOnly, setActiveOnly] = React.useState<boolean>(true);
  const [publishedOnly, setPublishedOnly] = React.useState<boolean>(true);
  const [includeExpired, setIncludeExpired] = React.useState<boolean>(false);
  const [sort, setSort] = React.useState<AdminAnnouncementsListQuery["sort"]>("display_order");
  const [order, setOrder] = React.useState<AdminAnnouncementsListQuery["order"]>("asc");

  const debouncedSearch = useDebounce(search, 350);

  const listParams: AdminAnnouncementsListQuery = {
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(typeof activeOnly === "boolean" ? { is_active: activeOnly } : {}),
    ...(typeof publishedOnly === "boolean" ? { is_published: publishedOnly } : {}),
    ...(typeof includeExpired === "boolean" ? { include_expired: includeExpired } : {}),
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
  };

  const { data: rows = [], isFetching, refetch } = useListAnnouncementsAdminQuery(listParams);
  const [removeOne, { isLoading: deleting }] = useDeleteAnnouncementAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateAnnouncementAdminMutation();

  const handleNew = () => navigate("/admin/announcements/new");
  const handleEdit = (id: string) => navigate(`/admin/announcements/${id}`);

  const toggleActive = async (id: string, next: boolean) => {
    try { await updateOne({ id, patch: { is_active: next } }).unwrap(); refetch(); }
    catch { toast.error("Aktif/pasif güncellenemedi"); }
  };

  const togglePublished = async (id: string, next: boolean) => {
    try { await updateOne({ id, patch: { is_published: next } }).unwrap(); refetch(); }
    catch { toast.error("Yayın durumu güncellenemedi"); }
  };

  const bumpOrder = async (id: string, curr: number, delta: number) => {
    try {
      const next = Math.max(1, (curr || 1) + delta);
      await updateOne({ id, patch: { display_order: next } }).unwrap();
      refetch();
    } catch { toast.error("Sıra güncellenemedi"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Duyuruyu silmek istiyor musunuz?")) return;
    try { await removeOne(id).unwrap(); toast.success("Silindi"); refetch(); }
    catch { toast.error("Silme başarısız"); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2">
            <Label htmlFor="ann-q" className="text-xs text-gray-600">Ara</Label>
            <Input
              id="ann-q"
              placeholder="Başlık, açıklama…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch id="ann-active" checked={activeOnly} onCheckedChange={(v) => setActiveOnly(!!v)} />
            <Label htmlFor="ann-active" className="text-sm text-gray-700">Yalnızca aktif</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch id="ann-pub" checked={publishedOnly} onCheckedChange={(v) => setPublishedOnly(!!v)} />
            <Label htmlFor="ann-pub" className="text-sm text-gray-700">Yalnızca yayınlanan</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch id="ann-exp" checked={includeExpired} onCheckedChange={(v) => setIncludeExpired(!!v)} />
            <Label htmlFor="ann-exp" className="text-sm text-gray-700">Süresi geçenleri de göster</Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="display_order">Sıra</option>
              <option value="created_at">Oluşturma</option>
              <option value="updated_at">Güncelleme</option>
            </select>
            <select
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm"
              value={order}
              onChange={(e) => setOrder(e.target.value as any)}
            >
              <option value="asc">Artan</option>
              <option value="desc">Azalan</option>
            </select>
          </div>
          <Button onClick={handleNew} className="bg-emerald-600 text-white hover:bg-emerald-700">
            Yeni Duyuru
          </Button>
        </div>
      </div>

      {/* Liste */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-left text-gray-700">
              {["Sıra","Başlık","Açıklama","Aktif","Yayın","İşlem"].map((h, i) => (
                <th key={i} className="border-b border-gray-200 p-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-600">Yükleniyor…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-600">Kayıt yok</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="odd:bg-gray-50/40 hover:bg-gray-100/40">
                  <td className="border-b border-gray-200 p-2">
                    <div className="flex items-center gap-2">
                      <Button aria-label="Sırayı azalt" size="sm" variant="outline" onClick={() => bumpOrder(r.id, r.display_order ?? 1, -1)}>-</Button>
                      <span className="min-w-[2ch] text-center">{r.display_order ?? 1}</span>
                      <Button aria-label="Sırayı artır" size="sm" variant="outline" onClick={() => bumpOrder(r.id, r.display_order ?? 1, +1)}>+</Button>
                    </div>
                  </td>
                  <td className="border-b border-gray-200 p-2">
                    <div className="line-clamp-2 font-medium text-gray-900">{r.title}</div>
                  </td>
                  <td className="border-b border-gray-200 p-2">
                    <div className="line-clamp-2 text-gray-700">{r.description}</div>
                  </td>
                  <td className="border-b border-gray-200 p-2">
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggleActive(r.id, !!v)} />
                  </td>
                  <td className="border-b border-gray-200 p-2">
                    <Switch checked={r.is_published} onCheckedChange={(v) => togglePublished(r.id, !!v)} />
                  </td>
                  <td className="border-b border-gray-200 p-2">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(r.id)}>Düzenle</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting || updating}
                      >
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
