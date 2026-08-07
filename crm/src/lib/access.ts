import type { UserRole } from "@/types";

/** Hierarquia: admin > gerente > vendedor */
export const ROLE_RANK: Record<UserRole, number> = {
  vendedor: 1,
  gerente: 2,
  admin: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
};

/** Quem pode ver/editar cadastros (clientes, produtos, receituário) */
export const ROLES_GESTAO: UserRole[] = ["admin", "gerente"];

/** Quem pode gerenciar usuários do sistema */
export const ROLES_USUARIOS: UserRole[] = ["admin"];

/** Quem acessa vendas e dashboard */
export const ROLES_VENDAS: UserRole[] = ["admin", "gerente", "vendedor"];

export function hasRole(userRole: UserRole | undefined | null, allowed: UserRole[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

export function isGerenteOrAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin" || role === "gerente";
}

export function isVendedor(role: UserRole | undefined | null): boolean {
  return role === "vendedor";
}
