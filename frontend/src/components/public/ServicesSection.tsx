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

import {
  useListReviewsQuery,
  useCreateReviewMutation,
} from "@/integrations/metahub/rtk/endpoints/reviews.endpoints";
import {
  useListRecentWorksQuery,
} from "@/integrations/metahub/rtk/endpoints/recent_works.endpoints";
import {
  useListSimpleCampaignsQuery,
} from "@/integrations/metahub/rtk/endpoints/campaigns.endpoints";
import {
  useListAnnouncementsQuery,
} from "@/integrations/metahub/rtk/endpoints/announcements.endpoints";

import type { ReviewCreateInput } from "@/integrations/metahub/db/types/reviews";
import type { RecentWorkView } from "@/integrations/metahub/db/types/recent_works";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop";

function pickImageUrl(x: unknown): string | undefined {
  if (!x) return;
  if (typeof x === "string") return x;
  const o = x as Record<string, any>;
  const cands = [
    o.image_effective_url,
    o.image_url,
    o.public_url,
    o.url,
    o.src,
    o.path,
    o.file_url,
    o.asset?.url,
    o.storage_asset?.public_url,
  ];
  return cands.find((v) => typeof v === "string" && v.trim());
}

/** Duyuru için slug/uuid/id/_id öncelik sırası ile **string** id üretir */
function resolveAnnouncementId(a: any): string | undefined {
  if (a == null) return;
  if (typeof a === "string" || typeof a === "number") return String(a).trim() || undefined;
  if (typeof a === "object") {
    const cand = a.slug ?? a.uuid ?? a.id ?? a._id ?? a.ID;
    return cand != null ? String(cand).trim() || undefined : undefined;
  }
  return;
}

type Props = {
  onNavigate?: (page: string) => void;
  /** RecentWork modalı için **id/slug** gönder */
  onOpenRecentWorkModal?: (payload: { id: string; slug?: string }) => void;
  /** Kampanya detay modalı */
  onOpenCampaignsModal?: (payload?: any) => void;
  /** Duyuru detay modalı (kampanya modalından ayrı) */
  onOpenAnnouncementModal?: (payload?: any) => void;
};

