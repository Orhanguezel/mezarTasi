import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RecentWork } from '../../data/recentWorksData';

interface RecentWorkDetailPageProps {
  work: RecentWork;
  onBack: () => void;
}

export const RecentWorkDetailPage: React.FC<RecentWorkDetailPageProps> = ({ work, onBack }) => {
  return (
    <div className="bg-white max-w-2xl mx-auto p-6 space-y-6">
      {/* Header with Category Badge */}
      <div className="text-center space-y-4">
        <Badge className="bg-teal-500 text-white px-3 py-1 text-sm">
          Öne Çıkan Model
        </Badge>

        <h1 className="text-xl text-teal-600 leading-tight">
          {work.title}
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed">
          {work.description}
        </p>
      </div>

      {/* Main Image */}
      <div className="flex justify-center">
        <div className="w-80 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={work.images[0]}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Material Badges */}
      <div className="flex justify-center gap-2">
        <Badge variant="outline" className="text-teal-600 border-teal-300 px-3 py-1">
          {work.material}
        </Badge>
        <Badge variant="outline" className="text-teal-600 border-teal-300 px-3 py-1">
          {work.category}
        </Badge>
      </div>

      {/* Price Section */}
      <div className="text-center">
        <p className="text-lg text-teal-600 mb-4">Fiyat İçin Arayınız</p>

        <div className="flex gap-3 justify-center">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white px-6">
            Fiyat Teklifi Al
          </Button>
          <Button variant="outline" className="border-gray-300 text-gray-700 px-6">
            📱 WhatsApp'tan Sor
          </Button>
        </div>
      </div>

      {/* Technical Details */}
      <div className="space-y-3">
        <h3 className="text-center text-gray-800 mb-4">Teknik Özellikler</h3>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Boyutlar:</span>
            <span className="text-gray-800">{work.details.dimensions}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Çalışma Süresi:</span>
            <span className="text-gray-800">{work.details.workTime}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Lokasyon:</span>
            <span className="text-gray-800">{work.location}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Yıl:</span>
            <span className="text-gray-800">{work.date}</span>
          </div>
        </div>
      </div>

      {/* Special Features */}
      {work.details.specialFeatures && work.details.specialFeatures.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-center text-gray-800 text-sm">Özel Özellikler</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {work.details.specialFeatures.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};