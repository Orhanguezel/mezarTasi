// Enhanced Slider veri yapısı - Admin paneli ile tam entegre
export interface SlideData {
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string; // Backward compatibility
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

// Slider verileri - Admin SliderManager ile senkronize
let slidesData: SlideData[] = [
  {
    id: "slide-1",
    title: "İstanbul'un En Deneyimli Mezar Yapım Firması",
    description: "25 yıllık deneyimimizle kaliteli mezar yapımı, mezar taşı ve restorasyon hizmetleri",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    alt: "İstanbul mezar yapım firması - Kaliteli mezar modelleri",
    buttonText: "Hemen Arayın",
    buttonLink: "tel:05334838971",
    isActive: true,
    order: 1,
    priority: 'high',
    showOnMobile: true,
    showOnDesktop: true
  },
  {
    id: "slide-2",
    title: "Premium Mermer ve Granit Mezar Modelleri",
    description: "A+ kalite doğal taşlar, özel tasarım ve profesyonel işçilik garantisi",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=1200&h=600&fit=crop",
    alt: "Premium mermer granit mezar modelleri",
    buttonText: "Modelleri İncele",
    buttonLink: "models",
    isActive: true,
    order: 2,
    priority: 'high',
    showOnMobile: true,
    showOnDesktop: true
  },
  {
    id: "slide-3",
    title: "Ücretsiz Keşif ve Proje Çizimi",
    description: "Mezar projeleriniz için profesyonel keşif hizmeti ve detaylı fiyat teklifi",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop",
    alt: "Ücretsiz mezar keşif hizmeti",
    buttonText: "Keşif Talep Et",
    buttonLink: "contact",
    isActive: true,
    order: 3,
    priority: 'medium',
    showOnMobile: true,
    showOnDesktop: true
  },
  {
    id: "slide-4",
    title: "Mezar Onarım ve Restorasyon Hizmetleri",
    description: "Çökmüş, çatlak veya eski mezarların profesyonel onarımı ve yenilenmesi",
    image: "https://images.unsplash.com/photo-1544024994-27c5b7b22c55?w=1200&h=600&fit=crop",
    alt: "Mezar onarım restorasyon hizmetleri",
    buttonText: "Onarım Talebi",
    buttonLink: "contact",
    isActive: false, // Default olarak pasif
    order: 4,
    priority: 'medium',
    showOnMobile: true,
    showOnDesktop: true
  },
  {
    id: "slide-5",
    title: "Mezar Çiçeklendirme ve Peyzaj Hizmetleri",
    description: "Mezar çevresi düzenleme, çiçeklendirme ve sürekli bakım hizmetleri",
    image: "https://images.unsplash.com/photo-1589677216159-5c27977717ed?w=1200&h=600&fit=crop",
    alt: "Mezar çiçeklendirme peyzaj hizmetleri",
    buttonText: "Bakım Hizmeti",
    buttonLink: "gardening",
    isActive: false, // Default olarak pasif
    order: 5,
    priority: 'low',
    showOnMobile: true,
    showOnDesktop: true
  }
];

// Admin paneli için gelişmiş yardımcı fonksiyonlar
export const getActiveSlides = () => {
  return slidesData
    .filter(slide => slide.isActive)
    .sort((a, b) => a.order - b.order);
};

export const getAllSlides = () => {
  return [...slidesData].sort((a, b) => a.order - b.order);
};

export const getSlideById = (id: string): SlideData | undefined => {
  return slidesData.find(slide => slide.id === id);
};

export const updateSlideData = (id: string, updates: Partial<SlideData>) => {
  const index = slidesData.findIndex(slide => slide.id === id);
  if (index !== -1) {
    slidesData[index] = { ...slidesData[index], ...updates };
    // Trigger event for components to update
    window.dispatchEvent(new CustomEvent('slider-data-updated'));
    return true;
  }
  return false;
};

export const addNewSlide = (slideData: Omit<SlideData, 'id'>) => {
  const newId = `slide-${Date.now()}`;
  const maxOrder = Math.max(...slidesData.map(slide => slide.order), 0);
  const newSlide: SlideData = {
    ...slideData,
    id: newId,
    order: maxOrder + 1,
    priority: slideData.priority || 'medium',
    showOnMobile: slideData.showOnMobile ?? true,
    showOnDesktop: slideData.showOnDesktop ?? true
  };
  
  slidesData.push(newSlide);
  window.dispatchEvent(new CustomEvent('slider-data-updated'));
  return newSlide;
};

export const deleteSlide = (id: string) => {
  const index = slidesData.findIndex(slide => slide.id === id);
  if (index !== -1) {
    slidesData.splice(index, 1);
    // Reorder remaining slides
    slidesData.forEach((slide, idx) => {
      slide.order = idx + 1;
    });
    window.dispatchEvent(new CustomEvent('slider-data-updated'));
    return true;
  }
  return false;
};

export const reorderSlides = (newOrder: SlideData[]) => {
  slidesData = newOrder.map((slide, index) => ({
    ...slide,
    order: index + 1
  }));
  window.dispatchEvent(new CustomEvent('slider-data-updated'));
};

export const toggleSlideStatus = (id: string) => {
  const index = slidesData.findIndex(slide => slide.id === id);
  if (index !== -1) {
    slidesData[index].isActive = !slidesData[index].isActive;
    window.dispatchEvent(new CustomEvent('slider-data-updated'));
    return slidesData[index].isActive;
  }
  return false;
};

// Bulk operations for admin
export const setMultipleSlideStatus = (ids: string[], status: boolean) => {
  let changed = false;
  ids.forEach(id => {
    const index = slidesData.findIndex(slide => slide.id === id);
    if (index !== -1) {
      slidesData[index].isActive = status;
      changed = true;
    }
  });
  
  if (changed) {
    window.dispatchEvent(new CustomEvent('slider-data-updated'));
  }
  return changed;
};

// Import/Export functions for backup
export const exportSliderData = (): string => {
  return JSON.stringify(slidesData, null, 2);
};

export const importSliderData = (jsonData: string): boolean => {
  try {
    const imported = JSON.parse(jsonData) as SlideData[];
    if (Array.isArray(imported)) {
      slidesData = imported;
      window.dispatchEvent(new CustomEvent('slider-data-updated'));
      return true;
    }
  } catch (error) {
    console.error('Error importing slider data:', error);
  }
  return false;
};

// Statistics for admin dashboard
export const getSliderStats = () => {
  const total = slidesData.length;
  const active = slidesData.filter(slide => slide.isActive).length;
  const inactive = total - active;
  const highPriority = slidesData.filter(slide => slide.priority === 'high').length;
  const mediumPriority = slidesData.filter(slide => slide.priority === 'medium').length;
  const lowPriority = slidesData.filter(slide => slide.priority === 'low').length;
  
  return {
    total,
    active,
    inactive,
    highPriority,
    mediumPriority,
    lowPriority
  };
};