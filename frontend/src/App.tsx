// src/App.tsx
import { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { HeroSection } from "./components/home/HeroSection";
import { ProductGallery } from "./components/public/ProductGallery";
import { ServicesSection } from "./components/public/ServicesSection";
import { Footer } from "./components/layout/Footer";
import { FloatingCallButton } from "./components/public/FloatingCallButton";
import AdminPanel from "./components/admin/AdminPanel";
import { AdminSecretAccess } from "./components/admin/AdminSecretAccess";
import { ContactPage } from "./components/public/ContactPage";
import { AboutPage } from "./components/public/AboutPage";
import { ModelsPage } from "./components/public/ModelsPage";
import { PricingPage } from "./components/public/PricingPage";
import { AccessoriesPage } from "./components/public/AccessoriesPage";
import { GardeningPage } from "./components/public/GardeningPage";
import { SoilFillingPage } from "./components/public/SoilFillingPage";
import { MissionVisionPage } from "./components/public/MissionVisionPage";
import { QualityPolicyPage } from "./components/public/QualityPolicyPage";
import { FAQPage } from "./components/public/FAQPage";
import { ProductDetailPage } from "./components/public/ProductDetailPage";
import CampaignAnnouncementsPage from "./components/public/CampaignAnnouncementsPage";
import { ModalWrapper } from "./components/public/ModalWrapper";
import { RecentWorkDetailPage } from "./components/public/RecentWorkDetailPage";
import { CampaignDetailPage } from "./components/public/CampaignDetailPage";
import { DataProvider } from "./contexts/DataContext";
import { RecentWork } from "./data/recentWorksData";


// ---- Route tipi sadece App içinde (içeri kullanım) ----
type Page =
  | "home"
  | "admin"
  | "adminAccess"
  | "contact"
  | "about"
  | "mission"
  | "quality"
  | "faq"
  | "pricing"
  | "models"
  | "accessories"
  | "gardening"
  | "soilfilling"
  | "productDetail";

const ADMIN_PAGES = new Set<Page>(["admin", "adminAccess"]);

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [showRecentWorkModal, setShowRecentWorkModal] = useState(false);
  const [selectedRecentWork, setSelectedRecentWork] = useState<RecentWork | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const isAdmin = ADMIN_PAGES.has(currentPage);

  // Tailwind kapsam bayrağı
  useEffect(() => {
    document.documentElement.setAttribute("data-app", isAdmin ? "admin" : "site");
    document.body.id = "site-root";
  }, [isAdmin]);

  // Admin panelinden gelen eventler
  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener("mezarisim-products-updated", refresh);
    window.addEventListener("mezarisim-force-rerender", refresh);
    window.addEventListener("mezarisim-product-changed", refresh);
    return () => {
      window.removeEventListener("mezarisim-products-updated", refresh);
      window.removeEventListener("mezarisim-force-rerender", refresh);
      window.removeEventListener("mezarisim-product-changed", refresh);
    };
  }, []);

  // Force rerender
  useEffect(() => {
    const h = () => setRefreshKey((k) => k + 1);
    window.addEventListener("mezarisim-force-rerender", h);
    return () => window.removeEventListener("mezarisim-force-rerender", h);
  }, []);

  // ---- İç navigasyon (Page) ----
  const navigatePage = (page: Page) => {
    console.log("🧭 App: Navigating to:", page, "(prev:", currentPage, ")");
    setCurrentPage(page);
    setShowSearchResults(false);
    setSearchTerm("");
  };

  // ---- Dışa verilecek sarmalayıcı (string) ----
  // AdminSecretAccess, Header, Footer vb. hala string bekliyorsa buna veriyoruz.
  const navigateString: (page: string) => void = (page) => {
    navigatePage(page as Page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const has = term.trim().length > 0;
    setShowSearchResults(has);
    if (has) navigatePage("home");
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const handleProductDetail = (productId: number) => {
    setSelectedProductId(productId);
    navigatePage("productDetail");
  };

  // Admin kısa yol
  useEffect(() => {
    if (window.location.pathname === "/adminkotrol") {
      navigatePage("adminAccess");
    }
  }, []);

  // Router
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "adminAccess":
        return <AdminSecretAccess onNavigate={navigateString} />;
      case "admin":
        return <AdminPanel onNavigate={navigateString} />;
      case "contact":
        return <ContactPage onNavigate={navigateString} />;
      case "about":
        return <AboutPage onNavigate={navigateString} />;
      case "mission":
        return <MissionVisionPage onNavigate={navigateString} />;
      case "quality":
        return <QualityPolicyPage onNavigate={navigateString} />;
      case "faq":
        return <FAQPage onNavigate={navigateString} />;
      case "pricing":
        return (
          <PricingPage
            key={`pricing-${refreshKey}`}
            onNavigate={navigateString}
            onProductDetail={handleProductDetail}
          />
        );
      case "models":
        return <ModelsPage onNavigate={navigateString} onProductDetail={handleProductDetail} />;
      case "accessories":
        return <AccessoriesPage onNavigate={navigateString} />;
      case "gardening":
        return <GardeningPage onNavigate={navigateString} />;
      case "soilfilling":
        return <SoilFillingPage onNavigate={navigateString} />;
      case "productDetail":
        return selectedProductId ? (
          <ProductDetailPage
            key={`product-${selectedProductId}`}
            productId={selectedProductId}
            onNavigate={navigateString}
            onProductDetail={handleProductDetail}
          />
        ) : (
          <>
            <HeroSection onNavigate={navigateString} />
            <ProductGallery
              searchTerm={searchTerm}
              showSearchResults={showSearchResults}
              onClearSearch={handleClearSearch}
              onProductDetail={handleProductDetail}
              refreshKey={refreshKey}
            />
            <ServicesSection
              onNavigate={navigateString}
              onOpenRecentWorkModal={(w) => {
                setSelectedRecentWork(w);
                setShowRecentWorkModal(true);
              }}
              onOpenCampaignsModal={(c) => {
                if (c) setSelectedCampaign(c);
                setShowCampaignsModal(true);
              }}
            />
          </>
        );
      case "home":
      default:
        return (
          <>
            <HeroSection onNavigate={navigateString} />
            <ProductGallery
              searchTerm={searchTerm}
              showSearchResults={showSearchResults}
              onClearSearch={handleClearSearch}
              onProductDetail={handleProductDetail}
              refreshKey={refreshKey}
            />
            <ServicesSection
              onNavigate={navigateString}
              onOpenRecentWorkModal={(w) => {
                setSelectedRecentWork(w);
                setShowRecentWorkModal(true);
              }}
              onOpenCampaignsModal={(c) => {
                if (c) setSelectedCampaign(c);
                setShowCampaignsModal(true);
              }}
            />
          </>
        );
    }
  };

  const hidePublicChrome = isAdmin;

  return (
    <DataProvider>
      <div className="min-h-screen bg-white">
        {!hidePublicChrome && (
          <Header
            currentPage={currentPage}
            onNavigate={navigateString}
            onSearch={handleSearch}
            searchTerm={searchTerm}
          />
        )}

        <main className="min-h-screen">{renderCurrentPage()}</main>

        {!hidePublicChrome && <Footer onNavigate={navigateString} />}

        {!hidePublicChrome && <FloatingCallButton />}

        <ModalWrapper
          isOpen={showCampaignsModal}
          onClose={() => {
            setShowCampaignsModal(false);
            setSelectedCampaign(null);
          }}
          title={selectedCampaign ? "Kampanya Detayı" : "Duyuru / Kampanyalar"}
          maxWidth="max-w-3xl"
        >
          {selectedCampaign ? (
            <CampaignDetailPage
              campaign={selectedCampaign}
              onBack={() => {
                setShowCampaignsModal(false);
                setSelectedCampaign(null);
              }}
            />
          ) : (
            <CampaignAnnouncementsPage onNavigate={navigateString} />
          )}
        </ModalWrapper>

        <ModalWrapper
          isOpen={showRecentWorkModal}
          onClose={() => {
            setShowRecentWorkModal(false);
            setSelectedRecentWork(null);
          }}
          title="Son Çalışmalarımız"
          maxWidth="max-w-7xl"
        >
          {selectedRecentWork && (
            <RecentWorkDetailPage
              work={selectedRecentWork}
              onBack={() => {
                setShowRecentWorkModal(false);
                setSelectedRecentWork(null);
              }}
            />
          )}
        </ModalWrapper>
      </div>
    </DataProvider>
  );
}

export default App;
