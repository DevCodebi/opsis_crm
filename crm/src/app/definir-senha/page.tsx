"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Tela usada tanto para o primeiro acesso (link de convite) quanto para
// recuperação de senha ("esqueci minha senha"). O Supabase Auth, ao abrir
// o link enviado por e-mail, já autentica a sessão automaticamente (lê o
// token que vem na URL) — aqui só esperamos essa sessão aparecer e depois
// deixamos a pessoa definir a nova senha.
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let resolved = false;

    const finish = (valid: boolean) => {
      if (resolved) return;
      resolved = true;
      setLinkValido(valid);
      setCheckingLink(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        finish(true);
      }
    });

    // Se depois de alguns segundos nenhuma sessão apareceu, o link é
    // inválido/expirado (ex: convite já usado, ou aberto sem o token).
    const timeout = setTimeout(() => finish(false), 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { data: userData, error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError("Não foi possível definir a senha: " + updateError.message);
      return;
    }

    // Ativa o perfil (cobre o caso de primeiro acesso vindo de convite;
    // para quem já estava ativo e só redefiniu a senha, não tem efeito).
    if (userData.user) {
      await supabase
        .from("profiles")
        .update({ status: "ativo", updatedAt: new Date().toISOString() })
        .eq("id", userData.user.id);
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D25] p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#344B6F] flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-[#344B6F]/30">
            HO
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[#344B6F] font-semibold text-xl">Home Ótica</span>
            <span className="text-[#9ca3af] text-xs">by Ópsis CRM</span>
          </div>
        </div>

        <div className="card p-8 border border-[rgba(93,112,139,0.25)] rounded-2xl shadow-xl">
          {checkingLink && (
            <p className="text-home-muted text-sm text-center py-6">Validando seu link...</p>
          )}

          {!checkingLink && !linkValido && (
            <>
              <h1 className="text-xl font-semibold text-[#EAEAEA] mb-2">Link inválido ou expirado</h1>
              <p className="text-[#9ca3af] text-sm mb-6">
                Este link de convite ou redefinição de senha não é mais válido. Peça ao administrador
                para reenviar o convite, ou solicite um novo link de redefinição na tela de login.
              </p>
              <button type="button" onClick={() => router.push("/login")} className="btn-primary w-full">
                Voltar para o login
              </button>
            </>
          )}

          {!checkingLink && linkValido && (
            <>
              <h1 className="text-xl font-semibold text-[#EAEAEA] mb-2 flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Defina sua senha
              </h1>
              <p className="text-[#9ca3af] text-sm mb-6">
                Escolha uma senha para acessar o sistema Home Ótica.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full"
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="input-field w-full"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? "Salvando..." : "Definir senha e entrar"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-[#5d708b] mt-6">Ópsis CRM</p>
      </div>
    </div>
  );
}
