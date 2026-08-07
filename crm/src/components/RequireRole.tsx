"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { hasRole } from "@/lib/access";
import type { UserRole } from "@/types";

type RequireRoleProps = {
  allow: UserRole[];
  children: React.ReactNode;
  /** Para onde redirecionar se não tiver permissão (padrão: dashboard) */
  fallbackHref?: string;
};

/**
 * Protege uma página por papel. O menu já esconde links, mas isso
 * impede acesso direto pela URL (ex: vendedor abrir /clientes).
 */
export function RequireRole({ allow, children, fallbackHref = "/" }: RequireRoleProps) {
  const { currentUser, initialized } = useStore();
  const router = useRouter();
  const allowed = hasRole(currentUser?.role, allow);

  useEffect(() => {
    if (initialized && currentUser && !allowed) {
      router.replace(fallbackHref);
    }
  }, [initialized, currentUser, allowed, router, fallbackHref]);

  if (!initialized || !currentUser) {
    return (
      <div className="py-12 text-center text-[#9ca3af]">Carregando...</div>
    );
  }

  if (!allowed) {
    return (
      <div className="py-12 text-center text-[#9ca3af]">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return <>{children}</>;
}
