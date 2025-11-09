// =============================================================
// FILE: src/App.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

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
import { CemeteriesPage } from "./components/public/CemeteriesPage";

import CampaignAnnouncementsPage from "./components/public/CampaignAnnouncementsPage";
import { DetailPanel } from "./components/public/CampaignAnnouncementDetailPanel";
import { RecentWorkDetailPage } from "./components/public/RecentWorkDetailPage";
import { ModalWrapper } from "./components/public/ModalWrapper";
import { DataProvider } from "./contexts/DataContext";

import { useListSimpleCampaignsQuery } from "@/integrations/metahub/rtk/endpoints/campaigns.endpoints";
import type { SimpleCampaignView } from "@/integrations/metahub/db/types/campaigns";

/** ------- Yardımcılar ------- */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

type PageKey =
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
  | "productDetail"
  | "cemetery";

const routeMap: Record<PageKey, string> = {
  home: "/",
  about: "/about",
  mission: "/mission",
  quality: "/quality",
  faq: "/faq",
  pricing: "/pricing",
  models: "/models",
  accessories: "/accessories",
  gardening: "/gardening",
  soilfilling: "/soilfilling",
  contact: "/contact",
  adminAccess: "/adminkotrol",
  admin: "/admin",
  productDetail: "/product/:id",
  cemetery: "/cemetery",
};

function useCurrentPageKey(): PageKey {
  const { pathname } = useLocation();
  if (pathname.startsWith("/adminkotrol")) return "adminAccess";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/mission")) return "mission";
  if (pathname.startsWith("/quality")) return "quality";
  if (pathname.startsWith("/faq")) return "faq";
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/models")) return "models";
  if (pathname.startsWith("/accessories")) return "accessories";
  if (pathname.startsWith("/gardening")) return "gardening";
  if (pathname.startsWith("/soilfilling")) return "soilfilling";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/product/")) return "productDetail";
  if (pathname.startsWith("/cemetery")) return "cemetery";
  return "home";
}

/** Bir kampanya objesi/slug/id’den string ID üret – tüm durumları kabul et */
function resolveCampaignId(c: any): string | undefined {
  if (c == null) return undefined;
  if (typeof c === "string") {
    const s = c.trim();
    return s || undefined;
  }
  if (typeof c === "number") return String(c);
  if (typeof c === "object") {
    const possible = c.id ?? c.campaignId ?? c.slug ?? c.uuid ?? c._id ?? c.ID;
    if (possible == null) return undefined;
    return String(possible).trim() || undefined;
  }
  return undefined;
}

/** Bir duyuru objesi/slug/id’den string ID üret – slug/uuid öncelikli */
function resolveAnnouncementId(a: any): string | undefined {
  if (a == null) return undefined;
  if (typeof a === "string") {
    const s = a.trim();
    return s || undefined;
  }
  if (typeof a === "number") return String(a);
  if (typeof a === "object") {
    const possible = a.slug ?? a.uuid ?? a.id ?? a._id ?? a.ID;
    if (possible == null) return undefined;
    return String(possible).trim() || undefined;
  }
  return undefined;
}


