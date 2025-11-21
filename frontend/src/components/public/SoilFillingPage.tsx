// =============================================================
// FILE: src/components/public/SoilFillingPage.tsx
// =============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useActiveSlidesRtk, type SlideData } from "../../data/sliderData";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";

import { useListServicesPublicQuery } from "@/integrations/rtk/endpoints/services_public.endpoints";
import type { ServiceView } from "@/integrations/rtk/types/services.types";

/* =========================== Types =========================== */
interface SoilFillingPageProps {
  onNavigate: (page: string) => void;
}

/** DB: category ∈ {"temel","ozel","restorasyon"} */
type SoilCat = "temel" | "ozel" | "restorasyon";
type UiCat = "tümü" | SoilCat;

interface SoilService {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  category: SoilCat;
  material?: string;
  price?: string;
  image: string;
  description?: string;
  featured?: boolean;
  area?: string;
  duration?: string;
  season?: string;
  warranty?: string;
  includes?: string;
}

/* =========================== Helpers =========================== */
function keyOfSlide(slide: Partial<SlideData>, i: number) {
  return String(slide.id ?? slide.image ?? slide.title ?? i);
}

function hashToNumericKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return h === 0 ? 1 : h;
}

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop";

function pickImageUrl(s: any): string {
  const cand = [
    s.image,
    s.image_url,
    s.featured_image,
    s.cover_url,
    s.cover,
    s.thumbnail_url,
    s.thumb_url,
    s.photo_url,
    s.photo,
    s.picture_url,
    s.picture,
    s.main_image_url,
    s.mainImageUrl,
    s.asset_url,
    s.asset?.url,
    s.media_url,
    s.media?.url,
    s.images?.[0]?.url,
    s.images?.[0],
    s.photos?.[0],
    s.media?.[0]?.url,
    s.storage_assets?.[0]?.public_url,
    s.storage?.[0]?.public_url,
  ];
  const url = cand.find((x) => typeof x === "string" && x.trim().length > 0);
  return url || PLACEHOLDER;
}

function normalizeListPayload<T = any>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (!res || typeof res !== "object") return [];
  const o = res as any;
  return (o.rows || o.data || o.items || o.result || o.list || []) as T[];
}

