// FILE: src/pages/.../ModelsPage.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveSlidesRtk } from "../../data/sliderData";
import { getAllProducts } from "../../data/dynamicProducts";
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";
import type { Product } from "@/integrations/metahub/db/types/products.rows";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";
import tombstoneImage1 from "figma:asset/045ec544828ae89a32759225db62e101d2608292.png";
import tombstoneImage2 from "figma:asset/230bfc45a1c3e29e0d1080b05baa205fb4c5f511.png";

interface ModelsPageProps {
  onNavigate: (page: string) => void;
  onProductDetail?: (productId: number) => void;
}

interface TombstoneModel {
  id: number;
  name: string;
  category: string; // "mermer" | "granit" | "sutunlu" | "bastaslari" | "modeller"
  material: string;
  price: string;
  image: string;
  description: string;
  featured?: boolean;
  dimensions?: string;
  weight?: string;
  thickness?: string;
  finish?: string;
  warranty?: string;
  installationTime?: string;
}

/* ================= helpers: dynamic product normalize ================= */
type DynamicProduct = Partial<Product> & {
  category?: string;
  category_name?: string;
  productCode?: string; // FE alanı
  image?: string; // FE alanı
  specifications?:
    | Record<string, unknown>
    | Array<{ name?: string; value?: unknown }>
    | unknown
    | null;
};

type SpecDict = Record<string, string>;

const toSpecDict = (specs: DynamicProduct["specifications"]): SpecDict => {
  if (!specs) return {};
  if (Array.isArray(specs)) {
    const out: SpecDict = {};
    for (const it of specs) {
      const k = (it?.name ?? "").toString().trim().toLowerCase();
      const v = it?.value;
      if (k) out[k] = v == null ? "" : String(v);
    }
    return out;
  }
  if (typeof specs === "object") {
    const out: SpecDict = {};
    for (const [k, v] of Object.entries(specs as Record<string, unknown>)) {
      out[k.toLowerCase()] = v == null ? "" : String(v);
    }
    return out;
  }
  return {};
};

const getSpec = (d: SpecDict, keys: string[]): string => {
  for (const k of keys) {
    const v = d[k.toLowerCase()];
    if (v) return v;
  }
  return "";
};

const pickImage = (p: DynamicProduct): string | undefined => {
  if (p.image_url) return p.image_url;
  if (Array.isArray(p.images) && p.images.length > 0) return String(p.images[0]);
  if ((p as any).image) return String((p as any).image);
  return undefined;
};

const inferCategorySource = (p: DynamicProduct): string => {
  const c = p.category || p.category_name || "";
  if (c) return c;
  const t = (p.title || "").toLowerCase();
  if (/granit/.test(t)) return "granit";
  if (/mermer/.test(t)) return "mermer";
  if (/sütun|sutun/.test(t)) return "sutunlu";
  if (/baş ?taşı|bas ?tasi/.test(t)) return "bastaslari";
  return "modeller";
};

