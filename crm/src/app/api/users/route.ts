import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// ------------------------------------------------------------------------
// Todas as rotas abaixo usam a service_role key (ignora RLS), por isso
// TODA requisição precisa provar que quem está chamando é um admin logado.
// O client (store.tsx) manda o access_token da sessão atual no header
// Authorization; aqui validamos esse token e checamos o papel do usuário.
// ------------------------------------------------------------------------
async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return { error: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin" || profile.status !== "ativo") {
    return { error: NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 }) };
  }

  return { userId: userData.user.id };
}

function siteUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

// Convida um funcionário por e-mail: cria o usuário no Supabase Auth (sem
// senha) e dispara automaticamente o e-mail de convite com um link de
// ativação. O próprio funcionário define a senha na primeira vez que entra
// (ver src/app/definir-senha/page.tsx). O admin nunca sabe/define a senha
// de outra pessoa — é a prática recomendada para SaaS e CRMs.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, email, role } = body ?? {};

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
    }

    const redirectTo = `${siteUrl(request)}/definir-senha`;

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    );

    if (inviteError || !invited?.user) {
      return NextResponse.json(
        { error: inviteError?.message ?? "Erro ao enviar convite." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: invited.user.id,
          name,
          email,
          role: role || "vendedor",
          status: "convidado",
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (profileError) {
      // Reverte o convite se o profile falhar, pra não deixar um usuário
      // "órfão" no Auth sem perfil correspondente.
      await supabaseAdmin.auth.admin.deleteUser(invited.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Reenvia convite (usuário ainda em status "convidado") ou envia link de
// redefinição de senha (usuário já ativo). Nunca define senha diretamente.
export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, email, action } = body ?? {};
    if (!id || !email || !action) {
      return NextResponse.json({ error: "id, email e action são obrigatórios." }, { status: 400 });
    }

    const redirectTo = `${siteUrl(request)}/definir-senha`;

    if (action === "resend_invite") {
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error) {
        return NextResponse.json(
          { error: error.message || "Não foi possível reenviar o convite. Se o usuário já ativou a conta, use 'Enviar link de redefinição'." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "send_reset") {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Atualiza dados do perfil (nome, papel, status). Senha nunca é definida
// por aqui — ver PUT acima para convite/redefinição.
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, name, email, role, status } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (role !== undefined) patch.role = role;
    if (status !== undefined) patch.status = status;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Remove o usuário do Supabase Auth; o profile é removido em cascata (FK ON DELETE CASCADE).
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }
    if (id === auth.userId) {
      return NextResponse.json({ error: "Você não pode excluir seu próprio usuário." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
