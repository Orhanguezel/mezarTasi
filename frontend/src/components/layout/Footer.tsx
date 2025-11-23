// FILE: src/components/layout/Footer.tsx
"use client";

import { ChevronUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
    get("contact_address", "Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye/İstanbul")
  );
  const version = String(get("site_version", "1.0.0"));
  const adminPath = String(get("admin_path", "/adminkotrol"));

  const go = (path: string, pageKey?: string) => {
    if (pageKey && onNavigate) onNavigate(pageKey);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
      <footer className="bg-[#009688] text-white/90">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="sm:col-span-2">
              <h3 className="mb-3 text-lg font-semibold text-white md:text-xl">
                {brandName}
              </h3>
              <p className="text-sm leading-relaxed">
                İstanbul genelinde kaliteli mezar yapım, onarım ve bakım hizmetleri sunuyoruz.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
                Hizmetlerimiz
              </h4>
              <ul className="space-y-1 text-sm">
                {(services.length ? services : ["Mezar Yapımı", "Mezar Onarımı", "Mezar Bakımı", "Çiçeklendirme"]).map((t) => (
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
                {(quickLinks.length
                  ? quickLinks
                  : [
                    { title: "Anasayfa", path: "/", pageKey: "home" },
                    { title: "Hakkımızda", path: "/about", pageKey: "about" },
                    { title: "Ürünlerimiz", path: "/pricing", pageKey: "pricing" },
                    { title: "İletişim", path: "/contact", pageKey: "contact" },
                  ]
                ).map((l) => (
                  <li key={l.title}>
                    <button
                      type="button"
                      onClick={() => go(l.path, l.pageKey)}
                      className="text-left font-medium transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      {l.title}
                    </button>
                  </li>
                ))}
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
                  <a href={`tel:${phoneTel}`} className="font-medium transition-colors hover:text-teal-300">
                    {phoneDisplay}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span>📧</span>
                  <a href={`mailto:${email}`} className="font-medium transition-colors hover:text-teal-300">
                    {email}
                  </a>
                </p>
                <p className="flex items-start gap-2">
                  <span>📍</span>
                  <span className="cursor-pointer leading-relaxed font-medium transition-colors hover:text-teal-300">
                    {address}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="mt-8 border-t border-white/20 pt-6">
            <h4 className="mb-3 text-base font-semibold text-white md:text-lg">
              Anahtar Kelimeler
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/90 sm:grid-cols-4 md:text-sm">
              {(keywords.length
                ? keywords
                : ["Ucuz Mezar Yapımı", "Mezar Yapımı İşleri", "Mezar Yapımı Fiyatları", "Mezar Baş Taşı Fiyatı", "Mezar Taşına Resim", "Ucuz Mezar İşleri", "İstanbul Mezar Yapım", "Mezar Taşı Fiyatları"]
              ).map((k) => (
                <p key={k} className="cursor-pointer font-medium transition-colors hover:text-teal-300">
                  {k}
                </p>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-white/20 pt-6 text-center">
            <p className="text-sm font-medium text-white/90">
              &copy; {new Date().getFullYear()} {brandName} Mezar Yapım. Tüm hakları saklıdır.
            </p>

             {/*
            <div className="mt-2 flex items-center justify-center gap-4">
              <p className="text-xs text-white/60">Version {version}</p>
              <span className="text-white/30">•</span>
              <Link
                to={adminPath}
                className="text-xs text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Yönetim
              </Link>
            </div>
             */}
          </div>
        </div>
      </footer>
    </div>
  );
}
