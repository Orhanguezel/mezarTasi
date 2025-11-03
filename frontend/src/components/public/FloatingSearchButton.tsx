import { useState } from "react";
import { Search, X } from "lucide-react";

export function FloatingSearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      console.log("Arama terimi:", searchTerm);
      // Burada arama işlemi yapılabilir
      setIsSearchOpen(false);
      setSearchTerm("");
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchTerm("");
    }
  };

  return (
    <>
      {/* Overlay */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSearch}
        />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg" style={{color: '#334155'}}>Ürün Arama</h3>
            <button
              onClick={toggleSearch}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Aradığınız ürün adını yazınız..."
              className="flex-1 px-3 py-2 border-2 rounded focus:outline-none"
              style={{borderColor: '#334155'}}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="text-white px-4 py-2 rounded hover:opacity-90 transition-all"
              style={{backgroundColor: '#334155'}}
            >
              ARA
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Popüler aramalar: Mezar taşı, Baş taşı, Çiçeklendirme</p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleSearch}
        className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-30 group hover:opacity-90"
        style={{backgroundColor: '#334155'}}
        aria-label="Ürün Ara"
      >
        <Search size={24} />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Ürün Ara
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </button>
    </>
  );
}