/** İlgili aktif kampanyalar şeridi (detay modalı içinde kullanılıyor) */
function RelatedActiveCampaigns(props: { currentId: string; onOpen: (id: string) => void }) {
  const { data: campaigns = [] } = useListSimpleCampaignsQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });
  const items = (campaigns as SimpleCampaignView[]).filter(
    (c) => !!c.is_active && String(c.id) !== props.currentId
  );
  if (!items.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-slate-700 mb-3">Diğer aktif kampanyalar</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((x: SimpleCampaignView) => (
          <button
            key={`rel-${x.id}`}
            className="shrink-0 w-48 text-left bg-white rounded-lg border border-emerald-100 hover:shadow transition"
            onClick={() => props.onOpen(String(x.id))}
          >
            <img
              src={
                (x as any).images?.[0]?.image_effective_url ||
                (x as any).images?.[0]?.image_url ||
                x.image_effective_url ||
                x.image_url ||
                "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=500&fit=crop"
              }
              alt={x.title}
              className="w-full h-24 object-cover rounded-t-lg"
            />
            <div className="p-2">
              <div className="text-[10px] text-emerald-700 font-semibold mb-1">Kampanya</div>
              <div className="text-xs text-slate-800 line-clamp-2">{x.title}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** ------- Sayfa Parçaları ------- */
function HomeComposition(props: {
  searchTerm: string;
  showSearchResults: boolean;
  onClearSearch: () => void;
  onProductDetail: (id: number) => void;
  refreshKey: number;
  openRecentWork: (payload: { id: string; slug?: string }) => void;
  openCampaigns: (c?: any) => void;
  openAnnouncement: (a?: any) => void;
}) {
  return (
    <>
      <HeroSection onNavigate={() => { }} />
      <ProductGallery
        searchTerm={props.searchTerm}
        showSearchResults={props.showSearchResults}
        onClearSearch={props.onClearSearch}
        onProductDetail={props.onProductDetail}
        refreshKey={props.refreshKey}
      />
      <ServicesSection
        onNavigate={() => { }}
        onOpenRecentWorkModal={(w) => props.openRecentWork(w)}
        onOpenCampaignsModal={(c) => props.openCampaigns(c)}
        onOpenAnnouncementModal={(a) => props.openAnnouncement(a)}
      />
    </>
  );
}

function ProductDetailWrapper(props: { onProductDetail: (id: number) => void }) {
  const params = useParams();
  const pid = Number(params.id);
  if (!Number.isFinite(pid)) return <Navigate to="/" replace />;
  return (
    <ProductDetailPage
      key={`product-${pid}`}
      productId={pid}
      onNavigate={() => { }}
      onProductDetail={props.onProductDetail}
    />
  );
}

/** ------- App ------- */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = useCurrentPageKey();

  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [showRecentWorkModal, setShowRecentWorkModal] = useState(false);
  const [selectedRecentWork, setSelectedRecentWork] = useState<{ id: string; slug?: string } | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);

  const hidePublicChrome = useMemo(
    () => location.pathname.startsWith("/admin") || location.pathname.startsWith("/adminkotrol"),
    [location.pathname]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-app", hidePublicChrome ? "admin" : "site");
    (document.body || document.documentElement).id = "site-root";
  }, [hidePublicChrome]);

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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const has = term.trim().length > 0;
    setShowSearchResults(has);
    if (has) navigate(routeMap.home);
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const onNavigateString = (page: string) => {
    const key = page as PageKey;
    if (key === "productDetail") return;
    navigate(routeMap[key] ?? "/");
  };

  const onProductDetail = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  // Artık { id, slug? } payload bekliyoruz
  const openRecentWork = (payload: { id: string; slug?: string }) => {
    setSelectedRecentWork(payload);
    setShowRecentWorkModal(true);
  };

  const openCampaigns = (c?: any) => {
    const cid = resolveCampaignId(c);
    setSelectedCampaignId(cid ?? null);
    setSelectedAnnouncementId(null); // kampanya açılırken duyuru seçimi temizle
    setShowCampaignsModal(true);
  };

  const openAnnouncement = (a?: any) => {
    const aid = resolveAnnouncementId(a);
    setSelectedAnnouncementId(aid ?? null);
    setSelectedCampaignId(null); // duyuru açılırken kampanya seçimi temizle
    setShowCampaignsModal(true);
  };

  return (
    <DataProvider>
      <ScrollToTop />

      <div className="min-h-screen bg-white">
        {!hidePublicChrome && (
          <Header
            currentPage={currentPage}
            onNavigate={onNavigateString}
            onSearch={handleSearch}
            searchTerm={searchTerm}
          />
        )}

        <main className="min-h-screen">
          <Routes>
            <Route
              path="/"
              element={
                <HomeComposition
                  searchTerm={searchTerm}
                  showSearchResults={showSearchResults}
                  onClearSearch={handleClearSearch}
                  onProductDetail={onProductDetail}
                  refreshKey={refreshKey}
                  openRecentWork={openRecentWork}
                  openCampaigns={openCampaigns}
                  openAnnouncement={openAnnouncement}
                />
              }
            />

            <Route path="/about" element={<AboutPage onNavigate={onNavigateString} />} />
            <Route path="/mission" element={<MissionVisionPage onNavigate={onNavigateString} />} />
            <Route path="/quality" element={<QualityPolicyPage onNavigate={onNavigateString} />} />
            <Route path="/faq" element={<FAQPage onNavigate={onNavigateString} />} />
            <Route path="/cemetery" element={<CemeteriesPage onNavigate={onNavigateString} />} />

            <Route
              path="/pricing"
              element={
                <PricingPage
                  key={`pricing-${refreshKey}`}
                  onNavigate={onNavigateString}
                  onProductDetail={onProductDetail}
                />
              }
            />
            <Route
              path="/models"
              element={<ModelsPage onNavigate={onNavigateString} onProductDetail={onProductDetail} />}
            />
            <Route path="/accessories" element={<AccessoriesPage onNavigate={onNavigateString} />} />
            <Route path="/gardening" element={<GardeningPage onNavigate={onNavigateString} />} />
            <Route path="/soilfilling" element={<SoilFillingPage onNavigate={onNavigateString} />} />
            <Route path="/contact" element={<ContactPage onNavigate={onNavigateString} />} />

            {/* Ürün detay */}
            <Route path="/product/:id" element={<ProductDetailWrapper onProductDetail={onProductDetail} />} />

            {/* Admin akışı */}
            <Route path="/adminkotrol" element={<AdminSecretAccess onNavigate={onNavigateString} />} />

            {/* ✅ Admin panel VE tüm form rotaları */}
            <Route path="/admin" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/products" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/products/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/products/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/categories" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/categories/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/categories/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/subcategories" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/subcategories/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/subcategories/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/pages" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/pages/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/pages/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/faqs" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/faqs/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/faqs/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/recent-works" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/recent-works/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/recent-works/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/site-settings" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/announcements" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/announcements/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/announcements/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/users" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/users/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/users/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/campaigns" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/campaigns/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/campaigns/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/recent_works" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/recent_works/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/recent_works/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/contacts" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/contacts/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/contacts/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/services" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/services/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/services/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/accessories" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/accessories/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/accessories/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/sliders" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/sliders/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/sliders/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            <Route path="/admin/reviews" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/reviews/new" element={<AdminPanel onNavigate={onNavigateString} />} />
            <Route path="/admin/reviews/:id" element={<AdminPanel onNavigate={onNavigateString} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!hidePublicChrome && <Footer onNavigate={onNavigateString} />}
        {!hidePublicChrome && <FloatingCallButton />}

        {/* Kampanya/Duyuru Modal */}
        <ModalWrapper
          isOpen={showCampaignsModal}
          onClose={() => {
            setShowCampaignsModal(false);
            setSelectedCampaignId(null);
            setSelectedAnnouncementId(null);
          }}
          title={
            selectedCampaignId
              ? "Kampanya Detayı"
              : selectedAnnouncementId
              ? "Duyuru Detayı"
              : "Duyuru / Kampanyalar"
          }
          maxWidth="max-w-3xl"
        >
          {selectedCampaignId ? (
            <>
              <DetailPanel kind="campaign" id={selectedCampaignId} />
              <RelatedActiveCampaigns currentId={selectedCampaignId} onOpen={(id) => setSelectedCampaignId(id)} />
            </>
          ) : selectedAnnouncementId ? (
            <DetailPanel kind="announcement" id={selectedAnnouncementId} />
          ) : (
            <CampaignAnnouncementsPage onNavigate={onNavigateString} />
          )}
        </ModalWrapper>

        {/* Son Çalışmalar Modal */}
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
              id={selectedRecentWork.id}
              slug={selectedRecentWork.slug}
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
