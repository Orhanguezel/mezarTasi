import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveSlides, SlideData } from "../../data/sliderData";
import { getAllProducts, getFeaturedProducts } from "../../data/dynamicProducts";
import backgroundImage from 'figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png';

interface PricingPageProps {
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
  productCode: string;
  dimensions?: string;
  weight?: string;
  thickness?: string;
  finish?: string;
  warranty?: string;
  installationTime?: string;
}

export function PricingPage({ onNavigate, onProductDetail }: PricingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [models, setModels] = useState<TombstoneModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load dynamic products
  useEffect(() => {
    const loadProducts = () => {
      const allProducts = getAllProducts();
      const convertedModels: TombstoneModel[] = allProducts.map(product => ({
        id: product.id,
        name: product.title || product.productCode || 'Ürün Adı Yok',
        category: getCategoryKey(product.category),
        material: 'Mermer', // Default material
        price: product.price || 'Fiyat İçin Arayınız',
        image: product.image,
        description: product.description || '',
        featured: false, // Will be updated from dynamic products
        productCode: product.productCode,
        dimensions: '',
        weight: '',
        thickness: '',
        finish: '',
        warranty: '',
        installationTime: ''
      }));

      setModels(convertedModels);
    };

    loadProducts();

    // Listen for product updates
    const handleProductUpdate = () => {
      console.log('🔄 PricingPage - Product update event received');
      setRefreshKey(prev => prev + 1);
      loadProducts();
    };

    window.addEventListener('mezarisim-products-updated', handleProductUpdate);

    // Also listen for force re-render events
    const handleForceRerender = () => {
      console.log('🔄 PricingPage - Force rerender event received');
      setRefreshKey(prev => prev + 1);
      loadProducts();
    };

    window.addEventListener('mezarisim-force-rerender', handleForceRerender);

    // Listen for storage events too
    const handleStorageChange = () => {
      console.log('🔄 PricingPage - Storage change event received');
      setRefreshKey(prev => prev + 1);
      loadProducts();
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom product change events
    const handleProductChange = (event: any) => {
      console.log('🔄 PricingPage - Custom product change event received:', event.detail);
      setRefreshKey(prev => prev + 1);
      loadProducts();
    };

    window.addEventListener('mezarisim-product-changed', handleProductChange);

    return () => {
      window.removeEventListener('mezarisim-products-updated', handleProductUpdate);
      window.removeEventListener('mezarisim-force-rerender', handleForceRerender);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mezarisim-product-changed', handleProductChange);
    };
  }, [refreshKey]);

  // Helper function to map category names to keys
  const getCategoryKey = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      // Admin panelinden gelen kategoriler
      'Tek Kişilik Mermer Modeller': 'tek-kisilik-mermer',
      'Tek Kişilik Granit Modeller': 'tek-kisilik-granit',
      'İki Kişilik Mermer Modeller': 'iki-kisilik-mermer',
      'İki Kişilik Granit Modeller': 'iki-kisilik-granit',
      'Katlı Lahit Mezar Modelleri': 'katli-lahit',
      'Özel Yapım Mezar Modelleri': 'ozel-yapim',
      'Sütunlu Mezar Modelleri': 'sutunlu-mermer',
      'MERMER BAŞ TAŞI MODELLERİ': 'tek-kisilik-mermer',
      'GRANİT BAŞ TAŞI MODELLERİ': 'tek-kisilik-granit',
      'ÖZEL TASARIM BAŞ TAŞLARI': 'ozel-yapim',
      // Eski kategoriler uyumluluğu
      'Mezar Modelleri': 'tek-kisilik-mermer',
      'tek-kisilik-mermer': 'tek-kisilik-mermer',
      'tek-kisilik-granit': 'tek-kisilik-granit',
      'iki-kisilik-mermer': 'iki-kisilik-mermer',
      'iki-kisilik-granit': 'iki-kisilik-granit',
      'modern': 'ozel-yapim',
      'lahit': 'katli-lahit',
      'sutunlu': 'sutunlu-mermer',
      'granit': 'tek-kisilik-granit',
      'mermer': 'tek-kisilik-mermer'
    };

    return categoryMap[category] || 'tek-kisilik-mermer';
  };

  useEffect(() => {
    setSlides(getActiveSlides());
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [slides.length]);

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
    { id: "tümü", name: "Tüm Modeller", count: 21 },
    { id: "tek-kisilik-granit", name: "Tek Kişilik Granit Mezar", count: 5 },
    { id: "tek-kisilik-mermer", name: "Tek Kişilik Mermer Mezar", count: 4 },
    { id: "iki-kisilik-granit", name: "İki Kişilik Granit Mezar", count: 3 },
    { id: "iki-kisilik-mermer", name: "İki Kişilik Mermer Mezar", count: 3 },
    { id: "sutunlu-mermer", name: "Sütunlu Mermer Mezar", count: 2 },
    { id: "katli-lahit", name: "Katlı Lahit Mezar", count: 2 },
    { id: "ozel-yapim", name: "Özel Mezar Yapım", count: 2 }
  ];

  const filteredModels = selectedCategory === "tümü"
    ? models
    : models.filter(model => model.category === selectedCategory);

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

      {/* Category Filters - Same style as HomePage */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Desktop Version - Horizontal Pills */}
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg hover:bg-teal-600"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                    }`}
                >
                  <span>{category.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === category.id
                      ? "bg-white bg-opacity-20 text-white"
                      : "bg-teal-100 text-teal-700"
                    }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile Version - 2 Column Grid like HomePage */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 border text-center ${selectedCategory === category.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                      : "bg-white text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                    }`}
                >
                  <div className="text-center leading-tight break-words font-bold">
                    {category.name}
                  </div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === category.id
                      ? "bg-white bg-opacity-20 text-white"
                      : "bg-teal-100 text-teal-700"
                    }`}>
                    {category.count}
                  </div>
                </button>
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                  onClick={() => handleProductDetail(model)}
                >
                  {/* Ürün resmi - daha büyük */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={model.image}
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Ürün bilgileri - masaüstü tasarım formatında */}
                  <div className="p-3">
                    {/* Ürün adı */}
                    <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 uppercase leading-tight">
                      {model.name}
                    </h3>

                    {/* Ürün kodu ve fiyat - tek sırada yan yana */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-500 text-blue-600 text-xs font-bold rounded">
                        {model.productCode}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {model.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📷</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bu kategoride henüz model bulunmuyor</h3>
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

      {/* Featured Models Slider - Moved to Bottom */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">Öne Çıkan Mezar Modelleri</h2>
              <p className="text-gray-600">
                En popüler ve kaliteli mezar modellerimizi keşfedin
              </p>
            </div>

            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent className="-ml-2 md:-ml-4">
                {getFeaturedProducts().map((model) => (
                  <CarouselItem key={model.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden h-full cursor-pointer"
                      onClick={() => handleProductDetail(model)}>
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
                          <span className="inline-block px-3 py-1 border-2 border-blue-500 text-blue-600 text-xs font-bold rounded">
                            {model.productCode}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {model.price}
                          </span>
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

      {/* CTA Section */}
      <div className="bg-teal-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl text-white mb-6">Kaliteli Mezar Yapımı İçin Hemen İletişime Geçin</h2>
            <p className="text-teal-100 mb-8 text-lg">
              Uzman ekibimizle birlikte en uygun mezar modelini seçin ve profesyonel hizmet alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onNavigate("contact")}
                className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3"
              >
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