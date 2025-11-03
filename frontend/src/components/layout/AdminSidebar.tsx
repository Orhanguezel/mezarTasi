// =============================================================
// FILE: src/components/layout/AdminSidebar.tsx
// =============================================================
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3, Package, Settings, LogOut, Home, FileText, Menu, MessageSquare, FolderTree, Megaphone,
} from "lucide-react";
import { metahub } from "@/integrations/metahub/client";

// ✅ 'categories' de aktif sekmelere eklendi
export type ActiveTab =
  | "products"
  | "slider"
  | "keywords"
  | "campaigns"
  | "categories" 
  | "subcategories"  
  | "pages"
  | "menu"
  | "popups";



type MenuValue =
  | "products"
  | "slider"
  | "campaigns"
  | "categories"
  | "subcategories" 
  | "blog"
  | "pages"
  | "menu"
  | "popups"
  | "settings";

const menuGroups: {
  label: string;
  items: { title: string; icon: React.ComponentType<any>; value: MenuValue }[];
}[] = [
  {
    label: "Genel",
    items: [
      { title: "Dashboard", icon: BarChart3, value: "products" },
      { title: "Ana Sayfa Ayarları", icon: Home, value: "slider" },
      { title: "Kampanyalar", icon: Megaphone, value: "campaigns" }
    ],
  },
  {
    label: "İçerik Yönetimi",
    items: [
      { title: "Ürünler", icon: Package, value: "products" },
      { title: "Kategoriler", icon: FolderTree, value: "categories" },
      { title:"Alt Kategoriler",icon:FolderTree,  value:"subcategories"},
      { title: "Sayfalar", icon: FileText, value: "pages" },
      { title: "Menü", icon: Menu, value: "menu" },
      { title: "Popup'lar", icon: MessageSquare, value: "popups" }
    ],
  },
  { label: "Ayarlar", items: [{ title: "Genel Ayarlar", icon: Settings, value: "settings" }] },
];

// ✅ Menü -> Sekme eşlemesi (aktif olanlar)
const MENU_TO_TAB: Partial<Record<MenuValue, ActiveTab>> = {
  products: "products",
  slider: "slider",
  campaigns: "campaigns",
  categories: "categories",
  subcategories: "subcategories",
  pages: "pages",
  menu: "menu",
  popups: "popups",
};



const NavButton = React.forwardRef<
  HTMLButtonElement,
  { isActive?: boolean; onClick?: () => void; className?: string; children: React.ReactNode; titleWhenCollapsed?: string }
>(({ isActive, onClick, className, children, titleWhenCollapsed }, ref) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarMenuButton
      asChild
      isActive={!!isActive}
      className={[isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white", className || ""].join(" ")}
    >
      <button ref={ref} type="button" onClick={onClick} title={collapsed ? titleWhenCollapsed : undefined} aria-label={collapsed ? titleWhenCollapsed : undefined}>
        {children}
      </button>
    </SidebarMenuButton>
  );
});
NavButton.displayName = "NavButton";

export interface AdminSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (v: ActiveTab) => void;
  onNavigateHome?: () => void;
  onNavigateLogin?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onNavigateHome, onNavigateLogin }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const matchesActive = (v: MenuValue, tab: ActiveTab) => (MENU_TO_TAB[v] ?? null) === tab;

  const handleClick = (v: MenuValue) => {
    const tab = MENU_TO_TAB[v];
    if (tab) onTabChange(tab);
    else toast.info("Bu bölüm yakında.");
  };

  const handleLogout = async () => {
    try {
      await metahub.auth.signOut();
      onNavigateLogin?.();
    } catch {
      toast.error("Çıkış yapılırken bir hata oluştu.");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground border-sidebar-border">
      <SidebarContent className="h-dvh">
        <div className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">
              <span className="text-sm font-bold">MZ</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold leading-none">Admin Panel</h2>
                <p className="text-xs text-white/60">Mezar Taşı</p>
              </div>
            )}
          </div>
        </div>

        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-white/60">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = matchesActive(item.value, activeTab);
                  return (
                    <SidebarMenuItem key={item.value}>
                      <NavButton isActive={isActive} onClick={() => handleClick(item.value)} titleWhenCollapsed={item.title}>
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <div className="mt-auto space-y-2 border-t border-sidebar-border p-3 sm:p-4">
          <NavButton onClick={() => onNavigateHome?.()} titleWhenCollapsed="Ana Sayfaya Dön">
            <Home className="h-4 w-4" />
            {!isCollapsed && <span>Ana Sayfaya Dön</span>}
          </NavButton>
          <NavButton onClick={handleLogout} className="text-red-300 hover:bg-red-500/10 hover:text-red-200" titleWhenCollapsed="Çıkış Yap">
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </NavButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
