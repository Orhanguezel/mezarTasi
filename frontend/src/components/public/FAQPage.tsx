import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import backgroundImage from 'figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png';
import mapImage from 'figma:asset/5dd2bb78e83a89bc4f5cfe9ac82e2cfa7a3ab90c.png';

interface FAQPageProps {
  onNavigate: (page: string) => void;
}

export function FAQPage({ onNavigate }: FAQPageProps) {
  const faqs = [
    {
      question: "Mezar yapımında bize dair bir şüpheniz bulunmasın",
      answer: "25 yılı aşkın tecrübemiz ve binlerce başarılı projemizle İstanbul'da mezar yapımı konusunda güvenilir bir firmayız. Kaliteli malzeme, profesyonel işçilik ve müşteri memnuniyeti garantisi ile hizmet veriyoruz. Tüm işlerimizde İstanbul Büyükşehir Belediyesi standartlarına uygun olarak çalışmaktayız."
    },
    {
      question: "Mezar fiyatları mezar modeline göre değişir mi? Hangi mezar modellerinde fiyat artışı olur?",
      answer: "Evet, mezar fiyatları kullanılan malzeme ve mezar modeline göre değişiklik gösterir. Tek kişilik mermer mezar modelleri daha uygun fiyatlıdır. Granit mezar taşı, özel tasarım mezarlar ve büyük boy aile mezarları fiyat artışına neden olur. Detaylı fiyat bilgisi için bizimle iletişime geçebilirsiniz."
    },
    {
      question: "Mezar yapımı fiyatları hangi durumlarda değişir?",
      answer: "Mezar fiyatları; mezar boyutuna (tek kişilik, çift kişilik), kullanılan malzemeye (mermer, granit, traverten), mezar modelinin karmaşıklığına, özel tasarım isteklerine ve mezarlık lokasyonuna göre değişiklik gösterir. Ayrıca mezar aksesuarları ve özel işlemler de fiyatı etkiler."
    },
    {
      question: "Mezar yapılmak istediğim zaman ne gibi yollara başvurmalıyım?",
      answer: "Öncelikle mezar yapım konusunda araştırma yapmalı, güvenilir firmaları karşılaştırmalısınız. Bizimle iletişime geçerek ücretsiz keşif hizmeti alabilir, mezar modelleri hakkında bilgi edinebilir ve fiyat teklifi talep edebilirsiniz. Sonrasında İstanbul Büyükşehir Belediyesi'nden gerekli izinleri alarak işleme başlayabiliriz."
    },
    {
      question: "Mezar yapımında tercih edilen mezar modelleri nelerdir?",
      answer: "Mezar yapımında en çok tercih edilen modeller: Mermer mezar modelleri (ekonomik ve estetik), Granit mezar modelleri (dayanıklı ve uzun ömürlü), Traverten mezar modelleri (doğal görünüm), Lahit tipi mezarlar (klasik ve ihtişamlı), Modern tasarım mezarlar ve özel yapım mezar modelleridir. Her birinin kendine özgü avantajları bulunmaktadır."
    },
    {
      question: "Mezar yapımı ve mezar işlerinde mezar yerinin inşaat ruhsatını ne zaman çıkartabilirim?",
      answer: "Mezar yapımı için inşaat ruhsatını, cenaze defin işleminden 3 ay sonra İstanbul Büyükşehir Belediyesi'nden çıkartabilirsiniz. Bu süre zorunlu bekleme süresidir. Ruhsat başvurusu sırasında mezar planı, malzeme bilgileri ve teknik çizimler gereklidir. Tüm evrak işlemlerinde size yardımcı olabiliriz."
    },
    {
      question: "Mezar yapımında genellikle hangi mezar modelini tercih edilmektedir?",
      answer: "Mezar yapımında en çok tercih edilen model mermer mezar modelleridir çünkü hem estetik hem de ekonomiktir. Ancak dayanıklılık açısından granit mezar modelleri daha uzun ömürlüdür ve hava koşullarına karşı daha dirençlidir. Son yıllarda modern tasarım mezarlar da oldukça popülerdir. Tercih tamamen bütçe ve kişisel beğeniye bağlıdır."
    },
    {
      question: "Mezar yapımında mezarı lahit mezar olarak yaptırmam uygun olur mu?",
      answer: "Lahit tipi mezar modeli klasik ve ihtişamlı bir görünüm sunar. Ancak lahit mezar yapımı için İstanbul Büyükşehir Belediyesi'nden özel izin almanız ve ruhsat başvurusu sırasında bu tercihinizi belirtmeniz gerekmektedir. Lahit mezarlar daha fazla alan kaplar ve maliyeti yüksektir, ancak çok estetik ve dayanıklıdır."
    },
    {
      question: "Mezar yapımında mermer mezar modellerinden tercih etsem dayanıklı olur mu?",
      answer: "Mermer mezar modelleri doğru işçilik ve kaliteli malzeme ile yapıldığında oldukça dayanıklıdır. Mezarisi.com güvencesi ile yapılan mermer mezarlar 10 yıl garanti ile teslim edilir. Düzenli bakım ile mermer mezarlar uzun yıllar kullanılabilir. Ancak en yüksek dayanıklılık için granit mezar modellerini öneririz."
    }
  ];

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
                <span>Mezar Yapımında Sık Sorulan Sorular</span>
              </nav>
              <h1 className="text-4xl mb-2">Mezar Yapımında Sık Sorulan Sorular</h1>
              <p className="text-lg opacity-90">Anasayfa &gt; Mezar Yapımında Sık Sorulan Sorular</p>
            </div>

            {/* Question mark illustration */}
            <div className="hidden lg:block">
              <div className="w-48 h-32 flex items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-4xl text-white">?</span>
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-teal-500 mb-4">MEZAR YAPIMINDA BİZE DAİR BİR ŞÜPHENİZ BULUNMASIN</h2>
              <p className="text-gray-700 text-lg font-medium mb-6">
                Değerli müşterilerimizin mezar yapımı konusunda en sık karşılaştığı sorunları derledik ve size sunuyoruz.
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="mb-16">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-gray-200 rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="text-gray-800 font-semibold text-base">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 accordion-content-limited">
                      <div className="text-gray-700 leading-relaxed font-medium text-base">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact Information and Map Section */}
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl text-teal-500 mb-6">Mezarisim.com</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Google Map */}
                <div className="order-2 lg:order-1">
                  <div className="w-full h-64 rounded-lg shadow-lg overflow-hidden relative">
                    <iframe
                      src="https://maps.google.com/maps?q=Hekimba%C5%9F%C4%B1%20Mahallesi%20Y%C4%B1ld%C4%B1ztepe%20Caddesi%20No%3A31%20%C3%9Cmraniye%20%C4%B0stanbul&output=embed&z=16"
                      width="100%"
                      height="256"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Mezarisi.com Konum - Hekimbaşı Mah. Yıldıztepe Cad. No:31 Ümraniye/İstanbul"
                    ></iframe>

                    {/* Overlay for direct link */}
                    <div className="absolute top-2 right-2">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Hekimba%C5%9F%C4%B1+Mahallesi+Y%C4%B1ld%C4%B1ztepe+Caddesi+No%3A31+%C3%9Cmraniye+%C4%B0stanbul"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-teal-500 px-3 py-1 rounded shadow-md hover:bg-teal-50 transition-colors text-xs"
                      >
                        🔗 Büyük Görünüm
                      </a>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="order-1 lg:order-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg text-gray-800 mb-2">İletişim Bilgileri</h4>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="text-teal-500 mt-1">📍</span>
                      <div>
                        <p className="text-gray-700">
                          <strong>Adres:</strong><br />
                          Hekimbaşı Mah. Yıldıztepe Cad. No:31 Ümraniye/İstanbul
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-teal-500">📞</span>
                      <div>
                        <p className="text-gray-700">
                          <strong>Cep Telefonu:</strong><br />
                          <a href="tel:+905334838971" className="text-teal-500 hover:text-teal-600">
                            0533 483 89 71
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-teal-500">✉️</span>
                      <div>
                        <p className="text-gray-700">
                          <strong>E-posta:</strong><br />
                          <a href="mailto:mezarisim.com@gmail.com" className="text-teal-500 hover:text-teal-600">
                            mezarisim.com@gmail.com
                          </a>
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="pt-4 flex flex-col gap-3">
                      <a
                        href="tel:+905334838971"
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors text-center"
                      >
                        📞 Hemen Ara
                      </a>
                    </div>

                    {/* WhatsApp Button */}
                    <div className="pt-3">
                      <a
                        href="https://wa.me/905334838971?text=Merhaba,%20mezar%20yapımı%20hakkında%20bilgi%20almak%20istiyorum."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full text-center flex items-center justify-center"
                      >
                        💬 WhatsApp ile İletişim
                      </a>
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