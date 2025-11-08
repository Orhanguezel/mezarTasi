// =============================================================
// FILE: src/components/admin/AdminPanel/form/SiteSettingFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetSiteSettingAdminByKeyQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";
import { toast } from "sonner";

function tryParseValue(s: string): any {
  const t = s.trim();
  if (!t.length) return "";
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try { return JSON.parse(t); } catch { /* ignore */ }
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

export default function SiteSettingFormPage() {
  const params = useParams<{ "*": string }>(); // react-router v6 wildcard
  // Destek: /admin/site_settings/:key veya /admin/site-settings/:key
  const path = (params?.["*"] || "").replace(/^site[_-]settings\//, "");
  const isNew = path === "new" || !path;
  const keyFromPath = !isNew ? decodeURIComponent(path) : "";

  const navigate = useNavigate();

  const { data: existing, isFetching } = useGetSiteSettingAdminByKeyQuery(keyFromPath, {
    skip: isNew || !keyFromPath,
  });

  const [createSetting, { isLoading: creating }] = useCreateSiteSettingAdminMutation();
  const [updateSetting, { isLoading: updating }] = useUpdateSiteSettingAdminMutation();

  const [key, setKey] = React.useState<string>(keyFromPath || "");
  const [valueStr, setValueStr] = React.useState<string>("");

  React.useEffect(() => {
    if (existing && !isNew) {
      setKey(existing.key);
      setValueStr(toDisplay(existing.value));
    }
  }, [existing, isNew]);

  const onSave = async () => {
    const parsed = tryParseValue(valueStr);
    try {
      if (isNew) {
        const k = key.trim();
        if (!k) {
          toast.error("Key zorunludur");
          return;
        }
        await createSetting({ key: k, value: parsed }).unwrap();
        toast.success("Ayar oluşturuldu");
        navigate("/admin/site-settings");
      } else {
        await updateSetting({ key, value: parsed }).unwrap();
        toast.success("Ayar güncellendi");
        navigate("/admin/site-settings");
      }
    } catch (e) {
      toast.error("Kayıt başarısız");
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            {isNew ? "Yeni Ayar" : `Ayar: ${keyFromPath}`}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/site-settings")}>
              Geri
            </Button>
            <Button onClick={onSave} disabled={creating || updating || isFetching}>
              Kaydet
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Key</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} disabled={!isNew} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Value (string/number/boolean/json)
            </label>
            <Textarea
              rows={12}
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder={`"Merhaba"\n123\ntrue\n{"a":1}\n["a","b"]`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
