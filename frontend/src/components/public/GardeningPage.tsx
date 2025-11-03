import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveSlides, SlideData } from "../../data/sliderData";
import backgroundImage from 'figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png';

interface GardeningPageProps {
  onNavigate: (page: string) => void;
}

interface GardeningService {
  id: number;
  name: string;
  category: string;
  material: string;
  price: string;
  image: string;
  description: string;
  featured?: boolean;
  area?: string;
  duration?: string;
  maintenance?: string;
  season?: string;
  warranty?: string;
  includes?: string;
}

export function GardeningPage({ onNavigate }: GardeningPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [selectedService, setSelectedService] = useState<GardeningService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);

  useEffect(() => {
    setSlides(getActiveSlides());
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // 5 saniyede bir değişim - daha rahat izlenebilir

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  // Preload next image for smoother transitions
  useEffect(() => {
    if (slides.length > 0) {
      const nextIndex = (currentSlide + 1) % slides.length;
      const img = new Image();
      img.src = slides[nextIndex].image;
    }
  }, [currentSlide, slides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const categories = [
    { id: "tümü", name: "Tüm Hizmetler", count: 9 },
    { id: "mevsimlik", name: "Mevsimlik Çiçek", count: 3 },
    { id: "surekli", name: "Sürekli Bitki", count: 3 },
    { id: "ozel", name: "Özel Peyzaj", count: 3 }
  ];

  const services: GardeningService[] = [
    {
      id: 1,
      name: "Mevsimlik Çiçek Ekimi",
      category: "mevsimlik",
      material: "Mevsim Çiçekleri",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      description: "Mezar alanınıza mevsimlik çiçek ekimi ve düzenli bakım hizmeti",
      featured: true,
      area: "2-5 m²",
      duration: "3-4 Ay",
      maintenance: "Haftalık Bakım",
      season: "Mevsimlik",
      warranty: "Çiçek Sağlığı Garantisi",
      includes: "Çiçek + Toprak + Ekim + Bakım"
    },
    {
      id: 2,
      name: "Bahar Çiçekleri Düzenlemesi",
      category: "mevsimlik",
      material: "Bahar Çiçekleri",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop",
      description: "Lale, sümbül ve nergis gibi bahar çiçekleri ile düzenleme",
      area: "1-3 m²",
      duration: "2-3 Ay",
      maintenance: "Haftalık Bakım",
      season: "Bahar",
      warranty: "Çiçek Sağlığı Garantisi",
      includes: "Soğan + Toprak + Ekim + Bakım"
    },
    {
      id: 3,
      name: "Yaz Çiçekleri Ekimi",
      category: "mevsimlik",
      material: "Yaz Çiçekleri",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop",
      description: "Petunya, begonla ve diğer yaz çiçekleri ile renkli düzenleme",
      area: "2-4 m²",
      duration: "4-5 Ay",
      maintenance: "Haftalık Bakım",
      season: "Yaz",
      warranty: "Çiçek Sağlığı Garantisi",
      includes: "Fide + Toprak + Ekim + Bakım"
    },
    {
      id: 4,
      name: "Çim Ekimi ve Düzenlemesi",
      category: "surekli",
      material: "Çim + Bitki",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
      description: "Mezar alanında çim ekimi ve sürekli yeşil alan oluşturma",
      featured: true,
      area: "3-10 m²",
      duration: "Sürekli",
      maintenance: "Aylık Bakım",
      season: "Tüm Mevsim",
      warranty: "1 Yıl Çim Garantisi",
      includes: "Çim Tohumu + Toprak + Ekim + Bakım"
    },
    {
      id: 5,
      name: "Süs Bitkisi Dikimi",
      category: "surekli",
      material: "Süs Bitkileri",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      description: "Dayanıklı süs bitkileri ile kalıcı yeşil alan oluşturma",
      area: "2-6 m²",
      duration: "Sürekli",
      maintenance: "Aylık Bakım",
      season: "Tüm Mevsim",
      warranty: "6 Ay Bitki Garantisi",
      includes: "Bitki + Toprak + Dikim + Bakım"
    },
    {
      id: 6,
      name: "Çalı ve Ağaç Dikimi",
      category: "surekli",
      material: "Ağaç + Çalı",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1574263867128-dacbc0fc09ce?w=400&h=300&fit=crop",
      description: "Küçük ağaç ve çalı dikimi ile doğal gölgelik alan",
      area: "1-4 m²",
      duration: "Sürekli",
      maintenance: "Mevsimlik Bakım",
      season: "Tüm Mevsim",
      warranty: "1 Yıl Ağaç Garantisi",
      includes: "Ağaç/Çalı + Toprak + Dikim + Bakım"
    },
    {
      id: 7,
      name: "Özel Peyzaj Tasarımı",
      category: "ozel",
      material: "Karma Peyzaj",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      description: "Özel tasarım peyzaj düzenlemesi ve sürekli bakım hizmeti",
      featured: true,
      area: "5-15 m²",
      duration: "Sürekli",
      maintenance: "Haftalık Bakım",
      season: "Tüm Mevsim",
      warranty: "2 Yıl Peyzaj Garantisi",
      includes: "Tasarım + Malzeme + Uygulama + Bakım"
    },
    {
      id: 8,
      name: "Çiçek Bahçesi Düzenlemesi",
      category: "ozel",
      material: "Çiçek Bahçesi",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop",
      description: "Karışık çiçek türleri ile özel bahçe düzenlemesi",
      area: "3-8 m²",
      duration: "Mevsimlik",
      maintenance: "Haftalık Bakım",
      season: "Bahar-Yaz",
      warranty: "Çiçek Sağlığı Garantisi",
      includes: "Çiçek + Tasarım + Ekim + Bakım"
    },
    {
      id: 9,
      name: "Tema Peyzaj Düzenlemesi",
      category: "ozel",
      material: "Tema Bitkileri",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
      description: "Özel tema ile (Akdeniz, Japon vb.) peyzaj düzenlemesi",
      area: "4-12 m²",
      duration: "Sürekli",
      maintenance: "Aylık Bakım",
      season: "Tüm Mevsim",
      warranty: "1 Yıl Peyzaj Garantisi",
      includes: "Tema Tasarım + Bitki + Uygulama + Bakım"
    }
  ];

  const filteredServices = selectedCategory === "tümü"
    ? services
    : services.filter(service => service.category === selectedCategory);

  const handleImageClick = (service: GardeningService) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Breadcrumb */}
      <div
        className="relative bg-teal-500 py-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/95 to-teal-500/90"></div>
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
              <span>Mezar Çiçeklendirme</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider Section - Modern Design */}
      {slides.length > 0 && (
        <div className="relative bg-black">
          <div className="relative w-full h-96 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-transform duration-700 ease-in-out ${index === currentSlide ? 'translate-x-0' : index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                  }`}
              >
                {/* Background Image with Overlay */}
                <div className="relative w-full h-full">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>

                {/* Content Overlay - Bottom Right Minimal */}
                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">
                    {slide.title}
                  </h2>
                  <button
                    onClick={() => {
                      // Sayfanın grid kısmına scroll yapacak şekilde navigate
                      const gridElement = document.getElementById('services-grid');
                      if (gridElement) {
                        gridElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 border border-white border-opacity-50 text-black px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    İNCELE
                  </button>
                </div>
              </div>
            ))}

            {/* Navigation Arrows - Sleek Design */}
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Dots Indicator - Modern Style */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white bg-opacity-40 hover:bg-opacity-70'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filters - Under Slider */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Desktop Version - Flex Layout */}
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-5 py-2.5 rounded-full transition-all duration-300 text-sm ${selectedCategory === category.id
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg"
                      : "border-teal-500 text-teal-600 hover:bg-teal-50 bg-white"
                    }`}
                >
                  {category.name}
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs ${selectedCategory === category.id
                        ? "bg-teal-400 text-teal-900"
                        : "bg-teal-100 text-teal-700"
                      }`}
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Mobile Version - Grid Layout */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-3 py-3 h-auto rounded-lg transition-all duration-300 text-center ${selectedCategory === category.id
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
                {selectedCategory === "tümü" ? "Tüm Çiçeklendirme Hizmetleri" :
                  categories.find(cat => cat.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Profesyonel peyzaj ekibimizle mezar alanlarınızı güzelleştiriyoruz
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
                  <div className="relative cursor-pointer" onClick={() => handleImageClick(service)}>
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

                    {/* Click to view indicator */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3">
                        <span className="text-gray-800 text-sm">🔍 Detayları Gör</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-3">
                      <Badge variant="outline" className="text-teal-600 border-teal-600 mb-2">
                        {service.material}
                      </Badge>
                    </div>

                    <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
                      {service.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-teal-600">
                        {service.price}
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
                          const whatsappMessage = `Merhaba, ${service.name} hakkında bilgi almak istiyorum.`;
                          window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
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
                <div className="text-gray-400 text-6xl mb-4">🌸</div>
                <h3 className="text-xl text-gray-600 mb-2">Bu kategoride henüz hizmet bulunmuyor</h3>
                <p className="text-gray-500 mb-6">Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.</p>
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

      {/* Enhanced Process Section - İstanbul Mezar Yapımı Çalışma Sürecimiz */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-teal-50 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-teal-300 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-green-300 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-7xl mx-auto">
            {/* SEO Optimized Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-6">
                <span className="text-2xl">🏺</span>
              </div>
              <h2 className="text-4xl text-gray-800 mb-6">
                <strong>İstanbul Mezar Yapımı</strong> Çalışma Sürecimiz
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                <strong>Mezar inşaatı, mezar taşı yapımı ve mezar onarımı</strong> alanında
                <strong> 25+ yıllık deneyimimizle</strong> <em>profesyonel hizmet süreci</em>. <strong>İstanbul'da kaliteli mezar yapımı</strong> için izlediğimiz 3 aşamalı sistem.
              </p>
            </div>

            {/* Process Steps - Modern Card Design */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

              {/* Step 1: Tasarım ve Keşif */}
              <div className="group relative">
                {/* Connection Line */}
                <div className="hidden lg:block absolute top-24 left-full w-12 h-0.5 bg-gradient-to-r from-teal-500 to-transparent z-10"></div>

                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">1</div>

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                      <span className="text-4xl">🎨</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-200 to-teal-300 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 transform scale-110"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-teal-600 transition-colors duration-300">
                      <strong>Tasarım ve Keşif</strong>
                    </h3>

                    <div className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">
                        <strong>Ücretsiz mezar keşfi</strong> ve <em>ölçüm hizmeti</em> ile başlar. <strong>Mezar şuluk, vazo, sütun</strong>
                        tasarımında <em>müşteri isteklerine özel</em> <strong>3D tasarım hazırlama</strong> süreci.
                      </p>

                      <div className="bg-teal-50 p-4 rounded-xl">
                        <h4 className="text-sm text-teal-700 mb-2">📋 Bu Aşamada Yapılanlar:</h4>
                        <ul className="text-xs text-gray-600 space-y-1 text-left">
                          <li>• <strong>Mezar alanı ölçümü</strong> ve aksesuar yerleşimi</li>
                          <li>• <strong>A+ sınıf malzeme</strong> seçimi (mermer, granit)</li>
                          <li>• <em>Şuluk, vazo, sütun</em> tasarım seçenekleri</li>
                          <li>• <strong>3D görselleştirme</strong> ve onay süreci</li>
                          <li>• <em>Şeffaf fiyat teklifi</em> hazırlama</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-xs text-green-700">
                          ⏱️ <strong>Süre:</strong> 1-2 gün • 🆓 <strong>Keşif Ücretsiz</strong> • 📞 <strong>7/24 Destek</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Üretim ve İşçilik */}
              <div className="group relative">
                {/* Connection Line */}
                <div className="hidden lg:block absolute top-24 left-full w-12 h-0.5 bg-gradient-to-r from-blue-500 to-transparent z-10"></div>

                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">2</div>

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                      <span className="text-4xl">🔨</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 transform scale-110"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      <strong>Üretim ve İşçilik</strong>
                    </h3>

                    <div className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">
                        <strong>25+ yıl deneyimli ustalarımız</strong> ile <em>A+ kalite malzemede</em> üretim. <strong>Mezar şuluk yapımı,
                          mermer vazo üretimi, granit sütun</strong> işçiliğinde <em>hassas çalışma</em> ve <strong>kalite kontrolü</strong>.
                      </p>

                      <div className="bg-blue-50 p-4 rounded-xl">
                        <h4 className="text-sm text-blue-700 mb-2">🏭 Üretim Aşamaları:</h4>
                        <ul className="text-xs text-gray-600 space-y-1 text-left">
                          <li>• <strong>A+ sınıf malzeme</strong> tedarik ve kalite kontrolü</li>
                          <li>• <em>Profesyonel kesim ve şekillendirme</em></li>
                          <li>• <strong>El işçiliği ve özel detaylar</strong></li>
                          <li>• <em>Cilalama ve yüzey işlemleri</em></li>
                          <li>• <strong>Final kalite kontrol</strong> ve onay süreci</li>
                        </ul>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <p className="text-xs text-orange-700">
                          ⏱️ <strong>Süre:</strong> 3-7 gün • 🛡️ <strong>5-10 Yıl Garanti</strong> • ✅ <strong>Kalite Onayı</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Kurulum ve Teslim */}
              <div className="group relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">3</div>

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                      <span className="text-4xl">📍</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 transform scale-110"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-green-600 transition-colors duration-300">
                      <strong>Kurulum ve Teslim</strong>
                    </h3>

                    <div className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">
                        <strong>Mezarlıkta profesyonel kurulum</strong>, <em>mezar çiçeklendirme</em> ve <strong>son kontroller</strong>.
                        İstanbul mezarlıklarında <em>garantili montaj hizmeti</em>. <strong>Final kontrolü</strong> ve teslim belgesi.
                      </p>

                      <div className="bg-green-50 p-4 rounded-xl">
                        <h4 className="text-sm text-green-700 mb-2">🏗️ Kurulum Detayları:</h4>
                        <ul className="text-xs text-gray-600 space-y-1 text-left">
                          <li>• <strong>Mezarlık alanında</strong> ve <em>güvenli kurulum</em></li>
                          <li>• <em>Profesyonel montaj ekibi</em> ve yapıştırma</li>
                          <li>• <strong>Mezar çiçeklendirme</strong> ve son düzenleme</li>
                          <li>• <em>Mezar taprağı düzenleme</em> ve <strong>temizlik</strong></li>
                          <li>• <strong>Final kontrolü</strong> ve teslim belgeleri</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                        <p className="text-xs text-purple-700">
                          ⏱️ <strong>Süre:</strong> 1-2 gün • 👥 <strong>Garantili Kurulum</strong> • 📄 <strong>Teslim Belgesi</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl mb-4">
              Özel Peyzaj Tasarımı İstiyorsanız
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Size özel peyzaj tasarımı için uzman ekibimizle iletişime geçin.
              Alanınıza uygun özel çözümler sunuyoruz.
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

      {/* Service Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={selectedService ? `service-description-${selectedService.id}` : "modal-content"}
        >
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">
                  {selectedService.name}
                </DialogTitle>
                <DialogDescription
                  id={`service-description-${selectedService.id}`}
                  className="text-gray-600"
                >
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Main Image - Centered */}
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

                {/* Price and Category Info - Centered */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="text-teal-600 border-teal-600">
                      {selectedService.material}
                    </Badge>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {selectedService.category.charAt(0).toUpperCase() + selectedService.category.slice(1)}
                    </Badge>
                  </div>

                  <div className="text-2xl text-teal-600">
                    {selectedService.price}
                  </div>
                </div>

                {/* Contact Buttons */}
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
                      const whatsappMessage = `Merhaba, ${selectedService.name} hakkında bilgi almak istiyorum.`;
                      window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                </div>

                {/* Service Specifications */}
                <div>
                  <h3 className="text-lg text-gray-800 mb-4 text-center">Hizmet Detayları</h3>
                  <div className="space-y-3">
                    {selectedService.area && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Alan:</span>
                        <span className="text-gray-800">{selectedService.area}</span>
                      </div>
                    )}

                    {selectedService.duration && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Süre:</span>
                        <span className="text-gray-800">{selectedService.duration}</span>
                      </div>
                    )}

                    {selectedService.maintenance && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Bakım:</span>
                        <span className="text-gray-800">{selectedService.maintenance}</span>
                      </div>
                    )}

                    {selectedService.season && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Mevsim:</span>
                        <span className="text-gray-800">{selectedService.season}</span>
                      </div>
                    )}

                    {selectedService.warranty && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Garanti:</span>
                        <span className="text-gray-800">{selectedService.warranty}</span>
                      </div>
                    )}

                    {selectedService.includes && (
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