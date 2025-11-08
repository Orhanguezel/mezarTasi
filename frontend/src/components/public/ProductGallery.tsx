// src/components/public/ProductGallery.tsx
import { useEffect, useMemo, useState } from "react";
import { ImageOptimized } from "./ImageOptimized";
import { SkeletonLoader } from "./SkeletonLoader";
import { Button } from "../ui/button";
import { Search, X } from "lucide-react";

// RTK public endpoints
import {
  useListProductsQuery
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";

import {
  type Product as ApiProduct,
} from "@/integrations/metahub/db/types/products.rows";


import {
  useListCategoriesQuery,
} from "@/integrations/metahub/rtk/endpoints/categories.endpoints";

interface ProductGalleryProps {
  searchTerm: string;
  showSearchResults: boolean;
  onClearSearch: () => void;
  onProductDetail: (productId: number) => void;
  refreshKey?: number;
}

type UiProduct = {
  id: string;
  title: string;
  productCode?: string | null;
  price: number | string;
  image: string;
  description: string;
  category_id: string;
};

const ALL_CATEGORY = "mezar-modelleri"; // “Hepsi” başlığı için sabit id gibi kullanacağız

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
    category_id: String(p.category_id ?? ""), // sayım/filtre için gerçek ID
  };
}

export function ProductGallery({
  searchTerm,
  showSearchResults,
  onClearSearch,
  onProductDetail,
  refreshKey,
}: ProductGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [softLoading, setSoftLoading] = useState(true);

  // --- Kategorileri çek (aktif olanlar)
  const {
    data: categoriesRes,
    isFetching: fetchingCats,
    isError: catErr,
  } = useListCategoriesQuery({ is_active: true, sort: "display_order", order: "asc", limit: 1000 });

  // --- Sayım & fallback için tüm ürünler (limit'i büyük tuttuk; BE default küçükse sayım eksilebilir)
  const {
    data: allRes,
    isFetching: fetchingAll,
    isError: allErr,
  } = useListProductsQuery({ is_active: true, limit: 1000 });

  // --- Ekranda gösterilecek liste için server-side parametreleri hazırla ---
  const currentQueryParams = useMemo(() => {
    const params: Parameters<typeof useListProductsQuery>[0] = {
      is_active: true,
      limit: 60,
    };

    if (showSearchResults && searchTerm.trim()) {
      params.q = searchTerm.trim();
    }

    // “Hepsi” değilse seçili kategori ID’sini gönder
    if (selectedCategory !== ALL_CATEGORY) {
      params.category_id = selectedCategory;
    }

    return params;
  }, [showSearchResults, searchTerm, selectedCategory]);

  // --- Ekranda kullanılacak veri (server-side filtreli/aramalı)
  const {
    data: listRes,
    isFetching: fetchingList,
    isError: listErr,
  } = useListProductsQuery(currentQueryParams);

  // --- Yumuşak skeleton (UX) ---
  useEffect(() => {
    setSoftLoading(true);
    const t = setTimeout(() => setSoftLoading(false), 300);
    return () => clearTimeout(t);
  }, [selectedCategory, searchTerm, showSearchResults, refreshKey]);

  // Tüm ürünleri UI tipine çevir
  const uiAllProducts: UiProduct[] = useMemo(() => {
    const src = Array.isArray(allRes) ? allRes : [];
    return src.map(toUiProduct);
  }, [allRes]);

  // Server’dan gelen (filtreli) listeyi UI tipine çevir
  const uiListedProducts: UiProduct[] = useMemo(() => {
    const serverArr = Array.isArray(listRes) ? listRes.map(toUiProduct) : [];

    // Server tarafı zaten arama/kategori uyguladığı için doğrudan kullanıyoruz.
    // (Her ihtimale karşı server boş dönerse client-side fallback’e kayabilirsiniz:
    // if (!serverArr.length) {...} fakat burada şimdilik gerekmiyor.)
    return serverArr;
  }, [listRes]);

  // Kategori seçeneklerini ve sayaçlarını hazırla
  const categoryItems = useMemo(() => {
    const cats = Array.isArray(categoriesRes) ? categoriesRes : [];

    // Hepsi başlığı
    const items: Array<{ id: string; label: string; count: number; isHeader?: boolean }> = [
      {
        id: ALL_CATEGORY,
        label: "MEZAR MODELLERİ",
        count: uiAllProducts.length,
        isHeader: true,
      },
    ];

    // Diğer kategoriler
    for (const c of cats) {
      const id = String(c.id);
      const label = c.name ?? c.slug ?? id;
      const count = uiAllProducts.filter((p) => p.category_id === id).length;
      items.push({ id, label, count });
    }

    return items;
  }, [categoriesRes, uiAllProducts]);

  const isLoading = fetchingAll || fetchingList || fetchingCats || softLoading;

  // görünür ürünler (paginate)
  const displayedProducts = useMemo(
    () => uiListedProducts.slice(0, visibleProducts),
    [uiListedProducts, visibleProducts]
  );

  useEffect(() => {
    setVisibleProducts(12);
  }, [selectedCategory, searchTerm, showSearchResults]);

  const loadMore = () => setVisibleProducts((p) => p + 12);

  const handleProductClick = (productId: string) => {
    // public ProductDetailPage id numerik bekliyorsa Number(...)’a çevir
    const n = Number(productId);
    onProductDetail(Number.isFinite(n) ? n : 0);
  };

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

          {/* Ürün grid’i */}
          <div className={showSearchResults ? "w-full" : "lg:w-3/4"}>
            {isLoading ? (
              <SkeletonLoader type="grid" count={12} />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {/* Görsel */}
                      <div className="relative aspect-[4/3] lg:aspect-[4/3] sm:aspect-[3/4] overflow-hidden bg-gray-100">
                        <ImageOptimized
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={true}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          quality={85}
                        />
                      </div>

                      {/* İçerik */}
                      <div className="p-4">
                        <h3 className="text-base font-bold text-gray-800 mb-3 line-clamp-2 uppercase">
                          {product.title}
                        </h3>

                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-block px-3 py-1 border-2 border-blue-500 text-blue-600 text-xs font-bold rounded">
                            {product.productCode ?? "KOD-YOK"}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {typeof product.price === "number" ? product.price : String(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleProducts < uiListedProducts.length && (
                  <div className="text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 border-teal-500 text-teal-600 hover:bg-teal-50"
                    >
                      Daha Fazla Göster ({uiListedProducts.length - visibleProducts} ürün daha)
                    </Button>
                  </div>
                )}

                {uiListedProducts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {showSearchResults ? "Arama sonucu bulunamadı" : "Bu kategoride ürün bulunamadı"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {showSearchResults
                          ? `"${searchTerm}" ile eşleşen ürün bulunamadı.`
                          : "Seçilen kategoride henüz ürün bulunmuyor."}
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
