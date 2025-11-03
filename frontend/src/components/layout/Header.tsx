import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSearch: (searchTerm: string) => void;
  searchTerm: string;
}

export function Header({ currentPage, onNavigate, onSearch, searchTerm }: HeaderProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKurumsalOpen, setIsKurumsalOpen] = useState(false);
  const [isDigerHizmetlerOpen, setIsDigerHizmetlerOpen] = useState(false);
  
  // Desktop dropdown states
  const [isDesktopKurumsalOpen, setIsDesktopKurumsalOpen] = useState(false);
  const [isDesktopDigerHizmetlerOpen, setIsDesktopDigerHizmetlerOpen] = useState(false);

  const handleSearch = () => {
    onSearch(localSearchTerm);
  };

  const handleMobileNavigation = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Menü kapatılırken accordion'ları da kapat
    if (isMobileMenuOpen) {
      setIsKurumsalOpen(false);
      setIsDigerHizmetlerOpen(false);
    }
  };

  const toggleKurumsal = () => {
    setIsKurumsalOpen(!isKurumsalOpen);
  };

  const toggleDigerHizmetler = () => {
    setIsDigerHizmetlerOpen(!isDigerHizmetlerOpen);
  };

  // Desktop dropdown handlers
  const handleDesktopKurumsalClick = () => {
    setIsDesktopKurumsalOpen(!isDesktopKurumsalOpen);
    setIsDesktopDigerHizmetlerOpen(false); // Close other dropdown
  };

  const handleDesktopDigerHizmetlerClick = () => {
    setIsDesktopDigerHizmetlerOpen(!isDesktopDigerHizmetlerOpen);
    setIsDesktopKurumsalOpen(false); // Close other dropdown
  };

  const handleDesktopNavigation = (page: string) => {
    onNavigate(page);
    setIsDesktopKurumsalOpen(false);
    setIsDesktopDigerHizmetlerOpen(false);
  };

  const handleDropdownNavigation = (page: string) => {
    onNavigate(page);
    setIsDesktopKurumsalOpen(false);
    setIsDesktopDigerHizmetlerOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInsideDropdown = target.closest('[data-dropdown]');
      
      if (!isInsideDropdown) {
        setIsDesktopKurumsalOpen(false);
        setIsDesktopDigerHizmetlerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDesktopKurumsalOpen(false);
        setIsDesktopDigerHizmetlerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-white relative">
      {/* Mobile Header */}
      <div className="md:hidden">
        {/* Top info bar - Same as desktop */}
        <div className="bg-teal-500 text-white py-1.5">
          <div className="px-4">
            <div className="flex items-center justify-center space-x-2 text-xs">
              <span className="text-white">Ürünlerimiz Hakkında Detaylı Bilgi İçin</span>
              <a href="tel:05334838971" className="hover:text-teal-200 transition-colors whitespace-nowrap">
                📞 0533 483 89 71
              </a>
              <button 
                onClick={() => window.location.href = 'tel:05334838971'}
                className="bg-white text-teal-500 px-2 py-0.5 rounded text-xs hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 font-medium transform active:scale-95 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                HEMEN ARA
              </button>
            </div>
          </div>
        </div>

        {/* Logo and search section */}
        <div className="bg-white px-4 py-4">
          {/* Logo */}
          <div className="flex items-center mb-4 cursor-pointer" onClick={() => handleMobileNavigation("home")}>
            <div className="w-12 h-8 bg-teal-500 rounded mr-3 flex items-center justify-center">
              <div className="w-8 h-6 bg-white rounded-sm relative">
                <div className="absolute inset-1 bg-teal-500 rounded-sm"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl text-teal-500 font-bold">mezarisim.com</h1>
              <p className="text-xs text-gray-500">online mezar yapımı</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex mb-4">
            <input
              type="text"
              value={localSearchTerm}
              onChange={handleInputChange}
              placeholder="Aradığınız Ürün Adını Yazınız"
              className="flex-1 px-3 py-2 border-2 border-teal-500 rounded-l focus:outline-none focus:border-teal-600 text-sm"
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              className="bg-teal-500 text-white px-4 py-2 rounded-r hover:bg-teal-600 active:bg-teal-700 transition-colors text-sm font-medium"
            >
              ARA
            </button>
          </div>

          {/* Menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="w-full bg-teal-500 text-white py-3 rounded flex items-center justify-center space-x-2 hover:bg-teal-600 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="font-medium">{isMobileMenuOpen ? "KAPAT" : "MENÜ"}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`bg-teal-500 border-t border-teal-400 transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 py-2">
            {/* Ana sayfa */}
            <button 
              onClick={() => handleMobileNavigation("home")}
              className={`w-full text-left py-3 px-2 border-b border-teal-400 font-medium text-white hover:bg-teal-600 transition-colors ${
                currentPage === "home" ? "bg-teal-600" : ""
              }`}
            >
              ANASAYFA
            </button>

            {/* Kurumsal - Accordion */}
            <div className="border-b border-teal-400">
              <button 
                onClick={toggleKurumsal}
                className="w-full flex items-center justify-between py-3 px-2 font-medium text-white hover:bg-teal-600 transition-colors"
              >
                <span>KURUMSAL</span>
                {isKurumsalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isKurumsalOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="pl-4 pb-2">
                  <button 
                    onClick={() => handleMobileNavigation("about")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "about" ? "bg-teal-600" : ""
                    }`}
                  >
                    HAKKIMIZDA
                  </button>
                  <button 
                    onClick={() => handleMobileNavigation("mission")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "mission" ? "bg-teal-600" : ""
                    }`}
                  >
                    MİSYONUMUZ - VİZYONUMUZ
                  </button>
                  <button 
                    onClick={() => handleMobileNavigation("quality")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "quality" ? "bg-teal-600" : ""
                    }`}
                  >
                    KALİTE POLİTİKAMIZ
                  </button>
                  <button 
                    onClick={() => handleMobileNavigation("faq")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "faq" ? "bg-teal-600" : ""
                    }`}
                  >
                    S.S.S.
                  </button>
                </div>
              </div>
            </div>

            {/* Mezar Modelleri */}
            <button 
              onClick={() => handleMobileNavigation("pricing")}
              className={`w-full text-left py-3 px-2 border-b border-teal-400 font-medium text-white hover:bg-teal-600 transition-colors ${
                currentPage === "pricing" ? "bg-teal-600" : ""
              }`}
            >
              MEZAR MODELLERİ
            </button>

            {/* Mezar Baş Taşı Modelleri */}
            <button 
              onClick={() => handleMobileNavigation("models")}
              className={`w-full text-left py-3 px-2 border-b border-teal-400 font-medium text-white hover:bg-teal-600 transition-colors ${
                currentPage === "models" ? "bg-teal-600" : ""
              }`}
            >
              MEZAR BAŞ TAŞI MODELLERİ
            </button>

            {/* Mezar Aksesuarları */}
            <button 
              onClick={() => handleMobileNavigation("accessories")}
              className={`w-full text-left py-3 px-2 border-b border-teal-400 font-medium text-white hover:bg-teal-600 transition-colors ${
                currentPage === "accessories" ? "bg-teal-600" : ""
              }`}
            >
              MEZAR AKSESUARLARI
            </button>

            {/* Diğer Hizmetler - Accordion */}
            <div className="border-b border-teal-400">
              <button 
                onClick={toggleDigerHizmetler}
                className="w-full flex items-center justify-between py-3 px-2 font-medium text-white hover:bg-teal-600 transition-colors"
              >
                <span>DİĞER HİZMETLER</span>
                {isDigerHizmetlerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isDigerHizmetlerOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="pl-4 pb-2">
                  <button 
                    onClick={() => handleMobileNavigation("gardening")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "gardening" ? "bg-teal-600" : ""
                    }`}
                  >
                    MEZAR ÇİÇEKLENDİRME
                  </button>
                  <button 
                    onClick={() => handleMobileNavigation("soilfilling")}
                    className={`block w-full text-left py-2 px-2 text-sm text-white hover:bg-teal-600 transition-colors ${
                      currentPage === "soilfilling" ? "bg-teal-600" : ""
                    }`}
                  >
                    MEZAR TOPRAK DOLDURUMU
                  </button>
                </div>
              </div>
            </div>





            {/* İletişim */}
            <button 
              onClick={() => handleMobileNavigation("contact")}
              className={`w-full text-left py-3 px-2 border-b border-teal-400 font-medium text-white hover:bg-teal-600 transition-colors ${
                currentPage === "contact" ? "bg-teal-600" : ""
              }`}
            >
              İLETİŞİM
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        {/* Top info bar */}
        <div className="bg-teal-500 text-white py-2">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span className="text-white font-semibold">Ürünlerimiz Hakkında Detaylı Bilgi İçin</span>
              <a href="tel:05334838971" className="hover:text-teal-200 transition-colors font-bold whitespace-nowrap">
                📞 0533 483 89 71
              </a>
              <button 
                onClick={() => window.location.href = 'tel:05334838971'}
                className="bg-white text-teal-500 px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 transform active:scale-95 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                HEMEN ARA
              </button>
            </div>
          </div>
        </div>

        {/* Logo and Search Section */}
        <div className="bg-white py-6 border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <div className="flex items-center cursor-pointer" onClick={() => onNavigate("home")}>
                <div className="w-16 h-10 bg-teal-500 rounded mr-4 flex items-center justify-center">
                  <div className="w-10 h-7 bg-white rounded-sm relative">
                    <div className="absolute inset-1 bg-teal-500 rounded-sm"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl text-teal-500 font-bold">mezarisim.com</h1>
                  <p className="text-sm text-gray-500">online mezar yapımı</p>
                </div>
              </div>

              {/* Search Section */}
              <div className="flex-1 max-w-md ml-8">
                <div className="flex">
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={handleInputChange}
                    placeholder="Aradığınız Ürün Adını Yazınız"
                    className="flex-1 px-4 py-3 border-2 border-teal-500 rounded-l focus:outline-none focus:border-teal-600"
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-teal-500 text-white px-6 py-3 rounded-r hover:bg-teal-600 active:bg-teal-700 transition-colors font-bold"
                  >
                    ARA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="bg-teal-500 text-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handleDesktopNavigation("home")}
                  className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap ${
                    currentPage === "home" ? "bg-teal-600" : ""
                  }`}
                >
                  ANASAYFA
                </button>
                
                {/* KURUMSAL Dropdown */}
                <div className="relative" data-dropdown="kurumsal">
                  <button 
                    onClick={handleDesktopKurumsalClick}
                    className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap flex items-center space-x-1 ${
                      isDesktopKurumsalOpen ? "bg-teal-600" : ""
                    }`}
                  >
                    <span>KURUMSAL</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${
                      isDesktopKurumsalOpen ? "rotate-180" : ""
                    }`} />
                  </button>
                  
                  {isDesktopKurumsalOpen && (
                    <div className="absolute top-full left-0 bg-teal-500 border-2 border-teal-600 shadow-xl rounded-b-lg min-w-[240px] z-50">
                      <button 
                        onClick={() => handleDropdownNavigation("about")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 border-b border-teal-600 text-sm font-bold uppercase transition-colors ${
                          currentPage === "about" ? "bg-teal-600" : ""
                        }`}
                      >
                        HAKKIMIZDA
                      </button>
                      <button 
                        onClick={() => handleDropdownNavigation("mission")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 border-b border-teal-600 text-sm font-bold uppercase transition-colors ${
                          currentPage === "mission" ? "bg-teal-600" : ""
                        }`}
                      >
                        MİSYONUMUZ - VİZYONUMUZ
                      </button>
                      <button 
                        onClick={() => handleDropdownNavigation("quality")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 border-b border-teal-600 text-sm font-bold uppercase transition-colors ${
                          currentPage === "quality" ? "bg-teal-600" : ""
                        }`}
                      >
                        KALİTE POLİTİKAMIZ
                      </button>
                      <button 
                        onClick={() => handleDropdownNavigation("faq")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 text-sm font-bold uppercase transition-colors rounded-b-lg ${
                          currentPage === "faq" ? "bg-teal-600" : ""
                        }`}
                      >
                        S.S.S.
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleDesktopNavigation("pricing")}
                  className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap ${
                    currentPage === "pricing" ? "bg-teal-600" : ""
                  }`}
                >
                  MEZAR MODELLERİ
                </button>
                
                <button 
                  onClick={() => handleDesktopNavigation("models")}
                  className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap ${
                    currentPage === "models" ? "bg-teal-600" : ""
                  }`}
                >
                  MEZAR BAŞ TAŞI MODELLERİ
                </button>
                
                <button 
                  onClick={() => handleDesktopNavigation("accessories")}
                  className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap ${
                    currentPage === "accessories" ? "bg-teal-600" : ""
                  }`}
                >
                  MEZAR AKSESUARLARI
                </button>
                
                {/* DİĞER HİZMETLER Dropdown */}
                <div className="relative" data-dropdown="diger-hizmetler">
                  <button 
                    onClick={handleDesktopDigerHizmetlerClick}
                    className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap flex items-center space-x-1 ${
                      isDesktopDigerHizmetlerOpen ? "bg-teal-600" : ""
                    }`}
                  >
                    <span>DİĞER HİZMETLER</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${
                      isDesktopDigerHizmetlerOpen ? "rotate-180" : ""
                    }`} />
                  </button>
                  
                  {isDesktopDigerHizmetlerOpen && (
                    <div className="absolute top-full left-0 bg-teal-500 border-2 border-teal-600 shadow-xl rounded-b-lg min-w-[240px] z-50">
                      <button 
                        onClick={() => handleDropdownNavigation("gardening")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 border-b border-teal-600 text-sm font-bold uppercase transition-colors ${
                          currentPage === "gardening" ? "bg-teal-600" : ""
                        }`}
                      >
                        MEZAR ÇİÇEKLENDİRME
                      </button>
                      <button 
                        onClick={() => handleDropdownNavigation("soilfilling")}
                        className={`block w-full text-left py-3 px-4 text-white hover:bg-teal-600 text-sm font-bold uppercase transition-colors rounded-b-lg ${
                          currentPage === "soilfilling" ? "bg-teal-600" : ""
                        }`}
                      >
                        MEZAR TOPRAK DOLDURUMU
                      </button>
                    </div>
                  )}
                </div>
                


                
                <button 
                  onClick={() => handleDesktopNavigation("contact")}
                  className={`py-3 px-4 hover:bg-teal-600 transition-colors text-sm uppercase font-bold whitespace-nowrap ${
                    currentPage === "contact" ? "bg-teal-600" : ""
                  }`}
                >
                  İLETİŞİM
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}