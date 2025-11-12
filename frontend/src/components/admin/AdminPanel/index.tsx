// =============================================================
// FILE: src/components/admin/AdminPanel/index.tsx
// =============================================================
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import { toast } from "sonner";

import AdminLayout, { ActiveTab } from "@/components/layout/AdminLayout";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminFooter from "@/components/layout/AdminFooter";

// SQL import/export RTK
import {
  useExportSqlMutation,
  useImportSqlMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/db_admin.endpoints";

// Form sayfaları
import ProductFormPage from "@/components/admin/AdminPanel/form/ProductFormPage";
import CategoryFormPage from "@/components/admin/AdminPanel/form/CategoryFormPage";
import SubCategoryFormPage from "@/components/admin/AdminPanel/form/SubCategoryFormPage";
import CustomPageFormPage from "@/components/admin/AdminPanel/form/CustomPageFormPage";
import FAQForm from "./form/FAQForm";
import UserFormPage from "./form/UserFormPage";
import CampaignFormPage from "./form/CampaignFormPage";
import RecentWorkFormPage from "./form/RecentWorkFormPage";
import ContactFormPage from "./form/ContactFormPage";
import ServiceFormPage from "./form/ServiceFormPage";
import AccessoryFormPage from "./form/AccessoryFormPage";
import SliderFormPage from "./form/SliderFormPage";
import ReviewFormPage from "./form/ReviewFormPage";
import SettingFormPage from "./form/SettingFormPage";
import AnnouncementForm from "./form/AnnouncementForm";

// Tab sayfaları
import { TabsProducts } from "./Tabs/TabsProducts";
import CategoriesTabs from "./Tabs/CategoriesTab";
import SubCategoriesTab from "./Tabs/SubCategoriesTab";
import TabsPages from "./Tabs/PagesTab";
import TabsFAQ from "./Tabs/FAQTab";
import TabsUsers from "./Tabs/TabsUser";
import TabsCampaigns from "./Tabs/CampaignsTab";
import TabsRecentWorks from "./Tabs/RecentWorksTab";
import TabsContacts from "./Tabs/ContactsTab";
import TabsServices from "./Tabs/TabsServices";
import TabsAccessories from "./Tabs/TabsAccessories";
import SlidersTab from "./Tabs/SlidersTab";
import ReviewsTab from "./Tabs/ReviewsTab";
import TabsAnnouncements from "./Tabs/AnnouncementsTab";
import TabsSiteSettings from "./Tabs/SiteSettingsTab";
import TabsSettings from "./Tabs/TabsSettings";

// ✅ Dashboard doğru konum
import AdminDashboard from "./AdminDashboard";

type AdminPanelProps = { onNavigate: (page: string) => void };

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { data: authStatus, isFetching: statusFetching, refetch: refetchStatus } = useStatusQuery();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [exportSql] = useExportSqlMutation();
  const [importSql] = useImportSqlMutation();

  const isFormRoute = (segment: string) =>
    pathname === `/admin/${segment}/new` ||
    new RegExp(`^/admin/${segment}/[^/]+$`).test(pathname);

  const isProductFormRoute = isFormRoute("products");
  const isCategoryFormRoute = isFormRoute("categories");
  const isSubCategoryFormRoute = isFormRoute("subcategories");
  const isCustomPageFormRoute = isFormRoute("pages");
  const isFAQFormRoute = isFormRoute("faqs");
  const isAnnouncementFormRoute = isFormRoute("announcements");
  const isUserFormRoute = isFormRoute("users");
  const isSimpleCampaignFormRoute = isFormRoute("campaigns");
  const isRecentWorkFormRoute =
    pathname === "/admin/recent_works/new" ||
    pathname === "/admin/recent-works/new" ||
    /^\/admin\/recent[_-]works\/[^/]+$/.test(pathname);
  const isContactFormRoute = isFormRoute("contacts");
  const isServiceFormRoute = isFormRoute("services");
  const isAccessoryFormRoute = isFormRoute("accessories");
  const isSliderFormRoute = isFormRoute("sliders");
  const isReviewFormRoute = isFormRoute("reviews");
  const isSiteSettingFormRoute =
    pathname === "/admin/site_settings/new" ||
    pathname === "/admin/site-settings/new" ||
    /^\/admin\/site[_-]settings\/[^/]+$/.test(pathname);
  const isSettingFormRoute = isFormRoute("settings");

  const isAnyFormRoute =
    isProductFormRoute ||
    isCategoryFormRoute ||
    isSubCategoryFormRoute ||
    isCustomPageFormRoute ||
    isFAQFormRoute ||
    isAnnouncementFormRoute ||
    isUserFormRoute ||
    isSimpleCampaignFormRoute ||
    isRecentWorkFormRoute ||
    isContactFormRoute ||
    isServiceFormRoute ||
    isAccessoryFormRoute ||
    isReviewFormRoute ||
    isSliderFormRoute ||
    isSettingFormRoute;

  const isRootAdmin = pathname === "/admin";

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
    setIsAuthorized(!!(authStatus?.authenticated && authStatus.is_admin));
  }, [authStatus, statusFetching]);

  // ✅ Form rotasındayken ilgili sekmeyi aktif tut
  useEffect(() => {
    if (isProductFormRoute && activeTab !== "products") setActiveTab("products");
    if (isCategoryFormRoute && activeTab !== "categories") setActiveTab("categories");
    if (isSubCategoryFormRoute && activeTab !== "subcategories") setActiveTab("subcategories");
    if (isCustomPageFormRoute && activeTab !== "pages") setActiveTab("pages");
    if (isFAQFormRoute && activeTab !== "faqs") setActiveTab("faqs");
    if (isAnnouncementFormRoute && activeTab !== "announcements") setActiveTab("announcements");
    if (isUserFormRoute && activeTab !== "users") setActiveTab("users");
    if (isSimpleCampaignFormRoute && activeTab !== "campaigns") setActiveTab("campaigns");
    if (isRecentWorkFormRoute && activeTab !== "recent_works") setActiveTab("recent_works");
    if (isContactFormRoute && activeTab !== "contacts") setActiveTab("contacts");
    if (isServiceFormRoute && activeTab !== "services") setActiveTab("services");
    if (isAccessoryFormRoute && activeTab !== "accessories") setActiveTab("accessories");
    if (isSliderFormRoute && activeTab !== "sliders") setActiveTab("sliders");
    if (isReviewFormRoute && activeTab !== "reviews") setActiveTab("reviews");
    if (isSiteSettingFormRoute && activeTab !== "sitesettings") setActiveTab("sitesettings");
    if (isSettingFormRoute && activeTab !== "settings") setActiveTab("settings");
    if (isRootAdmin && activeTab !== "dashboard") setActiveTab("dashboard");
  }, [
    isProductFormRoute,
    isCategoryFormRoute,
    isSubCategoryFormRoute,
    isCustomPageFormRoute,
    isFAQFormRoute,
    isAnnouncementFormRoute,
    isUserFormRoute,
    isSimpleCampaignFormRoute,
    isRecentWorkFormRoute,
    isContactFormRoute,
    isServiceFormRoute,
    isAccessoryFormRoute,
    isSliderFormRoute,
    isReviewFormRoute,
    isSiteSettingFormRoute,
    isSettingFormRoute,
    activeTab,
    isRootAdmin,
  ]);

  // ✅ Sekmeye tıklanınca ilgili route’a git
  const handleTabChange = useCallback(
    (t: ActiveTab) => {
      const map: Record<ActiveTab, string> = {
        dashboard: "",
        products: "products",
        services: "services",
        campaigns: "campaigns",
        sliders: "sliders",
        categories: "categories",
        subcategories: "subcategories",
        accessories: "accessories",
        pages: "pages",
        faqs: "faqs",
        reviews: "reviews",
        contacts: "contacts",
        announcements: "announcements",
        recent_works: "recent_works",
        sitesettings: "sitesettings",
        users: "users",
        settings: "settings",
      };

      setActiveTab(t);
      if ((map as any)[t] === "") {
        navigate("/admin", { replace: false });
      } else if (map[t]) {
        navigate(`/admin/${map[t]}`, { replace: false });
      }
    },
    [navigate]
  );

  // ✅ Formda değilsek URL segmentinden aktif sekmeyi eşle
  useEffect(() => {
    if (isAnyFormRoute) return;
    const m = pathname.match(/^\/admin\/([a-z_-]+)$/);
    if (!m) return;
    const seg = m[1];

    const map: Record<string, ActiveTab> = {
      products: "products",
      services: "services",
      campaigns: "campaigns",
      sliders: "sliders",
      categories: "categories",
      subcategories: "subcategories",
      accessories: "accessories",
      pages: "pages",
      faqs: "faqs",
      reviews: "reviews",
      contacts: "contacts",
      announcements: "announcements",
      recent_works: "recent_works",
      "recent-works": "recent_works",
      sitesettings: "sitesettings",
      site_settings: "sitesettings",
      "site-settings": "sitesettings",
      users: "users",
      settings: "settings",
      dashboard: "dashboard",
    };

    const next = map[seg as keyof typeof map] as ActiveTab | undefined;
    if (next && activeTab !== next) setActiveTab(next);
  }, [pathname, isAnyFormRoute, activeTab]);

  /* ================== SQL İçe/Dışa Aktarma ================== */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (file?: File | null) => {
  if (!file) return;

  // ❗ ZIP desteği yok
  if (!/(\.sql|\.gz)$/i.test(file.name)) {
    toast.error("Lütfen .sql veya .gz dosyası seçin.");
    if (importInputRef.current) importInputRef.current.value = "";
    return;
  }

  const ok = window.confirm(
    `Seçilen dosya: ${file.name}\n\nBu işlem geri alınamaz. Devam edilsin mi?`
  );
  if (!ok) {
    if (importInputRef.current) importInputRef.current.value = "";
    return;
  }
  try {
    toast.loading("SQL içe aktarılıyor…", { id: "sql-import" });

    // alias: useImportSqlMutation -> /admin/db/import-file
    const res = await importSql({ file, truncate_before_import: true }).unwrap();

    toast.success(res?.message || "İçe aktarma tamamlandı.", { id: "sql-import" });
  } catch (err: any) {
    const msg =
      err?.data?.error ||
      err?.data?.message ||
      err?.error ||
      "İçe aktarma başarısız.";
    toast.error(msg, { id: "sql-import" });
  } finally {
    if (importInputRef.current) importInputRef.current.value = "";
  }
};


  const handleExport = async () => {
  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(
    ts.getHours()
  )}${pad(ts.getMinutes())}`;
  const filename = `dump_${stamp}.sql`;

  try {
    toast.loading("SQL dışa aktarılıyor…", { id: "sql-export" });

    // ❗ Artık argüman yok
    const blob = await exportSql().unwrap();

    downloadBlob(blob, filename);
    toast.success(`Dışa aktarıldı: ${filename}`, { id: "sql-export" });
  } catch (err: any) {
    // BE export'ta {error} dönebilir; fallback'leri geniş tut
    const msg =
      err?.data?.error ||
      err?.data?.message ||
      err?.error ||
      "Dışa aktarma başarısız.";
    toast.error(msg, { id: "sql-export" });
  }
};


  /* ================== Auth/Yetki ================== */
  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900" />;
  }
  if (!isAuthorized) {
    return <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900" />;
  }

  const authedUserId: string | undefined =
    (authStatus as any)?.user_id ?? (authStatus as any)?.user?.id ?? (authStatus as any)?.id;

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
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
      {/* FORM ROTALARI */}
      {isAnyFormRoute ? (
        isProductFormRoute ? (
          <ProductFormPage />
        ) : isCategoryFormRoute ? (
          <CategoryFormPage />
        ) : isSubCategoryFormRoute ? (
          <SubCategoryFormPage />
        ) : isCustomPageFormRoute ? (
          <CustomPageFormPage />
        ) : isFAQFormRoute ? (
          <FAQForm />
        ) : isAnnouncementFormRoute ? (
          <AnnouncementForm />
        ) : isUserFormRoute ? (
          <UserFormPage />
        ) : isSimpleCampaignFormRoute ? (
          <CampaignFormPage />
        ) : isRecentWorkFormRoute ? (
          <RecentWorkFormPage />
        ) : isContactFormRoute ? (
          <ContactFormPage />
        ) : isServiceFormRoute ? (
          <ServiceFormPage />
        ) : isAccessoryFormRoute ? (
          <AccessoryFormPage />
        ) : isSliderFormRoute ? (
          <SliderFormPage />
        ) : isReviewFormRoute ? (
          <ReviewFormPage />
        ) : isSettingFormRoute ? (
          <SettingFormPage />
        ) : null
      ) : (
        <>
          {/* =================== DASHBOARD (root /admin) =================== */}
          {isRootAdmin ? (
            <AdminDashboard />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Dashboard</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <AdminDashboard />
                  </CardContent>
                </Card>
              )}

              {/* =================== TAB ROTALARI =================== */}
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

              {activeTab === "categories" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Kategoriler</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <CategoriesTabs />
                  </CardContent>
                </Card>
              )}

              {activeTab === "subcategories" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Alt Kategoriler</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <SubCategoriesTab />
                  </CardContent>
                </Card>
              )}

              {activeTab === "sitesettings" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Sayfa Ayarları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsSiteSettings />
                  </CardContent>
                </Card>
              )}

              {activeTab === "settings" && authedUserId && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Hesap Ayarları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsSettings userId={authedUserId} defaultTab="password" />
                  </CardContent>
                </Card>
              )}

              {activeTab === "contacts" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">İletişim Mesajları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsContacts />
                  </CardContent>
                </Card>
              )}

              {activeTab === "accessories" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Aksesuarlar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsAccessories />
                  </CardContent>
                </Card>
              )}

              {activeTab === "sliders" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Slider Yönetimi</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <SlidersTab />
                  </CardContent>
                </Card>
              )}

              {activeTab === "reviews" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Yorumlar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <ReviewsTab />
                  </CardContent>
                </Card>
              )}

              {activeTab === "services" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Hizmetler</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsServices />
                  </CardContent>
                </Card>
              )}

              {activeTab === "recent_works" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Son Çalışmalar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsRecentWorks />
                  </CardContent>
                </Card>
              )}

              {activeTab === "users" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Kullanıcılar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsUsers />
                  </CardContent>
                </Card>
              )}

              {activeTab === "campaigns" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Kampanyalar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsCampaigns />
                  </CardContent>
                </Card>
              )}

              {activeTab === "announcements" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Duyurular</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsAnnouncements />
                  </CardContent>
                </Card>
              )}

              {activeTab === "faqs" && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">SSS (Sık Sorulan Sorular)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <TabsFAQ />
                  </CardContent>
                </Card>
              )}

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
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}
