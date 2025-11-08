// =============================================================
// FILE: src/components/public/ProductDetailPage.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";

import {
  useGetProductQuery,
  useListProductsQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";

import {
  type Product as ApiProduct,
} from "@/integrations/metahub/db/types/products.rows";

// ---- Session mapping: numericKey <-> realId (uuid/slug) ----
const IDMAP_KEY = "mh_public_product_idmap_v1";
type IdMap = Record<string, string>; // numericKey(string) -> realId

function hashToNumericKey(s: string): number {
  // simple 32-bit hash, always >= 1
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return h === 0 ? 1 : h;
}
function saveIdMapping(realId: string): number {
  const key = hashToNumericKey(realId);
  try {
    const raw = sessionStorage.getItem(IDMAP_KEY);
    const map: IdMap = raw ? JSON.parse(raw) : {};
    map[String(key)] = realId;
    sessionStorage.setItem(IDMAP_KEY, JSON.stringify(map));
  } catch {}
  return key;
}
function readRealId(numericKey: number | string): string | null {
  try {
    const raw = sessionStorage.getItem(IDMAP_KEY);
    if (!raw) return null;
    const map: IdMap = JSON.parse(raw);
    const id = map[String(numericKey)];
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

// ---- specs normalize (unknown -> Record<string,string>)
function normalizeSpecs(specs: unknown): Record<string, string> {
  if (!specs) return {};
  if (typeof specs === "string") {
    try {
      const parsed = JSON.parse(specs);
      return normalizeSpecs(parsed);
    } catch {
      return {};
    }
  }
  if (Array.isArray(specs)) {
    const out: Record<string, string> = {};
    for (const it of specs as any[]) {
      if (it && typeof it === "object" && (it as any).name) {
        const v = (it as any).value;
        out[String((it as any).name)] = Array.isArray(v) ? v.join(", ") : v != null ? String(v) : "";
      }
    }
    return out;
  }
  if (typeof specs === "object") {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(specs as Record<string, any>)) {
      if (v == null) continue;
      out[k] = Array.isArray(v) ? v.join(", ") : String(v);
    }
    return out;
  }
  return {};
}

// ---- ApiProduct -> UI
type UiProduct = {
  id: string;
  title: string;
  productCode?: string | null;
  price: number | string;
  image: string;
  images: string[];
  description: string;
  category_id: string;
  specifications?: Record<string, string>;
};
function toUiProduct(p: ApiProduct): UiProduct {
  const imgs = (Array.isArray(p.images) ? p.images.filter(Boolean) : null) ?? [];
  const primary = imgs[0] || (p as any).image_url || "";
  return {
    id: String(p.id),
    title: String(p.title ?? ""),
    productCode: (p as any).product_code ?? null,
    price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
    image: primary,
    images: imgs.length ? imgs : (primary ? [primary] : []),
    description: (p as any).description ?? "",
    category_id: String((p as any).category_id ?? ""),
    specifications: normalizeSpecs((p as any).specifications),
  };
}

interface ProductDetailPageProps {
  // Parent halen number gönderiyor; biz numericKey -> realId map’inden çözüyoruz.
  productId: number;
  onNavigate: (page: string) => void;
  onProductDetail?: (productId: number) => void;
}

export function ProductDetailPage({ productId, onNavigate, onProductDetail }: ProductDetailPageProps) {
  // ----- UI state (dokunma, slider, form vs.)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [currentPopularIndex, setCurrentPopularIndex] = useState(0);
  const [currentSimilarIndex, setCurrentSimilarIndex] = useState(0);
  const [similarTouchStart, setSimilarTouchStart] = useState(0);
  const [similarTouchEnd, setSimilarTouchEnd] = useState(0);
  const [isSimilarAutoPlaying, setIsSimilarAutoPlaying] = useState(true);

  const [formData, setFormData] = useState({ name: "", phone: "", cemetery: "", email: "", message: "" });

  const itemsPerView = { mobile: 1, tablet: 2, desktop: 4 } as const;

  // ----- Müşteri yorumları (statik)
  const customerReviews = useMemo(
    () => [
      { id: 1, name: "Mehmet KARATAŞ", location: "İhlamurkuyu Mezarlığı", rating: 5, comment: "Çok kaliteli işçilik ve malzeme kullanılmış. Personel ilgiliydi." },
      { id: 2, name: "Ayşe YILMAZ", location: "Zincirlikuyu Mezarlığı", rating: 5, comment: "Zamanında teslim, güzel işçilik. Memnun kaldık." },
      { id: 3, name: "Ali DEMİR", location: "Karacaahmet Mezarlığı", rating: 5, comment: "Profesyonel hizmet ve uygun fiyat." },
    ],
    []
  );

  // ----- Numeric -> real id/slug çöz
  const mappedId = readRealId(productId);
  const shouldUseListFallback = !mappedId && Number.isFinite(productId);

  // Liste fallback
  const { data: fallbackList } = useListProductsQuery(undefined, {
    skip: !shouldUseListFallback,
  });

  const resolvedIdOrSlug = useMemo(() => {
    if (mappedId) return mappedId;
    if (shouldUseListFallback && Array.isArray(fallbackList)) {
      const idx = Number(productId);
      const hit = (fallbackList as any[])[idx];
      if (hit?.id) return String(hit.id);
      if (hit?.slug) return String(hit.slug);
    }
    return "";
  }, [mappedId, shouldUseListFallback, fallbackList, productId]);

  const { data: detailData } = useGetProductQuery(resolvedIdOrSlug, {
    skip: !resolvedIdOrSlug,
  });

  useEffect(() => {
    if (!mappedId && resolvedIdOrSlug) {
      saveIdMapping(resolvedIdOrSlug);
    }
  }, [mappedId, resolvedIdOrSlug]);

  const product = useMemo(() => (detailData ? toUiProduct(detailData) : null), [detailData]);

  // ----- Popüler: rating desc
  const { data: popularRes } = useListProductsQuery({ is_active: 1, sort: "rating", order: "desc", limit: 8 });
  const popularProducts = useMemo(() => (Array.isArray(popularRes) ? popularRes.map(toUiProduct) : []), [popularRes]);

  // ----- Benzer: aynı kategori (ürün geldikten sonra)
  const { data: similarRes } = useListProductsQuery(
    product ? { is_active: 1, category_id: product.category_id, limit: 24 } : undefined,
    { skip: !product }
  );
  const similarProducts = useMemo(() => {
    const arr = Array.isArray(similarRes) ? similarRes.map(toUiProduct) : [];
    return product ? arr.filter((p) => p.id !== product.id).slice(0, 8) : [];
  }, [similarRes, product]);

  // ----- Autoplay (yorumlar)
  useEffect(() => {
    if (!isAutoPlaying || customerReviews.length === 0) return;
    const t = setInterval(() => setCurrentReviewIndex((i) => (i + 1) % customerReviews.length), 5000);
    return () => clearInterval(t);
  }, [isAutoPlaying, customerReviews.length]);

  // ----- Autoplay (benzer)
  useEffect(() => {
    if (!isSimilarAutoPlaying || similarProducts.length === 0) return;
    const t = setInterval(() => {
      const max = Math.max(0, Math.ceil(similarProducts.length / itemsPerView.desktop) - 1);
      setCurrentSimilarIndex((i) => (i >= max ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(t);
  }, [isSimilarAutoPlaying, similarProducts.length, itemsPerView.desktop]);

  // ----- Touch handlers (yorumlar) — TS2532 safe
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches?.[0]?.clientX ?? 0);
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches?.[0]?.clientX ?? 0);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50) setCurrentReviewIndex((i) => (i + 1) % customerReviews.length);
    if (dist < -50) setCurrentReviewIndex((i) => (i - 1 + customerReviews.length) % customerReviews.length);
  };

  // ----- Touch handlers (benzer) — TS2532 safe
  const onSimilarStart = (e: React.TouchEvent) => setSimilarTouchStart(e.targetTouches?.[0]?.clientX ?? 0);
  const onSimilarMove = (e: React.TouchEvent) => setSimilarTouchEnd(e.targetTouches?.[0]?.clientX ?? 0);
  const onSimilarEnd = () => {
    if (!similarTouchStart || !similarTouchEnd) return;
    const dist = similarTouchStart - similarTouchEnd;
    if (dist > 50) nextSimilar();
    if (dist < -50) prevSimilar();
  };

  const nextPopular = () => {
    if (!popularProducts.length) return;
    setCurrentPopularIndex((i) => (i + 1) % popularProducts.length);
  };
  const prevPopular = () => {
    if (!popularProducts.length) return;
    setCurrentPopularIndex((i) => (i - 1 + popularProducts.length) % popularProducts.length);
  };

  const nextSimilar = () => {
    const max = Math.max(0, Math.ceil(similarProducts.length / itemsPerView.desktop) - 1);
    setCurrentSimilarIndex((i) => Math.min(i + 1, max));
  };
  const prevSimilar = () => setCurrentSimilarIndex((i) => Math.max(i - 1, 0));

  // ----- Detay navigasyon (mapping)
  const goDetailByRealId = (realId: string) => {
    const key = saveIdMapping(realId);
    onProductDetail?.(key);
  };

  const handlePopularClick = () => {
    const item = popularProducts[currentPopularIndex];
    if (item?.id) goDetailByRealId(item.id);
  };
  const handleSimilarClick = (id: string) => goDetailByRealId(id);

  // ----- Form
  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Talebiniz alındı! En kısa sürede size dönüş yapacağız.");
    setFormData({ name: "", phone: "", cemetery: "", email: "", message: "" });
  };

  // ----- Ürün bulunamadı
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ürün bulunamadı</h2>
          <Button onClick={() => onNavigate("home")} className="bg-teal-500 hover:bg-teal-600">Ana Sayfaya Dön</Button>
        </div>
      </div>
    );
  }

  const images = product.images.length ? product.images : (product.image ? [product.image] : []);
  const specs = (product.specifications ?? {}) as Record<string, string>;

  // ---- TS-safe: gösterilecek ana anahtarlar ve etiketleri
  const SPEC_MAIN_KEYS = [
    "dimensions",
    "weight",
    "thickness",
    "surfaceFinish",
    "warranty",
    "installationTime",
  ] as const;
  type SpecKey = typeof SPEC_MAIN_KEYS[number];
  const SPEC_LABELS: Record<SpecKey, string> = {
    dimensions: "Boyutlar",
    weight: "Ağırlık",
    thickness: "Kalınlık",
    surfaceFinish: "Yüzey İşlemi",
    warranty: "Garanti",
    installationTime: "Kurulum Süresi",
  };
  const hasSpecs =
    Object.values(specs).some((v) => (v ?? "").toString().trim().length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => onNavigate("home")} className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Ana Sayfa
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 font-semibold">Mezar Modelleri</span>
            <span className="text-gray-400">/</span>
            {/* ID fallback kaldırıldı; ürün kodu varsa göster, yoksa başlığı yaz */}
            <span className="text-gray-800 font-bold">{product.productCode || product.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden shadow-lg">
              <ImageWithFallback
                src={images[currentImageIndex] ?? ""}
                alt={`${product.title} - Görsel ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={`${product.id}-${idx}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? "border-teal-500 ring-2 ring-teal-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <ImageWithFallback src={img} alt={`${product.title} küçük görsel ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                {Math.max(1, images.length)} fotoğraf mevcut
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                {product.productCode && (
                  <Badge variant="outline" className="text-teal-600 border-teal-600 mb-3 font-bold">
                    {product.productCode}
                  </Badge>
                )}
                <h1 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">{product.title}</h1>
              </div>

              <div className="mb-4">
                <div className="inline-flex items-center bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Ürün Satış Fiyatı:
                </div>
              </div>

              <div className="mb-6">
                <div className="inline-flex items-center justify-center bg-white border-4 border-black rounded-full px-8 py-4 shadow-lg">
                  <span className="text-4xl font-bold text-teal-600">
                    {typeof product.price === "number" ? product.price.toLocaleString("tr-TR") : String(product.price)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ürün Açıklaması</h3>
              <p className="text-gray-700 font-semibold leading-snug">{product.description}</p>
            </div>

            {hasSpecs && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Teknik Özellikler</h3>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <div className="space-y-3">
                    {SPEC_MAIN_KEYS.map((k) => {
                      const v = (specs as Record<string, string>)[k];
                      return v ? (
                        <div className="flex items-start gap-3" key={k}>
                          <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-800 font-semibold leading-tight">
                            <strong>{SPEC_LABELS[k]}:</strong> {v}
                          </span>
                        </div>
                      ) : null;
                    })}

                    {Object.entries(specs)
                      .filter(([k]) => !(SPEC_MAIN_KEYS as readonly string[]).includes(k))
                      .map(([k, v]) => (
                        <div className="flex items-start gap-3" key={k}>
                          <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-800 font-semibold leading-tight">
                            <strong>{k}:</strong> {String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accordions */}
        <div className="mt-8 lg:mt-16 bg-white rounded-lg shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {/* Reviews */}
            <AccordionItem value="reviews" className="border-b border-gray-200">
              <AccordionTrigger className="bg-teal-600 text-white px-6 py-4 hover:bg-teal-700 text-left">
                <span className="text-lg font-bold flex items-center gap-2">⭐ Müşterilerimizden Gelen Görüşler</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-white accordion-content-reviews">
                <div className="relative overflow-hidden">
                  <div
                    className="relative touch-manipulation select-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                  >
                    <div className="overflow-hidden rounded-xl">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentReviewIndex * 100}%)`, width: `${customerReviews.length * 100}%` }}
                      >
                        {customerReviews.map((review) => (
                          <div key={review.id} className="w-full flex-shrink-0" style={{ width: `${100 / customerReviews.length}%` }}>
                            <div className="bg-gradient-to-br from-teal-50 to-white rounded-lg p-3 md:p-4 shadow-sm border border-teal-100 mx-1">
                              <div className="text-center mb-3">
                                <div className="w-12 h-12 mx-auto mb-2 bg-teal-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white text-base font-bold">{review.name.charAt(0)}</span>
                                </div>
                                <h4 className="text-base font-bold text-teal-600 mb-1">{review.name}</h4>
                                <p className="text-xs text-gray-600 mb-2 flex items-center justify-center gap-1">
                                  <span>📍</span>
                                  {review.location}
                                </p>
                                <div className="flex justify-center mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current mx-0.5" />
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                <div className="text-teal-600 text-2xl mb-1 text-center opacity-50">"</div>
                                <p className="text-gray-700 text-center leading-relaxed text-sm italic">{review.comment}</p>
                                <div className="text-teal-600 text-2xl mt-1 text-center rotate-180 opacity-50">"</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <Button variant="outline" size="sm" onClick={() => setCurrentReviewIndex((i) => (i - 1 + customerReviews.length) % customerReviews.length)} className="border-teal-500 text-teal-600 hover:bg-teal-50 text-xs px-2 py-1">
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Önceki
                    </Button>
                    <div className="flex items-center gap-1">
                      {customerReviews.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentReviewIndex(idx)}
                          className={`transition-all duration-300 rounded-full ${idx === currentReviewIndex ? "w-6 h-2 bg-teal-500" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
                          aria-label={`${idx + 1}. yoruma git`}
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentReviewIndex((i) => (i + 1) % customerReviews.length)} className="border-teal-500 text-teal-600 hover:bg-teal-50 text-xs px-2 py-1">
                      Sonraki
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">
                      {currentReviewIndex + 1} / {customerReviews.length} müşteri yorumu
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* İletişim */}
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
                      <Button onClick={() => window.open("tel:+905334838971")} className="w-full bg-teal-500 hover:bg-teal-600 text-white">📞 Hemen Ara</Button>
                      <Button onClick={() => window.open("https://wa.me/905334838971", "_blank")} className="w-full bg-green-500 hover:bg-green-600 text-white">💬 WhatsApp'tan Yaz</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-teal-600 mb-4">Detaylı Bilgi Formu</h4>
                    <form onSubmit={onSubmit} className="space-y-4">
                      <Input type="text" name="name" placeholder="Adınız Soyadınız" value={formData.name} onChange={onInput} />
                      <Input type="tel" name="phone" placeholder="Telefon Numaranız" value={formData.phone} onChange={onInput} />
                      <Input type="text" name="cemetery" placeholder="Mezarlık Adı" value={formData.cemetery} onChange={onInput} />
                      <Input type="email" name="email" placeholder="E-posta Adresiniz (Opsiyonel)" value={formData.email} onChange={onInput} />
                      <Textarea name="message" placeholder="Mesajınız ve özel istekleriniz..." value={formData.message} onChange={onInput} rows={4} />
                      <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white">📧 Bilgi Talep Et</Button>
                    </form>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* DİĞER KONULAR (Popüler) */}
            <AccordionItem value="popular" className="border-b-0">
              <AccordionTrigger className="bg-teal-600 text-white px-6 py-4 hover:bg-teal-700 text-left">
                <span className="text-lg font-bold">DİĞER KONULAR</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white accordion-content-limited">
                <div className="relative">
                  <div className="bg-gray-50 rounded-lg p-6">
                    {popularProducts.length > 0 && (
                      <div className="text-center">
                        <div className="mb-4">
                          <ImageWithFallback
                            src={popularProducts[currentPopularIndex]?.image ?? ""}
                            alt={popularProducts[currentPopularIndex]?.title ?? "Ürün"}
                            className="w-40 h-32 object-cover rounded-lg mx-auto shadow-md"
                          />
                        </div>
                        <h4 className="text-lg font-bold text-teal-600 mb-2">
                          {popularProducts[currentPopularIndex]?.title ?? ""}
                        </h4>
                        <p className="text-2xl font-bold text-gray-800 mb-4">
                          {typeof popularProducts[currentPopularIndex]?.price === "number"
                            ? (popularProducts[currentPopularIndex]?.price as number).toLocaleString("tr-TR")
                            : String(popularProducts[currentPopularIndex]?.price ?? "")}
                        </p>
                        <Button onClick={handlePopularClick} className="bg-teal-500 hover:bg-teal-600 text-white">
                          Detaylı İncele
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                      <Button variant="outline" size="sm" onClick={prevPopular}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex space-x-2">
                        {popularProducts.map((_, idx) => (
                          <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentPopularIndex ? "bg-teal-500" : "bg-gray-300"}`} />
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

        {/* Fiyat İçin Arayınız */}
        <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 md:p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">🔥 Özel Fiyat İçin Hemen Arayın! 🔥</h3>
            <p className="text-lg md:text-xl mb-6 opacity-90">Bu ürün için en uygun fiyatı almak ve detaylı bilgi için hemen bizimle iletişime geçin.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button onClick={() => window.open("tel:+905334838971")} className="bg-white text-teal-600 hover:bg-gray-100 font-bold px-8 py-3 text-lg">📞 0533 483 89 71</Button>
              <Button onClick={() => window.open("https://wa.me/905334838971", "_blank")} className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 text-lg">💬 WhatsApp</Button>
            </div>
          </div>
        </div>

        {/* Benzer Ürünler */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Benzer Ürünler</h2>
            <p className="text-gray-600">Size uygun diğer mezar modelleri</p>
          </div>

          <div className="relative">
            <div
              className="overflow-hidden"
              onTouchStart={onSimilarStart}
              onTouchMove={onSimilarMove}
              onTouchEnd={onSimilarEnd}
              onMouseEnter={() => setIsSimilarAutoPlaying(false)}
              onMouseLeave={() => setIsSimilarAutoPlaying(true)}
            >
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSimilarIndex * (100 / itemsPerView.desktop)}%)` }}>
                {similarProducts.map((sp) => (
                  <div key={sp.id} className="flex-none w-full sm:w-1/2 lg:w-1/4 px-3" style={{ minWidth: "0" }}>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full" onClick={() => handleSimilarClick(sp.id)}>
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <ImageWithFallback src={sp.image} alt={sp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                        <h3 className="font-bold text-gray-800 mb-3 text-sm leading-tight min-h-[2.5rem] line-clamp-2">{sp.title}</h3>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-teal-600 font-bold text-lg">
                            {typeof sp.price === "number" ? sp.price.toLocaleString("tr-TR") : String(sp.price)}
                          </span>
                          {/* ID/UUID gösterimi kaldırıldı */}
                        </div>
                        <Button
                          className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2.5 rounded-lg transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimilarClick(sp.id);
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

            <button
              onClick={prevSimilar}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-teal-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group"
              aria-label="Önceki ürünler"
            >
              <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={nextSimilar}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-teal-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group"
              aria-label="Sonraki ürünler"
            >
              <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.max(1, Math.ceil(similarProducts.length / itemsPerView.desktop)) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSimilarIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    Math.floor(currentSimilarIndex / itemsPerView.desktop) === idx ? "w-8 h-3 bg-teal-500" : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`${idx + 1}. ürün grubuna git`}
                />
              ))}
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                {similarProducts.length} benzer ürün • {Math.floor(currentSimilarIndex / itemsPerView.desktop) + 1} /{" "}
                {Math.max(1, Math.ceil(similarProducts.length / itemsPerView.desktop))} grup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
