import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Ativa o próprio perfil após definir a senha (convite / recovery).
 * Usa service_role porque a tabela profiles não tem política de UPDATE
 * para o cliente — e is_active_user() exige status "ativo", o que
 * impedia o convidado de se ativar sozinho via RLS.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const userId = userData.user.id;
    const now = new Date().toISOString();

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "ativo", updatedAt: now })
      .eq("id", userId)
      .neq("status", "inativo") // não reativa quem foi desligado pelo admin
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado ou inativo. Peça ao administrador." },
        { status: 403 }
      );
    }

    return NextResponse.json({ profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
