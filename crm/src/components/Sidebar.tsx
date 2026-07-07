"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  UserCog,
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

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const allowedNav = currentUser ? nav.filter((n) => n.roles.includes(currentUser.role)) : [];

  return (
    <aside className="w-56 min-h-screen flex flex-col bg-[#1e2430] border-r border-[rgba(93,112,139,0.2)]">
      <div className="p-5 border-b border-[rgba(93,112,139,0.2)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#344B6F] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-[#344B6F]/30">
            HO
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[#344B6F] font-semibold text-base">Home Ótica</span>
            <span className="text-[#9ca3af] text-[11px]">by Ópsis CRM</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {allowedNav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
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
  );
}
