// =============================================================
// FILE: src/pages/admin/AdminPanel/index.tsx
// =============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

import { TabsProducts } from "./Tabs/ProductsTab";
import { TabsSliders } from "./Tabs/SlidersTab";
import { TabsKeywords } from "./Tabs/KeywordsTab";
import { TabsCampaigns } from "./Tabs/CampaignsTab";
import { CategoriesCard } from "./parts/CategoriesCard";
import { SubCategoriesCard } from "./parts/SubCategoriesCard";
import { TabsPages } from "./Tabs/PagesTab";
import { TabsMenu } from "./Tabs/MenuTab";
import TabsPopups from "./Tabs/PopupsTab"; // 👈 yeni: Popups sekmesi

import AdminLayout, { ActiveTab } from "@/components/layout/AdminLayout";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminFooter from "@/components/layout/AdminFooter";

type AdminPanelProps = { onNavigate: (page: string) => void };

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { data: authStatus, isFetching: statusFetching, refetch: refetchStatus } = useStatusQuery();

  // Projede başka yerlerde kullanılabilir; burada tutuyoruz (lint uyarısı olmasın diye destructure ediliyor)
  const { refreshProducts, refreshSliders, refreshKeywords, refreshCampaigns } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refetchStatus();
    const onFocus = () => refetchStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchStatus]);

  useEffect(() => {
    if (statusFetching) {
      setLoading(true);
      return;
    }
    setLoading(false);

    if (authStatus?.authenticated && authStatus.is_admin) {
      setIsAuthorized(true);
      setDebugInfo("RTK status: authenticated & admin");
    } else {
      setIsAuthorized(false);
      setDebugInfo(`RTK status: ${authStatus?.authenticated ? "user (not admin)" : "unauthenticated"}`);
    }
  }, [authStatus, statusFetching]);

  const handleImportFile = () => {};
  const handleImportClick = () => {};
  const handleExport = () => {
    toast.info("Dışa aktarma bu sayfada devre dışı. RTK ile DB kullanılıyor.");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <h2 className="mb-2 text-lg font-medium">Admin Panel Yükleniyor</h2>
          {debugInfo && (
            <div className="mb-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-500">
              <p className="mb-1 font-medium">Debug:</p>
              <p>{debugInfo}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-lg font-medium text-red-600">Yetkisiz Erişim</h2>
          <p className="mb-4 text-gray-500">Admin paneline erişim yetkiniz bulunmuyor. Lütfen giriş yapın.</p>
          {debugInfo && (
            <div className="mb-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-500">
              <p className="mb-1 font-medium">Debug Info:</p>
              <p>{debugInfo}</p>
            </div>
          )}
          <div className="flex justify-center gap-3">
            <Button onClick={() => onNavigate("adminAccess")} className="bg-teal-500 text-white hover:bg-teal-600">
              Admin Girişi
            </Button>
            <Button onClick={() => onNavigate("home")} variant="outline">
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t)}
      onNavigateHome={() => onNavigate("home")}
      onNavigateLogin={() => onNavigate("adminAccess")}
      header={
        <AdminHeader
          importInputRef={importInputRef}
          onImportFile={handleImportFile}
          onExport={handleExport}
          onImportClick={handleImportClick}
          onBackHome={() => {
            localStorage.removeItem("mh_access_token");
            localStorage.removeItem("mh_refresh_token");
            onNavigate("home");
          }}
        />
      }
      footer={<AdminFooter />}
    >
      {/* Ürünler */}
      {activeTab === "products" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Ürünler</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsProducts />
          </CardContent>
        </Card>
      )}

      {/* Slider */}
      {activeTab === "slider" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Slider Yönetimi</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsSliders />
          </CardContent>
        </Card>
      )}

      {/* Keywords */}
      {activeTab === "keywords" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Son Çalışmalarımız - Anahtar Kelimeler</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsKeywords />
          </CardContent>
        </Card>
      )}

      {/* Kampanyalar */}
      {activeTab === "campaigns" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Duyuru / Kampanyalar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsCampaigns />
          </CardContent>
        </Card>
      )}

      {/* Popuplar — ✅ yeni sekme */}
      {activeTab === "popups" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Popuplar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsPopups />
          </CardContent>
        </Card>
      )}

      {/* Menü */}
      {activeTab === "menu" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Menü</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsMenu />
          </CardContent>
        </Card>
      )}

      {/* Kategoriler */}
      {activeTab === "categories" && <CategoriesCard />}

      {/* Alt Kategoriler */}
      {activeTab === "subcategories" && <SubCategoriesCard />}

      {/* Sayfalar */}
      {activeTab === "pages" && (
        <Card className="border border-gray-200 shadow-none">
          <CardHeader className="border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Sayfalar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <TabsPages />
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