/* ================= component ================= */
export function ModelsPage({ onNavigate, onProductDetail }: ModelsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [selectedModel, setSelectedModel] = useState<TombstoneModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [allModels, setAllModels] = useState<TombstoneModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ Slider RTK
  const { slides, isError: isSlidesError } = useActiveSlidesRtk();

  // ✅ Kategorileri RTK'dan çek
  const { data: categories = [] } = useListCategoriesQuery({
    is_active: true,
    limit: 200,
    offset: 0,
    sort: "display_order",
    order: "asc",
  });

  // --- normalize helper ---
  const normalize = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      // @ts-ignore - Unicode diacritics regex
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");

  // === Statik vitrin ===
  const staticShowcase: TombstoneModel[] = [
    {
      id: 1,
      name: "Günay Yaman Modeli - Siyah Granit Çerçeveli Mezar Baş Taşı",
      category: "granit",
      material: "Siyah Granit + Beyaz Mermer",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description:
        "Siyah granit çerçeve ile beyaz mermer kombinasyonu, modern ve şık mezar baş taşı tasarımı",
      featured: true,
      dimensions: "120cm x 80cm",
      weight: "350 kg",
      thickness: "8 cm",
      finish: "Parlak Cilalı",
      warranty: "10 Yıl Garanti",
      installationTime: "1-2 Gün",
    },
    {
      id: 10,
      name: "Özel Yapım Mezar Modeli",
      category: "modeller",
      material: "Granit + Özel İşçilik",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage2,
      description: "Müşteri isteklerine göre özel olarak tasarlanan granit mezar baş taşı modeli",
      featured: true,
      dimensions: "Müşteri İsteğine Göre",
      weight: "300-500 kg",
      thickness: "6-12 cm",
      finish: "Özel İstek İşçilik",
      warranty: "15 Yıl Garanti",
      installationTime: "2-5 Gün",
    },
  ];

  // ✅ RTK kategorilerinden sayfa içi anahtarlar türet
  const hasModeller = useMemo(
    () => categories.some((c: any) => /mezar-?modelleri/i.test(normalize(c.slug || c.name))),
    [categories]
  );
  const hasBasTasi = useMemo(
    () => categories.some((c: any) => /mezar-?bas-?tasi-?modelleri/i.test(normalize(c.slug || c.name))),
    [categories]
  );

  // ✅ Kategori adı/slug → iç anahtar map'i
  const categoryKeyByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories as any[]) {
      const label = normalize(c.slug || c.name || "");
      if (/mezar-?modelleri/.test(label)) map.set("mezar-modelleri", "modeller");
      if (/mezar-?bas-?tasi-?modelleri/.test(label)) map.set("mezar-bas-tasi-modelleri", "bastaslari");
      if (c.name)
        map.set(
          normalize(c.name),
          /bas-?tasi/.test(label) ? "bastaslari" : /modelleri|model/.test(label) ? "modeller" : ""
        );
      if (c.slug)
        map.set(
          normalize(c.slug),
          /bas-?tasi/.test(label) ? "bastaslari" : /modelleri|model/.test(label) ? "modeller" : ""
        );
    }
    return map;
  }, [categories]);

  // Helper: admin/dynamic kategori → sayfa içi key
  const getCategoryKey = (category: string): string => {
    const norm = normalize(category);
    const fromMap = categoryKeyByName.get(norm);
    if (fromMap) return fromMap || "mermer";

    if (/tek-kisilik-mermer|iki-kisilik-mermer|mermer-bas-tasi|mermer/i.test(norm)) return "mermer";
    if (/tek-kisilik-granit|iki-kisilik-granit|granit-bas-tasi|granit/i.test(norm)) return "granit";
    if (/sutunlu-?mezar|sutunlu-?bas-?tasi|sutun/i.test(norm)) return "sutunlu";
    if (/ozel-?yapim|katli-?lahit|mezar-?modelleri|modeller|model/i.test(norm)) return "modeller";
    if (/bas-?tasi/.test(norm)) return "bastaslari";

    if (/granit/.test(norm)) return "granit";
    if (/mermer/.test(norm)) return "mermer";
    if (/sutun/.test(norm)) return "sutunlu";
    return "mermer";
  };

  // Dinamik ürünleri yükle + statik vitrinle birleştir
  useEffect(() => {
    const loadAllModels = () => {
      const dynamicProducts = getAllProducts() as unknown as DynamicProduct[];

      const convertedDynamicProducts: TombstoneModel[] = dynamicProducts
        .filter((product) => {
          const key = getCategoryKey(inferCategorySource(product));
          return ["mermer", "granit", "sutunlu", "bastaslari", "modeller"].includes(key);
        })
        .map((product) => {
          const specs = toSpecDict(product.specifications);
          const dimensions = getSpec(specs, ["dimensions", "ölçü", "olcu", "boyut", "size"]);
          const weight = getSpec(specs, ["weight", "ağırlık", "agirlik"]);
          const thickness = getSpec(specs, ["thickness", "kalınlık", "kalinlik"]);
          const finish = getSpec(specs, ["finish", "yüzey", "surface", "polisaj", "polish"]);
          const warranty = getSpec(specs, ["warranty", "garanti"]);
          const installationTime = getSpec(specs, [
            "installationtime",
            "kurulum süresi",
            "montaj süresi",
            "montaj",
          ]);

          const img =
            pickImage(product) ||
            "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop";

          const key = getCategoryKey(inferCategorySource(product));
          const material = key === "granit" ? "Granit" : key === "mermer" ? "Mermer" : "Özel Malzeme";

          const idNum = Number(product.id);
          const safeId = Number.isFinite(idNum) ? idNum : 0;

          return {
            id: safeId + 1000,
            name:
              product.title ||
              (product as any).productCode ||
              (product as any).product_code ||
              "Ürün Adı Yok",
            category: key,
            material,
            price:
              product.price != null && (product as any).price !== ""
                ? String(product.price)
                : "Fiyat İçin Arayınız",
            image: img,
            description: product.description || "",
            featured: false,
            dimensions,
            weight,
            thickness,
            finish,
            warranty,
            installationTime,
          } as TombstoneModel;
        });

      setAllModels([...staticShowcase, ...convertedDynamicProducts]);
    };

    loadAllModels();

    const handleProductUpdate = () => loadAllModels();
    const handleForceRerender = () => {
      setRefreshKey((prev) => prev + 1);
      loadAllModels();
    };

    window.addEventListener("mezarisim-products-updated", handleProductUpdate);
    window.addEventListener("mezarisim-force-rerender", handleForceRerender);
    return () => {
      window.removeEventListener("mezarisim-products-updated", handleProductUpdate);
      window.removeEventListener("mezarisim-force-rerender", handleForceRerender);
    };
    // categories değiştiğinde ve mapping güncellendiğinde yeniden hesapla
  }, [refreshKey, categoryKeyByName]);

  // ✅ Slider autoplay — tüm code path’ler cleanup döndürür
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (slides.length > 0) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [slides.length]);

  // ✅ Bir sonraki görseli preload et — undefined guard
  useEffect(() => {
    if (slides.length === 0) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    const next = slides[nextIndex];
    if (!next) return;
    const img = new Image();
    img.src = next.image;
  }, [currentSlide, slides]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % (slides.length || 1));
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + (slides.length || 1)) % (slides.length || 1));

  // ✅ RTK’dan gelenlere göre chip setini kur
  const chipDefs = useMemo(
    () =>
      [
        { id: "tümü", label: "Tüm Modeller" },
        { id: "mermer", label: "Mermer Mezar Taşları" },
        { id: "granit", label: "Granit Mezar Taşları" },
        { id: "sutunlu", label: "Sütunlu Mezar Taşları" },
        ...(hasBasTasi ? [{ id: "bastaslari", label: "Mezar Baş Taşları" }] : []),
        ...(hasModeller ? [{ id: "modeller", label: "Mezar Modelleri" }] : []),
      ] as const,
    [hasBasTasi, hasModeller]
  );

  // Kategori sayıları (dinamik)
  const categoriesUi = useMemo(() => {
    const counts: Record<string, number> = {
      mermer: allModels.filter((m) => m.category === "mermer").length,
      granit: allModels.filter((m) => m.category === "granit").length,
      sutunlu: allModels.filter((m) => m.category === "sutunlu").length,
      bastaslari: allModels.filter((m) => m.category === "bastaslari").length,
      modeller: allModels.filter((m) => m.category === "modeller").length,
    };
    const total = allModels.length;

    return chipDefs
      .map((c) => ({
        id: c.id,
        name: c.label,
        count: c.id === "tümü" ? total : (counts as any)[c.id] ?? 0,
      }))
      .filter((cat) => cat.id === "tümü" || cat.count > 0);
  }, [chipDefs, allModels]);

  const filteredModels =
    selectedCategory === "tümü"
      ? allModels
      : allModels.filter((model) => model.category === selectedCategory);

  const handleImageClick = (model: TombstoneModel) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleProductDetail = (model: TombstoneModel) => {
    onProductDetail?.(model.id);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative bg-teal-500 py-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/95 to-teal-500/90" />
        <div className="relative container mx-auto px-4">
          <div className="text-center text-white">
            <nav className="flex items-center justify-center space-x-2 text-sm">
              <button
                onClick={() => onNavigate("home")}
                className="hover:text-teal-200 transition-colors"
              >
                Anasayfa
              </button>
              <span>{">"}</span>
              <span>Mezar Modelleri</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider */}
      {slides.length > 0 && !isSlidesError && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                  index === currentSlide
                    ? "translate-x-0"
                    : index < currentSlide
                    ? "-translate-x-full"
                    : "translate-x-full"
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
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">
                    {slide.title}
                  </h2>
                  <button
                    onClick={() => {
                      const gridElement =
                        document.getElementById("products-grid");
                      if (gridElement)
                        gridElement.scrollIntoView({ behavior: "smooth" });
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
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-white scale-125"
                      : "bg-white bg-opacity-40 hover:bg-opacity-70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kategoriler */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {categoriesUi.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-5 py-2.5 rounded-full transition-all duration-300 text-sm ${
                    selectedCategory === category.id
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                      : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                  }`}
                >
                  {category.name}
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs ${
                      selectedCategory === category.id
                        ? "bg-teal-400 text-teal-900"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="md:hidden grid grid-cols-2 gap-3">
              {categoriesUi.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-3 py-3 h-auto rounded-lg transition-all duration-300 text-center ${
                    selectedCategory === category.id
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                      : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                  }`}
                >
                  <span className="text-base font-bold leading-tight text-center break-words hyphens-auto">
                    {category.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ürün grid */}
      <div id="products-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü"
                  ? "Tüm Mezar Modelleri"
                  : categoriesUi.find((cat) => cat.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Kaliteli malzeme ve işçilikle hazırlanmış mezar modelleri
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model, index) => (
                <Card
                  key={`model-${model.id}-${index}`}
                  className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden"
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => handleImageClick(model)}
                  >
                    <ImageWithFallback
                      src={model.image}
                      alt={model.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {model.featured && (
                      <Badge className="absolute top-3 right-3 bg-teal-500 text-white">
                        Öne Çıkan
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3">
                        <span className="text-gray-800 text-sm">🔍 Detayları Gör</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-3">
                      <Badge
                        variant="outline"
                        className="text-teal-600 border-teal-600 mb-2"
                      >
                        {model.material}
                      </Badge>
                    </div>

                    <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
                      {model.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {model.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-teal-600">{model.price}</span>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                        onClick={() => handleProductDetail(model)}
                      >
                        🔍 Detayları Görüntüle
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-teal-500 border-teal-500 hover:bg-teal-50"
                        onClick={() => onNavigate("contact")}
                      >
                        Fiyat Teklifi Al
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => {
                          const whatsappMessage = `Merhaba, ${model.name} hakkında bilgi almak istiyorum.`;
                          window.open(
                            `https://wa.me/905334838971?text=${encodeURIComponent(
                              whatsappMessage
                            )}`,
                            "_blank"
                          );
                        }}
                      >
                        💬 WhatsApp'tan Sor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📷</div>
                <h3 className="text-xl text-gray-600 mb-2">
                  Bu kategoride henüz model bulunmuyor
                </h3>
                <p className="text-gray-500 mb-6">
                  Diğer kategorileri inceleyebilir veya bizimle iletişime
                  geçebilirsiniz.
                </p>
                <Button
                  onClick={() => setSelectedCategory("tümü")}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Tüm Modelleri Görüntüle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal — AccessoriesPage ile aynı yapıda detaylı */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl bg-gray-50 max-h-[90vh] overflow-y-auto"
          aria-describedby={
            selectedModel ? `model-description-${selectedModel.id}` : "modal-content"
          }
        >
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">
                  {selectedModel.name}
                </DialogTitle>
                <DialogDescription
                  id={`model-description-${selectedModel.id}`}
                  className="text-gray-600"
                >
                  {selectedModel.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Görsel */}
                <div className="relative bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedModel.image}
                    alt={selectedModel.name}
                    className="w-full h-80 object-cover"
                  />
                  {selectedModel.featured && (
                    <Badge className="absolute top-4 left-4 bg-teal-500 text-white">
                      Öne Çıkan Model
                    </Badge>
                  )}
                </div>

                {/* Etiketler + Fiyat */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="text-teal-600 border-teal-600">
                      {selectedModel.material}
                    </Badge>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {selectedModel.category.charAt(0).toUpperCase() +
                        selectedModel.category.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-2xl text-teal-600">{selectedModel.price}</div>
                </div>

                {/* Aksiyonlar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={() => onNavigate("contact")}
                  >
                    📞 Fiyat Teklifi Al
                  </Button>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => {
                      const msg = `Merhaba, ${selectedModel.name} hakkında bilgi almak istiyorum.`;
                      window.open(
                        `https://wa.me/905334838971?text=${encodeURIComponent(msg)}`,
                        "_blank"
                      );
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                  <Button
                    variant="outline"
                    className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    onClick={() => onProductDetail?.(selectedModel.id)}
                  >
                    🔍 Ürün Sayfasına Git
                  </Button>
                </div>

                {/* Teknik Özellikler */}
                <div>
                  <h3 className="text-lg text-gray-800 mb-4 text-center">Teknik Özellikler</h3>
                  <div className="space-y-3">
                    {selectedModel.dimensions && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Boyutlar:</span>
                        <span className="text-gray-800">{selectedModel.dimensions}</span>
                      </div>
                    )}
                    {selectedModel.weight && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Ağırlık:</span>
                        <span className="text-gray-800">{selectedModel.weight}</span>
                      </div>
                    )}
                    {selectedModel.thickness && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kalınlık:</span>
                        <span className="text-gray-800">{selectedModel.thickness}</span>
                      </div>
                    )}
                    {selectedModel.finish && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Yüzey İşlemi:</span>
                        <span className="text-gray-800">{selectedModel.finish}</span>
                      </div>
                    )}
                    {selectedModel.warranty && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Garanti:</span>
                        <span className="text-gray-800">{selectedModel.warranty}</span>
                      </div>
                    )}
                    {selectedModel.installationTime && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Kurulum Süresi:</span>
                        <span className="text-gray-800">{selectedModel.installationTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
