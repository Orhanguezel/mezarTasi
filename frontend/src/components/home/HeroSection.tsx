import { useState, useEffect } from "react";
import { ImageOptimized } from "../public/ImageOptimized";
import { SkeletonLoader } from "../public/SkeletonLoader";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSliders } from "../../contexts/DataContext";

interface HeroSectionProps {
  onNavigate?: (page: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Vite feature-flag: Dev'de her zaman görünür; prod'da VITE_SHOW_ADMIN_SHORTCUT=1 ise açılır
  const showAdminShortcut =
    import.meta.env.DEV ||
    import.meta.env.VITE_SHOW_ADMIN_SHORTCUT === "1";

  // Context'ten slider verileri
  const { sliders } = useSliders();

  // Sadece aktif slider'lar
  const slides = sliders
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  const minSwipeDistance = 50;

  // Geçerli index out-of-range ise sıfırla
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Otomatik geçiş (bağlantı hızına göre aralık)
  useEffect(() => {
    if (slides.length > 1) {
      let intervalTime = 5000;
      // Bağlantı durumu (desteklenen tarayıcılarda)
      const anyNav = navigator as any;
      const conn = anyNav?.connection;
      if (conn?.effectiveType) {
        switch (conn.effectiveType) {
          case "slow-2g":
          case "2g":
            intervalTime = 8000;
            break;
          case "3g":
            intervalTime = 6000;
            break;
          default:
            intervalTime = 5000;
        }
      }
      const t = setInterval(
        () => setCurrentSlide((p) => (p + 1) % slides.length),
        intervalTime
      );
      return () => clearInterval(t);
    }
  }, [slides.length]);

  // İlk görseli preload et
  useEffect(() => {
    if (slides.length > 0) {
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.src = `${slides[0].image}?w=1200&h=600&fit=crop&fm=webp&q=85`;
    } else {
      setIsLoading(false);
    }
  }, [slides]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && slides.length > 1) nextSlide();
    if (distance < -minSwipeDistance && slides.length > 1) prevSlide();
  };

  // Slide yoksa basit placeholder
  if (slides.length === 0) {
    return (
      <section className="relative h-[280px] md:h-[380px] lg:h-[450px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-base">Slider yükleniyor...</p>
            <p className="text-sm text-gray-300 mt-1">Henüz aktif slider bulunamadı</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[280px] md:h-[380px] lg:h-[450px] overflow-hidden hero-section">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20">
          <SkeletonLoader type="hero" />
        </div>
      )}

      {/* Slider alanı */}
      <div
        className="relative w-full h-full mobile-optimized"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 will-change-opacity ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{
              transform: index === currentSlide ? "translateZ(0)" : "translateZ(-1px)",
              backfaceVisibility: "hidden",
            }}
          >
            <ImageOptimized
              src={slide.image}
              alt={slide.alt || slide.title}
              className="w-full h-full object-cover optimized-image"
              priority={index === 0}
              sizes="100vw"
              quality={index === 0 ? 90 : 75}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        ))}
      </div>

      {/* Navigasyon */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 z-20 backdrop-blur-sm"
            aria-label="Önceki slide"
            style={{ minWidth: "40px", minHeight: "40px" }}
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 z-20 backdrop-blur-sm"
            aria-label="Sonraki slide"
            style={{ minWidth: "40px", minHeight: "40px" }}
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? "bg-white/90 w-6 h-1.5"
                    : "bg-white/40 hover:bg-white/60 w-1.5 h-1.5"
                }`}
                style={{ minWidth: "6px", minHeight: "6px" }}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Admin kısayol — Dev veya flag ile prod */}
      {showAdminShortcut && (
        <div className="absolute top-4 right-4 z-30">
          <Button
            onClick={() =>
              onNavigate?.("admin") ?? (window.location.href = "/admin")
            }
            variant="outline"
            size="sm"
            className="bg-black/20 text-white border-white/30 hover:bg-black/40 backdrop-blur-sm"
          >
            Slider Düzenle
          </Button>
        </div>
      )}
    </section>
  );
}
