"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useStore } from "@/lib/store";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
};

export function Header() {
  const { currentUser, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  if (!currentUser) return null;

  return (
    <header className="h-14 flex items-center justify-end gap-4 px-6 border-b border-[rgba(93,112,139,0.2)] bg-[#1A1D25]/90 backdrop-blur-sm">
      <span className="text-[#9ca3af] text-sm">
        Olá, <span className="text-[#EAEAEA] font-medium">{currentUser.name}</span>{" "}
        <span className="text-[#9ca3af]">({ROLE_LABELS[currentUser.role] ?? currentUser.role})</span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-[#9ca3af] hover:text-[#EAEAEA] text-sm font-medium transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </header>
  );
}
