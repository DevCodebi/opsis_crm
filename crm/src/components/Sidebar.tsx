"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  UserCog,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/types";

const nav: { href: string; label: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "vendedor"] },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["admin", "gerente"] },
  { href: "/produtos", label: "Produtos", icon: Package, roles: ["admin", "gerente"] },
  { href: "/receituario", label: "Receituário", icon: FileText, roles: ["admin", "gerente"] },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart, roles: ["admin", "gerente", "vendedor"] },
  { href: "/usuarios", label: "Usuários", icon: UserCog, roles: ["admin"] },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const allowedNav = currentUser ? nav.filter((n) => n.roles.includes(currentUser.role)) : [];

  // Fecha o menu mobile ao trocar de rota (só pathname — onClose é estável o bastante aqui)
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fechar apenas na navegação
  }, [pathname]);

  // Trava o scroll do body quando o drawer está aberto no mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Overlay — só mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] flex flex-col bg-[#1e2430] border-r border-[rgba(93,112,139,0.2)] transform transition-transform duration-300 ease-out md:static md:z-auto md:w-56 md:max-w-none md:translate-x-0 md:min-h-screen ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu principal"
      >
        <div className="p-5 border-b border-[rgba(93,112,139,0.2)] flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-3 group min-w-0" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-[#344B6F]/30 shrink-0">
              HO
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[#344B6F] font-semibold text-base truncate">Home Ótica</span>
              <span className="text-[#9ca3af] text-[11px]">by Ópsis CRM</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2.5 -mr-1 rounded-xl text-[#9ca3af] hover:text-[#EAEAEA] hover:bg-[rgba(93,112,139,0.15)] transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allowedNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-[#EAEAEA] bg-[rgba(52,75,111,0.25)]"
                    : "text-[#9ca3af] hover:bg-[rgba(93,112,139,0.12)] hover:text-[#EAEAEA]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[rgba(93,112,139,0.2)] text-center">
          <span className="text-[10px] text-[#5d708b]">Ópsis CRM</span>
        </div>
      </aside>
    </>
  );
}
