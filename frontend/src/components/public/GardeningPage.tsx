// =============================================================
// FILE: src/components/public/GardeningPage.tsx
// =============================================================
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
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";

import {
  useListServicesPublicQuery,
} from "@/integrations/metahub/rtk/endpoints/services_public.endpoints";
import type { ServiceView } from "@/integrations/metahub/db/types/services.types";

interface GardeningPageProps {
  onNavigate: (page: string) => void;
}

interface GardeningService {
  id: number; // numeric key (uuid -> number)
  uuid: string;
  slug: string;
  name: string;
  category: string; // mevsimlik | surekli | ozel ...
  material?: string;
  price?: string;
  image: string;
  description?: string;
  featured?: boolean;
  area?: string;
  duration?: string;
  maintenance?: string;
  season?: string;
  warranty?: string;
  includes?: string;
}

/* uuid -> deterministic numeric key */
function hashToNumericKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return h === 0 ? 1 : h;
}

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop";

/* DB row -> UI model */
function toGardeningModel(s: ServiceView): GardeningService {
  const uuid = String((s as any).id ?? "");
  const image =
    (s as any).image_url ||
    (s as any).featured_image ||
    PLACEHOLDER;

  return {
    id: hashToNumericKey(uuid || (s as any).slug || (s as any).name || Math.random().toString(36)),
    uuid,
    slug: String((s as any).slug ?? ""),
    name: String((s as any).name ?? ""),
    category: String((s as any).category ?? "genel"),
    material: (s as any).material || undefined,
    price: (s as any).price || "Fiyat İçin Arayınız",
    image,
    description: (s as any).description || "",
    featured: Boolean((s as any).featured),
    area: (s as any).area || undefined,
    duration: (s as any).duration || undefined,
    maintenance: (s as any).maintenance || undefined,
    season: (s as any).season || undefined,
    warranty: (s as any).warranty || undefined,
    includes: (s as any).includes || undefined,
  };
}

/* Kategori başlıkları (slug -> görünen ad) */
const CATEGORY_LABELS: Record<string, string> = {
  mevsimlik: "Mevsimlik Çiçek",
  surekli: "Sürekli Bitki",
  ozel: "Özel Peyzaj",
};

