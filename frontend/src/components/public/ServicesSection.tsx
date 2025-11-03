import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Star } from "lucide-react";
import commentImage from 'figma:asset/2266554e915e59c2351e0a5a257271da502d6e95.png';
import { useKeywords, useCampaigns } from '../../contexts/DataContext';
import { RecentWork, recentWorksData } from '../../data/recentWorksData';

interface ServicesSectionProps {
  onNavigate?: (page: string) => void;
  onOpenRecentWorkModal?: (work: RecentWork) => void;
  onOpenCampaignsModal?: (campaign?: any) => void;
}

// Son çalışmalar ve kampanya verileri Context'ten geliyor

export function ServicesSection({ onNavigate, onOpenRecentWorkModal, onOpenCampaignsModal }: ServicesSectionProps = {}) {
  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: ""
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Context'ten verileri al
  const { keywords } = useKeywords();
  const { campaigns } = useCampaigns();

  // Keywords'dan recent works'leri oluştur - RecentWork interface'ine uygun format
  const contextRecentWorks = keywords.filter(k => k.status === 'Active').map(keyword => ({
    id: keyword.id.toString(),
    title: keyword.text.split(' / ')[0] || keyword.text, // İlk anahtar kelimeyi başlık yap
    description: keyword.text,
    category: "Mezar Yapım İşleri", // Default kategori
    keywords: keyword.text.split(' / ').filter(k => k.trim()), // Anahtar kelimeleri ayır
    images: keyword.images.length > 0 ? keyword.images : ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
    date: "2024",
    location: "İstanbul",
    material: "Mermer ve Granit",
    price: "Uygun fiyat seçenekleri",
    details: {
      dimensions: "Çeşitli boyutlar",
      workTime: "2-5 gün",
      specialFeatures: ["Kaliteli malzeme", "Profesyonel işçilik", "Hızlı teslimat"],
      customerReview: "Müşteri memnuniyeti odaklı hizmet."
    }
  }));

  // Context'ten veri yoksa statik data kullan, aksi halde Context'ten gelen veriyi kullan
  const recentWorks = contextRecentWorks.length > 0 ? contextRecentWorks.slice(0, 3) : recentWorksData.slice(0, 3);

  // Campaigns'dan announcements'leri oluştur
  const announcements = campaigns.filter(c => c.isActive).map(campaign => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    date: campaign.date,
    type: campaign.tag,
    image: campaign.images[0] || 'https://images.unsplash.com/photo-1594968973184-9040a5a79963?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNjb3VudCUyMHNhbGUlMjBwZXJjZW50YWdlfGVufDF8fHx8MTc1NjA3MTEzNnww&ixlib=rb-4.1.0&q=80&w=150&h=100&fit=crop&crop=center'
  }));

  const handleRatingClick = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Yorum gönderildi:", reviewData);
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setShowReviewForm(false);
      setReviewData({ name: "", email: "", rating: 5, comment: "" });
    }, 3000);
  };

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Sol Taraf - Recent Works + Customer Reviews */}
          <div className="order-2 lg:order-1 space-y-8">
            {/* Recent Works */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">SON ÇALIŞMALARIMIZ</h2>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {recentWorks.map((work) => (
                  <div
                    key={work.id}
                    className="flex space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      console.log('🔍 Recent work clicked:', work);
                      onOpenRecentWorkModal && onOpenRecentWorkModal(work);
                    }}
                  >
                    <ImageWithFallback
                      src={work.images[0]}
                      alt={work.title}
                      className="w-16 h-12 md:w-20 md:h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm md:text-base mb-1 leading-tight text-teal-600 hover:text-teal-700">{work.title}</h4>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2">{work.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews */}
            <div>
              {reviewSubmitted ? (
                <div className="bg-teal-50 p-6 rounded-lg text-center">
                  <div className="text-teal-600 text-4xl mb-3">✓</div>
                  <h3 className="text-lg mb-2 text-teal-600">Teşekkür Ederiz!</h3>
                  <p className="text-gray-600 text-sm">
                    Görüşünüz başarıyla alındı. Değerli yorumunuz için teşekkür ederiz.
                  </p>
                </div>
              ) : showReviewForm ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg mb-4 text-teal-600 text-center">Yorumunuzu Paylaşın</h3>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        value={reviewData.name}
                        onChange={(e) => setReviewData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Adınız Soyadınız"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Input
                        type="email"
                        value={reviewData.email}
                        onChange={(e) => setReviewData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="E-posta Adresiniz"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            className={`text-xl transition-colors ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Hizmetlerimiz hakkındaki görüşlerinizi paylaşın..."
                        rows={3}
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Gönder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1"
                      >
                        İptal
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {/* Minimal Header Görseli */}
                  <div className="mb-4">
                    <img
                      src={commentImage}
                      alt="Yaptığımız hizmetleri değerlendirmek için yorum gönder"
                      className="w-full h-auto rounded-lg shadow-sm"
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
            </div>

            {/* Müşterilerden Gelen Görüşler */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">MÜŞTERİLERİMİZDEN GELEN GÖRÜŞLER</h2>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-teal-600 mb-1">
                    Mehmet KARATAŞ - Ihlamurkuyu Mezarlığı
                  </h4>

                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  "Uygun fiyatları ve yüksek hizmet kalitesi ile beni çok memnun bıraktılar.
                  İşlerine verdikleri önem bizi çok sevindirdi. Çalışanlarının disiplinli,
                  bize gösterdikleri tutumları ve sürekli bilgilendirmiş olmalarımız epey
                  güçlendirdi. Hepinize teşekkür ederim."
                </p>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Announcements and Services */}
          <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
            {/* Duyuru/Kampanyalar */}
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-6 md:mb-8 text-teal-600 font-semibold">DUYURU / KAMPANYALAR</h2>
              <div className="space-y-3 md:space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => onOpenCampaignsModal && onOpenCampaignsModal(announcement)}
                    className="bg-gradient-to-r from-teal-50 to-green-50 p-4 md:p-5 rounded-lg border-l-4 border-teal-500 cursor-pointer hover:shadow-lg hover:scale-105 transform transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        {announcement.type}
                      </span>
                      <span className="text-xs text-gray-500">{announcement.date}</span>
                    </div>

                    {/* Görsel ve Metin Bölümü */}
                    <div className="flex space-x-3 md:space-x-4 items-start">
                      <ImageWithFallback
                        src={announcement.image}
                        alt={announcement.title}
                        className="w-16 h-12 md:w-20 md:h-15 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm md:text-base mb-2 text-teal-700 font-semibold leading-tight">{announcement.title}</h4>
                        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{announcement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fiyat Garantisi */}
            <div className="text-center">
              <h2 className="text-lg md:text-xl mb-4 md:mb-6 text-teal-600 leading-tight">MEZAR YAPIMI VE HİZMETLERİNDE EN UYGUN FİYAT GARANTİSİ!</h2>
              <div className="bg-teal-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6">
                <p className="text-sm md:text-base leading-relaxed">
                  Mezar fiyatları konusunda endişe etmeyin! Mezar yapımı alanında 25 yıllık deneyimimizle,
                  mermer mezar modelleri ve granit mezar modelleri için en uygun fiyat garantisi sunuyoruz.
                  Ucuz mezar yapımı arayanlar için kaliteli malzeme ve profesyonel işçilik bir arada.
                  Tüm mezar modellerimizde uygun fiyat, yüksek kalite ve uzun garantiyle hizmetinizdeyiz!
                </p>
              </div>

              {/* İkonlar */}
              <div className="flex justify-center items-center space-x-4 md:space-x-8">
                <div className="text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                    <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold leading-tight">Hesaplı</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                    <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold leading-tight">Kaliteli</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-teal-500 rounded-full flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                    <svg className="w-6 h-6 md:w-8 md:h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold leading-tight text-center">Zamanında<br />Teslimat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}