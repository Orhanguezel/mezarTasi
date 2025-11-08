import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveSlidesRtk, type SlideData } from "../../data/sliderData";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";

// RTK — soil listesi
import { useListServicesPublicQuery } from "@/integrations/metahub/rtk/endpoints/services_public.endpoints";
import type { ServiceView } from "@/integrations/metahub/db/types/services.types";

interface SoilFillingPageProps {
  onNavigate: (page: string) => void;
}

export function SoilFillingPage({ onNavigate }: SoilFillingPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<"tümü" | "temel" | "ozel" | "restorasyon">("tümü");
  const [selectedService, setSelectedService] = useState<ServiceView | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);

  // ✅ useActiveSlidesRtk artık obje dönüyor
  const {
    slides: activeSlides = [],
    isFetching: isSlidesFetching, // kullanılmıyorsa sorun değil
    isError: isSlidesError,
  } = useActiveSlidesRtk();

  useEffect(() => {
    setSlides(activeSlides ?? []);
  }, [activeSlides]);

  useEffect((): void | (() => void) => {
    if (!slides.length) return;
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Preload next image (opsiyonel zincirleme ile güvenli)
  useEffect(() => {
    if (!slides.length) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    const nextSrc = slides[nextIndex]?.image;
    if (nextSrc) {
      const img = new Image();
      img.src = nextSrc;
    }
  }, [currentSlide, slides]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  // 🔎 Soil tipindeki aktif servisler
  const { data: services, isLoading, isError } = useListServicesPublicQuery({
    type: "soil",
    orderBy: "display_order",
    order: "asc",
    active: true,
    limit: 500,
  });

  // Kategori sayımları
  const categoryCounts = useMemo(() => {
    const counts: Record<"temel" | "ozel" | "restorasyon", number> = {
      temel: 0,
      ozel: 0,
      restorasyon: 0,
    };
    (services ?? []).forEach((s) => {
      const cat = (s.category ?? "").toLowerCase();
      if (cat === "temel" || cat === "ozel" || cat === "restorasyon") counts[cat] += 1;
    });
    return counts;
  }, [services]);

  const categories = useMemo(
    () => [
      { id: "tümü" as const, name: "Tüm Hizmetler", count: services?.length ?? 0 },
      { id: "temel" as const, name: "Temel Toprak Dolum", count: categoryCounts.temel },
      { id: "ozel" as const, name: "Özel Toprak Karışım", count: categoryCounts.ozel },
      { id: "restorasyon" as const, name: "Restorasyon", count: categoryCounts.restorasyon },
    ],
    [services, categoryCounts]
  );

  const filteredServices = useMemo(() => {
    const list = services ?? [];
    if (selectedCategory === "tümü") return list;
    return list.filter((s) => (s.category ?? "").toLowerCase() === selectedCategory);
  }, [services, selectedCategory]);

  const imgOf = (s: ServiceView) =>
    s.featured_image_url ||
    s.image_url ||
    s.featured_image ||
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop";

  const priceOf = (s: ServiceView) => s.price || "Fiyat İçin Arayınız";

  const handleImageClick = (service: ServiceView) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
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
              <button onClick={() => onNavigate("home")} className="hover:text-teal-200 transition-colors">
                Anasayfa
              </button>
              <span>&gt;</span>
              <span>Mezar Toprak Doldurumu</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider */}
      {slides.length > 0 && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                  index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
                }`}
              >
                <div className="relative w-full h-full">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>
                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">{slide.title}</h2>
                  <button
                    onClick={() => document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" })}
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
                    index === currentSlide ? "bg-white scale-125" : "bg-white bg-opacity-40 hover:bg-opacity-70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filters */}
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
                      selectedCategory === category.id ? "bg-teal-400 text-teal-900" : "bg-teal-100 text-teal-700"
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
                  <span className="text-base font-bold leading-tight text-center break-words hyphens-auto">
                    {category.name}
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
                  ? "Tüm Toprak Doldurumu Hizmetleri"
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">Profesyonel ekipman ve kaliteli malzemelerle toprak doldurumu hizmeti</p>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="h-80 animate-pulse bg-white/60" />
                ))}
              </div>
            )}
            {isError && (
              <div className="text-center py-12 text-red-600">
                Servisler yüklenemedi. Lütfen daha sonra tekrar deneyin.
              </div>
            )}

            {!isLoading && !isError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
                      <div className="relative cursor-pointer" onClick={() => handleImageClick(service)}>
                        <ImageWithFallback
                          src={imgOf(service)}
                          alt={service.name}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {service.featured && <Badge className="absolute top-3 right-3 bg-teal-500 text-white">Öne Çıkan</Badge>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3">
                            <span className="text-gray-800 text-sm">🔍 Detayları Gör</span>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        {!!service.material && (
                          <div className="mb-3">
                            <Badge variant="outline" className="text-teal-600 border-teal-600 mb-2">
                              {service.material}
                            </Badge>
                          </div>
                        )}

                        <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">{service.name}</h3>

                        {!!service.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-teal-600">{priceOf(service)}</span>
                        </div>

                        <div className="space-y-2">
                          <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => onNavigate("contact")}>
                            Fiyat Teklifi Al
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-teal-500 border-teal-500 hover:bg-teal-50"
                            onClick={() => {
                              const m = `Merhaba, ${service.name} hakkında bilgi almak istiyorum.`;
                              window.open(`https://wa.me/905334838971?text=${encodeURIComponent(m)}`, "_blank");
                            }}
                          >
                            WhatsApp'tan Sor
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredServices.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏗️</div>
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
            <h2 className="text-3xl mb-4">Özel Toprak Doldurumu İhtiyacınız Var mı?</h2>
            <p className="text-lg opacity-90 mb-8">Özel durumlar için uzman ekibimizle iletişime geçin. Size özel çözümler sunuyoruz.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => onNavigate("contact")} className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3">
                Özel Hizmet Talebi
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
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={selectedService ? `soil-service-description-${selectedService.id}` : "modal-content"}
        >
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">{selectedService.name}</DialogTitle>
                <DialogDescription id={`soil-service-description-${selectedService.id}`} className="text-gray-600">
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <ImageWithFallback src={imgOf(selectedService)} alt={selectedService.name} className="w-full h-80 object-cover" />
                  {selectedService.featured && <Badge className="absolute top-4 left-4 bg-teal-500 text-white">Öne Çıkan Hizmet</Badge>}
                </div>

                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {!!selectedService.material && (
                      <Badge variant="outline" className="text-teal-600 border-teal-600">
                        {selectedService.material}
                      </Badge>
                    )}
                    {!!selectedService.category && (
                      <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                        {selectedService.category.charAt(0).toUpperCase() + selectedService.category.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl text-teal-600">{priceOf(selectedService)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={() => onNavigate("contact")}>
                    📞 Fiyat Teklifi Al
                  </Button>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => {
                      const m = `Merhaba, ${selectedService.name} hakkında bilgi almak istiyorum.`;
                      window.open(`https://wa.me/905334838971?text=${encodeURIComponent(m)}`, "_blank");
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg text-gray-800 mb-4 text-center">Hizmet Detayları</h3>
                  <div className="space-y-3">
                    {!!selectedService.area && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Alan:</span>
                        <span className="text-gray-800">{selectedService.area}</span>
                      </div>
                    )}
                    {!!selectedService.soil_type && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Toprak Türü:</span>
                        <span className="text-gray-800">{selectedService.soil_type}</span>
                      </div>
                    )}
                    {!!selectedService.thickness && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kalınlık:</span>
                        <span className="text-gray-800">{selectedService.thickness}</span>
                      </div>
                    )}
                    {!!selectedService.equipment && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Ekipman:</span>
                        <span className="text-gray-800">{selectedService.equipment}</span>
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
