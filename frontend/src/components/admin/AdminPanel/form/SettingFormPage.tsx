// =============================================================
// FILE: src/components/admin/AdminPanel/form/SettingFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import TabsSettings from "@/components/admin/AdminPanel/Tabs/TabsSettings";
import { useGetUserAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";
import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";

export default function SettingFormPage() {
  const { id } = useParams() as { id?: string };
  const navigate = useNavigate();

  // id zorunlu; yoksa uyarı göster
  const userId = id ?? "";
  const hasId = Boolean(userId);

  const { data: user } = useGetUserAdminQuery(userId, { skip: !hasId });

  const onBack = (): void => {
    if (window.history.length) {
      window.history.back();
    } else {
      navigate("/admin/users");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Hesap Güvenliği</span>
        </div>
      </div>

      {!hasId ? (
        <Section title="Kullanıcı bulunamadı">
          <p className="text-sm text-red-600">
            URL parametresinden kullanıcı kimliği (id) alınamadı. Lütfen /admin/users üzerinden bir kullanıcı seçin.
          </p>
        </Section>
      ) : (
        <>
          {/* Üst bilgi (opsiyonel) */}
          <Section title="Kullanıcı">
            <div className="text-sm text-gray-700">
              <div><b>ID:</b> {userId}</div>
              <div><b>Email:</b> {user?.email ?? "—"}</div>
            </div>
          </Section>

          {/* Tabs: sadece Şifre sekmesi aktif (email sekmesini TabsSettings içinde yorumdan açabilirsin) */}
          <TabsSettings userId={userId} defaultTab="password" />
        </>
      )}
    </div>
  );
}
