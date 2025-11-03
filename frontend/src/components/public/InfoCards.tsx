import { useState, useEffect } from "react";
import { HelpCircle, MapPin, Phone, FileText, Settings, Users, Calendar, Shield, Star } from "lucide-react";
import { getInfoCardsData } from "../../data/pageContent";

interface InfoCardsProps {
  onNavigate: (page: string) => void;
}

export function InfoCards({ onNavigate }: InfoCardsProps) {
  const [cardsData, setCardsData] = useState(getInfoCardsData());

  // Refresh cards data when component mounts
  useEffect(() => {
    setCardsData(getInfoCardsData());
  }, []);

  // Lucide icon mapping
  const lucideIconMap: { [key: string]: any } = {
    HelpCircle,
    MapPin,
    Phone,
    FileText,
    Settings,
    Users,
    Calendar,
    Shield,
    Star
  };

  const cards = cardsData.map(cardData => ({
    id: cardData.id,
    title: cardData.title,
    icon: cardData.iconType === 'lucide' && cardData.lucideIcon
      ? lucideIconMap[cardData.lucideIcon] || HelpCircle
      : null,
    emoji: cardData.iconType === 'emoji' ? cardData.icon : null,
    bgColor: cardData.bgColor,
    hoverColor: cardData.hoverColor,
    iconColor: cardData.iconColor,
    textColor: cardData.textColor,
    borderColor: cardData.borderColor,
    link: cardData.link
  }));

  const handleCardClick = (link: string) => {
    // Mezarlık adresleri için cemeteries sayfasına yönlendir
    if (link === "contact" || link === "cemetery-addresses") {
      onNavigate("cemeteries");
      return;
    }

    // Normal navigasyon
    onNavigate(link);
  };

  // Show fallback if no cards are available
  if (!cards || cards.length === 0) {
    return (
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center text-gray-500">
            <p>Henüz bilgi kartı eklenmemiş.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.link)}
                className={`${card.bgColor} ${card.hoverColor} rounded-xl p-6 md:p-8 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border ${card.borderColor}`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white rounded-full p-4 shadow-md">
                      {card.emoji ? (
                        <span className="text-2xl md:text-3xl">{card.emoji}</span>
                      ) : IconComponent ? (
                        <IconComponent className={`w-8 h-8 md:w-10 md:h-10 ${card.iconColor}`} />
                      ) : (
                        <HelpCircle className={`w-8 h-8 md:w-10 md:h-10 ${card.iconColor}`} />
                      )}
                    </div>
                  </div>
                  <h3 className={`text-base md:text-lg ${card.textColor} leading-tight`}>
                    {card.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}