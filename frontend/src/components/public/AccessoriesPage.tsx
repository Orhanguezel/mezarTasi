// src/pages/AccessoriesPage.tsx
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
// Sadece tipini al (dosya ismi aynı kalıyor)
import type { SlideData } from "../../data/sliderData";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";

// — Tipler
import type {
  AccessoryPublic,
  AccessoryKey,
  AccessoriesListParams,
} from "@/integrations/metahub/db/types/accessories";

// — RTK PUBLIC endpoints
import { useListAccessoriesPublicQuery } from "@/integrations/metahub/rtk/endpoints/accessories.endpoints";
import { useListSlidesPublicQuery } from "@/integrations/metahub/rtk/endpoints/slider.endpoints";

// — Üretim Süreci (ayrı dosya)
import ProcessSection from "./ProcessSection";

/* ================= helpers ================= */
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=800&h=600&fit=crop";

// Public liste çağrısı için param builder (is_active YOK!)
const buildPublicParams = (cat: "tümü" | AccessoryKey): AccessoriesListParams => ({
  // backend limit ≤ 200 olduğu için 200 gönder
  limit: 200,
  offset: 0,
  order: "asc",
  sort: "display_order",
  ...(cat === "tümü" ? {} : { category: cat }),
});

// Kategori string → AccessoryKey
const toKey = (v: unknown): AccessoryKey => {
  const c = String(v || "").toLowerCase();
  if (c.includes("şuluk") || c.includes("suluk")) return "suluk";
  if (c.includes("sütun") || c.includes("sutun")) return "sutun";
  if (c.includes("vazo")) return "vazo";
  return "aksesuar";
};

// Görsel seçimi: image | image_effective_url | image_url | images[0]
const pickImage = (r: any): string => {
  if (r?.image) return r.image as string;
  if (r?.image_effective_url) return r.image_effective_url as string;
  if (r?.image_url) return r.image_url as string;
  if (Array.isArray(r?.images) && r.images[0]) return String(r.images[0]);
  return PLACEHOLDER_IMG;
};

// Fiyat normalize
const normalizePrice = (r: any): string => {
  const p = r?.price;
  const pm = r?.price_minor;
  if (typeof p === "string" && p.trim()) return p;
  if (typeof p === "number" && Number.isFinite(p) && p > 0) {
    try {
      return p.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
    } catch {
      return `${Math.round(p)} TL`;
    }
  }
  if (typeof pm === "number" && Number.isFinite(pm) && pm > 0) {
    const tl = Math.round(pm / 100);
    try {
      return tl.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
    } catch {
      return `${tl} TL`;
    }
  }
  return "Fiyat İçin Arayınız";
};

// Backend hangi şekli dönerse dönsün FE aradığı AccessoryPublic’e çevir
const toUIAccessory = (r: any): AccessoryPublic => ({
  id: Number(r?.id ?? Math.random()),
  name: String(r?.name ?? r?.title ?? "Ürün"),
  category: toKey(r?.category ?? r?.category_name),
  material: String(r?.material ?? "Özel Malzeme"),
  price: normalizePrice(r),
  image: pickImage(r),
  description: String(r?.description ?? ""),
  featured: Boolean(r?.featured),
  dimensions: r?.dimensions ?? undefined,
  weight: r?.weight ?? undefined,
  thickness: r?.thickness ?? undefined,
  finish: r?.finish ?? undefined,
  warranty: r?.warranty ?? undefined,
  installationTime: r?.installationTime ?? r?.installation_time ?? undefined,
});

// SliderPublic -> SlideData map (public API zaten aktifleri döner; yine de guard koyduk)
const toSlideData = (s: any): SlideData => ({
  id: String(s?.id ?? s?.uuid ?? Math.random()),
  title: String(s?.title ?? s?.name ?? ""),
  description: String(s?.description ?? ""),
  image: String(s?.image ?? s?.image_effective_url ?? s?.image_url ?? PLACEHOLDER_IMG),
  alt: s?.alt ?? undefined,
  buttonText: String(s?.buttonText ?? "İncele"),
  buttonLink: String(s?.buttonLink ?? "contact"),
  isActive: Boolean(s?.isActive ?? s?.is_active ?? true),
  order: Number(s?.order ?? s?.display_order ?? 0),
  priority: "high",
  showOnMobile: true,
  showOnDesktop: true,
});

