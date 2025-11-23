// =============================================================
// FILE: src/components/public/homepage/HomeLeftColumn.tsx
// =============================================================

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";

import {
  useListReviewsQuery,
  useCreateReviewMutation,
} from "@/integrations/rtk/endpoints/reviews.endpoints";
import { useListRecentWorksQuery } from "@/integrations/rtk/endpoints/recent_works.endpoints";

import type { ReviewCreateInput } from "@/integrations/rtk/types/reviews";
import type { RecentWorkView } from "@/integrations/rtk/types/recent_works";

import { pickImageUrl, PLACEHOLDER } from "./homepageUtils";

// 👉 Slider için shadcn carousel
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../ui/carousel";

const COMMENT_IMAGE = "/calluns.avif";

type Props = {
  // exactOptionalPropertyTypes için: | undefined ekliyoruz
  onOpenRecentWorkModal?:
    | ((payload: { id: string; slug?: string }) => void)
    | undefined;
};

export function HomeLeftColumn({ onOpenRecentWorkModal }: Props) {
  /* -------- RTK DATA -------- */
  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: errorReviews,
    refetch: refetchReviews,
  } = useListReviewsQuery({
    approved: true,
    active: true,
    orderBy: "display_order",
    order: "asc",
    limit: 6,
    offset: 0,
  });

  const {
    data: rwRtk = [],
    isLoading: loadingRW,
    isError: errorRW,
  } = useListRecentWorksQuery({
    sort: "display_order",
    orderDir: "asc",
    limit: 6,
  });

  const recentWorks = Array.isArray(rwRtk) ? (rwRtk as RecentWorkView[]) : [];

  /* -------- FORM STATE -------- */
  const [createReview, { isLoading: sending }] = useCreateReviewMutation();
  const [reviewData, setReviewData] = useState<ReviewCreateInput>({
    name: "",
    email: "",
    rating: 5,
    comment: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Carousel API (autoplay için)
  const [carouselApi, setCarouselApi] = useState<any>(null);

  // Otomatik kayan slider
  useEffect(() => {
    if (!carouselApi) return;
    if (!reviews || reviews.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000); // 5 sn'de bir sonraki yorum

    return () => clearInterval(interval);
  }, [carouselApi, reviews]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reviewData.name.trim() ||
      !reviewData.email.trim() ||
      !reviewData.comment.trim()
    ) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      await createReview({
        name: reviewData.name.trim(),
        email: reviewData.email.trim(),
        rating: Number(reviewData.rating),
        comment: reviewData.comment.trim(),
      }).unwrap();
      toast.success("Yorumunuz alındı. Onay sonrası listede görünecek.");
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setShowReviewForm(false);
        setReviewData({ name: "", email: "", rating: 5, comment: "" });
        refetchReviews();
      }, 3000);
    } catch {
      toast.error("Gönderim sırasında bir hata oluştu.");
    }
  };

  return (
    <>
      {/* Son Çalışmalar (RTK) */}
      <div>
        <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">
          SON ÇALIŞMALARIMIZ
        </h2>

        {loadingRW && (
          <div className="text-center text-sm text-gray-500">Yükleniyor…</div>
        )}
        {errorRW && (
          <div className="text-center text-sm text-red-600">
            Çalışmalar yüklenemedi.
          </div>
        )}
        {!loadingRW && !errorRW && recentWorks.length === 0 && (
          <div className="text-center text-sm text-gray-500">
            Henüz çalışma bulunmuyor.
          </div>
        )}

        {!loadingRW && !errorRW && recentWorks.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {recentWorks.slice(0, 3).map((w) => {
              const img = pickImageUrl(w) || PLACEHOLDER;
              return (
                <div
                  key={w.id}
                  className="flex space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (!onOpenRecentWorkModal) {
                      toast.info("Detay modalı bağlanmamış görünüyor.");
                      return;
                    }
                    onOpenRecentWorkModal({
                      id: String(w.id),
                      slug: w.slug,
                    });
                  }}
                >
                  <ImageWithFallback
                    src={img}
                    alt={w.alt ?? w.title}
                    className="w-16 h-12 md:w-20 md:h-16 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm md:text-base mb-1 leading-tight text-teal-600 hover:text-teal-700">
                      {w.title}
                    </h4>
                    {w.description && (
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {w.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === Yorum Başarı Mesajı === */}
      {reviewSubmitted && (
        <div className="bg-teal-50 p-6 rounded-lg text-center">
          <div className="text-teal-600 text-4xl mb-3">✓</div>
          <h3 className="text-lg mb-2 text-teal-600">Teşekkür Ederiz!</h3>
          <p className="text-gray-600 text-sm">Görüşünüz başarıyla alındı.</p>
        </div>
      )}

      {/* === Yorum Formu === */}
      {showReviewForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg mb-4 text-teal-600 text-center">
            Yorumunuzu Paylaşın
          </h3>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <Input
              type="text"
              value={reviewData.name}
              onChange={(e) =>
                setReviewData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Adınız Soyadınız"
              required
            />
            <Input
              type="email"
              value={reviewData.email}
              onChange={(e) =>
                setReviewData((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="E-posta Adresiniz"
              required
            />
            <div className="flex justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setReviewData((p) => ({ ...p, rating: star }))
                  }
                  className={`text-xl transition-colors ${
                    star <= reviewData.rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  aria-label={`${star} yıldız`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewData.comment}
              onChange={(e) =>
                setReviewData((p) => ({ ...p, comment: e.target.value }))
              }
              placeholder="Hizmetlerimiz hakkındaki görüşlerinizi paylaşın…"
              rows={3}
              required
            />
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                disabled={sending}
              >
                {sending ? "Gönderiliyor..." : "Gönder"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="flex-1"
                disabled={sending}
              >
                İptal
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* === Görüşleriniz Bizim İçin Değerlidir — Görsel + Yazı (Form açık/başarı yokken) === */}
      {!reviewSubmitted && !showReviewForm && (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="mb-4">
            <img
              src={COMMENT_IMAGE}
              alt="Yaptığımız hizmetleri değerlendirmek için yorum gönder"
              className="w-full h-48 md:h-56 object-cover rounded-lg shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
              }}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="p-6 pt-2">
            <h3 className="text-lg mb-3 text-teal-600 text-center">
              GÖRÜŞLERİNİZ BİZİM İÇİN DEĞERLİDİR
            </h3>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Hizmetlerimiz hakkındaki görüş ve önerilerinizi bizimle paylaşın.
            </p>
            <div className="text-center">
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Yorum Gönder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Görüşleri — SLIDER */}
      <div>
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl text-teal-600 font-semibold">
            MÜŞTERİLERİMİZDEN GELEN GÖRÜŞLER
          </h2>
        </div>

        {loadingReviews && (
          <div className="text-gray-500 text-sm">Yükleniyor…</div>
        )}

        {errorReviews && (
          <div className="text-red-600 text-sm">
            Yorumlar yüklenemedi.{" "}
            <button onClick={() => refetchReviews()} className="underline">
              Tekrar dene
            </button>
          </div>
        )}

        {!loadingReviews && !errorReviews && reviews.length === 0 && (
          <div className="bg-white rounded-lg border p-6 text-sm text-gray-600">
            Henüz yorum bulunmuyor.
          </div>
        )}

        {!loadingReviews && !errorReviews && reviews.length > 0 && (
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {reviews.map((r: any) => (
                <CarouselItem key={r.id} className="basis-full">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-2 font-semibold text-teal-700">
                      {r.name}
                    </div>
                    <div className="flex items-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (r.rating ?? 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                     "{r.comment}"
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </>
  );
}
