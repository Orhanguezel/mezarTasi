import { useState, useEffect, useMemo } from "react";
import { ImageOptimized } from "./ImageOptimized";
import { SkeletonLoader } from "./SkeletonLoader";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Search, X } from "lucide-react";
import { products, searchProducts, getProductsByCategory } from "../../data/products";
import { useProducts } from "../../contexts/DataContext";

interface ProductGalleryProps {
  searchTerm: string;
  showSearchResults: boolean;
  onClearSearch: () => void;
  onProductDetail: (productId: number) => void;
  refreshKey?: number;
}

export function ProductGallery({ searchTerm, showSearchResults, onClearSearch, onProductDetail, refreshKey }: ProductGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("mezar-modelleri");
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  // Context'ten ürün verilerini al
  const { products: contextProducts } = useProducts();

  // Helper function to map category names to keys - bu fonksiyonu yukarıya aldık
  const getCategoryKey = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      // Admin panelinden gelen kategoriler (alt kategoriler aslında)
      'Tek Kişilik Mermer Modeller': 'tek-kisilik-mermer',
      'Tek Kişilik Granit Modeller': 'tek-kisilik-granit',
      'İki Kişilik Mermer Modeller': 'iki-kisilik-mermer',
      'İki Kişilik Granit Modeller': 'iki-kisilik-granit',
      'Katlı Lahit Mezar Modelleri': 'lahit',
      'Özel Yapım Mezar Modelleri': 'ozel-yapim',
      'Sütunlu Mezar Modelleri': 'sutunlu',
      'MERMER BAŞ TAŞI MODELLERİ': 'tek-kisilik-mermer',
      'GRANİT BAŞ TAŞI MODELLERİ': 'tek-kisilik-granit',
      'ÖZEL TASARIM BAŞ TAŞLARI': 'ozel-yapim',
      'Mezar Şuluk Modelleri': 'ozel-yapim',
      'Mezar Sütun Modelleri': 'sutunlu',
      'Mezar Vazo Modelleri': 'ozel-yapim',
      'ÇİÇEKLİK MODELLERİ': 'ozel-yapim',
      'ABAJUR MODELLERİ': 'ozel-yapim',
      'VAZO MODELLERİ': 'ozel-yapim',
      'DOĞAL ÇİÇEK DÜZENLEMESİ': 'sutunlu',
      'YAPAY ÇİÇEK DÜZENLEMESİ': 'sutunlu',
      'SEZON ÇİÇEKLERİ': 'sutunlu',
      'TOPRAK DOLDURMA HİZMETİ': 'lahit',
      'ÇİMENLENDİRME HİZMETİ': 'lahit',
      'PEYZAj DÜZENLEME': 'lahit',
      // Eski statik kategoriler
      'Mezar Modelleri': 'mezar-modelleri',
      'Mezar Baş Taşı Modelleri': 'tek-kisilik-mermer',
      'Mezar Aksesuarları': 'ozel-yapim',
      'Mezar Çiçeklendirme': 'sutunlu',
      'Mezar Toprak Doldurumu': 'lahit',
      'tek-kisilik-mermer': 'tek-kisilik-mermer',
      'tek-kisilik-granit': 'tek-kisilik-granit',
      'iki-kisilik-mermer': 'iki-kisilik-mermer',
      'iki-kisilik-granit': 'iki-kisilik-granit',
      'lahit': 'lahit',
      'ozel-yapim': 'ozel-yapim',
      'sutunlu': 'sutunlu'
    };

    return categoryMap[category] || 'mezar-modelleri';
  };

  // Tüm ürünleri (static + dynamic) birleştir
  const allProducts = useMemo(() => {
    try {
      console.log('📦 Combining products from Context:', contextProducts.length);

      const convertedDynamicProducts = contextProducts.map(product => ({
        id: product.id,
        title: product.title || product.name,
        productCode: product.productCode,
        price: product.price,
        image: product.image,
        description: product.description || "",
        category: getCategoryKey(product.category),
        isActive: product.isActive !== undefined ? product.isActive : true
      }));

      // Combine static and dynamic products, filter active ones
      const combinedProducts = [
        ...products.map(p => ({ ...p, isActive: true })), // Static products are always active
        ...convertedDynamicProducts.filter(p => p.isActive)
      ];

      console.log('✅ All products combined:', combinedProducts.length);
      return combinedProducts;
    } catch (error) {
      console.error('❌ Error combining products:', error);
      return products.map(p => ({ ...p, isActive: true }));
    }
  }, [contextProducts]);

  // Loading state management
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [contextProducts]);



  // Search function for all products
  const searchAllProducts = (term: string) => {
    const searchTerm = term.toLowerCase();
    return allProducts.filter(product =>
      product.title?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.productCode?.toLowerCase().includes(searchTerm)
    );
  };

  // Get products by category from all products
  const getProductsByCategoryFromAll = (category: string) => {
    if (category === "mezar-modelleri") {
      return allProducts;
    }
    return allProducts.filter(product => product.category === category);
  };

  const categories = [
    { id: "mezar-modelleri", label: "MEZAR MODELLERİ", count: allProducts.length, isHeader: true },
    { id: "tek-kisilik-mermer", label: "Tek Kişilik Mermer Modeller", count: allProducts.filter(p => p.category === "tek-kisilik-mermer").length, isHeader: false },
    { id: "tek-kisilik-granit", label: "Tek Kişilik Granit Modeller", count: allProducts.filter(p => p.category === "tek-kisilik-granit").length, isHeader: false },
    { id: "iki-kisilik-mermer", label: "İki Kişilik Mermer Modeller", count: allProducts.filter(p => p.category === "iki-kisilik-mermer").length, isHeader: false },
    { id: "iki-kisilik-granit", label: "İki Kişilik Granit Modeller", count: allProducts.filter(p => p.category === "iki-kisilik-granit").length, isHeader: false },
    { id: "lahit", label: "Katlı Lahit Mezar Modelleri", count: allProducts.filter(p => p.category === "lahit").length, isHeader: false },
    { id: "ozel-yapim", label: "Özel Yapım Mezar Modelleri", count: allProducts.filter(p => p.category === "ozel-yapim").length, isHeader: false },
    { id: "sutunlu", label: "Sütunlu Mezar Modelleri", count: allProducts.filter(p => p.category === "sutunlu").length, isHeader: false }
  ];

  const headerCategory = categories.find(cat => cat.isHeader);
  const regularCategories = categories.filter(cat => !cat.isHeader);

  // Memoize filtered products for better performance
  const filteredProducts = useMemo(() => {
    if (showSearchResults && searchTerm.trim()) {
      return searchAllProducts(searchTerm);
    }

    if (selectedCategory === "mezar-modelleri") {
      return allProducts; // Tüm ürünleri göster
    }

    return getProductsByCategoryFromAll(selectedCategory);
  }, [showSearchResults, searchTerm, selectedCategory, allProducts]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProducts);
  }, [filteredProducts, visibleProducts]);

  const loadMore = () => {
    setVisibleProducts(prev => prev + 12);
  };

  useEffect(() => {
    setIsLoading(true);
    setVisibleProducts(12);

    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  const handleProductClick = (productId: number) => {
    onProductDetail(productId);
  };

  return (
    <section className="py-16 bg-gray-50" id="products">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header - Only for search results */}
        {showSearchResults && (
          <div className="text-center mb-12">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <h2 className="text-4xl font-bold text-gray-800">
                  "{searchTerm}" için Arama Sonuçları
                </h2>
                <Button
                  onClick={onClearSearch}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-teal-500 text-teal-600 hover:bg-teal-50"
                >
                  <X className="w-4 h-4" />
                  Temizle
                </Button>
              </div>
              <p className="text-xl text-gray-600">
                {filteredProducts.length} ürün bulundu
              </p>
            </div>
          </div>
        )}

        {/* Main Content - Sidebar Layout for non-search pages */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Category List (only show when not searching) */}
          {!showSearchResults && (
            <div className="lg:w-1/4">
              <div className="sticky top-24">
                {/* Mobile Layout - 2 Column Grid */}
                <div className="lg:hidden">
                  {/* All Categories - 2 Column Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm ${category.isHeader
                            ? (selectedCategory === category.id
                              ? "bg-teal-600 text-white"
                              : "bg-teal-500 text-white hover:bg-teal-600")
                            : (selectedCategory === category.id
                              ? "bg-teal-100 text-teal-700"
                              : "bg-white text-gray-700 hover:bg-gray-50")
                          }`}
                      >
                        <div className="text-center">{category.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Layout - Unified Table */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {categories.map((category, index) => {
                      if (category.isHeader) {
                        return (
                          <div
                            key={category.id}
                            className="bg-teal-500 text-white px-6 py-4 cursor-pointer hover:bg-teal-600 transition-colors duration-200"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <h3 className="font-bold text-lg text-center">{category.label}</h3>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-6 py-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${selectedCategory === category.id
                                ? "bg-teal-50 text-teal-700 font-medium"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            <div className="text-sm">{category.label}</div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Content - Products Grid */}
          <div className={showSearchResults ? "w-full" : "lg:w-3/4"}>
            {/* Loading State */}
            {isLoading ? (
              <SkeletonLoader type="grid" count={12} />
            ) : (
              <>
                {/* Products Grid - 2 Columns Mobile, 3 Columns Desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  {displayedProducts.map((product, index) => (
                    <div
                      key={`product-${product.id}-${index}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {/* Image Container with Photo Badge */}
                      <div className="relative aspect-[4/3] lg:aspect-[4/3] sm:aspect-[3/4] overflow-hidden bg-gray-100">
                        <ImageOptimized
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={displayedProducts.findIndex(p => p.id === product.id) < 6} // Preload first 6 images
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          quality={85}
                        />
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Product Title */}
                        <h3 className="text-base font-bold text-gray-800 mb-3 line-clamp-2 uppercase">
                          {product.title}
                        </h3>

                        {/* Product Code and Price - Side by Side */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-block px-3 py-1 border-2 border-blue-500 text-blue-600 text-xs font-bold rounded">
                            {product.productCode}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {product.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {visibleProducts < filteredProducts.length && (
                  <div className="text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 border-teal-500 text-teal-600 hover:bg-teal-50"
                    >
                      Daha Fazla Göster ({filteredProducts.length - visibleProducts} ürün daha)
                    </Button>
                  </div>
                )}

                {/* No Results */}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {showSearchResults ? "Arama sonucu bulunamadı" : "Bu kategoride ürün bulunamadı"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {showSearchResults
                          ? `"${searchTerm}" aramanızla eşleşen ürün bulunamadı. Farklı anahtar kelimeler deneyebilirsiniz.`
                          : "Seçilen kategoride henüz ürün bulunmamaktadır. Diğer kategorileri kontrol edebilirsiniz."
                        }
                      </p>
                    </div>

                    {showSearchResults && (
                      <Button
                        onClick={onClearSearch}
                        className="bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        Tüm Ürünleri Görüntüle
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>


      </div>
    </section>
  );
}