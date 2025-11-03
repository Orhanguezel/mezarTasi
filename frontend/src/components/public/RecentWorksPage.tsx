import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Phone } from "lucide-react";
import exampleImage from 'figma:asset/ea63b76f8fbdbdcea873602cb1397bbff2654df4.png';

interface RecentWorksPageProps {
  onNavigate: (page: string) => void;
}

const recentProjects = [
  {
    id: 1,
    title: "ŞİLE MEZAR YAPIM İŞLERİ / AĞVA MEZAR YAPIMI",
    category: "Şile Mezar Yapım İşleri / Ağva mezar yapımı / şile mezar modelleri",
    date: "Ocak 2024",
    location: "Şile, İstanbul",
    description: "Şile köy mezarlığında gerçekleştirdiğimiz kaliteli mezar yapım projesi. Mermer mezar modelleri ve granit mezar çeşitleri ile modern mezarlık tasarımı yapılmıştır.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=500&h=400&fit=crop"
    ],
    details: [
      "Ucuz mezar modelleri ve kaliteli mezar fiyatları",
      "Şile mezar yapım / şile mezar modelleri / şile mezar fiyatları",
      "Şile köy mezarlığı / şile mermer mezar yapım",
      "Şile-ağva mezar yapımı hizmetleri"
    ]
  },
  {
    id: 2,
    title: "UCUZ MEZAR MODELLERİ / MEZAR FİYATLARI",
    category: "ucuz mezar modelleri / mezar fiyatları / İstanbul Mezar Yapım İşleri",
    date: "Aralık 2023",
    location: "İstanbul Geneli",
    description: "İstanbul'un çeşitli mezarlıklarında ekonomik mezar çözümleri sunduğumuz proje. Uygun fiyatlı mezar modelleri ile kaliteli mezar yapımı gerçekleştirilmiştir.",
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=500&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop"
    ],
    details: [
      "Ekonomik mezar çözümleri",
      "Kaliteli malzeme ile uygun fiyat",
      "İstanbul genelinde hizmet",
      "Profesyonel mezar montajı"
    ]
  },
  {
    id: 3,
    title: "MERMER, GRANİT, MOZAİK MEZAR MODELLERİ",
    category: "Mermer, granit, mozaik mezar modelleri ve mezar baş taşı çeştleri",
    date: "Kasım 2023",
    location: "Karacaahmet Mezarlığı",
    description: "Lüks mezar tasarımları ve özel mezar baş taşı çeşitleri ile gerçekleştirdiğimiz prestijli mezarlık projesi. Mozaik sanatı ve mermer işçiliği bir arada.",
    image: "https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=500&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=500&h=400&fit=crop"
    ],
    details: [
      "Özel mozaik tasarımları",
      "İthal granit malzemeler",
      "El işçiliği mezar baş taşları",
      "Lüks mezar kategorisi"
    ]
  },
  {
    id: 4,
    title: "MEZAR YAPIMI FİYATLARI MEZARISI.COM'DA",
    category: "Mezar Yapımı Fiyatları mezarisi.com'da!",
    date: "Ekim 2023",
    location: "Zincirlikuyu Mezarlığı",
    description: "Online mezar fiyat sistemi ile şeffaf ve uygun mezar yapım hizmetleri. Müşterilerimize en iyi fiyat garantisi sunduğumuz özel proje.",
    image: "https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=500&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=500&h=400&fit=crop"
    ],
    details: [
      "Online fiyat hesaplama sistemi",
      "Şeffaf mezar fiyatları",
      "Dijital mezar katalogları",
      "Hızlı fiyat teklifi"
    ]
  }
];

export function RecentWorksPage({ onNavigate }: RecentWorksPageProps) {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleProjectClick = (projectId: number) => {
    setSelectedProject(projectId);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedProject) {
      const project = recentProjects.find(p => p.id === selectedProject);
      if (project) {
        setCurrentImageIndex((prev) =>
          prev === project.images.length - 1 ? 0 : prev + 1
        );
      }
    }
  };

  const prevImage = () => {
    if (selectedProject) {
      const project = recentProjects.find(p => p.id === selectedProject);
      if (project) {
        setCurrentImageIndex((prev) =>
          prev === 0 ? project.images.length - 1 : prev - 1
        );
      }
    }
  };

  const selectedProjectData = selectedProject ? recentProjects.find(p => p.id === selectedProject) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-teal-500 text-white py-16">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${exampleImage})` }}
        />
        <div className="relative container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl mb-4">SON ÇALIŞMALARIMIZ</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
              Mezar yapımı alanında gerçekleştirdiğimiz son projeler ve çalışmalarımız.
              Kaliteli mezar modelleri ve profesyonel işçilik örnekleri.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="mb-8">
          <Button
            onClick={() => onNavigate('home')}
            variant="outline"
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </div>

        {!selectedProject ? (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="relative">
                  <ImageWithFallback
                    src={project.image}
                    alt={project.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-sm">
                    {project.images.length} Fotoğraf
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {project.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </div>
                  </div>

                  <h3 className="text-xl mb-3 text-teal-600">{project.title}</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">{project.description}</p>

                  <div className="border-t pt-3">
                    <p className="text-xs text-teal-500 mb-2 font-semibold">Proje Detayları:</p>
                    <p className="text-xs text-gray-500">{project.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Project Detail */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <Button
                onClick={() => setSelectedProject(null)}
                variant="outline"
                className="mb-6"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Projelere Geri Dön
              </Button>

              {selectedProjectData && (
                <div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedProjectData.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedProjectData.location}
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl mb-4 text-teal-600">{selectedProjectData.title}</h1>

                  <div className="mb-8">
                    <div className="relative">
                      <ImageWithFallback
                        src={selectedProjectData.images[currentImageIndex]}
                        alt={selectedProjectData.title}
                        className="w-full h-96 object-cover rounded-lg"
                      />

                      {selectedProjectData.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>

                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>

                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {selectedProjectData.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                                  }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl mb-4 text-teal-600">Proje Açıklaması</h3>
                      <p className="text-gray-700 leading-relaxed mb-6">{selectedProjectData.description}</p>

                      <div className="bg-teal-50 p-4 rounded-lg">
                        <h4 className="text-teal-600 mb-2">Kategori</h4>
                        <p className="text-sm text-gray-600">{selectedProjectData.category}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl mb-4 text-teal-600">Proje Özellikleri</h3>
                      <ul className="space-y-3">
                        {selectedProjectData.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                        <h4 className="text-lg mb-4 text-teal-600">Bu Proje Hakkında Bilgi Alın</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Benzer bir proje için bilgi almak veya teklif istemek için bizimle iletişime geçin.
                        </p>
                        <Button
                          onClick={() => window.open("tel:+905334838971")}
                          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Hemen Ara: 0533 483 89 71
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}