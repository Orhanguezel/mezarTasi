import { ImageWithFallback } from "../figma/ImageWithFallback";
import backgroundImage from 'figma:asset/2756699d70cd757056d783eb9a7f34264d5bc04d.png';
import qualityImage from 'figma:asset/86ac622a937f78742905aa1b265687cf5a66c70f.png';

interface QualityPolicyPageProps {
  onNavigate: (page: string) => void;
}

export function QualityPolicyPage({ onNavigate }: QualityPolicyPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero section with green background */}
      <div
        className="relative bg-teal-500 py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-teal-500 bg-opacity-90"></div>
        <div className="relative container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <nav className="flex items-center space-x-2 text-sm mb-4">
                <button
                  onClick={() => onNavigate("home")}
                  className="hover:text-teal-200 transition-colors"
                >
                  Anasayfa
                </button>
                <span>&gt;</span>
                <span>Kalite Politikamız</span>
              </nav>
              <h1 className="text-4xl mb-2">KALİTE POLİTİKAMIZ</h1>
              <p className="text-lg opacity-90">Anasayfa &gt; Kalite Politikamız</p>
            </div>

            {/* 3D Gear Illustration */}
            <div className="hidden lg:block">
              <div className="w-48 h-32 flex items-center justify-center">
                <div className="relative">
                  {/* Main gear */}
                  <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-white rounded-full"></div>
                  </div>
                  {/* Gear teeth */}
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-4 bg-white"
                        style={{
                          top: '50%',
                          left: '50%',
                          transformOrigin: '50% 0',
                          transform: `translate(-50%, -40px) rotate(${i * 45}deg)`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-teal-500 mb-4">KALİTE POLİTİKAMIZ</h2>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                <strong>İstanbul'da mezar yapımı sektöründe kalite lideri</strong> olarak, <em>25 yıllık deneyimimizle</em> müşterilerimize <strong>A+ kalite garantisi</strong> sunuyoruz
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left content */}
              <div className="lg:w-2/3">
                <div className="space-y-8 text-gray-700 leading-relaxed">

                  {/* Main quality policy */}
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl border-l-4 border-teal-500 shadow-lg">
                    <h3 className="text-2xl text-teal-600 mb-6 flex items-center">
                      <span className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center mr-4 text-white">🏆</span>
                      Mezar Yapımında Kalite Anlayışımız
                    </h3>

                    <div className="space-y-5">
                      <p>
                        <strong>İstanbul'da mezar yapımı konusunda sektörün en güvenilir firması</strong> olarak, <em>kaliteli mezar inşaatı, mermer mezar taşı yapımı, granit mezar taşı üretimi</em> ve <strong>mezar bakım hizmetlerinde</strong> asla taviz vermediğimiz standartlarımız bulunmaktadır. <strong>Tek kişilik mezar, iki kişilik mezar, aile mezarı</strong> projelerinde <em>İstanbul Büyükşehir Belediyesi normlarına uygun</em> kaliteli işçilik garantisi veriyoruz.
                      </p>

                      <p>
                        <strong>Mezar yapım kalitemiz</strong>, kullandığımız <em>A+ sınıf mermer, granit, traverten</em> malzemelerden başlayarak, <strong>profesyonel mezar ustalarımızın</strong> deneyimi ile devam eder. <em>Mezar onarımı, mezar restorasyonu, mezar çiçeklendirme</em> ve <strong>mezar toprak doldurumu</strong> hizmetlerimizde de aynı kalite standardını koruyoruz.
                      </p>

                      <p>
                        <strong>Uygun fiyat mezar yapımı</strong> sunarken kaliteden asla ödün vermeyiz. <em>Karaca Ahmet, Zincirlikuyu, Eyüp Sultan, Edirnekapı</em> mezarlıklarında gerçekleştirdiğimiz tüm projelerimiz <strong>5 yıl işçilik garantisi</strong> ile teslim edilir. <em>Modern mezar tasarımı, klasik mezar modelleri</em> ve özel tasarım projelerimizde <strong>mükemmellik standardı</strong> hedefliyoruz.
                      </p>
                    </div>
                  </div>

                  {/* Quality control process */}
                  <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl text-blue-600 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 text-white text-sm">🔍</span>
                      Mezar Yapım Kalite Kontrol Sürecimiz
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">1</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Malzeme Kalite Kontrolü</h4>
                            <p className="text-xs text-gray-600"><strong>A+ sınıf mermer ve granit</strong> seçimi, dayanıklılık testleri</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">2</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Ölçüm ve Planlama</h4>
                            <p className="text-xs text-gray-600"><strong>Ücretsiz keşif</strong>, teknik çizim ve <em>İBB standartları</em> kontrolü</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">3</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">İşçilik Kalitesi</h4>
                            <p className="text-xs text-gray-600"><strong>25+ yıl deneyimli ustalar</strong>, profesyonel araç-gereç kullanımı</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">4</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Montaj ve Uygulama</h4>
                            <p className="text-xs text-gray-600"><strong>Hassas montaj</strong>, estetik detaylar ve <em>dayanıklılık</em> odaklı kurulum</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">5</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Final Kontrolü</h4>
                            <p className="text-xs text-gray-600"><strong>Teslim öncesi kalite</strong> kontrolü, <em>müşteri memnuniyet</em> onayı</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-3 text-white text-xs mt-1">6</span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Garanti ve Takip</h4>
                            <p className="text-xs text-gray-600"><strong>5 yıl garanti</strong>, ��cretsiz bakım kontrolü ve <em>7/24 destek</em></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Quality principles */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl text-teal-600 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3 text-white text-sm">📋</span>
                      İstanbul Mezar Yapımında Kalite İlkelerimiz
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Müşteri Memnuniyeti Garantisi</h4>
                            <p className="text-xs text-gray-600"><strong>%98 müşteri memnuniyeti</strong> oranı ile <em>mezar yapımında</em> güvenilir hizmet</p>
                          </div>
                        </div>
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">A+ Kalite Malzeme Kullanımı</h4>
                            <p className="text-xs text-gray-600"><strong>Mermer, granit, traverten</strong> seçiminde <em>kaliteden taviz yok</em></p>
                          </div>
                        </div>
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Zamanında Teslimat Garantisi</h4>
                            <p className="text-xs text-gray-600"><strong>%95 zamanında teslimat</strong> oranı, <em>söz verdiğimiz tarihte</em> teslim</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Sürekli Gelişim ve İnovasyon</h4>
                            <p className="text-xs text-gray-600"><strong>Modern mezar tasarımları</strong> ve <em>teknolojik yenilikler</em> takibi</p>
                          </div>
                        </div>
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Çevre Dostu Mezar Yapımı</h4>
                            <p className="text-xs text-gray-600"><strong>Sürdürülebilir malzeme</strong> kullanımı ve <em>doğa dostu</em> üretim</p>
                          </div>
                        </div>
                        <div className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                          <span className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-1 mr-3 flex-shrink-0"></span>
                          <div>
                            <h4 className="text-sm text-gray-900 mb-1">Profesyonel Ekip Çalışması</h4>
                            <p className="text-xs text-gray-600"><strong>25+ yıl deneyimli ustalar</strong>, <em>takım halinde</em> mükemmel sonuç</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Commitment statement */}
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-8 rounded-xl shadow-lg">
                    <div className="flex items-center mb-4">
                      <span className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 text-2xl">🤝</span>
                      <h3 className="text-xl">Kalite Taahhüdümüz</h3>
                    </div>
                    <div className="space-y-4">
                      <p>
                        <strong>İstanbul'da mezar yapımı konusunda sektör lideri</strong> olarak, <em>kalite standartlarımızı sürekli yükseltmeyi</em>, müşterilerimizin beklentilerini karşılamayı ve aşmayı taahhüt ediyoruz. <strong>Her mezar projemizde mükemmellik</strong> arayışımız devam etmektedir.
                      </p>
                      <p>
                        <em>Tek kişilik mezar, iki kişilik mezar, aile mezarı</em> ve özel tasarım projelerimizde <strong>5 yıl işçilik garantisi</strong> veriyor, <em>ücretsiz bakım kontrolü</em> ile hizmetimizi sürdürüyoruz. <strong>Mezarlarınızın kalitesi bizim gururumuz</strong>dur.
                      </p>
                    </div>

                    {/* Quality metrics */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white border-opacity-30">
                      <div className="text-center">
                        <div className="text-2xl mb-1">98%</div>
                        <div className="text-xs opacity-90">Müşteri Memnuniyeti</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">5 Yıl</div>
                        <div className="text-xs opacity-90">İşçilik Garantisi</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">25+</div>
                        <div className="text-xs opacity-90">Yıl Deneyim</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar with enhanced content */}
              <div className="lg:w-1/3">
                <div className="sticky top-8">
                  <ImageWithFallback
                    src={qualityImage}
                    alt="Kaliteli beyaz mermer mezar yapımı örneği - A+ malzeme işçilik kalitesi"
                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                  />



                  {/* Enhanced statistics box */}
                  <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-lg mt-6">
                    <h3 className="text-lg mb-4 text-gray-800 flex items-center">
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 text-white text-xs">📊</span>
                      Mezar Yapım Kalite Metrikleri
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-700">Müşteri Memnuniyeti</span>
                          <div className="text-xs text-gray-500">İstanbul mezar yapımı</div>
                        </div>
                        <span className="text-xl text-teal-600">98%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-700">Zamanında Teslimat</span>
                          <div className="text-xs text-gray-500">Söz verdiğimiz tarih</div>
                        </div>
                        <span className="text-xl text-blue-600">95%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-700">Kalite Kontrolü</span>
                          <div className="text-xs text-gray-500">Her proje kontrol</div>
                        </div>
                        <span className="text-xl text-green-600">100%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-700">Sektör Deneyimi</span>
                          <div className="text-xs text-gray-500">Mezar yapımı tecrübesi</div>
                        </div>
                        <span className="text-xl text-purple-600">25+ Yıl</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-700">Garanti S��resi</span>
                          <div className="text-xs text-gray-500">Tüm işçilik garantili</div>
                        </div>
                        <span className="text-xl text-orange-600">5 Yıl</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced contact CTA */}
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-lg mt-6">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🛡️</span>
                      </div>
                      <h3 className="text-lg mb-2">5 Yıl Kalite Garantisi</h3>
                      <p className="text-sm opacity-90">
                        <strong>İstanbul mezar yapımında</strong> tüm işlerimizde <em>kalite garantisi</em> veriyoruz
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => window.open("tel:+905334838971")}
                        className="w-full bg-white text-orange-600 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <span>📞</span> <strong>Kalite Garantili Teklif</strong>
                      </button>

                      <button
                        onClick={() => {
                          const whatsappMessage = "Merhaba, kalite garantili mezar yapım hizmeti hakkında bilgi almak istiyorum.";
                          window.open(`https://wa.me/905334838971?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <span>💬</span> <strong>WhatsApp ile Bilgi Al</strong>
                      </button>

                      <button
                        onClick={() => onNavigate("contact")}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <span>📋</span> <strong>Detaylı Bilgi</strong>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white border-opacity-30 text-center">
                      <p className="text-xs opacity-75">
                        💎 <strong>A+ Kalite Malzeme</strong> • ⚡ <strong>Hızlı Teslimat</strong> • 🏆 <strong>25 Yıl Deneyim</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}