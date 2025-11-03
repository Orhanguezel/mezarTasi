import { Button } from "../ui/button";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface RamadanCampaignPageProps {
  onNavigate: (page: string) => void;
}

export function RamadanCampaignPage({ onNavigate }: RamadanCampaignPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          onClick={() => onNavigate("home")}
          variant="outline"
          className="mb-6 flex items-center gap-2 hover:bg-teal-50 border-teal-500 text-teal-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Button>

        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          <div className="relative h-64 md:h-80">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1594968973184-9040a5a79963?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNjb3VudCUyMHNhbGUlMjBwZXJjZW50YWdlfGVufDF8fHx8MTc1NjA3MTEzNnww&ixlib=rb-4.1.0&q=80&w=800&h=400&fit=crop&crop=center"
              alt="Ramazan Ayı Özel İndirim Kampanyası"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <span className="bg-teal-500 px-3 py-1 rounded-full text-sm font-semibold">Kampanya</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Meta Info */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Mart 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Kampanya</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Ramazan Ayı Özel İndirim Kampanyası
            </h1>

            {/* Content */}
            <div className="prose max-w-none space-y-6">
              <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded">
                <h2 className="text-xl font-semibold text-teal-700 mb-3">
                  🌙 Ramazan Ayı Boyunca %20 İndirim Fırsatı!
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Bu mübarek Ramazan ayında, tüm mezar yapım hizmetlerimizde özel indirim kampanyamız başladı.
                  Mermer ve granit mezar modelleri, mezar baş taşları ve tüm yapım hizmetlerinde geçerli olan
                  bu kampanya sınırlı sürelidir.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Kampanya Kapsamı</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      Tek kişilik mermer mezar modelleri
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      İki kişilik mermer mezar modelleri
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      Granit mezar modelleri
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      Mezar baş taşları
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      İşçilik ve montaj hizmetleri
                    </li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Kampanya Şartları</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Kampanya Ramazan ayı boyunca geçerlidir
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Peşin ödemede geçerlidir
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Diğer kampanyalarla birleştirilemez
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Minimum 5.000 TL tutarında siparişlerde geçerli
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Sözleşme imzalanması gerekir
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🕐 Kampanya Süresi</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Bu özel kampanya <strong>Ramazan ayı başlangıcından itibaren ay sonuna kadar</strong> geçerlidir.
                  Bu fırsatı kaçırmamak için hemen bizimle iletişime geçin ve ücretsiz keşif hizmetinden yararlanın.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open("tel:+905334838971")}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    Hemen Ara: 0533 483 89 71
                  </Button>
                  <Button
                    onClick={() => window.open("https://wa.me/905334838971?text=Ramazan%20kampanyası%20hakkında%20bilgi%20almak%20istiyorum")}
                    variant="outline"
                    className="border-teal-500 text-teal-600 hover:bg-teal-50"
                  >
                    WhatsApp ile İletişim
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Önemli Uyarı</h3>
                <p className="text-yellow-700 leading-relaxed">
                  Kampanya kapsamında verilen indirimler sadece Ramazan ayı boyunca geçerlidir.
                  Ay sonundan sonra yapılacak başvurular normal fiyatlandırma ile değerlendirilecektir.
                  Detaylı bilgi ve fiyat teklifi için lütfen bizimle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button
            onClick={() => onNavigate("models")}
            variant="outline"
            className="h-auto p-4 text-left border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Mezar Modelleri</h4>
              <p className="text-sm text-gray-600">Tüm mezar modellerimizi inceleyin</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("pricing")}
            variant="outline"
            className="h-auto p-4 text-left border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Fiyat Listesi</h4>
              <p className="text-sm text-gray-600">Güncel fiyatları görüntüleyin</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("contact")}
            variant="outline"
            className="h-auto p-4 text-left border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            <div>
              <h4 className="font-semibold mb-1">İletişim</h4>
              <p className="text-sm text-gray-600">Bizimle iletişime geçin</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}