import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveSlides, SlideData } from "../../data/sliderData";
import { getAllProducts } from "../../data/dynamicProducts";
import backgroundImage from 'figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png';
import tombstoneImage1 from 'figma:asset/045ec544828ae89a32759225db62e101d2608292.png';
import tombstoneImage2 from 'figma:asset/230bfc45a1c3e29e0d1080b05baa205fb4c5f511.png';

interface ModelsPageProps {
  onNavigate: (page: string) => void;
  onProductDetail?: (productId: number) => void;
}

interface TombstoneModel {
  id: number;
  name: string;
  category: string;
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

export function ModelsPage({ onNavigate, onProductDetail }: ModelsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [selectedModel, setSelectedModel] = useState<TombstoneModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [allModels, setAllModels] = useState<TombstoneModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSlides(getActiveSlides());
  }, []);

  // Helper function to map category names to keys for ModelsPage
  const getCategoryKey = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      // Admin panelinden gelen kategoriler
      'Mezar Baş Taşı Modelleri': 'bastaslari',
      'Mezar Modelleri': 'modeller',
      'Tek Kişilik Mermer Modeller': 'mermer',
      'Tek Kişilik Granit Modeller': 'granit',
      'İki Kişilik Mermer Modeller': 'mermer',
      'İki Kişilik Granit Modeller': 'granit',
      'Katlı Lahit Mezar Modelleri': 'mermer',
      'Özel Yapım Mezar Modelleri': 'mermer',
      'Sütunlu Mezar Modelleri': 'sutunlu',
      'MERMER BAŞ TAŞI MODELLERİ': 'mermer',
      'GRANİT BAŞ TAŞI MODELLERİ': 'granit',
      'ÖZEL TASARIM BAŞ TAŞLARI': 'mermer'
    };

    return categoryMap[category] || 'mermer';
  };

  // Load dynamic products and combine with static models
  useEffect(() => {
    const loadAllModels = () => {
      const dynamicProducts = getAllProducts();
      const convertedDynamicProducts: TombstoneModel[] = dynamicProducts
        .filter(product => {
          // Sadece mezar taşı ve mezar modeli kategorilerini filtrele
          const categoryKey = getCategoryKey(product.category);
          return ['mermer', 'granit', 'sutunlu', 'bastaslari', 'modeller'].includes(categoryKey);
        })
        .map((product, index) => ({
          id: product.id + 1000, // Offset by 1000 to avoid conflicts with static models
          name: product.title || product.productCode || 'Ürün Adı Yok',
          category: getCategoryKey(product.category),
          material: 'Özel Malzeme',
          price: product.price || 'Fiyat İçin Arayınız',
          image: product.image || "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop",
          description: product.description || '',
          featured: false,
          dimensions: '',
          weight: '',
          thickness: '',
          finish: '',
          warranty: '',
          installationTime: ''
        }));

      // Combine static models with dynamic products
      setAllModels([...models, ...convertedDynamicProducts]);
    };

    loadAllModels();

    // Listen for product updates
    const handleProductUpdate = () => {
      loadAllModels();
    };

    window.addEventListener('mezarisim-products-updated', handleProductUpdate);

    // Also listen for force re-render events
    const handleForceRerender = () => {
      setRefreshKey(prev => prev + 1);
      loadAllModels();
    };

    window.addEventListener('mezarisim-force-rerender', handleForceRerender);

    return () => {
      window.removeEventListener('mezarisim-products-updated', handleProductUpdate);
      window.removeEventListener('mezarisim-force-rerender', handleForceRerender);
    };
  }, [refreshKey]);

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

  // Dynamic category counts based on loaded models (non-zero categories only)
  const allCategories = [
    { id: "tümü", name: "Tüm Modeller", count: allModels.length },
    { id: "mermer", name: "Mermer Mezar Taşları", count: allModels.filter(m => m.category === 'mermer').length },
    { id: "granit", name: "Granit Mezar Taşları", count: allModels.filter(m => m.category === 'granit').length },
    { id: "sutunlu", name: "Sütunlu Mezar Taşları", count: allModels.filter(m => m.category === 'sutunlu').length },
    { id: "bastaslari", name: "Mezar Baş Taşları", count: allModels.filter(m => m.category === 'bastaslari').length },
    { id: "modeller", name: "Özel Mezar Modelleri", count: allModels.filter(m => m.category === 'modeller').length }
  ];

  // Show only categories with products (except "tümü" which always shows)
  const categories = allCategories.filter(cat => cat.id === "tümü" || cat.count > 0);

  const models: TombstoneModel[] = [
    {
      id: 1,
      name: "Günay Yaman Modeli - Siyah Granit Çerçeveli Mezar Baş Taşı",
      category: "granit",
      material: "Siyah Granit + Beyaz Mermer",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description: "Siyah granit çerçeve ile beyaz mermer kombinasyonu, modern ve şık mezar baş taşı tasarımı",
      featured: true,
      dimensions: "120cm x 80cm",
      weight: "350 kg",
      thickness: "8 cm",
      finish: "Parlak Cilalı",
      warranty: "10 Yıl Garanti",
      installationTime: "1-2 Gün"
    },
    {
      id: 2,
      name: "Tek Kişilik Granit Mezar Baş Taşı Modeli",
      category: "granit",
      material: "Siyah Granit",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description: "Dayanıklı siyah granit malzemeden üretilen tek kişilik mezar baş taşı modeli",
      dimensions: "100cm x 60cm",
      weight: "280 kg",
      thickness: "6 cm",
      finish: "Mat Yüzey",
      warranty: "8 Yıl Garanti",
      installationTime: "1 Gün"
    },
    {
      id: 3,
      name: "Çift Kişilik Mermer Mezar Baş Taşı",
      category: "mermer",
      material: "Beyaz Mermer",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=400&h=300&fit=crop",
      description: "Klasik beyaz mermer malzemeden çift kişilik mezar baş taşı",
      dimensions: "140cm x 90cm",
      weight: "420 kg",
      thickness: "10 cm",
      finish: "Doğal Mermer Cilalı",
      warranty: "15 Yıl Garanti",
      installationTime: "2 Gün"
    },
    {
      id: 4,
      name: "Özel Tasarım Tek Kişilik Mezar Baş Taşı",
      category: "mermer",
      material: "Mermer + Mozaik",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=800&h=600&fit=crop",
      description: "Özel mozaik desenlerle süslenmiş estetik mezar baş taşı modeli",
      dimensions: "110cm x 70cm",
      weight: "320 kg",
      thickness: "7 cm",
      finish: "Mozaik Süslemeli",
      warranty: "12 Yıl Garanti",
      installationTime: "2-3 Gün"
    },
    {
      id: 5,
      name: "Sütunlu Mermer Mezar Modeli",
      category: "sutunlu",
      material: "Beyaz Mermer + Sütun",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=800&h=600&fit=crop",
      description: "Klasik sütunlu tasarım ile beyaz mermer mezar modeli",
      featured: true,
      dimensions: "150cm x 100cm",
      weight: "480 kg",
      thickness: "10 cm",
      finish: "Sütunlu Mermer İşçiliği",
      warranty: "15 Yıl Garanti",
      installationTime: "3-4 Gün"
    },
    {
      id: 6,
      name: "Tek Kişilik Mermer Mezar Baş Taşı",
      category: "mermer",
      material: "Beyaz Mermer",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1578948854345-1b9b2e5f3b9c?w=800&h=600&fit=crop",
      description: "Geleneksel tasarım beyaz mermer tek kişilik mezar baş taşı",
      dimensions: "100cm x 65cm",
      weight: "290 kg",
      thickness: "6 cm",
      finish: "Klasik Mermer Cilalı",
      warranty: "15 Yıl Garanti",
      installationTime: "1 Gün"
    },
    {
      id: 7,
      name: "Katlı Lahit Mezar Modeli",
      category: "mermer",
      material: "Granit + Mermer",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1578948856894-9f5f2e5c8b2a?w=800&h=600&fit=crop",
      description: "Geniş aile mezarları için katlı lahit tip özel mezar modeli",
      dimensions: "200cm x 120cm",
      weight: "650 kg",
      thickness: "15 cm",
      finish: "Granit + Mermer Kombinasyon",
      warranty: "20 Yıl Garanti",
      installationTime: "3-4 Gün"
    },
    {
      id: 8,
      name: "İki Kişilik Granit Mezar Modeli",
      category: "granit",
      material: "Siyah Granit",
      price: "Fiyat İçin Arayınız",
      image: "https://images.unsplash.com/photo-1578948856893-2f3e2c5b8a1b?w=800&h=600&fit=crop",
      description: "Modern tasarım iki kişilik siyah granit mezar modeli",
      dimensions: "140cm x 90cm",
      weight: "450 kg",
      thickness: "8 cm",
      finish: "Parlak Granit Cilalı",
      warranty: "12 Yıl Garanti",
      installationTime: "2-3 Gün"
    },
    {
      id: 9,
      name: "Tek Kişilik Granit Mezar Baş Taşı",
      category: "granit",
      material: "Siyah Granit",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description: "Çağdaş tasarım anlayışı ile hazırlanmış siyah granit mezar baş taşı",
      dimensions: "115cm x 75cm",
      weight: "340 kg",
      thickness: "7 cm",
      finish: "Modern Parlak Granit",
      warranty: "10 Yıl Garanti",
      installationTime: "1-2 Gün"
    },
    {
      id: 10,
      name: "Özel Yapım Mezar Modeli",
      category: "mermer",
      material: "Granit + Özel İşçilik",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description: "Müşteri isteklerine göre özel olarak tasarlanan granit mezar baş taşı modeli",
      featured: true,
      dimensions: "Müşteri İsteğine Göre",
      weight: "300-500 kg",
      thickness: "6-12 cm",
      finish: "Özel İstek İşçilik",
      warranty: "15 Yıl Garanti",
      installationTime: "2-5 Gün"
    }
  ];

  const filteredModels = selectedCategory === "tümü"
    ? allModels
    : allModels.filter(model => model.category === selectedCategory);

  const handleImageClick = (model: TombstoneModel) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
  };

  const handleProductDetail = (model: TombstoneModel) => {
    if (onProductDetail) {
      onProductDetail(model.id);
    }
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
              <span>{">"}</span>
              <span>Mezar Modelleri</span>
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
                      const gridElement = document.getElementById('products-grid');
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

      {/* Products Grid */}
      <div id="products-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü" ? "Tüm Mezar Modelleri" :
                  categories.find(cat => cat.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                Kaliteli malzeme ve işçilikle hazırlanmış mezar modelleri
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model, index) => (
                <Card key={`model-${model.id}-${index}`} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
                  <div className="relative cursor-pointer" onClick={() => handleImageClick(model)}>
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
                      <span className="text-sm text-teal-600">
                        {model.price}
                      </span>
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
                          window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
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
                <h3 className="text-xl text-gray-600 mb-2">Bu kategoride henüz model bulunmuyor</h3>
                <p className="text-gray-500 mb-6">Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.</p>
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

      {/* Process Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">Mezar Yapım Sürecimiz</h2>
              <p className="text-gray-600">Mezar yapım sürecimizde izlediğimiz adımlar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl text-gray-800 mb-2">1. Tasarım</h3>
                <p className="text-gray-600">İsteklerinize göre özel mezar tasarımı hazırlığı ve onay süreci</p>
              </div>

              <div className="text-center">
                <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔨</span>
                </div>
                <h3 className="text-xl text-gray-800 mb-2">2. Üretim</h3>
                <p className="text-gray-600">Seçilen malzemede uzman ekibimizle kaliteli mezar üretimi</p>
              </div>

              <div className="text-center">
                <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📍</span>
                </div>
                <h3 className="text-xl text-gray-800 mb-2">3. Kurulum</h3>
                <p className="text-gray-600">Mezarlıkta profesyonel mezar kurulumu ve son kontrol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Models Section - Moved to Bottom */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">Öne Çıkan Mezar Modelleri</h2>
              <p className="text-gray-600">En popüler ve kaliteli mezar modellerimizi keşfedin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models.filter(model => model.featured).map((model, index) => (
                <Card key={`featured-${model.id}-${index}`} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
                  <div className="relative cursor-pointer" onClick={() => handleImageClick(model)}>
                    <ImageWithFallback
                      src={model.image}
                      alt={model.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 right-3 bg-teal-500 text-white">
                      Öne Çıkan
                    </Badge>
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
                      <span className="text-sm text-teal-600">
                        {model.price}
                      </span>
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
                          window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                        }}
                      >
                        💬 WhatsApp'tan Sor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl mb-4">
              Özel Tasarım Mezar Baş Taşı İstiyorsanız
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Size özel tasarım mezar baş taşı modelleri için uzman ekibimizle iletişime geçin.
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

      {/* Product Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={selectedModel ? `product-description-${selectedModel.id}` : "modal-content"}
        >
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">
                  {selectedModel.name}
                </DialogTitle>
                <DialogDescription
                  id={`product-description-${selectedModel.id}`}
                  className="text-gray-600"
                >
                  {selectedModel.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Main Image - Centered */}
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

                {/* Price and Category Info - Centered */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="text-teal-600 border-teal-600">
                      {selectedModel.material}
                    </Badge>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {selectedModel.category.charAt(0).toUpperCase() + selectedModel.category.slice(1)}
                    </Badge>
                  </div>

                  <div className="text-2xl text-teal-600">
                    {selectedModel.price}
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
                      const whatsappMessage = `Merhaba, ${selectedModel.name} hakkında bilgi almak istiyorum.`;
                      window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    }}
                  >
                    💬 WhatsApp'tan Sor
                  </Button>
                </div>

                {/* Product Specifications */}
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