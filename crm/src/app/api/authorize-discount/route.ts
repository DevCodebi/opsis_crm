import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Mode = "self" | "manager";

/**
 * Autoriza desconto na tela de vendas sem trocar a sessão do vendedor.
 * - mode=self: valida a senha do usuário logado (libera até 5%).
 * - mode=manager: valida e-mail+senha de gerente/admin (libera acima de 5%).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!callerProfile || callerProfile.status !== "ativo") {
    return NextResponse.json({ error: "Usuário inativo ou sem perfil." }, { status: 403 });
  }

  let body: { mode?: Mode; password?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const mode: Mode = body.mode === "manager" ? "manager" : "self";
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  // Cliente efêmero: valida senha sem afetar a sessão do navegador.
  const ephemeral = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (mode === "self") {
    const email = (callerProfile.email || userData.user.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "E-mail do usuário não encontrado." }, { status: 400 });
    }

    const { data, error } = await ephemeral.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }
    await ephemeral.auth.signOut();

    return NextResponse.json({
      ok: true,
      level: "seller",
      authorizedBy: { id: callerProfile.id, name: callerProfile.email, role: callerProfile.role },
    });
  }

  // mode === "manager"
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Informe o e-mail do gerente/admin." }, { status: 400 });
  }

  const { data, error } = await ephemeral.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const { data: managerProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  await ephemeral.auth.signOut();

  if (!managerProfile || managerProfile.status !== "ativo") {
    return NextResponse.json({ error: "Usuário autorizador inativo ou sem perfil." }, { status: 403 });
  }
  if (managerProfile.role !== "admin" && managerProfile.role !== "gerente") {
    return NextResponse.json(
      { error: "Desconto acima de 5% exige autorização de gerente ou administrador." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    level: "manager",
    authorizedBy: {
      id: managerProfile.id,
      name: managerProfile.name,
      role: managerProfile.role,
    },
  });
}
