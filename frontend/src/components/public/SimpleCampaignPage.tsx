import { useEffect, useState } from "react";
import { ArrowLeft, Tag, Phone } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ImageOptimized } from "./ImageOptimized";
import { getSimpleCampaignById, SimpleCampaignData } from "../../data/pageContent";

interface SimpleCampaignPageProps {
  onNavigate: (page: string) => void;
  campaignId: string;
}

export function SimpleCampaignPage({
  onNavigate,
  campaignId
}: SimpleCampaignPageProps) {
  const [campaignData, setCampaignData] = useState<SimpleCampaignData | null>(null);

  // İlk useEffect - campaignData'yı getir
  useEffect(() => {
    const data = getSimpleCampaignById(campaignId);
    setCampaignData(data || null);
  }, [campaignId]);

  // İkinci useEffect - SEO güncelleme (her zaman çalışmalı)
  useEffect(() => {
    if (!campaignData) return;

    const { title, seoKeywords } = campaignData;
    document.title = `${title} - Mezarisim.com`;

    // Meta description güncelle
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${title} - ${seoKeywords.slice(0, 3).join(', ')} için özel fırsatlar. İstanbul'da mezar yapımı hizmetleri.`);
    }

    // Meta keywords ekle/güncelle
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', seoKeywords.join(', '));

    return () => {
      // Cleanup
      document.title = "Mezarisim.com - İstanbul Mezar Yapımı";
    };
  }, [campaignData]); // campaignData'ya dependency olarak eklendi

  // Early return - hooks'ların altında
  if (!campaignData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Kampanya Bulunamadı</h1>
          <Button onClick={() => onNavigate("home")} className="bg-teal-500 hover:bg-teal-600">
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const { title, images, seoKeywords, description } = campaignData;

  const handleCall = () => {
    window.location.href = "tel:+905334838971";
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Merhaba, ${title} hakkında bilgi almak istiyorum.`);
    window.open(`https://wa.me/905334838971?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate("home")}
            className="mb-4 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            <ArrowLeft size={20} className="mr-2" />
            Ana Sayfaya Dön
          </Button>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* SEO Keywords Display */}
        <Card className="mb-8 bg-teal-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Tag className="text-teal-600 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-teal-800">Anahtar Kelimeler</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {seoKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium border border-teal-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Images Gallery */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Kampanya Görselleri
            </h3>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.slice(0, 5).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-teal-300 transition-colors duration-200 group"
                  >
                    <ImageOptimized
                      src={image}
                      alt={`${title} görsel ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={index < 2}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Henüz görsel eklenmemiş</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                🎉 Özel Kampanya Fırsatı!
              </h3>
              <p className="text-teal-100 mb-6 text-lg">
                Bu kampanya hakkında detaylı bilgi almak ve özel fiyat teklifi için hemen iletişime geçin.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleCall}
                  size="lg"
                  className="bg-white text-teal-600 hover:bg-gray-100 transition-colors min-w-[200px]"
                >
                  <Phone size={20} className="mr-2" />
                  📞 0533 483 89 71
                </Button>

                <Button
                  onClick={handleWhatsApp}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-teal-600 transition-colors min-w-[200px]"
                >
                  💬 WhatsApp'tan Yazın
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-teal-400">
                <p className="text-teal-100 text-sm">
                  <strong>Çalışma Saatleri:</strong> Pazartesi - Cumartesi: 09:00 - 18:00 | Pazar: 10:00 - 16:00
                </p>
                <p className="text-teal-100 text-sm mt-1">
                  <strong>Acil Durumlar:</strong> 7/24 hizmet veriyoruz
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-md border border-gray-200">
            <span className="text-gray-600 text-sm">
              ⭐ 25+ yıllık deneyim • ✅ Garantili işçilik • 🚚 Ücretsiz nakliye
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}