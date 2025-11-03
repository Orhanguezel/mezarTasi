import { ImageWithFallback } from "../figma/ImageWithFallback";
import { getAboutPageData } from "../../data/pageContent";
import backgroundImage from 'figma:asset/49bae4cd4b172781dc5d9ea5d642274ea5ea27b6.png';
import aboutSideImage from 'figma:asset/86ac622a937f78742905aa1b265687cf5a66c70f.png';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const pageData = getAboutPageData();
  
  return (
    <div className="min-h-screen">
      {/* Hero section with green background */}
      <div 
        className="relative bg-teal-500 py-12 md:py-20 bg-cover bg-center"
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
                <span>{pageData.title}</span>
              </nav>
              <h1 className="text-2xl md:text-4xl mb-2">{pageData.heroTitle}</h1>
              <p className="text-base md:text-lg opacity-90">{pageData.breadcrumb}</p>
            </div>
            
            {/* 3D Illustration - Hide on mobile and small tablets */}
            <div className="hidden xl:block">
              <div className="w-40 h-24 md:w-48 md:h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="w-24 h-16 md:w-32 md:h-20 bg-white rounded transform perspective-1000 rotate-y-12 shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="bg-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
              {/* Left content */}
              <div className="lg:w-2/3">
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl text-teal-500 mb-6">{pageData.mainContent.title}</h2>
                  
                  <div className="space-y-4 md:space-y-5 text-gray-700 leading-relaxed text-sm md:text-base">
                    {pageData.mainContent.paragraphs.map((paragraph, index) => (
                      <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                  
                  {/* SEO Optimized Related Links */}
                  <div className="mt-6 md:mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-base md:text-lg mb-4 text-gray-800">{pageData.popularServices.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                      {pageData.popularServices.items.map((item, index) => (
                        <button 
                          key={index}
                          onClick={() => onNavigate(item.link)}
                          className="text-teal-500 hover:text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg text-xs md:text-sm transition-colors text-left"
                        >
                          {item.icon} {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right sidebar image */}
              <div className="lg:w-1/3">
                <div className="lg:sticky lg:top-8">
                  <ImageWithFallback 
                    src={aboutSideImage}
                    alt="Beyaz mermer mezar yapımı - Kaliteli mezar inşaatı örneği"
                    className="w-full h-48 md:h-64 object-cover rounded-lg shadow-lg"
                  />
                  
                  {/* Enhanced Info box with SEO keywords */}
                  <div className="bg-teal-50 p-4 md:p-6 rounded-lg mt-6">
                    <h3 className="text-base md:text-lg mb-4 text-teal-700">{pageData.sidebarServices.title}</h3>
                    <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
                      {pageData.sidebarServices.items.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 flex-shrink-0"></span>
                          <span><strong>{item.title}</strong> - {item.description}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Contact CTA */}
                    <div className="mt-4 md:mt-6 pt-4 border-t border-teal-200">
                      <p className="text-xs text-gray-600 mb-3">
                        <strong>{pageData.contactInfo.message}</strong>
                      </p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => window.open(`tel:+90${pageData.contactInfo.phone.replace(/\s/g, '')}`)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm transition-colors"
                        >
                          📞 {pageData.contactInfo.phone}
                        </button>
                        <button 
                          onClick={() => {
                            window.open(`https://wa.me/90${pageData.contactInfo.phone.replace(/\s/g, '')}?text=${encodeURIComponent(pageData.contactInfo.whatsappMessage)}`, '_blank');
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm transition-colors"
                        >
                          💬 WhatsApp'tan Yazın
                        </button>
                      </div>
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