/** Sadece soil olanları kabul et */
function isSoil(s: any): boolean {
  const type = String(s?.type ?? "").toLowerCase();
  if (type === "soil") return true;
  if (type === "gardening") return false;

  const text = `${s?.category ?? ""} ${s?.slug ?? ""} ${s?.name ?? ""} ${s?.description ?? ""}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");

  return /(toprak|soil|dolgu|dolum|doldur|restorasyon|yenileme)/.test(text);
}

/** DB->UI kategori normalizasyonu */
function normalizeSoilCategory(input?: string): SoilCat {
  const s = (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

  // TEMEL (standart dolgu/dolum, hizli, genis alan vs.)
  if (
    s === "temel" ||
    /(dolgu|dolum|doldur|standart|hizli|genis)/.test(s)
  ) {
    return "temel";
  }

  // OZEL (karisim/drenaj/premium)
  if (
    s === "ozel" ||
    /(karisim|karisimi|drenaj|premium|bitki)/.test(s)
  ) {
    return "ozel";
  }

  // RESTORASYON (yenileme/tamir/onarma)
  if (
    s === "restorasyon" ||
    /(yenileme|tamir|onar|restorasyon)/.test(s)
  ) {
    return "restorasyon";
  }

  // Varsayılan: temel
  return "temel";
}

/** DB row -> UI model */
function toSoilModel(s: ServiceView): SoilService {
  const baseKeyStr = String(
    (s as any).uuid ??
    (s as any).id ??
    (s as any).slug ??
    (s as any).name ??
    JSON.stringify(s)
  );

  // fiyat metinleştir
  let priceText: string | undefined = (s as any).price;
  if (typeof (s as any).price === "number") {
    priceText = (s as any).price.toLocaleString("tr-TR");
  } else if (typeof (s as any).price === "string") {
    const n = Number((s as any).price);
    priceText = Number.isFinite(n) ? n.toLocaleString("tr-TR") : (s as any).price;
  }
  if (!priceText || !String(priceText).trim()) priceText = "Fiyat İçin Arayınız";

  const normalizedCat = normalizeSoilCategory((s as any).category);

  return {
    id: hashToNumericKey(baseKeyStr),
    uuid: baseKeyStr,
    slug: String((s as any).slug ?? ""),
    name: String((s as any).name ?? ""),
    category: normalizedCat,
    material: (s as any).material || undefined,
    price: priceText,
    image: pickImageUrl(s),
    description: (s as any).description || "",
    featured: Boolean((s as any).is_active && ((s as any).featured ?? (s as any).is_featured)),
    area: (s as any).area || undefined,
    duration: (s as any).duration || undefined,
    season: (s as any).season || undefined,
    warranty: (s as any).warranty || undefined,
    includes: (s as any).includes || undefined,
  };
}

/* Görünen başlıklar */
const CATEGORY_LABELS: Record<SoilCat, string> = {
  temel: "Temel Toprak Dolum",
  ozel: "Özel Toprak Karışım",
  restorasyon: "Restorasyon",
};

/* =========================== Component =========================== */
export function SoilFillingPage({ onNavigate }: SoilFillingPageProps) {
  // UI
  const [selectedCategory, setSelectedCategory] = useState<UiCat>("tümü");
  const [selectedService, setSelectedService] = useState<SoilService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Slider (Hero)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const { slides: activeSlides = [], isError: isSlidesError } = useActiveSlidesRtk();

  useEffect(() => setSlides(activeSlides ?? []), [activeSlides]);
  useEffect(() => {
    if (!slides.length) return;
    const t = window.setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 5000);
    return () => window.clearInterval(t);
  }, [slides.length]);
  useEffect(() => {
    if (!slides.length) return;
    const next = (currentSlide + 1) % slides.length;
    const src = slides[next]?.image;
    if (src) {
      const img = new Image();
      img.src = src;
    }
  }, [currentSlide, slides]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  // Services (PUBLIC)
  const {
    data: servicesRes,
    isLoading,
    isError,
    refetch,
  } = useListServicesPublicQuery({
    limit: 200,
    orderBy: "display_order",
    order: "asc",
  });

  // normalize + soil filtresi + model
  const allServices: SoilService[] = useMemo(() => {
    const list = normalizeListPayload<ServiceView>(servicesRes);
    return list.filter(isSoil).map(toSoilModel);
  }, [servicesRes]);

  // Kategori sayıları
  const countsByCategory = useMemo(() => {
    const m: Record<SoilCat, number> = { temel: 0, ozel: 0, restorasyon: 0 };
    for (const s of allServices) m[s.category] = (m[s.category] || 0) + 1;
    return m;
  }, [allServices]);

  const uiCategories = useMemo(
    () => [
      { id: "tümü" as const, name: "Tüm Hizmetler", count: allServices.length },
      { id: "temel" as const, name: CATEGORY_LABELS.temel, count: countsByCategory.temel },
      { id: "ozel" as const, name: CATEGORY_LABELS.ozel, count: countsByCategory.ozel },
      { id: "restorasyon" as const, name: CATEGORY_LABELS.restorasyon, count: countsByCategory.restorasyon },
    ],
    [allServices.length, countsByCategory]
  );

  const filtered = useMemo(() => {
    if (selectedCategory === "tümü") return allServices;
    return allServices.filter((s) => s.category === selectedCategory);
  }, [allServices, selectedCategory]);

  const openModal = (s: SoilService) => {
    setSelectedService(s);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative py-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/95 to-teal-500/90" />
        <div className="relative container mx-auto px-4">
          <div className="text-center text-white">
            <nav className="flex items-center justify-center space-x-2 text-sm">
              <button onClick={() => onNavigate("home")} className="hover:text-teal-200 transition-colors">
                Anasayfa
              </button>
              <span>&gt;</span>
              <span>Toprak Dolgu & Bakım</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider */}
      {slides.length > 0 && !isSlidesError && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {slides.map((slide, i) => (
              <div
                key={`slide-${keyOfSlide(slide, i)}`}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${i === currentSlide ? "translate-x-0" : i < currentSlide ? "-translate-x-full" : "translate-x-full"
                  }`}
              >
                <div className="relative w-full h-full">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.alt ?? slide.title ?? `slide-${i}`}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>

                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 font-normal">{slide.title}</h2>
                  <button
                    onClick={() => document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" })}
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
              {slides.map((slide, i) => (
                <button
                  key={`dot-${keyOfSlide(slide, i)}`}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-white scale-125" : "bg-white bg-opacity-40 hover:bg-opacity-70"
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
            {/* Desktop */}
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {uiCategories.map((c) => (
                <Button
                  key={`cat-${c.id}`}
                  onClick={() => setSelectedCategory(c.id)}
                  variant={selectedCategory === c.id ? "default" : "outline"}
                  className={`px-5 py-2.5 rounded-full transition-all duration-300 text-sm ${selectedCategory === c.id
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                    : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                    }`}
                >
                  {c.name}
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs ${selectedCategory === c.id ? "bg-teal-400 text-teal-900" : "bg-teal-100 text-teal-700"
                      }`}
                  >
                    {c.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              {uiCategories.map((c) => (
                <Button
                  key={`catm-${c.id}`}
                  onClick={() => setSelectedCategory(c.id)}
                  variant={selectedCategory === c.id ? "default" : "outline"}
                  className={`px-3 py-3 h-auto rounded-lg transition-all duration-300 text-center ${selectedCategory === c.id
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                    : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                    }`}
                >
                  <span className="text-base font-bold leading-tight text-center break-words hyphens-auto">
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
              <h2 className="text-3xl text-gray-800 mb-2">
                {selectedCategory === "tümü"
                  ? "Tüm Toprak Doldurumu Hizmetleri"
                  : uiCategories.find((x) => x.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Profesyonel ekipman ve kaliteli malzemelerle toprak doldurumu hizmeti
              </p>
            </div>

            {isError && (
              <div className="text-center text-red-600 mb-8">
                Hizmetler yüklenemedi.
                <button className="ml-2 underline" onClick={() => refetch()}>
                  Tekrar dene
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={`skel-${i}`} className="h-80 animate-pulse bg-white/60" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.map((svc) => (
                    <Card
                      key={`soil-${svc.id}`}
                      className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden"
                    >
                      <div className="relative cursor-pointer" onClick={() => openModal(svc)}>
                        <ImageWithFallback
                          src={svc.image}
                          alt={svc.name}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {svc.featured && (
                          <Badge className="absolute top-3 right-3 bg-teal-500 text-white">Öne Çıkan</Badge>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3">
                            <span className="text-gray-800 text-sm">🔍 Detayları Gör</span>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        {!!svc.material && (
                          <div className="mb-3">
                            <Badge variant="outline" className="text-teal-600 border-teal-600 mb-2">
                              {svc.material}
                            </Badge>
                          </div>
                        )}

                        <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
                          {svc.name}
                        </h3>

                        {!!svc.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{svc.description}</p>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-teal-600">{svc.price || "Fiyat İçin Arayınız"}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => onNavigate("contact")}>
                            Teklif Al
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-teal-500 border-teal-500 hover:bg-teal-50"
                            onClick={() => {
                              const txt = `Merhaba, ${svc.name} hakkında bilgi almak istiyorum.`;
                              window.open(`https://wa.me/905334838971?text=${encodeURIComponent(txt)}`, "_blank");
                            }}
                          >
                            WhatsApp
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filtered.length === 0 && !isError && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🌱</div>
                    <h3 className="text-xl text-gray-600 mb-2">Bu kategoride henüz hizmet bulunmuyor</h3>
                    <p className="text-gray-500 mb-6">
                      Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.
                    </p>
                    <Button onClick={() => setSelectedCategory("tümü")} className="bg-teal-500 hover:bg-teal-600 text-white">
                      Tüm Hizmetleri Görüntüle
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl mb-4">Toprak Dolgu & Bakım İçin Bilgi Alın</h2>
            <p className="text-lg opacity-90 mb-8">
              Uzman ekibimizle hızlı keşif ve uygun fiyat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onNavigate("contact")}
                className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3"
              >
                Hemen İletişim
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

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl  bg-gray-50 max-h-[90vh] overflow-y-auto"
          aria-describedby={selectedService ? `soil-desc-${selectedService.id}` : "modal-content"}
        >
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">{selectedService.name}</DialogTitle>
                {!!selectedService.description && (
                  <DialogDescription id={`soil-desc-${selectedService.id}`} className="text-gray-600">
                    {selectedService.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <ImageWithFallback src={selectedService.image} alt={selectedService.name} className="w-full h-80 object-cover" />
                  {selectedService.featured && (
                    <Badge className="absolute top-4 left-4 bg-teal-500 text-white">Öne Çıkan Hizmet</Badge>
                  )}
                </div>

                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {!!selectedService.material && (
                      <Badge variant="outline" className="text-teal-600 border-teal-600">
                        {selectedService.material}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {CATEGORY_LABELS[selectedService.category]}
                    </Badge>
                  </div>
                  <div className="text-2xl text-teal-600">{selectedService.price || "Fiyat İçin Arayınız"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={() => onNavigate("contact")}>
                    📞 Fiyat Teklifi Al
                  </Button>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => {
                      const txt = `Merhaba, ${selectedService.name} hakkında bilgi almak istiyorum.`;
                      window.open(`https://wa.me/905334838971?text=${encodeURIComponent(txt)}`, "_blank");
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                </div>

                <div className="space-y-3">
                  {!!selectedService.area && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Alan:</span>
                      <span className="text-gray-800">{selectedService.area}</span>
                    </div>
                  )}
                  {!!selectedService.duration && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Süre:</span>
                      <span className="text-gray-800">{selectedService.duration}</span>
                    </div>
                  )}
                  {!!selectedService.season && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Mevsim:</span>
                      <span className="text-gray-800">{selectedService.season}</span>
                    </div>
                  )}
                  {!!selectedService.warranty && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Garanti:</span>
                      <span className="text-gray-800">{selectedService.warranty}</span>
                    </div>
                  )}
                  {!!selectedService.includes && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Dahil Olanlar:</span>
                      <span className="text-gray-800">{selectedService.includes}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
