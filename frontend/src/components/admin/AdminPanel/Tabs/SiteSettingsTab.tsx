// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/SiteSettingsTab.tsx
// =============================================================
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useListSiteSettingsAdminQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
  type SiteSetting,
} from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";

type PrefixTab = "all" | "seo_" | "contact_" | "home_";

const PREFIX_LABEL: Record<PrefixTab, string> = {
  all: "Tümü",
  seo_: "SEO",
  contact_: "İletişim",
  home_: "Ana Sayfa",
};

function tryParseValue(s: string): any {
  const t = s.trim();
  if (!t.length) return "";
  // json?
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try { return JSON.parse(t); } catch { /* fallthrough */ }
  }
  if (t === "true") return true;
  if (t === "false") return false;
  const num = Number(t);
  if (!Number.isNaN(num) && t !== "") return num;
  return t;
}

function toDisplay(v: unknown): string {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

export default function TabsSiteSettings() {
  const [prefixTab, setPrefixTab] = React.useState<PrefixTab>("all");
  const [search, setSearch] = React.useState("");

  const params = React.useMemo(() => {
    const out: any = { sort: "key", order: "asc" as const };
    if (prefixTab !== "all") out.prefix = prefixTab;
    if (search.trim()) out.q = search.trim();
    return out;
  }, [prefixTab, search]);

  const { data = [], isFetching, refetch } = useListSiteSettingsAdminQuery(params);

  const [createSetting, { isLoading: creating }] = useCreateSiteSettingAdminMutation();
  const [updateSetting, { isLoading: updating }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: deleting }] = useDeleteSiteSettingAdminMutation();

  // Create modal
  const [openNew, setOpenNew] = React.useState(false);
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  // Edit modal
  const [editing, setEditing] = React.useState<SiteSetting | null>(null);
  const [editValue, setEditValue] = React.useState("");

  const onCreate = async () => {
    const key = newKey.trim();
    if (!key) {
      toast.error("Key zorunludur");
      return;
    }
    try {
      const value = tryParseValue(newValue);
      await createSetting({ key, value }).unwrap();
      toast.success("Ayar oluşturuldu");
      setOpenNew(false);
      setNewKey("");
      setNewValue("");
      refetch();
    } catch (e) {
      toast.error("Ayar oluşturulamadı");
    }
  };

  const onSave = async () => {
    if (!editing) return;
    try {
      const value = tryParseValue(editValue);
      await updateSetting({ key: editing.key, value }).unwrap();
      toast.success("Ayar güncellendi");
      setEditing(null);
      refetch();
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  const onDelete = async (key: string) => {
    if (!confirm(`${key} silinsin mi?`)) return;
    try {
      await deleteSetting(key).unwrap();
      toast.success("Silindi");
      refetch();
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="flex gap-2">
          {(["all", "seo_", "contact_", "home_"] as PrefixTab[]).map((t) => (
            <Button
              key={t}
              variant={t === prefixTab ? "default" : "outline"}
              onClick={() => setPrefixTab(t)}
              className={t === prefixTab ? "" : "bg-white"}
              size="sm"
            >
              {PREFIX_LABEL[t]}
              {t !== "all" && <Badge variant="outline" className="ml-2">{t}</Badge>}
            </Button>
          ))}
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">Ara</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="key veya açıklama"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            Yenile
          </Button>
          <Button onClick={() => setOpenNew(true)}>+ Yeni Ayar</Button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Key</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">Güncel</th>
              <th className="px-3 py-2 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.key} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                <td className="px-3 py-2">
                  <pre className="max-w-[640px] whitespace-pre-wrap break-words text-[12px] leading-5">
                    {toDisplay(r.value)}
                  </pre>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(r);
                        setEditValue(toDisplay(r.value));
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r.key)}>
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isFetching && data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {openNew && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Yeni Ayar</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setOpenNew(false)}>
                Kapat
              </button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Key</label>
                <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="örn: seo_home_title" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Value (string/number/boolean/json)</label>
                <Textarea rows={6} value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={`"Merhaba"\n123\ntrue\n{"a":1}\n["a","b"]`} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenNew(false)}>İptal</Button>
              <Button onClick={onCreate} disabled={creating}>Oluştur</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Ayar Düzenle</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setEditing(null)}>
                Kapat
              </button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Key</label>
                <Input value={editing.key} disabled />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Value</label>
                <Textarea rows={8} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>İptal</Button>
              <Button onClick={onSave} disabled={updating}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
