// src/components/public/ProductGallery.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageOptimized } from "./ImageOptimized";
import { SkeletonLoader } from "./SkeletonLoader";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";

import { useListProductsQuery } from "@/integrations/metahub/rtk/endpoints/products.endpoints";
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";
import { useListAccessoriesPublicQuery } from "@/integrations/metahub/rtk/endpoints/accessories.endpoints";
import { useListServicesPublicQuery } from "@/integrations/metahub/rtk/endpoints/services_public.endpoints";

import type { Product as ApiProduct } from "@/integrations/metahub/db/types/products.rows";
import type { ServiceView } from "@/integrations/metahub/db/types/services.types";

/* ========================== helpers & types ========================== */

const ALL_CATEGORY = "mezar-modelleri"; // “Hepsi” için sanal id

type UiProduct = {
  id: string;
  title: string;
  productCode?: string | null;
  price: number | string;
  image: string;
  description: string;
  category_id: string;
};

type UiCard = UiProduct & {
  kind: "product" | "accessory" | "service:garden" | "service:soil";
};

function toUiProduct(p: ApiProduct): UiProduct {
  const primaryImage =
    (Array.isArray(p.images) && p.images.length ? p.images[0] : null) ||
    p.image_url ||
    "";

  return {
    id: String(p.id),
    title: String(p.title ?? ""),
    productCode: p.product_code ?? null,
    price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
    image: primaryImage,
    description: p.description ?? "",
    category_id: String(p.category_id ?? ""),
  };
}

// aksesuar public tipini zorunlu kılmadan dönüştür
function toUiAccessory(a: any): UiCard {
  const img =
    a.image ||
    (Array.isArray(a.images) && a.images[0]) ||
    a.image_url ||
    "";

  let price: string | number = "Fiyat İçin Arayınız";
  if (typeof a.price === "number") price = a.price;
  else if (typeof a.price === "string" && a.price.trim()) {
    const n = Number(a.price);
    price = Number.isFinite(n) ? n : a.price;
  }

  return {
    id: String(a.id),
    title: String(a.name ?? "Aksesuar"),
    productCode: a.code ?? a.sku ?? null,
    price,
    image: String(img),
    description: String(a.description ?? ""),
    category_id: "accessories",
    kind: "accessory",
  };
}

function serviceGroupKey(s: Pick<ServiceView, "type" | "category" | "slug" | "name">):
  "service:ciceklendirme" | "service:toprak-dolumu" {
  const t = String(s.type ?? "").toLowerCase();
  const c = String(s.category ?? "").toLowerCase();
  if (t === "gardening") return "service:ciceklendirme";
  if (t === "soil") return "service:toprak-dolumu";
  const text = `${t} ${c} ${s.slug ?? ""} ${s.name ?? ""}`.toLowerCase();
  if (/(çiçek|cicek)/.test(text)) return "service:ciceklendirme";
  return "service:toprak-dolumu";
}

function toUiService(s: ServiceView): UiCard {
  const key = serviceGroupKey(s);
  const img =
    (s as any).image ||
    s.image_effective_url ||
    s.image_url ||
    (Array.isArray((s as any).images) && (s as any).images[0]) ||
    "";

  let price: string | number = "Teklif Alın";
  if (typeof s.price === "number") price = s.price;
  else if (typeof s.price === "string" && s.price.trim()) {
    const n = Number(s.price);
    price = Number.isFinite(n) ? n : s.price;
  }

  return {
    id: String(s.id),
    title: String(s.name ?? (key === "service:ciceklendirme" ? "Mezar Çiçeklendirme" : "Mezar Toprak Dolumu")),
    productCode: (s as any).code ?? (s as any).sku ?? null,
    price,
    image: String(img),
    description: String(s.description ?? ""),
    category_id: key,
    kind: key === "service:ciceklendirme" ? "service:garden" : "service:soil",
  };
}

/** slug/name’i normalize et (TR karakter + boşluk/punktuasyon temizliği) */
function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** özel bloklarla çakışabilecek kategori anahtarları */
const RESERVED_KEYS = new Set<string>([
  "mezar-modelleri",
  "accessories",
  "aksesuar",
  "aksesuarlar",
  "mezar-aksesuarlari",
  "ciceklendirme",
  "mezar-ciceklendirme",
  "toprak-dolumu",
  "mezar-toprak-dolumu",
]);

/* =============================== component =============================== */

interface ProductGalleryProps {
  searchTerm: string;
  showSearchResults: boolean;
  onClearSearch: () => void;
  onProductDetail: (productId: number) => void;
  refreshKey?: number;
}

