"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AdminHeaderProps = {
  importInputRef: RefObject<HTMLInputElement>;
  onImportFile: (file?: File | null) => void;
  onImportClick: () => void;
  onExport: () => void;
  onBackHome: () => void;
};

export default function AdminHeader({
  importInputRef,
  onImportFile,
  onImportClick,
  onExport,
  onBackHome,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* relative: ortalama için absolute center kullanıyoruz */}
      <div className="relative flex h-14 w-full items-center px-4 sm:px-6">
        {/* Sol: Sidebar tetikleyici */}
        <SidebarTrigger className="text-gray-700 transition-colors hover:text-gray-900" />

        {/* Sağ: Aksiyonlar */}
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />

          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={onExport}>
            JSON Dışa Aktar
          </Button>

          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={onImportClick}>
            JSON İçe Aktar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-gray-600 hover:text-gray-900"
            onClick={onBackHome}
          >
            ← Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </header>
  );
}
