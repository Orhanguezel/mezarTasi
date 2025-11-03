import { useEffect } from 'react';

interface MobileSEOOptimizerProps {
  currentPage: string;
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export function MobileSEOOptimizer({ 
  currentPage, 
  title, 
  description, 
  keywords,
  canonicalUrl = 'https://mezarisim.com',
  ogImage 
}: MobileSEOOptimizerProps) {

  useEffect(() => {
    // Page-specific SEO data
    const seoData = {
      home: {
        title: 'Mezar Taşı Modelleri & Mezar Yapımı - Mezarisim.com | İstanbul',
        description: 'İstanbul\'da kaliteli mezar taşı modelleri ve mezar yapım hizmetleri. Mermer, granit mezar taşları, mezar aksesuarları ve çiçeklendirme hizmetleri. Ücretsiz keşif!',
        keywords: 'mezar taşı, mezar modelleri, mermer mezar, granit mezar, mezar yapımı, İstanbul mezar taşı, mezar aksesuarları, mezar çiçeklendirme'
      },
      models: {
        title: 'Mezar Baş Taşı Modelleri - Mermer & Granit | Mezarisim.com',
        description: 'Özel tasarım mezar baş taşı modelleri. Mermer ve granit malzemeden kaliteli mezar taşları. İstanbul geneli hizmet, ücretsiz keşif ve montaj.',
        keywords: 'mezar baş taşı, mezar taşı modelleri, mermer mezar taşı, granit mezar taşı, özel tasarım mezar'
      },
      accessories: {
        title: 'Mezar Aksesuarları & Süsleri - Mezarisim.com | İstanbul',
        description: 'Mezar aksesuarları, vazo, çiçeklik, mezar süsleri ve dekoratif ürünler. Kaliteli malzeme, uygun fiyat, hızlı teslimat.',
        keywords: 'mezar aksesuarları, mezar vazosu, mezar çiçekliği, mezar süsleri, mezar dekorasyonu'
      },
      gardening: {
        title: 'Mezar Çiçeklendirme Hizmetleri - Peyzaj & Bahçıvanlık | Mezarisim',
        description: 'Profesyonel mezar çiçeklendirme ve peyzaj hizmetleri. Mevsimlik çiçek dikimi, bakım ve düzenleme hizmetleri. İstanbul geneli hizmet.',
        keywords: 'mezar çiçeklendirme, mezar peyzajı, mezar bahçıvanlığı, çiçek dikimi, mezar bakımı'
      },
      soilfilling: {
        title: 'Mezar Toprak Doldurumu Hizmetleri - Mezarisim.com | İstanbul',
        description: 'Mezar toprak doldurumu, düzenleme ve bakım hizmetleri. Kaliteli toprak, profesyonel uygulama, uygun fiyatlar.',
        keywords: 'mezar toprak doldurumu, mezar düzenleme, mezar bakımı, toprak dolgulu mezar'
      },
      contact: {
        title: 'İletişim - Mezar Taşı & Mezar Yapımı Hizmetleri | Mezarisim.com',
        description: 'Mezar taşı ve mezar yapımı hizmetleri için bizimle iletişime geçin. İstanbul geneli hizmet, ücretsiz keşif ve danışmanlık.',
        keywords: 'mezar taşı iletişim, mezar yapımı İstanbul, mezar taşı fiyatları, ücretsiz keşif'
      },
      about: {
        title: 'Hakkımızda - Mezar Taşı Uzmanları | Mezarisim.com',
        description: 'Mezar taşı ve mezar yapımında uzman ekibimiz ile kaliteli hizmet. Yılların deneyimi, güvenilir iş ortaklığı.',
        keywords: 'mezar taşı uzmanları, mezar yapımı deneyimi, kaliteli mezar hizmeti'
      },
      pricing: {
        title: 'Mezar Taşı Fiyatları & Paketler - Uygun Fiyatlar | Mezarisim.com',
        description: 'Mezar taşı fiyatları, mezar yapım paketleri ve hizmet ücretleri. Şeffaf fiyatlandırma, kaliteli hizmet, uygun ödeme seçenekleri.',
        keywords: 'mezar taşı fiyatları, mezar yapım ücreti, mezar taşı paketleri, uygun mezar fiyatları'
      }
    };

    const currentSEO = seoData[currentPage as keyof typeof seoData] || seoData.home;
    const pageTitle = title || currentSEO.title;
    const pageDescription = description || currentSEO.description;
    const pageKeywords = keywords || currentSEO.keywords;

    // Update document title
    document.title = pageTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) meta.setAttribute('property', name);
        else meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic SEO meta tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('keywords', pageKeywords);
    updateMetaTag('author', 'Mezarisim.com - Mezar Taşı Uzmanları');
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Mobile-specific meta tags
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    updateMetaTag('mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('theme-color', '#14b8a6');
    updateMetaTag('msapplication-TileColor', '#14b8a6');

    // Open Graph meta tags
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:url', `${canonicalUrl}${currentPage !== 'home' ? `/${currentPage}` : ''}`, true);
    updateMetaTag('og:site_name', 'Mezarisim.com - Mezar Taşı Uzmanları', true);
    updateMetaTag('og:locale', 'tr_TR', true);
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', pageTitle, true);
    }

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
      updateMetaTag('twitter:image:alt', pageTitle);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${canonicalUrl}${currentPage !== 'home' ? `/${currentPage}` : ''}`;

    // Structured Data (JSON-LD)
    const addStructuredData = () => {
      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Mezarisim.com",
        "description": "İstanbul'da kaliteli mezar taşı modelleri ve mezar yapım hizmetleri",
        "url": canonicalUrl,
        "telephone": "+90-XXX-XXX-XXXX",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "İstanbul",
          "addressCountry": "TR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "41.0082",
          "longitude": "28.9784"
        },
        "sameAs": [
          "https://www.facebook.com/mezarisim",
          "https://www.instagram.com/mezarisim"
        ],
        "priceRange": "$$",
        "serviceArea": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": "41.0082",
            "longitude": "28.9784"
          },
          "geoRadius": "50000"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Mezar Hizmetleri",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mezar Taşı Yapımı",
                "description": "Özel tasarım mezar taşı modelleri"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mezar Çiçeklendirme",
                "description": "Profesyonel mezar peyzaj hizmetleri"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mezar Aksesuarları",
                "description": "Mezar süsleri ve dekoratif ürünler"
              }
            }
          ]
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    };

    addStructuredData();

    // Additional mobile SEO optimizations
    const addMobileSEOOptimizations = () => {
      // Add language hints
      document.documentElement.lang = 'tr';
      
      // Add mobile-friendly test meta
      updateMetaTag('format-detection', 'telephone=yes');
      updateMetaTag('format-detection', 'address=yes');
      
      // Add AMP hint if applicable
      updateMetaTag('amp-google-client-id-api', 'googleanalytics');
      
      // Add mobile app meta tags
      updateMetaTag('apple-mobile-web-app-title', 'Mezarisim');
      updateMetaTag('application-name', 'Mezarisim');
      
      // Add touch icon
      let touchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!touchIcon) {
        touchIcon = document.createElement('link');
        touchIcon.rel = 'apple-touch-icon';
        touchIcon.sizes = '180x180';
        touchIcon.href = '/favicon.ico'; // Replace with actual touch icon
        document.head.appendChild(touchIcon);
      }
    };

    addMobileSEOOptimizations();

  }, [currentPage, title, description, keywords, canonicalUrl, ogImage]);

  return null; // This component doesn't render anything
}