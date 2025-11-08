// =============================================================
// FILE: src/components/public/PricingPage.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveSlidesRtk } from "../../data/sliderData";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";

// RTK hooks
import { useListProductsQuery } from "@/integrations/metahub/rtk/endpoints/products.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";
import { useListSubCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/sub_categories_admin.endpoints";

import type { Product as ApiProduct } from "@/integrations/metahub/db/types/products.rows";
import type { Category } from "@/integrations/metahub/db/types/categories.rows";
import type { SubCategory } from "@/integrations/metahub/db/types/sub_categories.rows";

// ---- NumericKey <-> realId mapping
const IDMAP_KEY = "mh_public_product_idmap_v1";
type IdMap = Record<string, string>;

function hashToNumericKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return h === 0 ? 1 : h;
}
function saveIdMapping(realId: string): number {
  const key = hashToNumericKey(realId);
  try {
    const raw = sessionStorage.getItem(IDMAP_KEY);
    const map: IdMap = raw ? JSON.parse(raw) : {};
    map[String(key)] = realId;
    sessionStorage.setItem(IDMAP_KEY, JSON.stringify(map));
  } catch { /* SSR / privacy block safe */ }
  return key;
}

// ---- Specs normalize
function normalizeSpecs(specs: unknown): Record<string, string> {
  if (!specs) return {};
  if (typeof specs === "string") {
    try { return normalizeSpecs(JSON.parse(specs)); } catch { return {}; }
  }
  if (Array.isArray(specs)) {
    const out: Record<string, string> = {};
    for (const it of specs as any[]) {
      if (it && typeof it === "object" && (it as any).name) {
        const v = (it as any).value;
        out[String((it as any).name)] = Array.isArray(v) ? v.join(", ") : v != null ? String(v) : "";
      }
    }
    return out;
  }
  if (typeof specs === "object") {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(specs as Record<string, any>)) {
      if (v == null) continue;
      out[k] = Array.isArray(v) ? v.join(", ") : String(v);
    }
    return out;
  }
  return {};
}

interface PricingPageProps {
  onNavigate: (page: string) => void;
  onProductDetail?: (productId: number) => void;
}

interface TombstoneModel {
  id: number; // numericKey
  name: string;
  category: string; // category slug
  material: string;
  price: string;
  image: string;
  description: string;
  featured?: boolean;
  productCode: string;
  dimensions?: string;
  weight?: string;
  thickness?: string;
  finish?: string;
  warranty?: string;
  installationTime?: string;
}

// ---- ApiProduct -> TombstoneModel
function toModel(
  p: ApiProduct,
  categorySlugById: Record<string, string>,
  categoryNameById: Record<string, string>
): TombstoneModel {
  const images = Array.isArray((p as any).images) ? (p as any).images.filter(Boolean) : [];
  const primary = String(images[0] || (p as any).image_url || "");
  const realId = String((p as any).id ?? (p as any).slug ?? "");
  const numericKey = saveIdMapping(realId);

  const catId = String((p as any).category_id ?? "");
  const catSlug = categorySlugById[catId] || "";
  const catName = (categoryNameById[catId] || "").toLowerCase();

  const specs = normalizeSpecs((p as any).specifications);
  const material = catName.includes("granit") ? "Granit" : "Mermer";

  let priceText = "Fiyat İçin Arayınız";
  const price = (p as any).price;
  if (typeof price === "number") {
    priceText = price.toLocaleString("tr-TR");
  } else if (typeof price === "string" && price.trim()) {
    const n = Number(price);
    priceText = Number.isFinite(n) ? n.toLocaleString("tr-TR") : price;
  }

  return {
    id: numericKey,
    name: String((p as any).title ?? (p as any).product_code ?? "Ürün Adı Yok"),
    category: catSlug,
    material,
    price: priceText,
    image: primary,
    description: String((p as any).description ?? ""),
    featured: Boolean((p as any).is_featured),
    productCode: String((p as any).product_code ?? ""),
    ...(specs.dimensions ? { dimensions: specs.dimensions } : {}),
    ...(specs.weight ? { weight: specs.weight } : {}),
    ...(specs.thickness ? { thickness: specs.thickness } : {}),
    ...(specs.surfaceFinish || specs.finish ? { finish: String(specs.surfaceFinish || specs.finish) } : {}),
    ...(specs.warranty ? { warranty: specs.warranty } : {}),
    ...(specs.installationTime ? { installationTime: specs.installationTime } : {}),
  };
}

