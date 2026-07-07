// Cliente Supabase com service_role key — SÓ pode ser importado em código
// que roda no servidor (API routes em src/app/api/**). Se este arquivo for
// importado por engano em um componente "use client", a service_role key
// vazaria para o navegador. Por isso ele nunca deve ter "use client" no topo.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Supabase admin: defina SUPABASE_SERVICE_ROLE_KEY em crm/.env.local (não expor com NEXT_PUBLIC_)"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
