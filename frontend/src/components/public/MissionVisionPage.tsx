import { getMissionVisionPageData } from "../../data/pageContent";
import backgroundImage from 'figma:asset/b107ffe2a64e8432874267abb6c79d28b131e216.png';
import missionImage from 'figma:asset/86ac622a937f78742905aa1b265687cf5a66c70f.png';

interface MissionVisionPageProps {
  onNavigate: (page: string) => void;
}

export function MissionVisionPage({ onNavigate }: MissionVisionPageProps) {
  const pageData = getMissionVisionPageData();

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
                <span>{pageData.title}</span>
              </nav>
              <h1 className="text-4xl mb-2">{pageData.heroTitle}</h1>
              <p className="text-lg opacity-90">{pageData.breadcrumb}</p>
            </div>

            {/* 3D Box Illustration */}
            <div className="hidden lg:block">
              <div className="w-48 h-32 flex items-center justify-center">
                <div className="relative">
                  {/* Main box */}
                  <div className="w-32 h-20 bg-gray-300 rounded shadow-lg transform perspective-1000 rotate-y-12"></div>
                  {/* Top face */}
                  <div className="absolute -top-2 left-2 w-32 h-6 bg-gray-100 rounded transform perspective-1000 rotate-x-45 shadow-sm"></div>
                  {/* Side face */}
                  <div className="absolute top-0 -right-2 w-6 h-20 bg-gray-400 rounded transform perspective-1000 rotate-y-45 shadow-md"></div>
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
              <h2 className="text-3xl text-teal-500 mb-4">{pageData.heroTitle}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: pageData.subtitle }} />
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left content */}
              <div className="lg:w-2/3">
                <div className={`bg-gradient-to-br ${pageData.mission.backgroundColor} p-8 rounded-xl mb-8 shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">{pageData.mission.icon}</span>
                    </div>
                    <h3 className={`text-2xl ${pageData.mission.textColor}`}>{pageData.mission.title}</h3>
                  </div>

                  <div className="space-y-5 text-gray-700 leading-relaxed">
                    {pageData.mission.paragraphs.map((paragraph, index) => (
                      <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${pageData.vision.backgroundColor} p-8 rounded-xl shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">{pageData.vision.icon}</span>
                    </div>
                    <h3 className={`text-2xl ${pageData.vision.textColor}`}>{pageData.vision.title}</h3>
                  </div>

                  <div className="space-y-5 text-gray-700 leading-relaxed">
                    {pageData.vision.paragraphs.map((paragraph, index) => (
                      <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                </div>

                {/* SEO optimized feature boxes */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                  {pageData.expertiseBoxes.map((box, index) => (
                    <div key={index} className={`bg-white border-l-4 ${box.borderColor} p-6 shadow-md rounded-r-lg`}>
                      <h4 className={`text-lg ${box.textColor} mb-3`}>{box.title}</h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        {box.items.map((item, itemIndex) => (
                          <li key={itemIndex}>• <strong>{item.highlight}</strong> {item.text}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar with enhanced content */}
              <div className="lg:w-1/3">
                <div className="sticky top-8">
                  {/* Company Image */}
                  <div className="mb-6">
                    <img
                      src={missionImage}
                      alt="Beyaz mermer mezar yapımı örneği - Kaliteli işçilik ve profesyonel mezar inşaatı"
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                    />
                  </div>

                  {/* Enhanced value boxes */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {pageData.valueCards.map((card, index) => (
                      <div key={card.id} className={`bg-gradient-to-br ${card.backgroundColor} ${card.textColor} p-4 rounded-xl text-center shadow-lg transform hover:scale-105 transition-transform`}>
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <h4 className="text-xs uppercase tracking-wide">{card.title}</h4>
                        <p className="text-xs mt-1 opacity-90">{card.subtitle}</p>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced values box */}
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-lg mb-6">
                    <h3 className="text-lg mb-4 text-teal-700 flex items-center">
                      <span className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3 text-white text-sm">{pageData.coreValues.icon}</span>
                      {pageData.coreValues.title}
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-700">
                      {pageData.coreValues.items.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <span className={`w-3 h-3 bg-gradient-to-r ${item.color} rounded-full mr-3`}></span>
                          <span><strong>{item.title}</strong> {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Enhanced contact CTA */}
                  <div className={`bg-gradient-to-br ${pageData.contactCTA.backgroundColor} text-white p-6 rounded-xl shadow-lg`}>
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">{pageData.contactCTA.icon}</span>
                      </div>
                      <h3 className="text-lg mb-2">{pageData.contactCTA.title}</h3>
                      <p className="text-sm opacity-90" dangerouslySetInnerHTML={{ __html: pageData.contactCTA.subtitle }} />
                    </div>

                    <div className="space-y-3">
                      {pageData.contactCTA.buttons.map((button, index) => {
                        const handleClick = () => {
                          if (button.link === "tel") {
                            window.open(`tel:+90${pageData.contactCTA.phone.replace(/\s/g, '')}`);
                          } else if (button.link === "whatsapp") {
                            window.open(`https://wa.me/90${pageData.contactCTA.phone.replace(/\s/g, '')}?text=${encodeURIComponent(pageData.contactCTA.whatsappMessage)}`, '_blank');
                          } else if (button.link === "contact") {
                            onNavigate("contact");
                          }
                        };

                        return (
                          <button
                            key={index}
                            onClick={handleClick}
                            className={`w-full ${button.backgroundColor} ${button.textColor} px-4 py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2`}
                          >
                            <span>{button.icon}</span> <strong>{button.text}</strong>
                          </button>
                        );
                      })}
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