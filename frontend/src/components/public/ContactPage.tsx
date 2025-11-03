import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import backgroundImage from 'figma:asset/0a9012ca17bfb48233c0877277b7fb8427a12d4c.png';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic here
    console.log("Form submitted:", formData);
    alert("Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero section with green background */}
      <div
        className="relative bg-teal-500 py-12 md:py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-teal-500 bg-opacity-90"></div>
        <div className="relative container mx-auto px-4">
          <div className="text-white">
            <nav className="flex items-center space-x-2 text-sm mb-4">
              <button
                onClick={() => onNavigate("home")}
                className="hover:text-teal-200 transition-colors"
              >
                Anasayfa
              </button>
              <span>&gt;</span>
              <span>İletişim</span>
            </nav>
            <h1 className="text-2xl md:text-4xl mb-2">BİZE ULAŞIN!</h1>
            <p className="text-base md:text-lg opacity-90">Daha fazla bilgi edinmek ve fiyat teklifi almak için bizimle iletişime geçin!</p>
          </div>
        </div>
      </div>

      {/* Contact Content Section */}
      <div className="bg-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">

            {/* Left Column - Contact Information */}
            <div className="space-y-6 md:space-y-8">
              <div className="bg-gray-50 rounded-lg p-6 md:p-8">
                <h2 className="text-lg md:text-xl text-teal-500 mb-6">Mezarisim.com</h2>
                <div className="space-y-4 md:space-y-6">

                  {/* Company Name */}
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-500 text-sm md:text-lg">🏢</span>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base text-gray-800 mb-1">Şirket Adı</h3>
                      <p className="text-sm md:text-base text-gray-600">Mezarisim.com</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-500 text-sm md:text-lg">📍</span>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base text-gray-800 mb-1">Adres</h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye / İstanbul</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-500 text-sm md:text-lg">✉️</span>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base text-gray-800 mb-1">E-posta</h3>
                      <a
                        href="mailto:mezarisim.com@gmail.com"
                        className="text-sm md:text-base text-teal-500 hover:text-teal-600 transition-colors break-all"
                      >
                        mezarisim.com@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-500 text-sm md:text-lg">📞</span>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base text-gray-800 mb-1">Telefon</h3>
                      <a
                        href="tel:+905334838971"
                        className="text-sm md:text-base text-teal-500 hover:text-teal-600 transition-colors"
                      >
                        0533 483 89 71
                      </a>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-4 md:pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <a
                        href="tel:+905334838971"
                        className="w-full bg-teal-500 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
                      >
                        <span>📞</span>
                        <span>Hemen Ara</span>
                      </a>
                      <a
                        href="https://wa.me/905334838971?text=Merhaba,%20mezar%20yapımı%20hakkında%20bilgi%20almak%20istiyorum."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-gray-50 rounded-lg p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

                {/* Name Field */}
                <div>
                  <Label htmlFor="name" className="text-gray-700 mb-2 block text-sm md:text-base">
                    AD SOYAD
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-gray-700 mb-2 block text-sm md:text-base">
                    EMAIL ADRESİNİZ
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <Label htmlFor="phone" className="text-gray-700 mb-2 block text-sm md:text-base">
                    TELEFON NUMARANIZ
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <Label htmlFor="subject" className="text-gray-700 mb-2 block text-sm md:text-base">
                    KONU
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  />
                </div>

                {/* Message Field */}
                <div>
                  <Label htmlFor="message" className="text-gray-700 mb-2 block text-sm md:text-base">
                    MESAJINIZI BURAYA YAZINIZ
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full min-h-24 md:min-h-32 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-sm md:text-base"
                >
                  MESAJ GÖNDER
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-gray-50 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-2xl text-teal-500 mb-6 md:mb-8 text-center">HARİTA ÜZERİNDE YERİMİZ</h2>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative w-full h-64 md:h-96">
                <iframe
                  src="https://maps.google.com/maps?q=Hekimba%C5%9F%C4%B1%20Mahallesi%20Y%C4%B1ld%C4%B1ztepe%20Caddesi%20No%3A41%20%C3%9Cmraniye%20%C4%B0stanbul&output=embed&z=16"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mezarisi.com Konum - Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye/İstanbul"
                ></iframe>

                {/* Map overlay with directions link */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Hekimba%C5%9F%C4%B1+Mahallesi+Y%C4%B1ld%C4%B1ztepe+Caddesi+No%3A41+%C3%9Cmraniye+%C4%B0stanbul"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-teal-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-md hover:bg-teal-600 transition-colors text-xs md:text-sm flex items-center space-x-1 md:space-x-2"
                  >
                    <span>🧭</span>
                    <span className="hidden sm:inline">Yol Tarifi Al</span>
                    <span className="sm:hidden">Tarif</span>
                  </a>
                </div>
              </div>

              {/* Map info footer */}
              <div className="bg-white p-4 md:p-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                  <div>
                    <h3 className="text-base md:text-lg text-gray-800 mb-1">Hekimbaşı Mezarlığı</h3>
                    <p className="text-sm md:text-base text-gray-600">Hekimbaşı, 34766 Ümraniye/İstanbul</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Hekimba%C5%9F%C4%B1+Mahallesi+Y%C4%B1ld%C4%B1ztepe+Caddesi+No%3A41+%C3%9Cmraniye+%C4%B0stanbul"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-500 hover:text-teal-600 transition-colors text-sm"
                    >
                      📍 Haritada Görüntüle
                    </a>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <button
                      onClick={() => onNavigate("faq")}
                      className="text-teal-500 hover:text-teal-600 transition-colors text-sm"
                    >
                      ❓ S.S.S.
                    </button>
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