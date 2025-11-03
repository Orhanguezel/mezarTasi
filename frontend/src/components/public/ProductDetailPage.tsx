import { useState, useEffect } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { products, type Product } from "../../data/products";
import { getAllProducts } from "../../data/dynamicProducts";

interface ProductDetailPageProps {
  productId: number;
  onNavigate: (page: string) => void;
  onProductDetail?: (productId: number) => void;
}

export function ProductDetailPage({ productId, onNavigate, onProductDetail }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [currentPopularIndex, setCurrentPopularIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cemetery: '',
    email: '',
    message: ''
  });

  // Benzer ürünler slider için state
  const [currentSimilarIndex, setCurrentSimilarIndex] = useState(0);
  const [similarSliderTouchStart, setSimilarSliderTouchStart] = useState(0);
  const [similarSliderTouchEnd, setSimilarSliderTouchEnd] = useState(0);
  const [isSimilarAutoPlaying, setIsSimilarAutoPlaying] = useState(true);

  // Desktop'ta görünecek ürün sayısı
  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  };

  // Müşteri yorumları data
  const customerReviews = [
    {
      id: 1,
      name: "Mehmet KARATAŞ",
      location: "İhlamurkuyu Mezarlığı",
      rating: 5,
      comment: "Çok kaliteli işçilik ve malzeme kullanılmış. Personel çok ilgili ve profesyoneldi. Tavsiye ederim."
    },
    {
      id: 2,
      name: "Ayşe YILMAZ",
      location: "Zincirlikuyu Mezarlığı",
      rating: 5,
      comment: "Mezar taşımız çok güzel oldu. Zamanında teslim edildi ve kalitesi çok iyi. Memnun kaldık."
    },
    {
      id: 3,
      name: "Ali DEMIR",
      location: "Karacaahmet Mezarlığı",
      rating: 5,
      comment: "Profesyonel hizmet ve uygun fiyat. Ailece çok memnun kaldık. Teşekkür ederiz."
    }
  ];

  // Popüler ürünler
  const popularProducts = allProducts.slice(0, 8);

  // Benzer ürünler - aynı kategoriden farklı ürünler
  const similarProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 8);

  // Helper Functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Form submission logic here
    alert('Talebiniz alındı! En kısa sürede size dönüş yapacağız.');
    setFormData({ name: '', phone: '', cemetery: '', email: '', message: '' });
  };

  // Touch handlers for reviews
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextReview();
    }
    if (isRightSwipe) {
      prevReview();
    }
  };

  // Review navigation
  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % customerReviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + customerReviews.length) % customerReviews.length);
  };

  const goToSlide = (index: number) => {
    setCurrentReviewIndex(index);
  };

  // Popular products navigation
  const nextPopular = () => {
    setCurrentPopularIndex((prev) => (prev + 1) % popularProducts.length);
  };

  const prevPopular = () => {
    setCurrentPopularIndex((prev) => (prev - 1 + popularProducts.length) % popularProducts.length);
  };

  const handlePopularProductClick = (productId: number) => {
    if (onProductDetail) {
      onProductDetail(productId);
    }
  };

  // Similar products touch handlers
  const handleSimilarTouchStart = (e: React.TouchEvent) => {
    setSimilarSliderTouchStart(e.targetTouches[0].clientX);
  };

  const handleSimilarTouchMove = (e: React.TouchEvent) => {
    setSimilarSliderTouchEnd(e.targetTouches[0].clientX);
  };

  const handleSimilarTouchEnd = () => {
    if (!similarSliderTouchStart || !similarSliderTouchEnd) return;
    const distance = similarSliderTouchStart - similarSliderTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSimilarProducts();
    }
    if (isRightSwipe) {
      prevSimilarProducts();
    }
  };

  // Similar products navigation
  const nextSimilarProducts = () => {
    const maxIndex = Math.ceil(similarProducts.length / itemsPerView.desktop) - 1;
    setCurrentSimilarIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSimilarProducts = () => {
    setCurrentSimilarIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSimilarProductClick = (productId: number) => {
    console.log('🔍 Similar product clicked:', productId);

    // Trigger the navigation to the new product detail page
    // This will cause App.tsx to re-render ProductDetailPage with the new productId
    if (onProductDetail) {
      onProductDetail(productId);
    } else {
      console.warn('⚠️ onProductDetail prop not provided');
    }
  };

  // Auto-play for reviews
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % customerReviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, customerReviews.length]);

  // Auto-play for similar products
  useEffect(() => {
    if (isSimilarAutoPlaying && similarProducts.length > 0) {
      const interval = setInterval(() => {
        setCurrentSimilarIndex((prev) => {
          const maxIndex = Math.ceil(similarProducts.length / itemsPerView.desktop) - 1;
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }, 4000); // 4 saniyede bir geçiş
      return () => clearInterval(interval);
    }
  }, [isSimilarAutoPlaying, similarProducts.length, itemsPerView.desktop]);

  // Load all products and find the specific product
  useEffect(() => {
    console.log('🔄 ProductDetailPage useEffect triggered for productId:', productId);

    const loadAllProducts = () => {
      const dynamicProducts = getAllProducts();
      const convertedDynamicProducts = dynamicProducts.map(product => ({
        id: product.id,
        title: product.title || product.name,
        productCode: product.productCode || `NO:${product.id}`,
        price: product.price || "Fiyat için arayınız",
        image: product.image || "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center",
        description: product.description || "",
        category: product.category,
        isActive: product.isActive
      }));

      // Combine static and dynamic products
      const combinedProducts = [
        ...products,
        ...convertedDynamicProducts.filter(p => p.isActive)
      ];

      setAllProducts(combinedProducts);

      // Find the specific product
      const foundProduct = combinedProducts.find(p => p.id === productId);
      if (foundProduct) {
        console.log('✅ Product found:', foundProduct.title);
        setProduct(foundProduct);
        // Reset states when product changes
        setCurrentImageIndex(0);
        setCurrentReviewIndex(0);
        setCurrentSimilarIndex(0);
      } else {
        console.error(`❌ Product with ID ${productId} not found`);
        setProduct(null);
      }
    };

    loadAllProducts();

    // Listen for product updates
    const handleProductUpdate = () => {
      console.log('🔄 Product update event received');
      loadAllProducts();
    };

    window.addEventListener('mezarisim-products-updated', handleProductUpdate);

    return () => {
      window.removeEventListener('mezarisim-products-updated', handleProductUpdate);
    };
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ürün bulunamadı</h2>
          <Button onClick={() => onNavigate("home")} className="bg-teal-500 hover:bg-teal-600">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const getProductImages = () => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  };

  const images = getProductImages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => onNavigate("home")}
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Ana Sayfa
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 font-semibold">Mezar Modelleri</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-bold">{product.productCode}</span>
          </div>
        </div>
      </div>

      {/* Product Detail Content */}
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden shadow-lg">
              <ImageWithFallback
                src={images[currentImageIndex]}
                alt={`${product.title} - Görsel ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                        ? "border-teal-500 ring-2 ring-teal-200"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${product.title} - Küçük görsel ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Info */}
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                {images.length > 1 ? `${images.length} fotoğraf mevcut` : "1 fotoğraf mevcut"}
              </p>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="mb-4">
                <Badge variant="outline" className="text-teal-600 border-teal-600 mb-3 font-bold">
                  {product.productCode}
                </Badge>
                <h1 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Small Price Label */}
              <div className="mb-4">
                <div className="inline-flex items-center bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Ürün Satış Fiyatı:
                </div>
              </div>

              {/* Oval Price Display */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center bg-white border-4 border-black rounded-full px-8 py-4 shadow-lg">
                  <span className="text-4xl font-bold text-teal-600">
                    {product.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ürün Açıklaması</h3>
              <p className="text-gray-700 font-semibold leading-snug">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications */}
            {product.specifications && Object.values(product.specifications).some(value => value && value.trim()) && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Teknik Özellikler</h3>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <div className="space-y-3">
                    {product.specifications.dimensions && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Boyutlar:</strong> {product.specifications.dimensions}
                        </span>
                      </div>
                    )}
                    {product.specifications.weight && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Ağırlık:</strong> {product.specifications.weight}
                        </span>
                      </div>
                    )}
                    {product.specifications.thickness && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Kalınlık:</strong> {product.specifications.thickness}
                        </span>
                      </div>
                    )}
                    {product.specifications.surfaceFinish && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Yüzey İşlemi:</strong> {product.specifications.surfaceFinish}
                        </span>
                      </div>
                    )}
                    {product.specifications.warranty && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Garanti:</strong> {product.specifications.warranty}
                        </span>
                      </div>
                    )}
                    {product.specifications.installationTime && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-800 font-semibold leading-tight">
                          <strong>Kurulum Süresi:</strong> {product.specifications.installationTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="mt-8 lg:mt-16 bg-white rounded-lg shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {/* Müşteri Yorumları */}
            <AccordionItem value="reviews" className="border-b border-gray-200">
              <AccordionTrigger className="bg-teal-600 text-white px-6 py-4 hover:bg-teal-700 text-left">
                <span className="text-lg font-bold flex items-center gap-2">
                  ⭐ Müşterilerimizden Gelen Görüşler
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-white accordion-content-reviews">
                <div className="relative overflow-hidden">
                  {/* Slider Container */}
                  <div
                    className="relative touch-manipulation select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    {/* Slider Track */}
                    <div className="overflow-hidden rounded-xl">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${currentReviewIndex * 100}%)`,
                          width: `${customerReviews.length * 100}%`
                        }}
                      >
                        {customerReviews.map((review, index) => (
                          <div
                            key={review.id}
                            className="w-full flex-shrink-0"
                            style={{ width: `${100 / customerReviews.length}%` }}
                          >
                            {/* Compact Slide Design */}
                            <div className="bg-gradient-to-br from-teal-50 to-white rounded-lg p-3 md:p-4 shadow-sm border border-teal-100 mx-1">
                              <div className="text-center mb-3">
                                {/* Customer Avatar/Initial */}
                                <div className="w-12 h-12 mx-auto mb-2 bg-teal-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white text-base font-bold">
                                    {review.name.charAt(0)}
                                  </span>
                                </div>

                                {/* Customer Info */}
                                <h4 className="text-base font-bold text-teal-600 mb-1">
                                  {review.name}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2 flex items-center justify-center gap-1">
                                  <span>📍</span>
                                  {review.location}
                                </p>

                                {/* Star Rating */}
                                <div className="flex justify-center mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-4 h-4 text-yellow-400 fill-current mx-0.5"
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Comment */}
                              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                <div className="text-teal-600 text-2xl mb-1 text-center opacity-50">"</div>
                                <p className="text-gray-700 text-center leading-relaxed text-sm italic">
                                  {review.comment}
                                </p>
                                <div className="text-teal-600 text-2xl mt-1 text-center transform rotate-180 opacity-50">"</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Compact Navigation */}
                  <div className="flex justify-between items-center mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevReview}
                      className="border-teal-500 text-teal-600 hover:bg-teal-50 text-xs px-2 py-1"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Önceki
                    </Button>

                    {/* Progress Dots */}
                    <div className="flex items-center gap-1">
                      {customerReviews.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`transition-all duration-300 rounded-full ${index === currentReviewIndex
                              ? "w-6 h-2 bg-teal-500"
                              : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                            }`}
                          aria-label={`${index + 1}. yoruma git`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextReview}
                      className="border-teal-500 text-teal-600 hover:bg-teal-50 text-xs px-2 py-1"
                    >
                      Sonraki
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>

                  {/* Minimal Review Counter */}
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">
                      {currentReviewIndex + 1} / {customerReviews.length} müşteri yorumu
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Bu Ürün Hakkında Detaylı Görüşmek */}
            <AccordionItem value="contact" className="border-b border-gray-200">
              <AccordionTrigger className="bg-teal-600 text-white px-6 py-4 hover:bg-teal-700 text-left">
                <span className="text-lg font-bold">Bu Ürün Hakkında Detaylı Görüşmek</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-6 bg-white accordion-content-contact">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-teal-600 mb-4">İletişim Bilgileri</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-600 font-bold">📞</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Telefon</p>
                          <p className="text-teal-600 font-bold">0533 483 89 71</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold">📱</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">WhatsApp</p>
                          <p className="text-green-600 font-bold">0533 483 89 71</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Button
                        onClick={() => window.open("tel:+905334838971")}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        📞 Hemen Ara
                      </Button>
                      <Button
                        onClick={() => window.open("https://wa.me/905334838971", "_blank")}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        💬 WhatsApp'tan Yaz
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-teal-600 mb-4">Detaylı Bilgi Formu</h4>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          name="name"
                          placeholder="Adınız Soyadınız"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Input
                          type="tel"
                          name="phone"
                          placeholder="Telefon Numaranız"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Input
                          type="text"
                          name="cemetery"
                          placeholder="Mezarlık Adı"
                          value={formData.cemetery}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Input
                          type="email"
                          name="email"
                          placeholder="E-posta Adresiniz (Opsiyonel)"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Textarea
                          name="message"
                          placeholder="Mesajınız ve özel istekleriniz..."
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        📧 Bilgi Talep Et
                      </Button>
                    </form>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* DİĞER KONULAR Carousel */}
            <AccordionItem value="popular" className="border-b-0">
              <AccordionTrigger className="bg-teal-600 text-white px-6 py-4 hover:bg-teal-700 text-left">
                <span className="text-lg font-bold">DİĞER KONULAR</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white accordion-content-limited">
                <div className="relative">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-center">
                      <div className="mb-4">
                        <ImageWithFallback
                          src={popularProducts[currentPopularIndex].image}
                          alt={popularProducts[currentPopularIndex].title}
                          className="w-40 h-32 object-cover rounded-lg mx-auto shadow-md"
                        />
                      </div>
                      <h4 className="text-lg font-bold text-teal-600 mb-2">
                        {popularProducts[currentPopularIndex].title}
                      </h4>
                      <p className="text-2xl font-bold text-gray-800 mb-4">
                        {popularProducts[currentPopularIndex].price}
                      </p>
                      <Button
                        onClick={() => handlePopularProductClick(popularProducts[currentPopularIndex].id)}
                        className="bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        Detaylı İncele
                      </Button>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <Button variant="outline" size="sm" onClick={prevPopular}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <div className="flex space-x-2">
                        {popularProducts.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${index === currentPopularIndex ? "bg-teal-500" : "bg-gray-300"
                              }`}
                          />
                        ))}
                      </div>

                      <Button variant="outline" size="sm" onClick={nextPopular}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Fiyat İçin Arayınız Bölümü */}
        <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 md:p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              🔥 Özel Fiyat İçin Hemen Arayın! 🔥
            </h3>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Bu ürün için en uygun fiyatı almak ve detaylı bilgi için hemen bizimle iletişime geçin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => window.open("tel:+905334838971")}
                className="bg-white text-teal-600 hover:bg-gray-100 font-bold px-8 py-3 text-lg"
              >
                📞 0533 483 89 71
              </Button>
              <Button
                onClick={() => window.open("https://wa.me/905334838971", "_blank")}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 text-lg"
              >
                💬 WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Benzer Ürünler Slider */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Benzer Ürünler</h2>
            <p className="text-gray-600">Size uygun diğer mezar modelleri</p>
          </div>

          <div className="relative">
            {/* Slider Container */}
            <div
              className="overflow-hidden"
              onTouchStart={handleSimilarTouchStart}
              onTouchMove={handleSimilarTouchMove}
              onTouchEnd={handleSimilarTouchEnd}
              onMouseEnter={() => setIsSimilarAutoPlaying(false)}
              onMouseLeave={() => setIsSimilarAutoPlaying(true)}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentSimilarIndex * (100 / itemsPerView.desktop)}%)`,
                }}
              >
                {similarProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex-none w-full sm:w-1/2 lg:w-1/4 px-3"
                    style={{ minWidth: '0' }}
                  >
                    <div
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
                      onClick={() => handleSimilarProductClick(product.id)}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-white bg-opacity-90 rounded-full p-3">
                              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm leading-tight min-h-[2.5rem] line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-teal-600 font-bold text-lg">{product.price}</span>
                          <Badge variant="outline" className="text-xs text-teal-600 border-teal-200">
                            #{product.id}
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2.5 rounded-lg transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🖱️ Detaylı İncele button clicked for product:', product.id, product.title);
                            handleSimilarProductClick(product.id);
                          }}
                        >
                          <span className="flex items-center justify-center gap-2">
                            Detaylı İncele
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSimilarProducts}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-teal-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group"
              aria-label="Önceki ürünler"
            >
              <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={nextSimilarProducts}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-teal-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group"
              aria-label="Sonraki ürünler"
            >
              <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            {/* Progress Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(similarProducts.length / itemsPerView.desktop) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSimilarIndex(index)}
                  className={`transition-all duration-300 rounded-full ${Math.floor(currentSimilarIndex / itemsPerView.desktop) === index
                      ? "w-8 h-3 bg-teal-500"
                      : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                    }`}
                  aria-label={`${index + 1}. ürün grubuna git`}
                />
              ))}
            </div>

            {/* Product Counter */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                {similarProducts.length} benzer ürün •
                {Math.floor(currentSimilarIndex / itemsPerView.desktop) + 1} / {Math.ceil(similarProducts.length / itemsPerView.desktop)} grup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}