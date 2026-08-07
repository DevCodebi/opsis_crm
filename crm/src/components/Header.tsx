"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/access";

type HeaderProps = {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

export function Header({ onMenuClick, onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const { currentUser, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-[rgba(93,112,139,0.2)] bg-[#1A1D25]/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile: abre drawer */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2.5 -ml-1 rounded-xl text-[#9ca3af] hover:text-[#EAEAEA] hover:bg-[rgba(93,112,139,0.15)] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop: recolhe / expande sidebar */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:inline-flex p-2.5 -ml-1 rounded-xl text-[#9ca3af] hover:text-[#EAEAEA] hover:bg-[rgba(93,112,139,0.15)] transition-colors"
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="md:hidden flex flex-col leading-tight min-w-0">
          <span className="text-[#344B6F] font-semibold text-sm truncate">Home Ótica</span>
          <span className="text-[#9ca3af] text-[10px]">Ópsis CRM</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <span className="text-[#9ca3af] text-xs sm:text-sm truncate text-right">
          <span className="hidden sm:inline">Olá, </span>
          <span className="text-[#EAEAEA] font-medium">{currentUser.name}</span>{" "}
          <span className="hidden sm:inline text-[#9ca3af]">
            ({ROLE_LABELS[currentUser.role] ?? currentUser.role})
          </span>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[#9ca3af] hover:text-[#EAEAEA] text-sm font-medium transition-colors shrink-0 p-2 sm:p-0"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