export function PricingPage({ onNavigate, onProductDetail }: PricingPageProps) {
  // ---- UI states
  const [selectedCategory, setSelectedCategory] = useState<string>("tümü");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | "tümü">("tümü");

  // ✅ Slider RTK (DOĞRU KULLANIM)
  const { slides: heroSlides, isError: isSlidesError } = useActiveSlidesRtk();
  const [currentSlide, setCurrentSlide] = useState(0);

  // ---- Fetch categories / sub-categories
  const { data: categoriesRes = [], refetch: refetchCats } = useListCategoriesAdminQuery({
    is_active: true,
    sort: "display_order",
    order: "asc",
    limit: 200,
  });
  const { data: subCategoriesRes = [], refetch: refetchSubs } = useListSubCategoriesAdminQuery({
    is_active: true,
    sort: "display_order",
    order: "asc",
    limit: 500,
  });

  // ---- Fetch products
  const { data: productsRes = [], refetch: refetchProducts } = useListProductsQuery({
    is_active: 1,
    limit: 500,
    sort: "created_at",
    order: "desc",
  });

  // ---- Map’ler (id -> slug/name)
  const categorySlugById = useMemo(() => {
    const m: Record<string, string> = {};
    (categoriesRes as Category[]).forEach((c) => { m[String(c.id)] = c.slug; });
    return m;
  }, [categoriesRes]);

  const categoryNameById = useMemo(() => {
    const m: Record<string, string> = {};
    (categoriesRes as Category[]).forEach((c) => { m[String(c.id)] = c.name; });
    return m;
  }, [categoriesRes]);

  // ---- Transform to UI models
  const allModels: TombstoneModel[] = useMemo(() => {
    if (!Array.isArray(productsRes)) return [];
    return (productsRes as ApiProduct[]).map((p) => toModel(p, categorySlugById, categoryNameById));
  }, [productsRes, categorySlugById, categoryNameById]);

  // ---- Featured
  const featuredModels: TombstoneModel[] = useMemo(() => {
    const featured = (productsRes as ApiProduct[]).filter((p: any) => Boolean(p?.is_featured));
    const source = featured.length ? featured : (productsRes as ApiProduct[]);
    return source.slice(0, 12).map((p) => toModel(p, categorySlugById, categoryNameById));
  }, [productsRes, categorySlugById, categoryNameById]);

  // ---- Counts (kategori)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allModels.forEach((m) => {
      if (!m.category) return;
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [allModels]);

  const subsByCategoryId = useMemo(() => {
    const m: Record<string, SubCategory[]> = {};
    (subCategoriesRes as SubCategory[]).forEach((s) => {
      const cid = String(s.category_id);
      (m[cid] ||= []).push(s);
    });
    return m;
  }, [subCategoriesRes]);

  // ---- UI categories list
  const uiCategories = useMemo(() => {
    const base = [{ id: "tümü", name: "Tüm Modeller", count: allModels.length }];
    const dyn = (categoriesRes as Category[]).map((c) => ({
      id: c.slug,
      name: c.name,
      count: categoryCounts[c.slug] || 0,
      _id: String(c.id),
    }));
    return [...base, ...dyn];
  }, [categoriesRes, allModels.length, categoryCounts]);

  // ---- Filtreleme
  const filteredModels = useMemo(() => {
    let arr = allModels;
    if (selectedCategory !== "tümü") {
      arr = arr.filter((m) => m.category === selectedCategory);
    }
    // sub-category filtresi eklenebilir (ürün şeması destekliyorsa)
    return arr;
  }, [allModels, selectedCategory]);

  // ✅ Slider autoplay (hook’tan gelen slides’a göre)
  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const t = window.setInterval(
      () => setCurrentSlide((p) => (p + 1) % heroSlides.length),
      5000
    );
    return () => window.clearInterval(t);
  }, [heroSlides?.length]);

  // ✅ Bir sonraki görseli preload et
  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const next = (currentSlide + 1) % heroSlides.length;
    const nextSlideObj = heroSlides[next];
    if (nextSlideObj?.image) {
      const img = new Image();
      img.src = nextSlideObj.image;
    }
  }, [currentSlide, heroSlides]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % (heroSlides?.length || 1));
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + (heroSlides?.length || 1)) % (heroSlides?.length || 1));

  // ---- Refetch tetikleyicileri
  useEffect(() => {
    const onAnyUpdate = () => {
      refetchProducts();
      refetchCats();
      refetchSubs();
    };
    window.addEventListener("mezarisim-products-updated", onAnyUpdate as any);
    window.addEventListener("mezarisim-force-rerender", onAnyUpdate as any);
    window.addEventListener("storage", onAnyUpdate as any);
    window.addEventListener("mezarisim-product-changed", onAnyUpdate as any);
    return () => {
      window.removeEventListener("mezarisim-products-updated", onAnyUpdate as any);
      window.removeEventListener("mezarisim-force-rerender", onAnyUpdate as any);
      window.removeEventListener("storage", onAnyUpdate as any);
      window.removeEventListener("mezarisim-product-changed", onAnyUpdate as any);
    };
  }, [refetchProducts, refetchCats, refetchSubs]);

  // ---- Product detail navigate
  const handleProductDetail = (model: TombstoneModel) => {
    onProductDetail?.(model.id);
  };

  // ---- Alt kategoriler (seçili kategoriye göre)
  const activeCategory = useMemo(
    () => (categoriesRes as Category[]).find((c) => c.slug === selectedCategory),
    [categoriesRes, selectedCategory]
  );
  const uiSubCategories = useMemo(() => {
    if (!activeCategory) return [];
    const list = subsByCategoryId[String(activeCategory.id)] || [];
    return list.map((s) => ({ id: s.slug, name: s.name }));
  }, [activeCategory, subsByCategoryId]);

  return (
    <div className="min-h-screen">
      {/* Hero + Breadcrumb */}
      <div
        className="relative bg-teal-500 py-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/95 to-teal-500/90"></div>
        <div className="relative container mx-auto px-4">
          <div className="text-center text-white">
            <nav className="flex items-center justify-center space-x-2 text-sm">
              <button onClick={() => onNavigate("home")} className="hover:text-teal-200 transition-colors">
                Anasayfa
              </button>
              <span>{">"}</span>
              <span>Mezar Modelleri</span>
            </nav>
          </div>
        </div>
      </div>

      {/* (Opsiyonel) Hero Slider */}
      {heroSlides && heroSlides.length > 0 && !isSlidesError && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                  index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
                }`}
              >
                <div className="relative w-full h-full">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.alt ?? slide.title}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>

                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">{slide.title}</h2>
                  <button
                    onClick={() => {
                      const gridElement = document.getElementById("products-grid");
                      if (gridElement) gridElement.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 border border-white border-opacity-50 text-black px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    İNCELE
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-white scale-125" : "bg-white bg-opacity-40 hover:bg-opacity-70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kategori filtreleri */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Desktop Pills */}
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {uiCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubCategory("tümü");
                  }}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg hover:bg-teal-600"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                  }`}
                >
                  <span>{(category as any).name}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedCategory === category.id ? "bg-white bg-opacity-20 text-white" : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {"count" in category ? (category as any).count : 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile Grid */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              {uiCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubCategory("tümü");
                  }}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 border text-center ${
                    selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                  }`}
                >
                  <div className="text-center leading-tight break-words font-bold">
                    {(category as any).name}
                  </div>
                  <div
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedCategory === category.id ? "bg-white bg-opacity-20 text-white" : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {"count" in category ? (category as any).count : 0}
                  </div>
                </button>
              ))}
            </div>

            {/* Alt kategoriler */}
            {activeCategory && uiSubCategories.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedSubCategory("tümü")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    selectedSubCategory === "tümü"
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                  }`}
                >
                  Tümü
                </button>
                {uiSubCategories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubCategory(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      selectedSubCategory === s.id
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ürün Grid */}
      <div id="products-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü"
                  ? "Tüm Mezar Modelleri"
                  : (uiCategories.find((cat: any) => cat.id === selectedCategory)?.name ?? "Mezar Modelleri")}
              </h2>
              <p className="text-gray-600">Kaliteli malzeme ve işçilikle hazırlanmış mezar modelleri</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {filteredModels.map((model) => (
                <div
                  key={`${model.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                  onClick={() => handleProductDetail(model)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={model.image}
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 uppercase leading-tight">
                      {model.name}
                    </h3>

                    <div className="flex items-center justify-between gap-2">
                      {model.productCode ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-500 text-blue-600 text-xs font-bold rounded">
                          {model.productCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-300 text-gray-600 text-xs font-semibold rounded">
                          KOD YOK
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">{model.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📷</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bu kategoride henüz model bulunmuyor</h3>
                <p className="text-gray-500 mb-6">Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.</p>
                <Button onClick={() => setSelectedCategory("tümü")} className="bg-teal-500 hover:bg-teal-600 text-white">
                  Tüm Modelleri Görüntüle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Öne Çıkanlar (Carousel) */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">Öne Çıkan Mezar Modelleri</h2>
              <p className="text-gray-600">En popüler ve kaliteli mezar modellerimizi keşfedin</p>
            </div>

            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredModels.map((model) => (
                  <CarouselItem key={model.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card
                      className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden h-full cursor-pointer"
                      onClick={() => handleProductDetail(model)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={model.image}
                          alt={model.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-gray-800 mb-3 line-clamp-2 uppercase">
                          {model.name}
                        </h3>

                        <div className="flex items-center justify-between gap-2">
                          {model.productCode ? (
                            <span className="inline-block px-3 py-1 border-2 border-blue-500 text-blue-600 text-xs font-bold rounded">
                              {model.productCode}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 border-2 border-gray-300 text-gray-600 text-xs font-semibold rounded">
                              KOD YOK
                            </span>
                          )}
                          <span className="text-lg font-bold text-gray-800">{model.price}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl text-white mb-6">Kaliteli Mezar Yapımı İçin Hemen İletişime Geçin</h2>
            <p className="text-teal-100 mb-8 text-lg">
              Uzman ekibimizle birlikte en uygun mezar modelini seçin ve profesyonel hizmet alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => onNavigate("contact")} className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3">
                İletişime Geç
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-teal-500 px-8 py-3"
                onClick={() => window.open("tel:+905334838971")}
              >
                📞 Hemen Ara
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