interface AccessoriesPageProps {
  onNavigate: (page: string) => void;
}

export function AccessoriesPage({ onNavigate }: AccessoriesPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<"tümü" | AccessoryKey>("tümü");
  const [selectedModel, setSelectedModel] = useState<AccessoryPublic | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==== SLIDER: RTK’dan çek
  const {
    data: slidesApi = [],
    isFetching: loadingSlides,
    isError: slidesError,
    refetch: refetchSlides,
  } = useListSlidesPublicQuery({
    limit: 200,
    offset: 0,
    sort: "display_order",
    order: "asc",
  });

  // aktif slider listesi
  const activeSlides: SlideData[] = useMemo(() => {
    const arr = Array.isArray(slidesApi) ? slidesApi : [];
    return arr.map(toSlideData).filter(s => s.isActive).sort((a, b) => a.order - b.order);
  }, [slidesApi]);

  // Slider UI state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);

  // API verisi gelince slider’ı besle
  useEffect(() => {
    setSlides(activeSlides);
    setCurrentSlide(0);
  }, [activeSlides]);

  // Admin tarafı tetikleyince tazele
  useEffect(() => {
    const onUpd = () => refetchSlides();
    window.addEventListener("slider-data-updated", onUpd);
    return () => window.removeEventListener("slider-data-updated", onUpd);
  }, [refetchSlides]);

  // autoplay + preload
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(
      () => setCurrentSlide((p) => (p + 1) % slides.length),
      5000
    );
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    const nextImgUrl = slides[nextIndex]?.image;
    if (nextImgUrl) {
      const img = new Image();
      img.src = nextImgUrl;
    }
  }, [currentSlide, slides]);

  // ==== ACCESSORIES: RTK
  const {
    data: allData = [],
    isFetching: loadingAll,
    refetch: refetchAll,
  } = useListAccessoriesPublicQuery(buildPublicParams("tümü"));

  const {
    data: pageData = [],
    isFetching,
    isError,
    refetch: refetchPage,
  } = useListAccessoriesPublicQuery(buildPublicParams(selectedCategory));

  // dış eventlerde iki sorguyu da tazele
  useEffect(() => {
    const upd = () => {
      refetchAll();
      refetchPage();
    };
    window.addEventListener("mezarisim-products-updated", upd);
    window.addEventListener("mezarisim-force-rerender", upd);
    return () => {
      window.removeEventListener("mezarisim-products-updated", upd);
      window.removeEventListener("mezarisim-force-rerender", upd);
    };
  }, [refetchAll, refetchPage]);

  // map’lenmiş listeler
  const allModels: AccessoryPublic[] = useMemo(
    () => (allData as any[]).map(toUIAccessory),
    [allData]
  );
  const pageModels: AccessoryPublic[] = useMemo(
    () => (pageData as any[]).map(toUIAccessory),
    [pageData]
  );

  // kategoriler + sayaçlar
  const categories = useMemo(() => {
    const counts = {
      suluk: allModels.filter((m) => m.category === "suluk").length,
      sutun: allModels.filter((m) => m.category === "sutun").length,
      vazo: allModels.filter((m) => m.category === "vazo").length,
      aksesuar: allModels.filter((m) => m.category === "aksesuar").length,
    };
    const total = allModels.length;
    return [
      { id: "tümü" as const, name: "Tüm Aksesuarlar", count: total },
      { id: "suluk" as const, name: "Suluk Modelleri", count: counts.suluk },
      { id: "sutun" as const, name: "Sütun Modelleri", count: counts.sutun },
      { id: "vazo" as const, name: "Vazo Modelleri", count: counts.vazo },
      { id: "aksesuar" as const, name: "Diğer Aksesuarlar", count: counts.aksesuar },
    ].filter((c) => c.id === "tümü" || c.count > 0);
  }, [allModels]);

  const handleImageClick = (m: AccessoryPublic) => {
    setSelectedModel(m);
    setIsModalOpen(true);
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
              <span>&gt;</span>
              <span>Mezar Aksesuarları</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider (API) */}
      {(!slidesError && slides.length > 0) && (
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
                    alt={slide.alt || slide.title}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 font-normal">
                    {slide.title}
                  </h2>
                  <button
                    onClick={() =>
                      document
                        .getElementById("products-grid")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-white/90 hover:bg-white border border-white/50 text-black px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    {slide.buttonText || "İNCELE"}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setCurrentSlide((p) => (p - 1 + slides.length) % slides.length)
              }
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((p) => (p + 1) % slides.length)
              }
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "bg-white scale-125"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            {loadingSlides && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                Slider yükleniyor…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kategoriler */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
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
              {categories.map((category) => (
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
                  <span className="text-base font-bold leading-tight">
                    {category.name}
                  </span>
                </Button>
              ))}
            </div>
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
                  ? "Tüm Mezar Aksesuarları"
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Kaliteli malzeme ve işçilikle hazırlanmış mezar aksesuarları
              </p>
            </div>

            {(isFetching || loadingAll) && (
              <div className="text-center text-gray-500 py-12">Yükleniyor…</div>
            )}
            {isError && !isFetching && (
              <div className="text-center text-red-500 py-12">
                Veri alınamadı.
              </div>
            )}

            {!isFetching && pageModels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pageModels.map((model) => (
                  <Card
                    key={model.id}
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
                          onClick={() => onNavigate("contact")}
                        >
                          Fiyat Teklifi Al
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-teal-500 border-teal-500 hover:bg-teal-50"
                          onClick={() => {
                            const msg = `Merhaba, ${model.name} hakkında bilgi almak istiyorum.`;
                            window.open(
                              `https://wa.me/905334838971?text=${encodeURIComponent(
                                msg
                              )}`,
                              "_blank"
                            );
                          }}
                        >
                          WhatsApp'tan Sor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isFetching && pageModels.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📷</div>
                <h3 className="text-xl text-gray-600 mb-2">
                  Bu kategoride henüz model yok
                </h3>
                <p className="text-gray-500 mb-6">
                  Diğer kategorileri inceleyebilir veya bizimle iletişime
                  geçebilirsiniz.
                </p>
                <Button
                  onClick={() => setSelectedCategory("tümü")}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Tüm Modeller
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* — Üretim süreci ayrı dosyadan import — */}
      <ProcessSection />

      {/* CTA */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl mb-4">Özel Tasarım Mezar Aksesuarı İstiyorsanız</h2>
            <p className="text-lg opacity-90 mb-8">
              Ölçülerinize ve isteklerinize göre özel çözümler sunuyoruz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onNavigate("contact")}
                className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3"
              >
                Özel Tasarım Talebi
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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={
            selectedModel ? `accessory-description-${selectedModel.id}` : "modal-content"
          }
        >
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">
                  {selectedModel.name}
                </DialogTitle>
                <DialogDescription
                  id={`accessory-description-${selectedModel.id}`}
                  className="text-gray-600"
                >
                  {selectedModel.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
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

                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-teal-600 border-teal-600"
                    >
                      {selectedModel.material}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-teal-100 text-teal-700"
                    >
                      {String(selectedModel.category)
                        .charAt(0)
                        .toUpperCase() + String(selectedModel.category).slice(1)}
                    </Badge>
                  </div>
                  <div className="text-2xl text-teal-600">{selectedModel.price}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div>
                  <h3 className="text-lg text-gray-800 mb-4 text-center">
                    Teknik Özellikler
                  </h3>
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
                        <span className="text-gray-800">
                          {selectedModel.installationTime}
                        </span>
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
