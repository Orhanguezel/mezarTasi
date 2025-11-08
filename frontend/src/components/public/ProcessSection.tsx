// src/sections/AccessoryProcessSection.tsx
"use client";
import React from "react";

export default function ProcessSection() {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-teal-50 py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-teal-300 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-300 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-green-300 rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-7xl mx-auto">
          {/* SEO Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-6">
              <span className="text-2xl">🏺</span>
            </div>
            <h2 className="text-4xl text-gray-800 mb-6">
              <strong>İstanbul Mezar Aksesuarı</strong> Üretim Sürecimiz
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              <strong>Mezar şuluk, mezar vazosu, mezar sütunu</strong> ve
              <em> özel mezar aksesuarları</em> üretiminde
              <strong> 25+ yıl deneyim</strong>, <em>A+ malzemeler</em>.
            </p>
          </div>

          {/* 3 Adım */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* 1 */}
            <div className="group relative">
              <div className="hidden lg:block absolute top-24 left-full w-12 h-0.5 bg-gradient-to-r from-teal-500 to-transparent z-10" />
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">1</div>
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                    <span className="text-4xl">🎨</span>
                  </div>
                </div>
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-teal-600 transition-colors duration-300">
                    <strong>Tasarım ve Keşif</strong>
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                      Ücretsiz keşif, ölçüm, <strong>3D tasarım</strong> ve şeffaf teklif.
                    </p>
                    <div className="bg-teal-50 p-4 rounded-xl text-left text-xs text-gray-600 space-y-1">
                      <div>• Alan ölçümü ve yerleşim</div>
                      <div>• Malzeme seçimi (mermer/granit)</div>
                      <div>• 3D görselleştirme ve onay</div>
                      <div>• Net fiyatlandırma</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-xs text-green-700">
                      ⏱️ Süre: 1-2 gün • 🆓 Keşif Ücretsiz
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2 */}
            <div className="group relative">
              <div className="hidden lg:block absolute top-24 left-full w-12 h-0.5 bg-gradient-to-r from-blue-500 to-transparent z-10" />
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">2</div>
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                    <span className="text-4xl">🔨</span>
                  </div>
                </div>
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    <strong>Üretim ve İşçilik</strong>
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                      A+ malzeme, hassas kesim, el işçiliği, yüzey işlemleri ve kalite kontrol.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl text-left text-xs text-gray-600 space-y-1">
                      <div>• Malzeme tedarik/kontrol</div>
                      <div>• Kesim & şekillendirme</div>
                      <div>• El işçiliği detaylar</div>
                      <div>• Cilalama</div>
                      <div>• Final kalite onayı</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-xs text-orange-700">
                      ⏱️ Süre: 3-7 gün • 🛡️ 5-10 Yıl Garanti
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 */}
            <div className="group relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg z-10">3</div>
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-md">
                    <span className="text-4xl">📍</span>
                  </div>
                </div>
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl text-gray-800 mb-4 group-hover:text-green-600 transition-colors duration-300">
                    <strong>Kurulum ve Teslim</strong>
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                      Mezarlıkta profesyonel montaj, hizalama ve teslim belgesi.
                    </p>
                    <div className="bg-green-50 p-4 rounded-xl text-left text-xs text-gray-600 space-y-1">
                      <div>• Alan hazırlığı & temizlik</div>
                      <div>• Aksesuar montajı ve sabitleme</div>
                      <div>• Şuluk/vazo yerleşimi, sütun dikimi</div>
                      <div>• Final kontrolü ve teslim</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-700">
                      ⏱️ Süre: 1 gün • 🎯 Garantili Kurulum
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Özet */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-20 h-20 border border-white rounded-full" />
                <div className="absolute bottom-4 left-4 w-16 h-16 border border-white rounded-full" />
              </div>
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl mb-4">🏆 Güvenilir Üretim</h3>
                  <p className="text-lg opacity-90 max-w-4xl mx-auto">
                    Yüksek memnuniyet ile İstanbul’un tamamında hizmet veriyoruz.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-white/10 rounded-xl p-4"><div className="text-3xl mb-2">25+</div><div className="text-sm opacity-90">Yıl Deneyim</div></div>
                  <div className="bg-white/10 rounded-xl p-4"><div className="text-3xl mb-2">2000+</div><div className="text-sm opacity-90">Aksesuar</div></div>
                  <div className="bg-white/10 rounded-xl p-4"><div className="text-3xl mb-2">7/24</div><div className="text-sm opacity-90">Destek</div></div>
                  <div className="bg-white/10 rounded-xl p-4"><div className="text-3xl mb-2">%98</div><div className="text-sm opacity-90">Memnuniyet</div></div>
                </div>
                <div className="text-center mt-8">
                  <a href="tel:+905334838971" className="inline-block bg-white text-teal-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg text-lg">
                    📞 Hemen Arayın: 0533 483 89 71
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-12 text-center">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg text-gray-700 mb-3">🏙️ İstanbul Mezarlıklarında Hizmet</h4>
                <p className="text-sm text-gray-600">
                  Karaca Ahmet, Zincirlikuyu, Eyüp Sultan, Edirnekapı, Kilyos, Ulus ve tüm mezarlıklar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
