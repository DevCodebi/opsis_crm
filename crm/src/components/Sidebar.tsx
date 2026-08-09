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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLES_CADASTRO, ROLES_GESTAO, ROLES_USUARIOS, ROLES_VENDAS } from "@/lib/access";
import type { UserRole } from "@/types";

const nav: { href: string; label: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ROLES_VENDAS },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ROLES_CADASTRO },
  { href: "/produtos", label: "Produtos", icon: Package, roles: ROLES_GESTAO },
  { href: "/receituario", label: "Receituário", icon: FileText, roles: ROLES_CADASTRO },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart, roles: ROLES_VENDAS },
  { href: "/usuarios", label: "Usuários", icon: UserCog, roles: ROLES_USUARIOS },
];

type SidebarProps = {
  /** Drawer aberto no mobile */
  open: boolean;
  onClose: () => void;
  /** Sidebar recolhida no desktop (só ícones) */
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const allowedNav = currentUser ? nav.filter((n) => n.roles.includes(currentUser.role)) : [];

  // Fecha o menu mobile ao trocar de rota
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1e2430] border-r border-[rgba(93,112,139,0.2)] transform transition-all duration-300 ease-out md:static md:z-auto md:translate-x-0 md:min-h-screen ${
          open ? "translate-x-0" : "-translate-x-full"
        } w-64 max-w-[85vw] ${collapsed ? "md:w-[4.5rem]" : "md:w-56"} md:max-w-none`}
        aria-label="Menu principal"
      >
        <div
          className={`border-b border-[rgba(93,112,139,0.2)] flex items-center gap-2 ${
            collapsed ? "md:flex-col md:p-3 md:gap-3" : "p-4 md:p-5 justify-between"
          } p-4`}
        >
          <Link
            href="/"
            className={`flex items-center gap-3 group min-w-0 ${collapsed ? "md:justify-center" : ""}`}
            onClick={onClose}
            title="Home Ótica"
          >
            <div className="w-10 h-10 rounded-xl bg-[#344B6F] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-[#344B6F]/30 shrink-0">
              HO
            </div>
            <div className={`flex flex-col leading-tight min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <span className="text-[#344B6F] font-semibold text-base truncate">Home Ótica</span>
              <span className="text-[#9ca3af] text-[11px]">by Ópsis CRM</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {/* Recolher / expandir — desktop */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:inline-flex p-2.5 rounded-xl text-[#9ca3af] hover:text-[#EAEAEA] hover:bg-[rgba(93,112,139,0.15)] transition-colors"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Fechar — mobile */}
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-2.5 -mr-1 rounded-xl text-[#9ca3af] hover:text-[#EAEAEA] hover:bg-[rgba(93,112,139,0.15)] transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto space-y-0.5 ${collapsed ? "md:p-2" : "p-3"} p-3`}>
          {allowedNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={label}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? "md:justify-center md:px-0 md:py-3 md:gap-0" : "gap-3 px-4 py-3.5"
                } gap-3 px-4 py-3.5 ${
                  isActive
                    ? "text-[#EAEAEA] bg-[rgba(52,75,111,0.25)]"
                    : "text-[#9ca3af] hover:bg-[rgba(93,112,139,0.12)] hover:text-[#EAEAEA]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-[rgba(93,112,139,0.2)] text-center p-3 ${collapsed ? "md:px-1" : ""}`}>
          <span className={`text-[10px] text-[#5d708b] ${collapsed ? "md:hidden" : ""}`}>
            Ópsis CRM
          </span>
          {collapsed && (
            <span className="hidden md:inline text-[9px] text-[#5d708b] tracking-wide" title="Ópsis CRM">
              Ópsis
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
