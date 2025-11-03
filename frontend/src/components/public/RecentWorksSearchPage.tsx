import React, { useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Search, MapPin, Calendar, Package } from 'lucide-react';
import { recentWorksData, searchRecentWorks, RecentWork } from '../../data/recentWorksData';

interface RecentWorksSearchPageProps {
  onNavigate: (page: string) => void;
  onWorkSelect?: (work: RecentWork) => void;
}

const RecentWorksSearchPage: React.FC<RecentWorksSearchPageProps> = ({ onNavigate, onWorkSelect }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredWorks, setFilteredWorks] = useState<RecentWork[]>(recentWorksData);

  const handleSearch = () => {
    const results = searchRecentWorks(searchKeyword);
    setFilteredWorks(results);
    console.log('Arama sonucu:', results.length, 'ürün bulundu');
  };

  const handleWorkClick = (work: RecentWork) => {
    console.log('Ürün detayına gidiliyor:', work.title);
    if (onWorkSelect) {
      onWorkSelect(work);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-linear-to-br from-teal-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl text-teal-800 mb-4">Son Çalışmalarımız</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Yıllarca aile ve sevdiklerinize saygıyla hizmet eden, kaliteli ve özel tasarım mezar taşı çalışmalarımızı keşfedin.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          <div className="mb-12">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop"
                alt="Mezar taşı çalışmaları"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl mb-2">Başarılı Projelerimiz</h3>
                <p className="text-lg opacity-90">15+ yıllık deneyim ile kaliteli hizmet</p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="text-center mb-12">
            <h2 className="text-2xl text-teal-700 mb-6">Çalışmalarımızı Keşfedin</h2>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Anahtar kelime girin..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-4 pr-12 py-3 text-lg border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-400 w-5 h-5" />
              </div>
              <Button
                onClick={handleSearch}
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-lg"
              >
                Ara
              </Button>
            </div>
            <p className="mt-4 text-slate-600">
              {filteredWorks.length} çalışma bulundu
            </p>
          </div>

          {/* Works Grid */}
          <div className="mb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorks.map((work) => (
                <Card
                  key={work.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => handleWorkClick(work)}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <ImageWithFallback
                        src={work.images[0]}
                        alt={work.title}
                        className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-teal-600 text-white">
                          {work.date}
                        </Badge>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 text-teal-800">
                          {work.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {work.description}
                      </p>

                      <div className="space-y-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{work.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3" />
                          <span>{work.material}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-teal-600 group-hover:text-teal-700 transition-colors">
                          Detayları görüntüle →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredWorks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-slate-500 mb-4">Aradığınız kriterlere uygun çalışma bulunamadı.</p>
                <Button
                  onClick={() => {
                    setSearchKeyword('');
                    setFilteredWorks(recentWorksData);
                  }}
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Tüm Çalışmaları Görüntüle
                </Button>
              </div>
            )}
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
                <h4 className="text-lg text-slate-800 mb-2">500+ Çalışma</h4>
                <p className="text-slate-600">Başarıyla tamamlanan projeler</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md">
                <h4 className="text-lg text-slate-800 mb-2">Kaliteli Malzeme</h4>
                <p className="text-slate-600">Granit, mermer ve doğal taşlar</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md">
                <h4 className="text-lg text-slate-800 mb-2">Uzman Ekip</h4>
                <p className="text-slate-600">15+ yıl deneyimli ustalar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentWorksSearchPage;