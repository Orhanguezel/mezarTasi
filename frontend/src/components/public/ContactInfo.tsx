import { Phone, Mail, MapPin } from "lucide-react";

export function ContactInfo() {
  return (
    <section className="py-6 bg-teal-500">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div className="text-center text-white group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white/30 transition-colors">
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="text-xs md:text-sm mb-1 text-white/90">TELEFON</h3>
            <div className="space-y-0.5">
              <a 
                href="tel:05334838971" 
                className="block text-xs md:text-sm text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                0533 483 89 71
              </a>
            </div>
          </div>
          
          <div className="text-center text-white group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white/30 transition-colors">
              <Mail className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="text-xs md:text-sm mb-1 text-white/90">E-POSTA</h3>
            <div className="space-y-0.5">
              <p className="block text-xs md:text-sm text-white">
                mezarisim.com
              </p>
            </div>
          </div>
          
          <div className="text-center text-white group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white/30 transition-colors">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="text-xs md:text-sm mb-1 text-white/90">ADRES</h3>
            <div className="space-y-0.5">
              <p className="text-xs md:text-sm text-white/90 leading-tight">Hekimbaşı Mah. Yıldıztepe Cad.</p>
              <p className="text-xs md:text-sm text-white/90 leading-tight">No:41 Ümraniye/İstanbul</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}