export function GardeningPage({ onNavigate }: GardeningPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [selectedService, setSelectedService] = useState<GardeningService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==== Slider (RTK) – çıktıyı normalize et (array veya {slides,isError})
  const slidesSource: any = useActiveSlidesRtk();
  const heroSlides = (Array.isArray(slidesSource) ? slidesSource : (slidesSource?.slides ?? [])) as Array<{
    id: string | number;
    image: string;
    title?: string;
    alt?: string;
  }>;
  const isSlidesError: boolean = Boolean(!Array.isArray(slidesSource) && slidesSource?.isError);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const t = window.setInterval(() => {
      setCurrentSlide((p) => (p + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!heroSlides || heroSlides.length === 0) return;
    const next = (currentSlide + 1) % heroSlides.length;
    const n = heroSlides[next];
    if (n?.image) {
      const img = new Image();
      img.src = n.image;
    }
  }, [currentSlide, heroSlides]);

  const nextSlide = () =>
    setCurrentSlide((p) => (p + 1) % (heroSlides.length || 1));
  const prevSlide = () =>
    setCurrentSlide(
      (p) => (p - 1 + (heroSlides.length || 1)) % (heroSlides.length || 1)
    );

  // ==== Services (Public)
  // Not: endpoint default'ta active=true ekliyor; backend 'is_active' bekliyorsa 500 atıyor.
  // Burada active'i bilerek override edip undefined yapıyoruz ki querystring'e eklenmesin.
  // Yerine is_active=1 gönderiyoruz.
  const {
    data: servicesRes = [],
    isFetching: isServicesLoading,
    isError: isServicesError,
    refetch: refetchServices,
  } = useListServicesPublicQuery({
    active: undefined as any,   // <-- 'active' paramını KALDIR
    is_active: 1 as any,        // <-- backend'in beklediği filtre
    type: "gardening",
    sort: "display_order",
    order: "asc",
    limit: 500,
  } as any);

  // UI veri modeli
  const allServices: GardeningService[] = useMemo(() => {
    if (!Array.isArray(servicesRes)) return [];
    return (servicesRes as ServiceView[]).map(toGardeningModel);
  }, [servicesRes]);

  // Kategori sayıları
  const countsByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of allServices) {
      const key = s.category || "genel";
      m[key] = (m[key] || 0) + 1;
    }
    return m;
  }, [allServices]);

  // UI kategori listesi (tümü + dinamik)
  const uiCategories = useMemo(() => {
    const base = [{ id: "tümü", name: "Tüm Hizmetler", count: allServices.length }];
    const dyn = Object.keys(countsByCategory).map((slug) => ({
      id: slug,
      name: CATEGORY_LABELS[slug] || slug[0]?.toUpperCase() + slug.slice(1),
      count: countsByCategory[slug] || 0,
    }));
    const order = ["mevsimlik", "surekli", "ozel"];
    dyn.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return [...base, ...dyn];
  }, [allServices.length, countsByCategory]);

  // Filtre
  const filteredServices = useMemo(() => {
    if (selectedCategory === "tümü") return allServices;
    return allServices.filter((s) => s.category === selectedCategory);
  }, [allServices, selectedCategory]);

  const handleImageClick = (service: GardeningService) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero + Breadcrumb */}
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
              <span>Mezar Çiçeklendirme</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider */}
      {heroSlides && heroSlides.length > 0 && !isSlidesError && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {heroSlides.map((slide, index) => (
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
                      const el = document.getElementById("services-grid");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
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
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "bg-white scale-125"
                      : "bg-white bg-opacity-40 hover:bg-opacity-70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kategori Filtreleri */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {uiCategories.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  variant={selectedCategory === c.id ? "default" : "outline"}
                  className={`px-5 py-2.5 rounded-full transition-all duration-300 text-sm ${
                    selectedCategory === c.id
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                      : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                  }`}
                >
                  {c.name}
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs ${
                      selectedCategory === c.id
                        ? "bg-teal-400 text-teal-900"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {c.count}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="md:hidden grid grid-cols-2 gap-3">
              {uiCategories.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  variant={selectedCategory === c.id ? "default" : "outline"}
                  className={`px-3 py-3 h-auto rounded-lg transition-all duration-300 text-center ${
                    selectedCategory === c.id
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                      : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                  }`}
                >
                  <span className="text-base font-bold leading-tight break-words hyphens-auto">
                    {c.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div id="services-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü"
                  ? "Tüm Çiçeklendirme Hizmetleri"
                  : uiCategories.find((x) => x.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Profesyonel peyzaj ekibimizle mezar alanlarınızı güzelleştiriyoruz
              </p>
            </div>

            {/* Loading/empty states basit */}
            {isServicesError && (
              <div className="text-center text-red-600 mb-8">
                Hizmetler yüklenirken bir hata oluştu.
                <button
                  className="ml-2 underline"
                  onClick={() => refetchServices()}
                >
                  Tekrar dene
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(isServicesLoading ? [] : filteredServices).map((service) => (
                <Card
                  key={service.uuid}
                  className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden"
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => handleImageClick(service)}
                  >
                    <ImageWithFallback
                      src={service.image}
                      alt={service.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {service.featured && (
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
                    {service.material && (
                      <div className="mb-3">
                        <Badge
                          variant="outline"
                          className="text-teal-600 border-teal-600 mb-2"
                        >
                          {service.material}
                        </Badge>
                      </div>
                    )}

                    <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-teal-600">
                        {service.price || "Fiyat İçin Arayınız"}
                      </span>
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
                          const txt = `Merhaba, ${service.name} hakkında bilgi almak istiyorum.`;
                          window.open(
                            `https://wa.me/905334838971?text=${encodeURIComponent(
                              txt
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

            {!isServicesLoading && filteredServices.length === 0 && !isServicesError && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🌸</div>
                <h3 className="text-xl text-gray-600 mb-2">
                  Bu kategoride henüz hizmet bulunmuyor
                </h3>
                <p className="text-gray-500 mb-6">
                  Diğer kategorileri inceleyebilir veya bizimle iletişime
                  geçebilirsiniz.
                </p>
                <Button
                  onClick={() => setSelectedCategory("tümü")}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Tüm Hizmetleri Görüntüle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Süreç (değişmedi) */}
      {/* ... mevcut Process ve CTA bölümleriniz burada aynen kalabilir ... */}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={
            selectedService
              ? `service-description-${selectedService.id}`
              : "modal-content"
          }
        >
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">
                  {selectedService.name}
                </DialogTitle>
                {selectedService.description && (
                  <DialogDescription
                    id={`service-description-${selectedService.id}`}
                    className="text-gray-600"
                  >
                    {selectedService.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedService.image}
                    alt={selectedService.name}
                    className="w-full h-80 object-cover"
                  />
                  {selectedService.featured && (
                    <Badge className="absolute top-4 left-4 bg-teal-500 text-white">
                      Öne Çıkan Hizmet
                    </Badge>
                  )}
                </div>

                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {selectedService.material && (
                      <Badge
                        variant="outline"
                        className="text-teal-600 border-teal-600"
                      >
                        {selectedService.material}
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="bg-teal-100 text-teal-700"
                    >
                      {CATEGORY_LABELS[selectedService.category] ??
                        selectedService.category
                          .charAt(0)
                          .toUpperCase() + selectedService.category.slice(1)}
                    </Badge>
                  </div>

                  <div className="text-2xl text-teal-600">
                    {selectedService.price || "Fiyat İçin Arayınız"}
                  </div>
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
                      const txt = `Merhaba, ${selectedService.name} hakkında bilgi almak istiyorum.`;
                      window.open(
                        `https://wa.me/905334838971?text=${encodeURIComponent(
                          txt
                        )}`,
                        "_blank"
                      );
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg text-gray-800 mb-4 text-center">
                    Hizmet Detayları
                  </h3>
                  <div className="space-y-3">
                    {selectedService.area && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Alan:</span>
                        <span className="text-gray-800">
                          {selectedService.area}
                        </span>
                      </div>
                    )}
                    {selectedService.duration && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Süre:</span>
                        <span className="text-gray-800">
                          {selectedService.duration}
                        </span>
                      </div>
                    )}
                    {selectedService.maintenance && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Bakım:</span>
                        <span className="text-gray-800">
                          {selectedService.maintenance}
                        </span>
                      </div>
                    )}
                    {selectedService.season && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Mevsim:</span>
                        <span className="text-gray-800">
                          {selectedService.season}
                        </span>
                      </div>
                    )}
                    {selectedService.warranty && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Garanti:</span>
                        <span className="text-gray-800">
                          {selectedService.warranty}
                        </span>
                      </div>
                    )}
                    {selectedService.includes && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Dahil Olanlar:</span>
                        <span className="text-gray-800">
                          {selectedService.includes}
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