export function ProductGallery({
  searchTerm,
  showSearchResults,
  onClearSearch,
  onProductDetail,
  refreshKey,
}: ProductGalleryProps) {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [visibleItems, setVisibleItems] = useState(12);
  const [softLoading, setSoftLoading] = useState(true);

  /* ---------- Categories (public) ---------- */
  const { data: categoriesRes, isFetching: fetchingCats } = useListCategoriesQuery({
    is_active: true, sort: "display_order", order: "asc", limit: 1000,
  });

  /* ---------- Products (counts + listed) ---------- */
  const { data: allRes, isFetching: fetchingAll } = useListProductsQuery({
    is_active: true, limit: 1000,
  });

  const currentQueryParams = useMemo(() => {
    const params: Parameters<typeof useListProductsQuery>[0] = {
      is_active: true,
      limit: 60,
    };
    if (showSearchResults && searchTerm.trim()) params.q = searchTerm.trim();

    // Ürün kategorileri için category_id gönder (özel bloklar hariç)
    if (
      selectedCategory !== ALL_CATEGORY &&
      !selectedCategory.startsWith("service:") &&
      selectedCategory !== "accessories"
    ) {
      params.category_id = selectedCategory;
    }
    return params;
  }, [showSearchResults, searchTerm, selectedCategory]);

  const { data: listRes, isFetching: fetchingList } = useListProductsQuery(currentQueryParams);

  /* ---------- Accessories (public) ---------- */
  const { data: accessoriesRes = [], isFetching: fetchingAccessories } =
    useListAccessoriesPublicQuery({ limit: 200, order: "asc", sort: "display_order" } as any);

  /* ---------- Services (public, type bazlı) ---------- */
  const { data: servicesGardeningRes = [], isFetching: fetchingServicesGardening } =
    useListServicesPublicQuery({ type: "gardening", orderBy: "display_order", order: "asc", limit: 200 });

  const { data: servicesSoilRes = [], isFetching: fetchingServicesSoil } =
    useListServicesPublicQuery({ type: "soil", orderBy: "display_order", order: "asc", limit: 200 });

  /* ---------- Soft skeleton UX ---------- */
  useEffect(() => {
    setSoftLoading(true);
    const t = setTimeout(() => setSoftLoading(false), 300);
    return () => clearTimeout(t);
  }, [selectedCategory, searchTerm, showSearchResults, refreshKey]);

  /* ---------- Transform to UI ---------- */
  const uiAllProducts: UiProduct[] = useMemo(() => {
    const src = Array.isArray(allRes) ? allRes : [];
    return src.map(toUiProduct);
  }, [allRes]);

  const uiListedProducts: UiCard[] = useMemo(() => {
    const serverArr = Array.isArray(listRes) ? listRes.map(toUiProduct) : [];
    return serverArr.map((p) => ({ ...p, kind: "product" as const }));
  }, [listRes]);

  const uiAccessories: UiCard[] = useMemo(
    () => (Array.isArray(accessoriesRes) ? accessoriesRes.map(toUiAccessory) : []),
    [accessoriesRes]
  );

  const uiServicesGarden: UiCard[] = useMemo(
    () => (Array.isArray(servicesGardeningRes) ? servicesGardeningRes.map(toUiService) : []),
    [servicesGardeningRes]
  );

  const uiServicesSoil: UiCard[] = useMemo(
    () => (Array.isArray(servicesSoilRes) ? servicesSoilRes.map(toUiService) : []),
    [servicesSoilRes]
  );

  /* ---------- Left menu items + counts (DEDUP + FILTER) ---------- */
  const categoryItems = useMemo(() => {
    const cats = Array.isArray(categoriesRes) ? categoriesRes : [];

    // 1) Header
    const items: Array<{ id: string; label: string; count: number; isHeader?: boolean }> = [
      {
        id: ALL_CATEGORY,
        label: "MEZAR MODELLERİ",
        count: uiAllProducts.length, // sadece ürün toplamı
        isHeader: true,
      },
    ];

    // 2) Normal kategoriler (özel bloklarla çakışanları ELE)
    const seen = new Set<string>();
    for (const c of cats) {
      const id = String((c as any).id);
      const slug = normKey(String((c as any).slug || ""));
      const nameKey = normKey(String((c as any).name || ""));

      // “Hepsi” başlığına/özel bloklara benzeyenleri gösterme
      if (RESERVED_KEYS.has(slug) || RESERVED_KEYS.has(nameKey)) continue;

      // Aynı isim/slug tekrarı varsa dedupe
      const dedupeKey = slug || nameKey || id;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const label = (c as any).name ?? (c as any).slug ?? id;
      const count = uiAllProducts.filter((p) => p.category_id === id).length;
      items.push({ id, label, count });
    }

    // 3) Özel bloklar (aksesuar + hizmetler)
    items.push({ id: "accessories", label: "MEZAR AKSESUARLARI", count: uiAccessories.length });
    items.push({ id: "service:ciceklendirme", label: "MEZAR ÇİÇEKLENDİRME", count: uiServicesGarden.length });
    items.push({ id: "service:toprak-dolumu", label: "MEZAR TOPRAK DOLUMU", count: uiServicesSoil.length });

    return items;
  }, [
    categoriesRes,
    uiAllProducts,
    uiAccessories.length,
    uiServicesGarden.length,
    uiServicesSoil.length,
  ]);

  /* ---------- Loading state ---------- */
  const isLoading =
    fetchingAll ||
    fetchingList ||
    fetchingCats ||
    fetchingAccessories ||
    fetchingServicesGardening ||
    fetchingServicesSoil ||
    softLoading;

  /* ---------- Visible list (paginate + selection) ---------- */
  const selectedCards: UiCard[] = useMemo(() => {
    if (showSearchResults) return uiListedProducts; // arama sadece ürünlerde

    if (selectedCategory === ALL_CATEGORY) return uiListedProducts;
    if (selectedCategory === "accessories") return uiAccessories;
    if (selectedCategory === "service:ciceklendirme") return uiServicesGarden;
    if (selectedCategory === "service:toprak-dolumu") return uiServicesSoil;

    // ürün kategorisi id'si
    return uiListedProducts;
  }, [
    showSearchResults,
    selectedCategory,
    uiListedProducts,
    uiAccessories,
    uiServicesGarden,
    uiServicesSoil,
  ]);

  const displayedCards = useMemo(
    () => selectedCards.slice(0, visibleItems),
    [selectedCards, visibleItems]
  );

  useEffect(() => {
    setVisibleItems(12);
  }, [selectedCategory, searchTerm, showSearchResults]);

  const loadMore = () => setVisibleItems((p) => p + 12);

  const navigateFromCard = (card: UiCard) => {
    if (card.kind === "product") {
      const n = Number(card.id);
      onProductDetail(Number.isFinite(n) ? n : 0);
    } else if (card.kind === "accessory") {
      navigate("/accessories");
    } else if (card.kind === "service:garden") {
      navigate("/gardening");
    } else if (card.kind === "service:soil") {
      navigate("/soilfilling");
    }
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <section className="py-16 bg-gray-50" id="products">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Search Header */}
        {showSearchResults && (
          <div className="text-center mb-12">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <h2 className="text-4xl font-bold text-gray-800">
                  "{searchTerm}" için Arama Sonuçları
                </h2>
                <Button
                  onClick={onClearSearch}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-teal-500 text-teal-600 hover:bg-teal-50"
                >
                  <X className="w-4 h-4" />
                  Temizle
                </Button>
              </div>
              <p className="text-xl text-gray-600">
                {uiListedProducts.length} ürün bulundu
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sol menü – arama yokken göster */}
          {!showSearchResults && (
            <div className="lg:w-1/4">
              <div className="sticky top-24">
                {/* Mobile grid */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    {categoryItems.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                          c.isHeader
                            ? selectedCategory === c.id
                              ? "bg-teal-600 text-white"
                              : "bg-teal-500 text-white hover:bg-teal-600"
                            : selectedCategory === c.id
                            ? "bg-teal-100 text-teal-700"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-center">
                          {c.label} <span className="ml-1 opacity-70">({c.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop list */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {categoryItems.map((c) =>
                      c.isHeader ? (
                        <div
                          key={c.id}
                          className="bg-teal-500 text-white px-6 py-4 cursor-pointer hover:bg-teal-600 transition-colors duration-200"
                          onClick={() => setSelectedCategory(c.id)}
                        >
                          <h3 className="font-bold text-lg text-center">
                            {c.label} <span className="opacity-80">({c.count})</span>
                          </h3>
                        </div>
                      ) : (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id)}
                          className={`px-6 py-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                            selectedCategory === c.id
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-sm flex justify-between">
                            <span>{c.label}</span>
                            <span className="text-gray-500">{c.count}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className={showSearchResults ? "w-full" : "lg:w-3/4"}>
            {isLoading ? (
              <SkeletonLoader type="grid" count={12} />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  {displayedCards.map((card) => (
                    <div
                      key={`${card.kind}-${card.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                      onClick={() => navigateFromCard(card)}
                    >
                      <div className="relative aspect-[4/3] lg:aspect-[4/3] sm:aspect-[3/4] overflow-hidden bg-gray-100">
                        <ImageOptimized
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={true}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          quality={85}
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="text-base font-bold text-gray-800 mb-3 line-clamp-2 uppercase">
                          {card.title}
                        </h3>

                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-block px-3 py-1 border-2 border-blue-500 text-blue-600 text-xs font-bold rounded">
                            {card.productCode ?? "KOD-YOK"}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {typeof card.price === "number" ? card.price : String(card.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleItems < selectedCards.length && (
                  <div className="text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 border-teal-500 text-teal-600 hover:bg-teal-50"
                    >
                      Daha Fazla Göster ({selectedCards.length - visibleItems} öğe daha)
                    </Button>
                  </div>
                )}

                {selectedCards.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {showSearchResults ? "Arama sonucu bulunamadı" : "Bu kategoride içerik yok"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {showSearchResults
                          ? `"${searchTerm}" ile eşleşen ürün bulunamadı.`
                          : "Seçilen kategoride henüz içerik bulunmuyor."}
                      </p>
                    </div>

                    {showSearchResults && (
                      <Button onClick={onClearSearch} className="bg-teal-500 hover:bg-teal-600 text-white">
                        Tüm Ürünleri Görüntüle
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
