// FILE: src/pages/.../ModelsPage.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveSlidesRtk } from "../../data/sliderData";
import { getAllProducts } from "../../data/dynamicProducts";
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";
import backgroundImage from "figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png";
import tombstoneImage1 from "figma:asset/045ec544828ae89a32759225db62e101d2608292.png";
import tombstoneImage2 from "figma:asset/230bfc45a1c3e29e0d1080b05baa205fb4c5f511.png";

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
  const [allModels, setAllModels] = useState<TombstoneModel[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ Slider RTK
  const { slides, isError: isSlidesError } = useActiveSlidesRtk();

  // ✅ Kategorileri RTK'dan çek
  const { data: categories = [] } = useListCategoriesQuery({
    is_active: true,
    limit: 200,
    offset: 0,
    sort: "display_order",
    order: "asc",
  });

  // --- normalize helper ---
  const normalize = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      // @ts-ignore - Unicode diacritics regex
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");

  // ✅ Kategori adı/slug → iç anahtar map'i (bastaslari|modeller|mermer|granit|sutunlu)
  const categoryKeyByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      const label = normalize((c as any).slug || (c as any).name || "");

      let key: "bastaslari" | "modeller" | "mermer" | "granit" | "sutunlu" = "mermer";
      if (/bas-?tasi|bastas/i.test(label)) key = "bastaslari";
      else if (/sutun/i.test(label)) key = "sutunlu";
      else if (/granit/i.test(label)) key = "granit";
      else if (/mermer/i.test(label)) key = "mermer";
      else if (/mezar-?modelleri|modeller|model/i.test(label)) key = "modeller";

      // name ve slug üzerinden erişim
      if ((c as any).name) map.set(normalize((c as any).name), key);
      if ((c as any).slug) map.set(normalize((c as any).slug), key);
    }
    return map;
  }, [categories]);

  // Helper: admin kategori → sayfa içi key (RTK tabanlı + heuristics)
  const getCategoryKey = (category: string): string => {
    const norm = normalize(category);
    const fromMap = categoryKeyByName.get(norm);
    if (fromMap) return fromMap;

    // Heuristic fallback (kategori listesi henüz gelmediyse veya isim birebir eşleşmediyse)
    if (/bas-?tasi|bastas/i.test(norm)) return "bastaslari";
    if (/sutun/i.test(norm)) return "sutunlu";
    if (/granit/i.test(norm)) return "granit";
    if (/mezar-?modelleri|modeller|model/i.test(norm)) return "modeller";
    if (/mermer/i.test(norm)) return "mermer";
    return "mermer";
  };

  // Dinamik ürünleri yükle + statik modellerle birleştir
  useEffect(() => {
    const loadAllModels = () => {
      const dynamicProducts = getAllProducts();
      const convertedDynamicProducts: TombstoneModel[] = dynamicProducts
        .filter((product) => {
          const categoryKey = getCategoryKey(product.category);
          return ["mermer", "granit", "sutunlu", "bastaslari", "modeller"].includes(categoryKey);
        })
        .map((product) => ({
          id: product.id + 1000,
          name: product.title || product.productCode || "Ürün Adı Yok",
          category: getCategoryKey(product.category),
          material: "Özel Malzeme",
          price: product.price || "Fiyat İçin Arayınız",
          image:
            product.image ||
            "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop",
          description: product.description || "",
          featured: false,
          dimensions: "",
          weight: "",
          thickness: "",
          finish: "",
          warranty: "",
          installationTime: "",
        }));

      setAllModels([...models, ...convertedDynamicProducts]);
    };

    loadAllModels();

    const handleProductUpdate = () => loadAllModels();
    const handleForceRerender = () => {
      setRefreshKey((prev) => prev + 1);
      loadAllModels();
    };

    window.addEventListener("mezarisim-products-updated", handleProductUpdate);
    window.addEventListener("mezarisim-force-rerender", handleForceRerender);
    return () => {
      window.removeEventListener("mezarisim-products-updated", handleProductUpdate);
      window.removeEventListener("mezarisim-force-rerender", handleForceRerender);
    };
    // categories değiştiğinde de yeniden map'leyelim
  }, [refreshKey, categoryKeyByName]);

  // Slider autoplay
  useEffect(() => {
    if (slides && slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides?.length]);

  // Bir sonraki görseli preload et
  useEffect(() => {
    if (slides && slides.length > 0) {
      const nextIndex = (currentSlide + 1) % slides.length;
      const img = new Image();
      img.src = slides[nextIndex].image;
    }
  }, [currentSlide, slides]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % (slides?.length || 1));
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + (slides?.length || 1)) % (slides?.length || 1));

  // Kategori sayıları
  const allCategories = [
    { id: "tümü", name: "Tüm Modeller", count: allModels.length },
    { id: "mermer", name: "Mermer Mezar Taşları", count: allModels.filter((m) => m.category === "mermer").length },
    { id: "granit", name: "Granit Mezar Taşları", count: allModels.filter((m) => m.category === "granit").length },
    { id: "sutunlu", name: "Sütunlu Mezar Taşları", count: allModels.filter((m) => m.category === "sutunlu").length },
    { id: "bastaslari", name: "Mezar Baş Taşları", count: allModels.filter((m) => m.category === "bastaslari").length },
    { id: "modeller", name: "Özel Mezar Modelleri", count: allModels.filter((m) => m.category === "modeller").length },
  ];
  const categoriesUi = allCategories.filter((cat) => cat.id === "tümü" || cat.count > 0);

  // Statik showcase (featured)
  const models: TombstoneModel[] = [
    {
      id: 1,
      name: "Günay Yaman Modeli - Siyah Granit Çerçeveli Mezar Baş Taşı",
      category: "granit",
      material: "Siyah Granit + Beyaz Mermer",
      price: "Fiyat İçin Arayınız",
      image: tombstoneImage1,
      description:
        "Siyah granit çerçeve ile beyaz mermer kombinasyonu, modern ve şık mezar baş taşı tasarımı",
      featured: true,
      dimensions: "120cm x 80cm",
      weight: "350 kg",
      thickness: "8 cm",
      finish: "Parlak Cilalı",
      warranty: "10 Yıl Garanti",
      installationTime: "1-2 Gün",
    },
    // ... (diğerleri aynı, kısaltıldı)
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
      installationTime: "2-5 Gün",
    },
  ];

  const filteredModels =
    selectedCategory === "tümü"
      ? allModels
      : allModels.filter((model) => model.category === selectedCategory);

  const handleImageClick = (model: TombstoneModel) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleProductDetail = (model: TombstoneModel) => {
    onProductDetail?.(model.id);
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
              <span>{">"}</span>
              <span>Mezar Modelleri</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Slider */}
      {slides && slides.length > 0 && !isSlidesError && (
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
                    alt={slide.alt ?? slide.title}
                    className="w-full h-96 object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60" />
                </div>

                <div className="absolute bottom-16 right-6 text-right text-white max-w-sm">
                  <h2 className="text-lg md:text-xl mb-3 text-white font-normal">{slide.title}</h2>
                  <button
                    onClick={() => {
                      const gridElement = document.getElementById("products-grid");
                      if (gridElement) gridElement.scrollIntoView({ behavior: "smooth" });
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

      {/* Kategoriler */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {categoriesUi.map((category) => (
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
              {categoriesUi.map((category) => (
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

      {/* Ürün grid */}
      <div id="products-grid" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-gray-800 mb-4">
                {selectedCategory === "tümü"
                  ? "Tüm Mezar Modelleri"
                  : categoriesUi.find((cat) => cat.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">Kaliteli malzeme ve işçilikle hazırlanmış mezar modelleri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model, index) => (
                <Card
                  key={`model-${model.id}-${index}`}
                  className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden"
                >
                  <div className="relative cursor-pointer" onClick={() => handleImageClick(model)}>
                    <ImageWithFallback
                      src={model.image}
                      alt={model.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {model.featured && (
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
                    <div className="mb-3">
                      <Badge variant="outline" className="text-teal-600 border-teal-600 mb-2">
                        {model.material}
                      </Badge>
                    </div>

                    <h3 className="text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">{model.name}</h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-teal-600">{model.price}</span>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => handleProductDetail(model)}>
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
                          window.open(
                            `https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`,
                            "_blank"
                          );
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
                <p className="text-gray-500 mb-6">
                  Diğer kategorileri inceleyebilir veya bizimle iletişime geçebilirsiniz.
                </p>
                <Button onClick={() => setSelectedCategory("tümü")} className="bg-teal-500 hover:bg-teal-600 text-white">
                  Tüm Modelleri Görüntüle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Süreç, Öne çıkanlar, CTA, Modal -> değişmedi (kısalttım) */}
      {/* ... (aynı içerik) ... */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={selectedModel ? `product-description-${selectedModel.id}` : "modal-content"}
        >
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-600">{selectedModel.name}</DialogTitle>
                <DialogDescription id={`product-description-${selectedModel.id}`} className="text-gray-600">
                  {selectedModel.description}
                </DialogDescription>
              </DialogHeader>
              {/* ... */}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
