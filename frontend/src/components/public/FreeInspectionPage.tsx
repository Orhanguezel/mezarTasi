import { Button } from "../ui/button";
import { Calendar, Tag, ArrowLeft, MapPin, CheckCircle, Clock } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface FreeInspectionPageProps {
  onNavigate: (page: string) => void;
}

export function FreeInspectionPage({ onNavigate }: FreeInspectionPageProps) {
  const serviceAreas = [
    "Üsküdar", "Kadıköy", "Kartal", "Maltepe", "Pendik", "Tuzla", "Çekmeköy",
    "Sancaktepe", "Sultanbeyli", "Şile", "Beykoz", "Ümraniye", "Ataşehir",
    "Samandıra", "Kavacık", "Aydos", "Ağva"
  ];

  const inspectionSteps = [
    {
      step: "1",
      title: "Randevu Alın",
      description: "Telefon veya WhatsApp ile iletişime geçin, uygun tarihi belirleyin"
    },
    {
      step: "2",
      title: "Keşif Ziyareti",
      description: "Uzman ekibimiz mezarlığa gelerek ölçüm ve inceleme yapar"
    },
    {
      step: "3",
      title: "Teknik Rapor",
      description: "Zemin durumu, ölçüler ve uygun model önerilerini içeren rapor hazırlanır"
    },
    {
      step: "4",
      title: "Fiyat Teklifi",
      description: "Detaylı fiyat teklifi ve çalışma takvimi sunulur"
    }
  ];

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
              src="https://images.unsplash.com/photo-1672684089414-7174386a1fd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJibGUlMjBzdG9uZSUyMGNlbWV0ZXJ5fGVufDF8fHx8MTc1NjA3MTEzNnww&ixlib=rb-4.1.0&q=80&w=800&h=400&fit=crop&crop=center"
              alt="Ücretsiz Keşif Hizmeti - Mezarlık Ziyareti"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">Hizmet</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Meta Info */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Şubat 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Hizmet</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              İstanbul Anadolu Yakası Ücretsiz Keşif Hizmeti
            </h1>

            {/* Content */}
            <div className="prose max-w-none space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                <h2 className="text-xl font-semibold text-green-700 mb-3">
                  🆓 Tamamen Ücretsiz Keşif ve Ölçüm
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  İstanbul Anadolu yakası tüm mezarlıklarında profesyonel keşif ve ölçüm hizmeti
                  sunuyoruz. Uzman ekibimiz, mezarlığa gelerek zemin analizi, ölçüm işlemleri ve
                  teknik değerlendirme yapar. Bu hizmet tamamen ücretsizdir ve herhangi bir
                  yükümlülük getirmez.
                </p>
              </div>

              {/* Service Process */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Keşif Süreci Nasıl İşler?</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {inspectionSteps.map((step, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {step.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                          <p className="text-gray-600 text-sm">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-green-600" />
                  Hizmet Verdiğimiz Bölgeler
                </h3>
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">İstanbul Anadolu yakasındaki tüm mezarlıklarda hizmet veriyoruz:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {serviceAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Keşif Hizmeti Kapsamı
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Mezar yerinin detaylı ölçümü
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Zemin yapısının analizi
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Mevcut durumun fotoğraflanması
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Uygun model önerilerinin sunulması
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Teknik rapor hazırlanması
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Detaylı fiyat teklifinin verilmesi
                    </li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Hızlı ve Pratik
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      24 saat içinde randevu
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Keşif işlemi 30-45 dakika
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Aynı gün fiyat teklifi
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Hafta sonu da hizmet
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Uzman ekip ile çalışma
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Yükümlülük getirmez
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📞 Ücretsiz Keşif İçin Randevu Alın</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Mezar yapımı konusunda en doğru kararı verebilmeniz için profesyonel keşif hizmetimizden
                  yararlanın. Uzman ekibimiz size en uygun çözümü sunar ve detaylı bilgi verir.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open("tel:+905334838971")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Randevu Al: 0533 483 89 71
                  </Button>
                  <Button
                    onClick={() => window.open("https://wa.me/905334838971?text=Ücretsiz%20keşif%20hizmeti%20için%20randevu%20almak%20istiyorum")}
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    WhatsApp ile Randevu
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Önemli Bilgi</h3>
                <p className="text-blue-700 leading-relaxed">
                  Keşif hizmetimiz tamamen ücretsizdir ve herhangi bir yükümlülük getirmez.
                  Teklif aldıktan sonra düşünme süreniz olacak ve istediğiniz zaman
                  bizimle çalışmaya karar verebilirsiniz. Amacımız size en iyi hizmeti sunmaktır.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button
            onClick={() => onNavigate("cemeteries")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Mezarlık Listesi</h4>
              <p className="text-sm text-gray-600">İstanbul mezarlıklarının listesi</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("models")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Mezar Modelleri</h4>
              <p className="text-sm text-gray-600">Tüm mezar modellerimizi inceleyin</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("pricing")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Fiyat Listesi</h4>
              <p className="text-sm text-gray-600">Güncel fiyatları görüntüleyin</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}