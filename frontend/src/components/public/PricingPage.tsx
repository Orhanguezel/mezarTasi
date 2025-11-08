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
import { useListAccessoriesPublicQuery } from "@/integrations/metahub/rtk/endpoints/accessories.endpoints";
import { useListServicesPublicQuery } from "@/integrations/metahub/rtk/endpoints/services_public.endpoints";

import type { Product as ApiProduct } from "@/integrations/metahub/db/types/products.rows";
import type { Category } from "@/integrations/metahub/db/types/categories.rows";
import type { SubCategory } from "@/integrations/metahub/db/types/sub_categories.rows";

/* =========================== helpers =========================== */

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
  } catch {}
  return key;
}

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

/* =========================== types =========================== */
interface PricingPageProps {
  onNavigate: (page: string) => void;
  onProductDetail?: (productNumericKey: number) => void;
}

interface TombstoneModel {
  id: number;                // numeric key (mapped from real id)
  name: string;
  category: string;          // product:<slug> | accessories | service:<ciceklendirme|toprak-dolumu>
  subCategory?: string;      // ürün için sub-category slug
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

/* ======================= mappers (RTK -> UI) ======================= */

// ---- ApiProduct -> TombstoneModel
function productToModel(
  p: ApiProduct,
  categorySlugById: Record<string, string>,
  categoryNameById: Record<string, string>,
  subCategorySlugById: Record<string, string>
): TombstoneModel {
  const images = Array.isArray((p as any).images) ? (p as any).images.filter(Boolean) : [];
  const primary = String(images[0] || (p as any).image_url || (p as any).main_image || "");
  const realId = String((p as any).id ?? (p as any).uuid ?? (p as any).slug ?? Math.random());
  const numericKey = saveIdMapping(realId);

  const catId = String((p as any).category_id ?? "");
  const subId = String((p as any).sub_category_id ?? "");
  const catSlug = categorySlugById[catId] || "";
  const subSlug = subCategorySlugById[subId] || "";
  const catName = (categoryNameById[catId] || "").toLowerCase();

  const specs = normalizeSpecs((p as any).specifications);
  const material = catName.includes("granit") ? "Granit" : catName.includes("mermer") ? "Mermer" : "Ürün";

  let priceText = "Fiyat İçin Arayınız";
  const price = (p as any).price;
  if (typeof price === "number") priceText = price.toLocaleString("tr-TR");
  else if (typeof price === "string" && price.trim()) {
    const n = Number(price);
    priceText = Number.isFinite(n) ? n.toLocaleString("tr-TR") : price;
  }

  return {
    id: numericKey,
    name: String((p as any).title ?? (p as any).product_code ?? "Ürün Adı Yok"),
    category: `product:${catSlug}`,
    ...(subSlug ? { subCategory: subSlug } : {}), // exactOptionalPropertyTypes uyumlu
    material,
    price: priceText,
    image: primary,
    description: String((p as any).description ?? ""),
    featured: Boolean((p as any).is_featured),
    productCode: String((p as any).product_code ?? ""),
    ...(specs.dimensions ? { dimensions: specs.dimensions } : {}),
    ...(specs.weight ? { weight: specs.weight } : {}),
    ...(specs.thickness ? { thickness: specs.thickness } : {}),
    ...(specs.surfaceFinish || specs.finish ? { finish: String((specs as any).surfaceFinish || (specs as any).finish) } : {}),
    ...(specs.warranty ? { warranty: specs.warranty } : {}),
    ...(specs.installationTime ? { installationTime: specs.installationTime } : {}),
  };
}

// ---- Accessory -> TombstoneModel (public API 'image' alanını da oku)
function accessoryToModel(a: any): TombstoneModel {
  const realId = String(a.id ?? a.uuid ?? a.slug ?? Math.random());
  const numericKey = saveIdMapping(realId);
  const img =
    a.image ||               // ✅ public endpoint döndürür
    a.image_url ||
    a.asset_url ||
    (Array.isArray(a.images) && a.images[0]) ||
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=800&fit=crop";

  let priceText = "Fiyat İçin Arayınız";
  const price = a.price;
  if (typeof price === "number") priceText = price.toLocaleString("tr-TR");
  else if (typeof price === "string" && price.trim()) {
    const n = Number(price);
    priceText = Number.isFinite(n) ? n.toLocaleString("tr-TR") : price;
  }

  return {
    id: numericKey,
    name: String(a.title ?? a.name ?? "Aksesuar"),
    category: "accessories",
    material: "Aksesuar",
    price: priceText,
    image: String(img),
    description: String(a.description ?? ""),
    featured: Boolean(a.is_featured ?? a.featured),
    productCode: String(a.code ?? a.sku ?? ""),
  };
}

// ---- Service -> TombstoneModel (type bazlı kesin gruplama)
function serviceGroupKey(s: any): "ciceklendirme" | "toprak-dolumu" {
  const type = String(s.type ?? "").toLowerCase();
  const cat = String(s.category ?? "").toLowerCase();

  // BE: type → 'gardening' | 'soil'
  if (type === "gardening") return "ciceklendirme";
  if (type === "soil") return "toprak-dolumu";

  // Ek güvenlik: metin içeriğine göre yakala
  const keyInText = `${type} ${cat} ${s.slug ?? ""} ${s.name ?? ""}`.toLowerCase();
  if (/(çiçek|cicek)/.test(keyInText)) return "ciceklendirme";
  return "toprak-dolumu";
}
function serviceGroupLabel(key: "ciceklendirme" | "toprak-dolumu"): string {
  return key === "ciceklendirme" ? "Mezar Çiçeklendirme" : "Mezar Toprak Dolumu";
}
function serviceToModel(s: any): TombstoneModel {
  const realId = String(s.id ?? s.uuid ?? s.slug ?? Math.random());
  const numericKey = saveIdMapping(realId);
  const img =
    s.image ||              // ✅ olası public alan
    s.image_url ||
    s.asset_url ||
    (Array.isArray(s.images) && s.images[0]) ||
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=800&fit=crop";

  let priceText = "Teklif Alın";
  const price = s.price;
  if (typeof price === "number") priceText = price.toLocaleString("tr-TR");
  else if (typeof price === "string" && price.trim()) {
    const n = Number(price);
    priceText = Number.isFinite(n) ? n.toLocaleString("tr-TR") : price;
  }

  const key = serviceGroupKey(s);

  return {
    id: numericKey,
    name: String(s.title ?? s.name ?? serviceGroupLabel(key)),
    category: `service:${key}`,
    material: "Hizmet",
    price: priceText,
    image: String(img),
    description: String(s.description ?? ""),
    featured: Boolean(s.is_featured ?? s.featured),
    productCode: String(s.code ?? s.sku ?? ""),
  };
}

/* ============================= component ============================= */
export function PricingPage({ onNavigate, onProductDetail }: PricingPageProps) {
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("tümü");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | "tümü">("tümü");

  // HERO slider
  const { slides: heroSlides, isError: isSlidesError } = useActiveSlidesRtk();
  const [currentSlide, setCurrentSlide] = useState(0);

 // --- RTK data (KATEGORİ / ALT KATEGORİ / ÜRÜN / AKSESUAR aynı) ---
const { data: categoriesRes = [], refetch: refetchCats } = useListCategoriesAdminQuery({
  is_active: true, sort: "display_order", order: "asc", limit: 200,
});
const { data: subCategoriesRes = [], refetch: refetchSubs } = useListSubCategoriesAdminQuery({
  is_active: true, sort: "display_order", order: "asc", limit: 200,
});
const { data: productsRes = [], refetch: refetchProducts } = useListProductsQuery({
  is_active: 1, limit: 200, sort: "created_at", order: "desc",
});
const { data: accessoriesRes = [], refetch: refetchAccessories } = useListAccessoriesPublicQuery({
  is_active: 1, limit: 200, order: "asc", sort: "display_order",
} as any);

// --- ✅ SERVICES: type'e göre ayrı ayrı çek ---
const {
  data: servicesGardeningRes = [],
  refetch: refetchServicesGardening,
} = useListServicesPublicQuery({
  type: "gardening",
  orderBy: "display_order",
  order: "asc",
  limit: 200,
});

const {
  data: servicesSoilRes = [],
  refetch: refetchServicesSoil,
} = useListServicesPublicQuery({
  type: "soil",
  orderBy: "display_order",
  order: "asc",
  limit: 200,
});


  // Maps
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

  const subCategorySlugById = useMemo(() => {
    const m: Record<string, string> = {};
    (subCategoriesRes as SubCategory[]).forEach((s) => { m[String(s.id)] = s.slug; });
    return m;
  }, [subCategoriesRes]);

  // ---- PRODUCTS / ACCESSORIES aynı ----
const productModels: TombstoneModel[] = useMemo(() => {
  if (!Array.isArray(productsRes)) return [];
  return (productsRes as ApiProduct[]).map((p) =>
    productToModel(p, categorySlugById, categoryNameById, subCategorySlugById)
  );
}, [productsRes, categorySlugById, categoryNameById, subCategorySlugById]);

const accessoryModels: TombstoneModel[] = useMemo(() => {
  const arr = Array.isArray(accessoriesRes) ? accessoriesRes : [];
  return arr.map(accessoryToModel);
}, [accessoriesRes]);

// ---- ✅ SERVICES: iki ayrı listeden UI modele çevirip birleştir ----
const serviceModels: TombstoneModel[] = useMemo(() => {
  const g = Array.isArray(servicesGardeningRes) ? servicesGardeningRes : [];
  const s = Array.isArray(servicesSoilRes) ? servicesSoilRes : [];
  return [...g, ...s].map(serviceToModel);
}, [servicesGardeningRes, servicesSoilRes]);

// ---- Hepsi birlikte ----
const allModels: TombstoneModel[] = useMemo(
  () => [...productModels, ...accessoryModels, ...serviceModels],
  [productModels, accessoryModels, serviceModels]
);


  // Featured (ürün)
  const featuredModels: TombstoneModel[] = useMemo(() => {
    const featured = (productsRes as ApiProduct[]).filter((p: any) => Boolean(p?.is_featured));
    const source = featured.length ? featured : (productsRes as ApiProduct[]);
    return source.slice(0, 12).map((p) =>
      productToModel(p, categorySlugById, categoryNameById, subCategorySlugById)
    );
  }, [productsRes, categorySlugById, categoryNameById, subCategorySlugById]);

  // Sub-cats grouped by category
  const subsByCategoryId = useMemo(() => {
    const m: Record<string, SubCategory[]> = {};
    (subCategoriesRes as SubCategory[]).forEach((s) => {
      const cid = String(s.category_id);
      (m[cid] ||= []).push(s);
    });
    return m;
  }, [subCategoriesRes]);

  // Counts
  const productCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    productModels.forEach((m) => {
      const slug = m.category.replace(/^product:/, "");
      if (!slug) return;
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [productModels]);

  const serviceCounts = useMemo(() => {
    const c = { "ciceklendirme": 0, "toprak-dolumu": 0 } as Record<"ciceklendirme" | "toprak-dolumu", number>;
    for (const s of serviceModels) {
      if (s.category.endsWith("ciceklendirme")) c["ciceklendirme"]++;
      else if (s.category.endsWith("toprak-dolumu")) c["toprak-dolumu"]++;
    }
    return c;
  }, [serviceModels]);

  // UI categories (chips)
  const uiCategories = useMemo(() => {
    const base = [{ id: "tümü", name: "Tüm Modeller", count: allModels.length }];

    const prodCats = (categoriesRes as Category[]).map((c) => ({
      id: `product:${c.slug}`,
      name: c.name.toUpperCase(),
      count: productCategoryCounts[c.slug] || 0,
      _id: String(c.id),
    }));

    const accessoriesChip =
      accessoryModels.length > 0
        ? [{ id: "accessories", name: "MEZAR AKSESUARLARI", count: accessoryModels.length }]
        : [];

    const serviceChips = [
      { id: "service:ciceklendirme", name: "MEZAR ÇİÇEKLENDİRME", count: serviceCounts["ciceklendirme"] },
      { id: "service:toprak-dolumu", name: "MEZAR TOPRAK DOLUMU", count: serviceCounts["toprak-dolumu"] },
    ];

    return [...base, ...prodCats, ...accessoriesChip, ...serviceChips];
  }, [allModels.length, categoriesRes, productCategoryCounts, accessoryModels.length, serviceCounts]);

  // Filtering
  const filteredModels = useMemo(() => {
    // Base by top chip
    let arr: TombstoneModel[] = allModels;

    if (selectedCategory === "accessories") {
      arr = accessoryModels;
    } else if (selectedCategory.startsWith("service:")) {
      const key = selectedCategory.replace(/^service:/, "");
      arr = serviceModels.filter((m) => m.category === `service:${key}`);
    } else if (selectedCategory.startsWith("product:")) {
      const slug = selectedCategory.replace(/^product:/, "");
      arr = productModels.filter((m) => m.category === `product:${slug}`);

      // sub-category filtre (yalnız ürün kategorisi seçiliyken)
      if (selectedSubCategory !== "tümü") {
        arr = arr.filter((m) => m.subCategory === selectedSubCategory);
      }
    }

    return arr;
  }, [allModels, selectedCategory, selectedSubCategory, accessoryModels, serviceModels, productModels]);

  // Active product category + its sub-cats
  const activeCategory = useMemo(() => {
    if (!selectedCategory.startsWith("product:")) return null;
    const slug = selectedCategory.replace(/^product:/, "");
    return (categoriesRes as Category[]).find((c) => c.slug === slug) ?? null;
  }, [categoriesRes, selectedCategory]);

  const uiSubCategories = useMemo(() => {
    if (!activeCategory) return [];
    const list = subsByCategoryId[String(activeCategory.id)] || [];
    return list.map((s) => ({ id: s.slug, name: s.name }));
  }, [activeCategory, subsByCategoryId]);

  // HERO slider autoplay & preload
  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const t = window.setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(t);
  }, [heroSlides?.length]);

  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const next = (currentSlide + 1) % heroSlides.length;
    const nextSlideObj = heroSlides[next];
    if (!nextSlideObj) return;
    const img = new Image();
    img.src = nextSlideObj.image;
  }, [currentSlide, heroSlides]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % (heroSlides?.length || 1));
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + (heroSlides?.length || 1)) % (heroSlides?.length || 1));

  // Refetch triggers
  useEffect(() => {
  const onAnyUpdate = () => {
    refetchProducts();
    refetchCats();
    refetchSubs();
    refetchAccessories();
    // ✅ iki ayrı services refetch
    refetchServicesGardening();
    refetchServicesSoil();
  };
  window.addEventListener("mezarisim-products-updated", onAnyUpdate as any);
  window.addEventListener("mezarisim-force-rerender", onAnyUpdate as any);
  window.addEventListener("mezarisim-product-changed", onAnyUpdate as any);
  return () => {
    window.removeEventListener("mezarisim-products-updated", onAnyUpdate as any);
    window.removeEventListener("mezarisim-force-rerender", onAnyUpdate as any);
    window.removeEventListener("mezarisim-product-changed", onAnyUpdate as any);
  };
}, [
  refetchProducts,
  refetchCats,
  refetchSubs,
  refetchAccessories,
  refetchServicesGardening,
  refetchServicesSoil,
]);


  // Detail navigate
  const handleProductDetail = (model: TombstoneModel) => onProductDetail?.(model.id);

  return (
    <div className="min-h-screen">
      {/* Hero + Breadcrumb */}
      <div className="relative bg-teal-500 py-6 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/95 to-teal-500/90" />
        <div className="relative container mx-auto px-4">
          <div className="text-center text-white">
            <nav className="flex items-center justify-center space-x-2 text-sm">
              <button onClick={() => onNavigate("home")} className="hover:text-teal-200 transition-colors">Anasayfa</button>
              <span>{">"}</span>
              <span>Mezar Modelleri</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Slider */}
      {heroSlides && heroSlides.length > 0 && !isSlidesError && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {heroSlides.map((slide, index) => (
              <div
                key={String(slide.id ?? slide.image ?? index)}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                  index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
                }`}
              >
                <div className="relative w-full h-full">
                  <ImageWithFallback src={slide.image} alt={slide.alt ?? slide.title} className="w-full h-96 object-cover opacity-30" />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>

                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">{slide.title}</h2>
                  <button
                    onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 border border-white border-opacity-50 text-black px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    İNCELE
                  </button>
                </div>
              </div>
            ))}

            <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110">
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

      {/* Kategori (chips) */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Desktop */}
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {uiCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.id); setSelectedSubCategory("tümü"); }}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg hover:bg-teal-600"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                  }`}
                >
                  <span>{(category as any).name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === category.id ? "bg-white bg-opacity-20 text-white" : "bg-teal-100 text-teal-700"
                  }`}>
                    {"count" in category ? (category as any).count : 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              {uiCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.id); setSelectedSubCategory("tümü"); }}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 border text-center ${
                    selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                  }`}
                >
                  <div className="text-center leading-tight break-words font-bold">{(category as any).name}</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === category.id ? "bg-white bg-opacity-20 text-white" : "bg-teal-100 text-teal-700"
                  }`}>
                    {"count" in category ? (category as any).count : 0}
                  </div>
                </button>
              ))}
            </div>

            {/* Alt kategoriler (sadece ürün kategorisinde) */}
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

      {/* Grid */}
      <div id="products-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü"
                  ? "Tüm Modeller"
                  : uiCategories.find((c: any) => c.id === selectedCategory)?.name ?? "Modeller"}
              </h2>
              <p className="text-gray-600">Kaliteli malzeme ve işçilikle hazırlanmış ürünler ve hizmetler</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bu kategoride henüz içerik yok</h3>
                <p className="text-gray-500 mb-6">Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.</p>
                <Button onClick={() => setSelectedCategory("tümü")} className="bg-teal-500 hover:bg-teal-600 text-white">
                  Tümünü Göster
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Öne Çıkanlar (ürün) */}
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
            <p className="text-teal-100 mb-8 text-lg">Uzman ekibimizle birlikte en uygun mezar modelini seçin ve profesyonel hizmet alın.</p>
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
