import { Button } from "../ui/button";
import { Calendar, Tag, ArrowLeft, Flower, Droplets, Brush, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface SummerCareServicePageProps {
  onNavigate: (page: string) => void;
}

export function SummerCareServicePage({ onNavigate }: SummerCareServicePageProps) {
  const careServices = [
    {
      icon: Brush,
      title: "Mezar Temizliği",
      description: "Mezar taşı ve çevresinin profesyonel temizlenmesi",
      features: ["Mezar taşı parlatma", "Yosun ve kir temizliği", "Çevre düzenleme"]
    },
    {
      icon: Flower,
      title: "Çiçeklendirme",
      description: "Mevsimlik çiçek ekimi ve düzenleme",
      features: ["Mevsimlik çiçek seçimi", "Toprak hazırlama", "Düzenli bakım"]
    },
    {
      icon: Droplets,
      title: "Sulama Sistemi",
      description: "Otomatik sulama sisteminin kurulumu ve bakımı",
      features: ["Damla sulama sistemi", "Zamanlayıcı kurulum", "Su tasarrufu"]
    }
  ];

  const servicePackages = [
    {
      name: "Temel Bakım Paketi",
      price: "800 TL",
      duration: "3 ay",
      services: ["Aylık temizlik", "Çiçek dikimi", "Temel bakım"],
      popular: false
    },
    {
      name: "Tam Bakım Paketi",
      price: "1.400 TL",
      duration: "6 ay",
      services: ["2 haftada bir temizlik", "Mevsimlik çiçek", "Sulama sistemi", "Fotoğraf raporu"],
      popular: true
    },
    {
      name: "Premium Bakım Paketi",
      price: "2.200 TL",
      duration: "12 ay",
      services: ["Haftalık kontrol", "Lüks çiçek düzenleme", "Otomatik sulama", "Aylık fotoğraf raporu", "7/24 destek"],
      popular: false
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
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXJzJTIwY2VtZXRlcnklMjBjYXJlJTIwc2VydmljZXxlbnwxfHx8fDE3NTYwNzExMzZ8MA&ixlib=rb-4.1.0&q=80&w=800&h=400&fit=crop&crop=center"
              alt="Yaz Ayları Mezar Bakım Hizmeti - Çiçeklendirme ve Temizlik"
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
                <span>Mayıs 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Hizmet</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Yaz Ayları Mezar Bakım Hizmeti
            </h1>

            {/* Content */}
            <div className="prose max-w-none space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                <h2 className="text-xl font-semibold text-green-700 mb-3">
                  🌸 Sevdiklerinizin Anısına Özel Bakım
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Yaz aylarında artan sıcaklık ve nem ile birlikte mezarların bakım ihtiyacı da artmaktadır.
                  Profesyonel mezar bakım hizmetimiz ile sevdiklerinizin mezarları her zaman temiz,
                  düzenli ve çiçeklerle donatılmış olarak kalır. 25 yıllık deneyimimizle,
                  en iyi bakım hizmetini sunuyoruz.
                </p>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Hizmet Kapsamımız</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {careServices.map((service, index) => {
                    const IconComponent = service.icon;
                    return (
                      <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-3">{service.title}</h4>
                        <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                        <ul className="space-y-1">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Packages */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Bakım Paketlerimiz</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {servicePackages.map((pkg, index) => (
                    <div key={index} className={`relative bg-white border-2 rounded-lg p-6 ${pkg.popular ? 'border-green-500 shadow-lg' : 'border-gray-200'
                      }`}>
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            En Popüler
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{pkg.name}</h4>
                        <div className="text-3xl font-bold text-green-600 mb-1">{pkg.price}</div>
                        <div className="text-sm text-gray-600">{pkg.duration}</div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {pkg.services.map((service, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{service}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => window.open("tel:+905334838971")}
                        className={`w-full ${pkg.popular
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-500 hover:bg-gray-600'
                          } text-white`}
                      >
                        Paket Seç
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Flower className="w-5 h-5 text-green-500" />
                    Yaz Aylarında Özel Dikkat
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Sıcaklığa dayanıklı çiçek seçimi
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Düzenli sulama ve nem kontrolü
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Güneş ışığından koruma
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Böcek ve hastalık kontrolü
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Toprak gübreleme
                    </li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    Hizmet Avantajları
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Profesyonel ekip ve ekipman
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Düzenli fotoğraf raporlama
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Esnek ziyaret saatleri
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      İhtiyaca özel çözümler
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Güvenilir ve düzenli hizmet
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📞 Mezar Bakım Hizmeti için İletişim</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Sevdiklerinizin mezarlarının en iyi şekilde bakımını istiyorsanız,
                  profesyonel ekibimizle iletişime geçin. Size özel bakım paketini belirleyerek
                  düzenli hizmet sunmaya başlayalım.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open("tel:+905334838971")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Hemen Ara: 0533 483 89 71
                  </Button>
                  <Button
                    onClick={() => window.open("https://wa.me/905334838971?text=Mezar%20bakım%20hizmeti%20hakkında%20bilgi%20almak%20istiyorum")}
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    WhatsApp ile İletişim
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">🌟 Özel Notlar</h3>
                <p className="text-yellow-700 leading-relaxed">
                  Yaz aylarında mezar bakımı daha sık yapılması gereken önemli bir konudur.
                  Hava şartlarına göre ziyaret sıklığı ayarlanabilir. Acil durumlar için
                  7/24 iletişim hattımız aktiftir. Hizmetlerimiz tüm mezarlıklarda geçerlidir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button
            onClick={() => onNavigate("gardening")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Mezar Çiçeklendirme</h4>
              <p className="text-sm text-gray-600">Çiçeklendirme hizmetlerimiz</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("contact")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">İletişim</h4>
              <p className="text-sm text-gray-600">Bizimle iletişime geçin</p>
            </div>
          </Button>
          <Button
            onClick={() => onNavigate("pricing")}
            variant="outline"
            className="h-auto p-4 text-left border-green-500 text-green-600 hover:bg-green-50"
          >
            <div>
              <h4 className="font-semibold mb-1">Fiyat Listesi</h4>
              <p className="text-sm text-gray-600">Bakım paket fiyatları</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}