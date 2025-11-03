"use client";

import { ChevronUp } from "lucide-react";

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleNavigation = (page: string) => {
    onNavigate?.(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="relative">
      {/* Scroll-to-top */}
      <div className="bg-gray-50 py-4 flex justify-center">
        <button
          type="button"
          onClick={scrollToTop}
          className="rounded-full border border-gray-200 p-3 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500"
          aria-label="Sayfa başına git"
        >
          <ChevronUp className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Main footer */}
      <footer className="bg-[#0B1220] text-white/90">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="sm:col-span-2">
              <h3 className="mb-3 text-lg font-semibold text-white md:text-xl">
                mezarisim.com
              </h3>
              <p className="text-sm leading-relaxed">
                İstanbul genelinde kaliteli mezar yapım, onarım ve bakım
                hizmetleri sunuyoruz.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
                Hizmetlerimiz
              </h4>
              <ul className="space-y-1 text-sm">
                {[
                  "Mezar Yapımı",
                  "Mezar Onarımı",
                  "Mezar Bakımı",
                  "Çiçeklendirme",
                ].map((t) => (
                  <li key={t}>
                    <span className="cursor-pointer font-medium transition-colors hover:text-teal-300">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
                Hızlı Linkler
              </h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigation("home")}
                    className="text-left font-medium transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    Anasayfa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigation("about")}
                    className="text-left font-medium transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    Hakkımızda
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigation("pricing")}
                    className="text-left font-medium transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    Ürünlerimiz
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigation("contact")}
                    className="text-left font-medium transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    İletişim
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
                İletişim
              </h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span>📞</span>
                  <a
                    href="tel:05334838971"
                    className="font-medium transition-colors hover:text-teal-300"
                  >
                    0533 483 89 71
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span>📧</span>
                  <span className="cursor-pointer font-medium transition-colors hover:text-teal-300">
                    mezarisim.com@gmail.com
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span>📍</span>
                  <span className="cursor-pointer leading-relaxed font-medium transition-colors hover:text-teal-300">
                    Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye/İstanbul
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="mt-8 border-t border-teal-500/20 pt-6">
            <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
              Anahtar Kelimeler
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/90 sm:grid-cols-4 md:text-sm">
              {[
                "Ucuz Mezar Yapımı",
                "Mezar Yapımı İşleri",
                "Mezar Yapımı Fiyatları",
                "Mezar Baş Taşı Fiyatı",
                "Mezar Taşına Resim",
                "Ucuz Mezar İşleri",
                "İstanbul Mezar Yapım",
                "Mezar Taşı Fiyatları",
              ].map((k) => (
                <p
                  key={k}
                  className="cursor-pointer font-medium transition-colors hover:text-teal-300"
                >
                  {k}
                </p>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-teal-500/20 pt-6 text-center">
            <p className="text-sm font-medium text-white/90">
              &copy; {new Date().getFullYear()} mezarisim.com Mezar Yapım. Tüm
              hakları saklıdır.
            </p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <p className="text-xs text-white/60">Version 1.0.0</p>
              <span className="text-white/30">•</span>
              <button
                type="button"
                onClick={() => (window.location.href = "/adminkotrol")}
                className="text-xs text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Yönetim
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
