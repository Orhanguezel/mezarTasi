import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Slide } from "../types";
import { SliderDialog } from "../Dialogs/SliderDialog";

type Props = { slides: Slide[]; setSlides: (arr: Slide[]) => void };

export const TabsSliders: React.FC<Props> = ({ slides, setSlides }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);

  const onCreate = () => { setEditing(null); setOpen(true); };
  const onEdit = (s: Slide) => { setEditing(s); setOpen(true); };
  const onDelete = (id: Slide["id"]) => {
    setSlides(slides.filter(s => s.id !== id));
    toast.success("Slider silindi");
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Slider
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border text-[12px] uppercase tracking-wide text-muted-foreground">
          <div className="col-span-6 sm:col-span-5">Başlık</div>
          <div className="col-span-3 sm:col-span-2">Sıra</div>
          <div className="hidden sm:block sm:col-span-3">Durum</div>
          <div className="col-span-3 sm:col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {slides.map((slide) => (
            <div key={slide.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-muted/30">
              <div className="col-span-12 sm:col-span-5 font-medium">{slide.title}</div>
              <div className="col-span-6 sm:col-span-2 text-foreground/80">{slide.order}</div>

              <div className="hidden sm:flex sm:col-span-3">
                <Badge variant={slide.isActive ? "default" : "secondary"}>
                  <span className={`mr-2 inline-block size-2 rounded-full ${slide.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  {slide.isActive ? "Aktif" : "Pasif"}
                </Badge>
              </div>

              <div className="col-span-6 sm:col-span-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(slide)}>
                  <Edit className="w-4 h-4 mr-1" /> Düzenle
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(slide.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Sil
                </Button>
              </div>
            </div>
          ))}

          {slides.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>

      <SliderDialog
        open={open}
        initialValue={editing}
        onOpenChange={setOpen}
        onSave={(payload) => {
          if (editing) {
            setSlides(slides.map(s => (s.id === editing.id ? { ...editing, ...payload } : s)));
            toast.success("Slider güncellendi");
          } else {
            setSlides([...slides, { id: Date.now().toString(), ...payload }]);
            toast.success("Yeni slider eklendi");
          }
        }}
      />
    </>
  );
};
