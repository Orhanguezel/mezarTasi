// src/components/public/ProductGallery.tsx
import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom"; // artık kullanmıyoruz
import { ImageOptimized } from "./ImageOptimized";
import { SkeletonLoader } from "./SkeletonLoader";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";

import { useListProductsQuery } from "@/integrations/rtk/endpoints/products.endpoints";
import type { Product as ApiProduct } from "@/integrations/rtk/types/products.rows";

/* ========================== constants & types ========================== */

/** Ana kategori: MEZAR MODELLERİ */
const TOP_CATEGORY_ID = "aaaa0001-1111-4111-8111-aaaaaaaa0001";

/** Başlığa tıklama yok; fakat başlangıçta “hepsi” gösterimi için sanal durum */
const ALL_KEY = "ALL";

const SUBCATS: Array<{ id: string; label: string }> = [
  { id: "bbbb0001-2222-4222-8222-bbbbbbbb0001", label: "Tek Kişilik Mermer Modeller" },
  { id: "bbbb0002-2222-4222-8222-bbbbbbbb0002", label: "Tek Kişilik Granit Modeller" },
  { id: "bbbb0003-2222-4222-8222-bbbbbbbb0003", label: "İki Kişilik Mermer Modeller" },
  { id: "bbbb0004-2222-4222-8222-bbbbbbbb0004", label: "İki Kişilik Granit Modeller" },
  { id: "bbbb0005-2222-4222-8222-bbbbbbbb0005", label: "Katlı Lahit Mezar Modelleri" },
  { id: "bbbb0006-2222-4222-8222-bbbbbbbb0006", label: "Özel Yapım Mezar Modelleri" },
  { id: "bbbb0007-2222-4222-8222-bbbbbbbb0007", label: "Sütunlu Mezar Modelleri" },
];

type UiProduct = {
  id: string;
  slug: string; // 🔹 slug ile detay sayfasına gideceğiz
  title: string;
  productCode?: string | null;
  price: number | string;
  image: string;
  description: string;
  category_id: string;
  // (opsiyonel) BE tarafında varsa ama tiplerde görünmüyorsa sorun çıkmasın diye
  sub_category_id?: string | null;
};

type UiCard = UiProduct & { kind: "product" };

/* ========================== mappers ========================== */

function toUiProduct(p: ApiProduct): UiProduct {
  const primaryImage =
    (Array.isArray((p as any).images) && (p as any).images.length ? (p as any).images[0] : null) ||
    (p as any).image_url ||
    "";

  return {
    id: String((p as any).id),
    slug: String((p as any).slug ?? ""), // 🔹 buradan slug’ı alıyoruz
    title: String((p as any).title ?? ""),
    productCode: (p as any).product_code ?? null,
    price:
      typeof (p as any).price === "number" ? (p as any).price : Number((p as any).price) || 0,
    image: primaryImage,
    description: (p as any).description ?? "",
    category_id: String((p as any).category_id ?? ""),
    sub_category_id: (p as any).sub_category_id ?? null,
  };
}

/* ---------- helpers: price format ---------- */
function formatPrice(price: number | string | null | undefined): string {
  const num = typeof price === "number" ? price : Number(price);

  // 0 veya geçersizse
  if (!Number.isFinite(num) || num <= 0) {
    return "Fiyat İçin Arayınız";
  }

  // Görseldeki gibi: 26400 TL (tam sayı, ayırıcı yok)
  const rounded = Math.round(num);
  return `${rounded} TL`;
}

/* =============================== component =============================== */

interface ProductGalleryProps {
  searchTerm: string;
  showSearchResults: boolean;
  onClearSearch: () => void;
  /** Artık slug ile detail açıyoruz */
  onProductDetail: (slug: string) => void;
  refreshKey?: number;
}