export function ServicesSection({
  onOpenRecentWorkModal,
  onOpenCampaignsModal,
  onOpenAnnouncementModal,
}: Props = {}) {
  /* -------- RTK DATA (yalnız RTK, fallback yok) -------- */
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

  const { data: campRtk = [], isLoading: loadingCamps, isError: errorCamps } =
    useListSimpleCampaignsQuery();

  const { data: annRtk = [], isLoading: loadingAnns, isError: errorAnns } =
    useListAnnouncementsQuery();

  /* -------- MAP’LER -------- */
  const recentWorks = Array.isArray(rwRtk) ? (rwRtk as RecentWorkView[]) : [];

  const campaignsUi =
    Array.isArray(campRtk)
      ? campRtk.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description ?? "",
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : (c.date ?? ""),
          type: c.tag ?? "Kampanya",
          image: pickImageUrl(c.images?.[0]) || PLACEHOLDER,
        }))
      : [];

  const announcementsUi =
    Array.isArray(annRtk)
      ? annRtk.map((a: any) => ({
          id: a.id,
          slug: a.slug,            // 🔹 event tıklamasında fallback
          uuid: a.uuid,            // 🔹 event tıklamasında fallback
          title: a.title,
          date: a.published_at
            ? new Date(a.published_at).toLocaleDateString()
            : a.created_at
            ? new Date(a.created_at).toLocaleDateString()
            : "",
          html: a.html as string | undefined,
          image: pickImageUrl(a.images?.[0]) || a.image || a.cover_image || PLACEHOLDER,
        }))
      : [];

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

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

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

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* ============ SOL SÜTUN ============ */}
          <div className="order-2 lg:order-1 space-y-8">
            {/* Son Çalışmalar (RTK) */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">
                SON ÇALIŞMALARIMIZ
              </h2>

              {loadingRW && <div className="text-center text-sm text-gray-500">Yükleniyor…</div>}
              {errorRW && <div className="text-center text-sm text-red-600">Çalışmalar yüklenemedi.</div>}
              {!loadingRW && !errorRW && recentWorks.length === 0 && (
                <div className="text-center text-sm text-gray-500">Henüz çalışma bulunmuyor.</div>
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
                          // 🔑 Modal’a her zaman gerçek id/slug gönder
                          onOpenRecentWorkModal({ id: String(w.id), slug: w.slug });
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

            {/* === Yorum Formu / Başarı mesajı === */}
            {reviewSubmitted && (
              <div className="bg-teal-50 p-6 rounded-lg text-center">
                <div className="text-teal-600 text-4xl mb-3">✓</div>
                <h3 className="text-lg mb-2 text-teal-600">Teşekkür Ederiz!</h3>
                <p className="text-gray-600 text-sm">Görüşünüz başarıyla alındı.</p>
              </div>
            )}

            {showReviewForm && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg mb-4 text-teal-600 text-center">Yorumunuzu Paylaşın</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={reviewData.name}
                    onChange={(e) => setReviewData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Adınız Soyadınız"
                    required
                  />
                  <Input
                    type="email"
                    value={reviewData.email}
                    onChange={(e) => setReviewData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="E-posta Adresiniz"
                    required
                  />
                  <div className="flex justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData((p) => ({ ...p, rating: star }))}
                        className={`text-xl transition-colors ${star <= reviewData.rating ? "text-yellow-400" : "text-gray-300"}`}
                        aria-label={`${star} yıldız`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Hizmetlerimiz hakkındaki görüşlerinizi paylaşın…"
                    rows={3}
                    required
                  />
                  <div className="flex space-x-3">
                    <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={sending}>
                      {sending ? "Gönderiliyor..." : "Gönder"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1" disabled={sending}>
                      İptal
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Müşteri Görüşleri */}
            <div>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl text-teal-600 font-semibold">MÜŞTERİLERİMİZDEN GELEN GÖRÜŞLER</h2>
                {!showReviewForm && !reviewSubmitted && (
                  <Button onClick={() => setShowReviewForm(true)} className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4">
                    Yorum Gönder
                  </Button>
                )}
              </div>

              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="text-sm text-slate-600">
                  Ortalama: <b className="text-teal-700">{avg || "—"}</b>
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({reviews.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loadingReviews && <div className="text-gray-500 text-sm">Yükleniyor…</div>}
                {errorReviews && (
                  <div className="text-red-600 text-sm">
                    Yorumlar yüklenemedi. <button onClick={() => refetchReviews()} className="underline">Tekrar dene</button>
                  </div>
                )}
                {!loadingReviews && !errorReviews && reviews.length === 0 && (
                  <div className="bg-white rounded-lg border p-6 text-sm text-gray-600">Henüz yorum bulunmuyor.</div>
                )}
                {reviews.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-2 font-semibold text-teal-700">{r.name}</div>
                    <div className="flex items-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-5 h-5 ${star <= (r.rating ?? 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============ SAĞ SÜTUN ============ */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* DUYURULAR */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">DUYURULAR</h2>

              {loadingAnns && <div className="text-sm text-gray-500 text-center">Yükleniyor…</div>}
              {errorAnns && <div className="text-sm text-red-600 text-center">Duyurular yüklenemedi.</div>}
              {!loadingAnns && !errorAnns && announcementsUi.length === 0 && (
                <div className="text-sm text-gray-500 text-center">Duyuru bulunmuyor.</div>
              )}

              {!loadingAnns && !errorAnns && announcementsUi.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  {announcementsUi.map((a: any) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        if (!onOpenAnnouncementModal) {
                          toast.info("Duyuru modalı bağlanmamış görünüyor.");
                          return;
                        }
                        const id = resolveAnnouncementId(a);
                        onOpenAnnouncementModal(id ?? a); // öncelik string id
                      }}
                      className="bg-gradient-to-r from-teal-50 to-green-50 p-4 md:p-5 rounded-lg border-l-4 border-teal-500 cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">Duyuru</span>
                        {a.date && <span className="text-xs text-gray-500">{a.date}</span>}
                      </div>

                      <h4 className="text-sm md:text-base mb-1 text-teal-700 font-semibold leading-tight">{a.title}</h4>
                      <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                        {(a.html || "").replace(/<[^>]+>/g, " ").trim().slice(0, 160) || "Detay için tıklayın."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KAMPANYALAR */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">KAMPANYALAR</h2>

              {loadingCamps && <div className="text-sm text-gray-500 text-center">Yükleniyor…</div>}
              {errorCamps && <div className="text-sm text-red-600 text-center">Kampanyalar yüklenemedi.</div>}
              {!loadingCamps && !errorCamps && campaignsUi.length === 0 && (
                <div className="text-sm text-gray-500 text-center">Aktif kampanya bulunmuyor.</div>
              )}

              {!loadingCamps && !errorCamps && campaignsUi.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  {campaignsUi.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => onOpenCampaignsModal?.(a)}
                      className="bg-gradient-to-r from-teal-50 to-green-50 p-4 md:p-5 rounded-lg border-l-4 border-teal-500 cursor-pointer hover:shadow-lg hover:scale-105 transform transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">{a.type}</span>
                        <span className="text-xs text-gray-500">{a.date}</span>
                      </div>

                      <div className="flex space-x-3 md:space-x-4 items-start">
                        <ImageWithFallback
                          src={a.image}
                          alt={a.title}
                          className="w-16 h-12 md:w-20 md:h-15 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base mb-2 text-teal-700 font-semibold leading-tight">{a.title}</h4>
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{a.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fiyat garantisi */}
            <div className="text-center">
              <h2 className="text-lg md:text-xl mb-4 md:mb-6 text-teal-600 leading-tight">
                MEZAR YAPIMI VE HİZMETLERİNDE EN UYGUN FİYAT GARANTİSİ!
              </h2>
              <div className="bg-teal-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6">
                <p className="text-sm md:text-base leading-relaxed">
                  Mezar fiyatları konusunda endişe etmeyin! 25 yıllık deneyimle granit/mermer için uygun fiyat garantisi.
                </p>
              </div>
            </div>
          </div>
          {/* sağ sütun */}
        </div>
      </div>
    </section>
  );
}
