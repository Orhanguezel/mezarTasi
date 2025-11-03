import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Campaign {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  image: string;
}

interface CampaignDetailPageProps {
  campaign: Campaign;
  onBack: () => void;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaign, onBack }) => {
  return (
    <div className="bg-white max-w-2xl mx-auto p-6 space-y-6">
      {/* Header with Type Badge */}
      <div className="text-center space-y-4">
        <Badge className="bg-teal-500 text-white px-3 py-1 text-sm">
          {campaign.type}
        </Badge>

        <h1 className="text-xl text-teal-600 leading-tight">
          {campaign.title}
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed">
          {campaign.description}
        </p>

        <div className="text-sm text-gray-500">
          {campaign.date}
        </div>
      </div>

      {/* Main Image */}
      <div className="flex justify-center">
        <div className="w-80 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4">
        <p className="text-lg text-teal-600">Bu Kampanyadan Yararlanın</p>

        <div className="flex gap-3 justify-center">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white px-6">
            Bilgi Al
          </Button>
          <Button variant="outline" className="border-gray-300 text-gray-700 px-6">
            📱 WhatsApp'tan Sor
          </Button>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="space-y-3">
        <h3 className="text-center text-gray-800 mb-4">Kampanya Detayları</h3>

        <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Kampanya Türü:</span>
            <span className="text-gray-800">{campaign.type}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Geçerlilik Tarihi:</span>
            <span className="text-gray-800">{campaign.date}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Durumu:</span>
            <span className="text-green-600">Aktif</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Detaylı bilgi için bizimle iletişime geçin</p>
        <p>📞 0532 395 45 58 | 🌐 mezarisim.com</p>
      </div>
    </div>
  );
};