export function ProductGallery({
  searchTerm,
  showSearchResults,
  onClearSearch,
  onProductDetail,
  refreshKey,
}: ProductGalleryProps) {
  // const navigate = useNavigate(); // kullanılmıyor

  /** ALL_KEY = tüm alt kategoriler; yoksa seçilen alt kategori id’si */
  const [selectedSubCat, setSelectedSubCat] = useState<string>(ALL_KEY);
  const [visibleItems, setVisibleItems] = useState(12);
  const [softLoading, setSoftLoading] = useState(true);

  /* ---------- Query params (yalnız MEZAR MODELLERİ kapsamı) ---------- */
  const currentQueryParams = useMemo(() => {
    const params: any = {
      is_active: true,
      limit: 60,
    };

    if (showSearchResults && searchTerm.trim()) {
      params.q = searchTerm.trim();
      // Arama da sadece bu üst kategoride olsun
      params.category_id = TOP_CATEGORY_ID;
      return params;
    }

    if (selectedSubCat !== ALL_KEY) {
      params.sub_category_id = selectedSubCat; // BE bunu destekliyorsa
    } else {
      params.category_id = TOP_CATEGORY_ID;
    }
    return params;
  }, [showSearchResults, searchTerm, selectedSubCat]);

  const { data: listRes, isFetching: fetchingList } =
    useListProductsQuery(currentQueryParams);

  /* ---------- Soft skeleton UX ---------- */
  useEffect(() => {
    setSoftLoading(true);
    const t = setTimeout(() => setSoftLoading(false), 250);
    return () => clearTimeout(t);
  }, [selectedSubCat, searchTerm, showSearchResults, refreshKey]);

  /* ---------- Transform to UI ---------- */
  const uiListedProducts: UiCard[] = useMemo(() => {
    const serverArr = Array.isArray(listRes) ? listRes.map(toUiProduct) : [];
    return serverArr.map((p) => ({ ...p, kind: "product" as const }));
  }, [listRes]);

  /* ---------- Loading state ---------- */
  const isLoading = fetchingList || softLoading;

  /* ---------- Visible list ---------- */
  const displayedCards = useMemo(
    () => uiListedProducts.slice(0, visibleItems),
    [uiListedProducts, visibleItems],
  );

  useEffect(() => {
    setVisibleItems(12);
  }, [selectedSubCat, searchTerm, showSearchResults]);

  const loadMore = () => setVisibleItems((p) => p + 12);

  const navigateFromCard = (card: UiCard) => {
    if (card.kind === "product" && card.slug) {
      onProductDetail(card.slug); // 🔹 slug ile yönlendir
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
          {/* Sol menü – sadece sabit alt kategoriler; sayaç yok */}
          {!showSearchResults && (
            <div className="lg:w-1/4">
              <div className="sticky top-24">
                {/* Desktop list */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hidden lg:block">
                  {/* 🔹 Başlık tıklanabilir: ALL_KEY */}
                  <button
                    type="button"
                    onClick={() => setSelectedSubCat(ALL_KEY)}
                    className={`w-full px-6 py-4 text-center border-b border-gray-100 transition-colors ${
                      selectedSubCat === ALL_KEY
                        ? "bg-teal-600 text-white"
                        : "bg-teal-500 text-white hover:bg-teal-600"
                    }`}
                  >
                    MEZAR MODELLERİ
                  </button>

                  {SUBCATS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedSubCat(c.id)}
                      className={`w-full text-left px-6 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                        selectedSubCat === c.id
                          ? "bg-teal-50 text-teal-700"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Mobile & tablet grid */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Sol üst hücre: MEZAR MODELLERİ */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubCat(ALL_KEY)}
                      className={`px-4 py-3 rounded-lg text-center shadow-md transition-colors ${
                        selectedSubCat === ALL_KEY
                          ? "bg-teal-600 text-white"
                          : "bg-teal-500 text-white hover:bg-teal-600"
                      }`}
                    >
                      MEZAR MODELLERİ
                    </button>

                    {/* Kategoriler */}
                    {SUBCATS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedSubCat(c.id)}
                        className={`px-3 py-3 rounded-lg text-sm transition-colors ${
                          selectedSubCat === c.id
                            ? "bg-teal-100 text-teal-700"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
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
                      {/* 🔹 Resim alanı: TÜM breakpoints'te sabit aspect-ratio + object-contain, oran korunur */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 flex items-center justify-center">
                        <ImageOptimized
                          src={card.image}
                          alt={card.title}
                          className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
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
                            {formatPrice(card.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleItems < uiListedProducts.length && (
                  <div className="text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 border-teal-500 text-teal-600 hover:bg-teal-50"
                    >
                      Daha Fazla Göster (
                      {uiListedProducts.length - visibleItems} öğe daha)
                    </Button>
                  </div>
                )}

                {uiListedProducts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {showSearchResults
                          ? "Arama sonucu bulunamadı"
                          : "Bu kategoride içerik yok"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {showSearchResults
                          ? `"${searchTerm}" ile eşleşen ürün bulunamadı.`
                          : "Seçilen kategoride henüz içerik bulunmuyor."}
                      </p>
                    </div>

                    {showSearchResults && (
                      <Button
                        onClick={onClearSearch}
                        className="bg-teal-500 hover:bg-teal-600 text-white"
                      >
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
