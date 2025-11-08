// =============================================================
// FILE: src/components/public/ServicesSection.tsx
// =============================================================
"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";

import { useKeywords, useCampaigns } from "@/contexts/DataContext";
import { RecentWork, recentWorksData } from "@/data/recentWorksData";

import {
  useListReviewsQuery,
  useCreateReviewMutation,
} from "@/integrations/metahub/rtk/endpoints/reviews.endpoints";
import { useListRecentWorksQuery } from "@/integrations/metahub/rtk/endpoints/recent_works.endpoints";
import { useListSimpleCampaignsQuery } from "@/integrations/metahub/rtk/endpoints/campaigns.endpoints";
import { useListAnnouncementsQuery } from "@/integrations/metahub/rtk/endpoints/announcements.endpoints";

import type { ReviewCreateInput } from "@/integrations/metahub/db/types/reviews";

/* helpers */
const excerptFromHtml = (html?: string, len = 160) => {
  const text = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > len ? text.slice(0, len) + "…" : text;
};

type Props = {
  onNavigate?: (page: string) => void;
  onOpenRecentWorkModal?: (work: RecentWork) => void;
  onOpenCampaignsModal?: (payload?: any) => void;
};

export function ServicesSection({
  onOpenRecentWorkModal,
  onOpenCampaignsModal,
}: Props = {}) {
  /* ---------------- RTK DATA ---------------- */
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

  const { data: rwRtk = [] } = useListRecentWorksQuery(undefined);

  // kampanyalar
  const { data: campRtk = [], isLoading: loadingCamps } =
    useListSimpleCampaignsQuery(undefined);

  // duyurular
  const { data: annRtk = [], isLoading: loadingAnns } =
    useListAnnouncementsQuery();

  /* ---------------- FALLBACKS ---------------- */
  const { keywords } = useKeywords();
  const { campaigns } = useCampaigns();

  const contextRecentWorks: RecentWork[] = keywords
    .filter((k) => k.status === "Active")
    .map((k) => ({
      id: String(k.id),
      title: k.text.split(" / ")[0] || k.text,
      description: k.text,
      category: "Mezar Yapım İşleri",
      keywords: k.text.split(" / ").filter(Boolean),
      images:
        k.images.length > 0
          ? k.images
          : ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"],
      date: "2024",
      location: "İstanbul",
      material: "Mermer ve Granit",
      price: "Uygun fiyat seçenekleri",
      details: {
        dimensions: "Çeşitli boyutlar",
        workTime: "2-5 gün",
        specialFeatures: ["Kaliteli malzeme", "Profesyonel işçilik", "Hızlı teslimat"],
        customerReview: "Müşteri memnuniyeti odaklı hizmet.",
      },
    }));

  const recentWorksFromRtk: RecentWork[] = rwRtk.map((r: any) => ({
    id: String(r.id),
    title: r.title,
    description: r.description ?? "",
    category: r.category ?? "Çalışma",
    keywords: r.seo_keywords ?? [],
    images:
      Array.isArray(r.images) && r.images.length
        ? r.images
        : ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"],
    date: (r.year as string) || "",
    location: r.location ?? "",
    material: "",
    price: "",
    details: { dimensions: "", workTime: "", specialFeatures: [], customerReview: "" },
  }));

  const recentWorks: RecentWork[] =
    (recentWorksFromRtk.length ? recentWorksFromRtk : contextRecentWorks).slice(0, 3) ||
    recentWorksData.slice(0, 3);

  // kampanyaları UI kartına indirgeme (fallback: context campaigns)
  const campaignsUi =
    (campRtk.length ? campRtk : campaigns).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      date: c.created_at ? new Date(c.created_at).toLocaleDateString() : c.date,
      type: c.tag ?? "Kampanya",
      image:
        (Array.isArray(c.images) && c.images[0]) ||
        "https://images.unsplash.com/photo-1594968973184-9040a5a79963?w=150&h=100&fit=crop&crop=center",
    }));

  // duyuruları UI kartına indirgeme
  const announcementsUi = annRtk.map((a: any) => ({
    id: a.id,
    title: a.title,
    date:
      a.published_at
        ? new Date(a.published_at).toLocaleDateString()
        : a.created_at
        ? new Date(a.created_at).toLocaleDateString()
        : "",
    html: a.html as string | undefined,
    // olası görsel alanları kaba kontrol
    image:
      (Array.isArray(a.images) && a.images[0]) ||
      a.image ||
      a.cover_image ||
      "",
  }));

  /* ---------------- FORM STATE ---------------- */
  const [createReview, { isLoading: sending }] = useCreateReviewMutation();

  const [reviewData, setReviewData] = useState<ReviewCreateInput>({
    name: "",
    email: "",
    rating: 5,
    comment: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleRatingClick = (rating: number) =>
    setReviewData((prev) => ({ ...prev, rating }));

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData.name.trim() || !reviewData.email.trim() || !reviewData.comment.trim()) {
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

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* ============ SOL SÜTUN ============ */}
          <div className="order-2 lg:order-1 space-y-8">
            {/* Son Çalışmalar */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">
                SON ÇALIŞMALARIMIZ
              </h2>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {recentWorks.map((work) => (
                  <div
                    key={work.id}
                    className="flex space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onOpenRecentWorkModal?.(work)}
                  >
                    <ImageWithFallback
                      src={work.images[0]}
                      alt={work.title}
                      className="w-16 h-12 md:w-20 md:h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm md:text-base mb-1 leading-tight text-teal-600 hover:text-teal-700">
                        {work.title}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {work.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* === Yorum Formu (yalnızca açıkken) / Başarı mesajı === */}
            {reviewSubmitted && (
              <div className="bg-teal-50 p-6 rounded-lg text-center">
                <div className="text-teal-600 text-4xl mb-3">✓</div>
                <h3 className="text-lg mb-2 text-teal-600">Teşekkür Ederiz!</h3>
                <p className="text-gray-600 text-sm">
                  Görüşünüz başarıyla alındı. Değerli yorumunuz için teşekkür ederiz.
                </p>
              </div>
            )}

            {showReviewForm && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg mb-4 text-teal-600 text-center">Yorumunuzu Paylaşın</h3>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={reviewData.name}
                    onChange={(e) =>
                      setReviewData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Adınız Soyadınız"
                    required
                  />

                  <Input
                    type="email"
                    value={reviewData.email}
                    onChange={(e) =>
                      setReviewData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="E-posta Adresiniz"
                    required
                  />

                  <div className="flex justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className={`text-xl transition-colors ${
                          star <= reviewData.rating ? "text-yellow-400" : "text-gray-300"
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
                      setReviewData((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    placeholder="Hizmetlerimiz hakkındaki görüşlerinizi paylaşın..."
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

            {/* Müşteri Görüşleri (RTK) */}
            <div>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl text-teal-600 font-semibold">
                  MÜŞTERİLERİMİZDEN GELEN GÖRÜŞLER
                </h2>
                {!showReviewForm && !reviewSubmitted && (
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
                  >
                    Yorum Gönder
                  </Button>
                )}
              </div>

              {/* küçük özet */}
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="text-sm text-slate-600">
                  Ortalama: <b className="text-teal-700">{avg || "—"}</b>
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(avg) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({reviews.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loadingReviews && <div className="text-gray-500 text-sm">Yükleniyor…</div>}
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
                {reviews.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-2 font-semibold text-teal-700">{r.name}</div>
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
                      {r.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============ SAĞ SÜTUN ============ */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* DUYURULAR */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">
                DUYURULAR
              </h2>
              <div className="space-y-3 md:space-y-4">
                {loadingAnns && (
                  <div className="text-sm text-gray-500 text-center">Yükleniyor…</div>
                )}
                {!loadingAnns &&
                  announcementsUi.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onOpenCampaignsModal?.(a)}
                      className="bg-gradient-to-r from-teal-50 to-green-50 p-4 md:p-5 rounded-lg border-l-4 border-teal-500 cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          Duyuru
                        </span>
                        {a.date && <span className="text-xs text-gray-500">{a.date}</span>}
                      </div>

                      <h4 className="text-sm md:text-base mb-1 text-teal-700 font-semibold leading-tight">
                        {a.title}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                        {excerptFromHtml(a.html, 160)}
                      </p>
                    </div>
                  ))}
                {!loadingAnns && announcementsUi.length === 0 && (
                  <div className="text-sm text-gray-500 text-center">Duyuru bulunmuyor.</div>
                )}
              </div>
            </div>

            {/* KAMPANYALAR */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">
                KAMPANYALAR
              </h2>
              <div className="space-y-3 md:space-y-4">
                {loadingCamps && (
                  <div className="text-sm text-gray-500 text-center">Yükleniyor…</div>
                )}
                {!loadingCamps &&
                  campaignsUi.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onOpenCampaignsModal?.(a)}
                      className="bg-gradient-to-r from-teal-50 to-green-50 p-4 md:p-5 rounded-lg border-l-4 border-teal-500 cursor-pointer hover:shadow-lg hover:scale-105 transform transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          {a.type}
                        </span>
                        <span className="text-xs text-gray-500">{a.date}</span>
                      </div>

                      <div className="flex space-x-3 md:space-x-4 items-start">
                        <ImageWithFallback
                          src={a.image}
                          alt={a.title}
                          className="w-16 h-12 md:w-20 md:h-15 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base mb-2 text-teal-700 font-semibold leading-tight">
                            {a.title}
                          </h4>
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                            {a.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                {!loadingCamps && campaignsUi.length === 0 && (
                  <div className="text-sm text-gray-500 text-center">
                    Aktif kampanya bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            {/* Fiyat garantisi */}
            <div className="text-center">
              <h2 className="text-lg md:text-xl mb-4 md:mb-6 text-teal-600 leading-tight">
                MEZAR YAPIMI VE HİZMETLERİNDE EN UYGUN FİYAT GARANTİSİ!
              </h2>
              <div className="bg-teal-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6">
                <p className="text-sm md:text-base leading-relaxed">
                  Mezar fiyatları konusunda endişe etmeyin! Mezar yapımı alanında 25 yıllık
                  deneyimimizle, mermer ve granit mezar modelleri için uygun fiyat garantisi sunuyoruz…
                </p>
              </div>

              <div className="flex justify-center items-center space-x-4 md:space-x-8">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs md:text-sm font-semibold leading-tight">Hesaplı</span>
                </div>
                <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span className="text-xs md:text-sm font-semibold leading-tight">Kaliteli</span>
                </div>
                <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                  <span className="text-xs md:text-sm font-semibold leading-tight text-center">
                    Zamanında<br />Teslimat
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* sağ sütun */}
        </div>
      </div>
    </section>
  );
}
