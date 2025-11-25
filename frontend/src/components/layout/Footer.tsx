// FILE: src/components/layout/Footer.tsx
"use client";

import { ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useListSiteSettingsQuery } from "@/integrations/rtk/endpoints/site_settings.endpoints";

interface FooterProps {
  onNavigate?: (page: string) => void;
}

type QuickLink = { title: string; path: string; pageKey?: string };

export function Footer({ onNavigate }: FooterProps) {
  const navigate = useNavigate();

  // İhtiyaç olan tüm key'leri tek istekle çek
  const { data: settings } = useListSiteSettingsQuery({
    keys: [
      "brand_name",
      "footer_services",
      "footer_quick_links",
      "footer_keywords",
      "contact_phone_display",
      "contact_phone_tel",
      "contact_email",
      "contact_address",
      "site_version",
      "admin_path",
    ],
  });

  const get = (k: string, d: any) =>
    settings?.find((s) => s.key === k)?.value ?? d;

  const brandName = String(get("brand_name", "mezarisim.com"));

  const services = (get("footer_services", []) as string[]) || [];
  const quickLinks = (get("footer_quick_links", []) as QuickLink[]) || [];
  const keywords = (get("footer_keywords", []) as string[]) || [];

  const phoneDisplay = String(get("contact_phone_display", "0533 483 89 71"));
  const phoneTel = String(get("contact_phone_tel", "05334838971"));
  const email = String(get("contact_email", "mezarisim.com@gmail.com"));
  const address = String(
    get(
      "contact_address",
      "Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye/İstanbul",
    ),
  );
  const version = String(get("site_version", "1.0.0"));
  const adminPath = String(get("admin_path", "/adminkontrol"));

  const go = (path: string, pageKey?: string) => {
    if (pageKey && onNavigate) onNavigate(pageKey);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  // Varsayılan listeler (settings yoksa)
  const defaultServices = [
    "Mezar Yapımı",
    "Mezar Onarımı",
    "Mezar Bakımı",
    "Çiçeklendirme",
  ];

  const defaultQuickLinks: QuickLink[] = [
    { title: "Anasayfa", path: "/", pageKey: "home" },
    { title: "Hakkımızda", path: "/about", pageKey: "about" },
    { title: "Ürünlerimiz", path: "/pricing", pageKey: "pricing" },
    { title: "İletişim", path: "/contact", pageKey: "contact" },
  ];

  const defaultKeywords = [
    "Ucuz Mezar Yapımı",
    "Mezar Yapımı İşleri",
    "Mezar Yapımı Fiyatları",
    "Mezar Baş Taşı Fiyatı",
    "Mezar Taşına Resim",
    "Ucuz Mezar İşleri",
    "İstanbul Mezar Yapım",
    "Mezar Taşı Fiyatları",
  ];

  const servicesToShow = services.length ? services : defaultServices;
  const linksToShow = quickLinks.length ? quickLinks : defaultQuickLinks;
  const keywordsToShow = keywords.length ? keywords : defaultKeywords;

  return (
    <div className="relative">
      {/* Scroll to Top Button - Footer üst kısmında */}
      <div className="bg-gray-50 py-4 flex justify-center">
        <button
          onClick={scrollToTop}
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-3 shadow-sm hover:shadow-md transition-all duration-200 group"
          aria-label="Sayfa başına git"
        >
          <ChevronUp className="w-6 h-6 text-gray-600 group-hover:text-teal-600 transition-colors" />
        </button>
      </div>

      <footer className="bg-teal-600 text-white py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Logo ve Açıklama - Genişletildi */}
            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="text-lg md:text-xl mb-3 text-white font-semibold">
                {brandName}
              </h3>
              <p className="text-white text-sm leading-relaxed font-medium">
                İstanbul genelinde kaliteli mezar yapım, onarım ve bakım
                hizmetleri sunuyoruz.
              </p>
            </div>

            {/* Hizmetlerimiz */}
            <div>
              <h4 className="text-base md:text-lg mb-3 text-white font-semibold">
                Hizmetlerimiz
              </h4>
              <ul className="space-y-1 text-sm text-white">
                {servicesToShow.map((t) => (
                  <li
                    key={t}
                    className="hover:text-black active:text-black transition-colors font-medium cursor-pointer"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hızlı Linkler - Küçültüldü */}
            <div>
              <h4 className="text-base md:text-lg mb-3 text-white font-semibold">
                Hızlı Linkler
              </h4>
              <ul className="space-y-1 text-sm text-white">
                {linksToShow.map((l) => (
                  <li key={l.title}>
                    <button
                      type="button"
                      onClick={() => go(l.path, l.pageKey)}
                      className="hover:text-black active:text-black transition-colors cursor-pointer text-left font-medium"
                    >
                      {l.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* İletişim */}
            <div>
              <h4 className="text-base md:text-lg mb-3 text-white font-semibold">
                İletişim
              </h4>
              <div className="text-sm text-white space-y-2">
                <p className="flex items-center space-x-2">
                  <span>📞</span>
                  <a
                    href={`tel:${phoneTel}`}
                    className="hover:text-black active:text-black transition-colors font-medium"
                  >
                    {phoneDisplay}
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <span>📧</span>
                  <a
                    href={`mailto:${email}`}
                    className="font-medium hover:text-black transition-colors cursor-pointer"
                  >
                    {email}
                  </a>
                </p>
                <p className="flex items-start space-x-2">
                  <span>📍</span>
                  <span className="leading-relaxed font-medium hover:text-black transition-colors cursor-pointer">
                    {address}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Anahtar Kelimeler - Ayrı satıra taşındı */}
          <div className="mt-6 pt-6 border-t border-teal-500">
            <h4 className="text-base md:text-lg mb-3 text-white font-semibold">
              Anahtar Kelimeler
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-1 text-xs md:text-sm text-white">
              {keywordsToShow.map((k) => (
                <p
                  key={k}
                  className="hover:text-black active:text-black transition-colors font-medium cursor-pointer"
                >
                  {k}
                </p>
              ))}
            </div>
          </div>

          {/* Alt kısım copyright */}
          <div className="border-t border-teal-500 mt-6 pt-6 text-center">
            <p className="text-sm text-white font-medium">
              &copy; {new Date().getFullYear()} {brandName} Mezar Yapım. Tüm
              hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
