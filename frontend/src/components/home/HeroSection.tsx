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

  // Context'ten slider verilerini al
  const { sliders } = useSliders();

  // Sadece aktif sliderleri filtrele
  const slides = sliders.filter(slide => slide.isActive).sort((a, b) => a.order - b.order);

  // Mobile touch swipe minimum distance
  const minSwipeDistance = 50;

  // Reset to first slide if current slide no longer exists
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Otomatik slider geçişi - mobil connection'a göre optimize edilmiş
  useEffect(() => {
    if (slides.length > 1) {
      // Check connection speed and adjust interval
      let intervalTime = 5000; // Default 5 seconds

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              intervalTime = 8000; // Slower transitions for slow connections
              break;
            case '3g':
              intervalTime = 6000;
              break;
            default:
              intervalTime = 5000;
          }
        }
      }

      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  // Hero image loading optimization
  useEffect(() => {
    if (slides.length > 0) {
      const firstImage = new Image();
      firstImage.onload = () => {
        setIsLoading(false);
      };
      firstImage.src = slides[0].image + '?w=1200&h=600&fit=crop&fm=webp&q=85';
    }
  }, [slides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Mobile touch handlers
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && slides.length > 1) {
      nextSlide();
    }
    if (isRightSwipe && slides.length > 1) {
      prevSlide();
    }
  };



  // Slide yoksa loading göster
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

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative h-[280px] md:h-[380px] lg:h-[450px] overflow-hidden hero-section">
      {/* Loading state for better UX */}
      {isLoading && (
        <div className="absolute inset-0 z-20">
          <SkeletonLoader type="hero" />
        </div>
      )}

      {/* Slider Container with touch support */}
      <div
        className="relative w-full h-full mobile-optimized"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 will-change-opacity ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            style={{
              // Mobile performance optimization
              transform: index === currentSlide ? 'translateZ(0)' : 'translateZ(-1px)',
              backfaceVisibility: 'hidden'
            }}
          >
            {/* Background Image */}
            <ImageOptimized
              src={slide.image}
              alt={slide.alt || slide.title}
              className="w-full h-full object-cover optimized-image"
              priority={index === 0} // Preload first slide
              sizes="100vw"
              quality={index === 0 ? 90 : 75} // Higher quality for first slide
            />

            {/* Minimal Overlay - sadece kontrast için */}
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons - Sadece birden fazla slide varsa göster */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 z-20 hover-optimize touch-manipulation backdrop-blur-sm"
            aria-label="Önceki slide"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 z-20 hover-optimize touch-manipulation backdrop-blur-sm"
            aria-label="Sonraki slide"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Slide Indicators - Minimal dots */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-20 hero-indicators">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`slide-indicator relative transition-all duration-300 hover-optimize touch-manipulation rounded-full ${index === currentSlide
                  ? 'bg-white/90 w-6 h-1.5'
                  : 'bg-white/40 hover:bg-white/60 w-1.5 h-1.5'
                  }`}
                style={{ minWidth: '6px', minHeight: '6px' }}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Admin Panel Quick Access - Sadece development modunda */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-30">
          <Button
            onClick={() => onNavigate?.('admin')}
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