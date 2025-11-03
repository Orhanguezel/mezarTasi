import React, { useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Tag, Calendar } from 'lucide-react';

interface CampaignAnnouncementsPageProps {
  onNavigate: (page: string) => void;
}

const CampaignAnnouncementsPage: React.FC<CampaignAnnouncementsPageProps> = ({ onNavigate }) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      console.log('Kampanya arama yapılıyor:', searchKeyword);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl text-emerald-800 mb-4">Duyuru / Kampanyalar</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Özel indirimler, sezonsal kampanyalar ve hizmet duyurularımızdan haberdar olun.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          <div className="mb-12">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=500&fit=crop"
                alt="Kampanya ve duyurular"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl mb-2">Özel Fırsatlar</h3>
                <p className="text-lg opacity-90">Avantajlı kampanyalarımızı kaçırmayın</p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="text-center mb-12">
            <h2 className="text-2xl text-emerald-700 mb-6">Kampanya Ara</h2>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Kampanya ara..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-4 pr-12 py-3 text-lg border-2 border-emerald-200 focus:border-emerald-500 rounded-lg"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
              </div>
              <Button
                onClick={handleSearch}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg text-lg"
              >
                Ara
              </Button>
            </div>
          </div>

          {/* Navigation Button */}
          <div className="text-center mb-8">
            <Button
              onClick={() => onNavigate('home')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-lg"
            >
              ← Ana Sayfaya Dön
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="flex items-center justify-center mb-3">
                  <Tag className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="text-lg text-slate-800 mb-2">%30'a Varan İndirim</h4>
                <p className="text-slate-600">Sezonsal kampanyalarda</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="text-lg text-slate-800 mb-2">Ücretsiz Keşif</h4>
                <p className="text-slate-600">Tüm projeler için</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="text-lg text-slate-800 mb-2">Özel Paketler</h4>
                <p className="text-slate-600">Bakım ve hizmet paketleri</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnnouncementsPage;