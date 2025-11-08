// =============================================================
// FILE: src/components/admin/AdminPanel/index.tsx
// =============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

import { TabsProducts } from "./Tabs/TabsProducts";
import { CategoriesCard } from "./parts/CategoriesCard";
import { SubCategoriesCard } from "./parts/SubCategoriesCard";
import { TabsPages } from "./Tabs/PagesTab";
import TabsFAQ from "./Tabs/FAQTab";
import FAQForm from "./form/FAQForm";
import TabsUsers from "./Tabs/TabsUser";
import UserFormPage from "./form/UserFormPage";

import { TabsCampaigns } from "./Tabs/CampaignsTab";
import CampaignFormPage from "./form/CampaignFormPage";

import TabsAnnouncements from "./Tabs/AnnouncementsTab";
import AnnouncementForm from "./form/AnnouncementForm";

import AdminLayout, { ActiveTab } from "@/components/layout/AdminLayout";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminFooter from "@/components/layout/AdminFooter";

import ProductFormPage from "@/components/admin/AdminPanel/form/ProductFormPage";
import CategoryFormPage from "@/components/admin/AdminPanel/form/CategoryFormPage";
import SubCategoryFormPage from "@/components/admin/AdminPanel/form/SubCategoryFormPage";
import CustomPageFormPage from "@/components/admin/AdminPanel/form/CustomPageFormPage";

import TabsRecentWorks from "./Tabs/RecentWorksTab";
import RecentWorkFormPage from "./form/RecentWorkFormPage";

import TabsContacts from "./Tabs/ContactsTab";
import ContactFormPage from "./form/ContactFormPage";

import TabsServices from "./Tabs/TabsServices";
import ServiceFormPage from "./form/ServiceFormPage";

import TabsAccessories from "./Tabs/TabsAccessories";
import AccessoryFormPage from "./form/AccessoryFormPage";

import SliderFormPage from "./form/SliderFormPage";
import SlidersTab from "./Tabs/SlidersTab";

import ReviewsTab from "./Tabs/ReviewsTab";
import ReviewFormPage from "./form/ReviewFormPage";

// ✅ YENİ: Site Settings
import TabsSiteSettings from "./Tabs/SiteSettingsTab";
import SiteSettingFormPage from "./form/SiteSettingFormPage";

type AdminPanelProps = { onNavigate: (page: string) => void };

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { data: authStatus, isFetching: statusFetching, refetch: refetchStatus } = useStatusQuery();
  const { pathname } = useLocation();

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
    isSiteSettingFormRoute;

  const { refreshProducts, refreshSliders, refreshKeywords, refreshCampaigns } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
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
    activeTab,
  ]);

  const handleImportFile = () => {};
  const handleImportClick = () => {};
  const handleExport = () => {
    toast.info("Dışa aktarma bu sayfada devre dışı. RTK ile DB kullanılıyor.");
  };

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900" />;
  }
  if (!isAuthorized) {
    return <div className="flex min-h-dvh items-center justify-center bg-white text-gray-900" />;
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
        ) : isSiteSettingFormRoute ? (
          <SiteSettingFormPage />
        ) : null
      ) : (
        <>
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

          {activeTab === "keywords" && (
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="border-b border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">
                    Son Çalışmalarımız - Anahtar Kelimeler
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6"></CardContent>
            </Card>
          )}

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

          {activeTab === "popups" && (
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="border-b border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Popuplar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6"></CardContent>
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

          {activeTab === "categories" && <CategoriesCard />}
          {activeTab === "subcategories" && <SubCategoriesCard />}

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
    </AdminLayout>
  );
}
