"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login, initialized, requestPasswordReset } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [loading, setLoading] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("E-mail ou senha inválidos. Verifique e tente novamente.");
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Informe seu e-mail para receber o link de redefinição.");
      return;
    }
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    // Sempre mostramos a mesma mensagem, exista ou não o e-mail cadastrado —
    // evita que alguém use esta tela para descobrir quais e-mails têm conta.
    setInfo("Se este e-mail estiver cadastrado, enviamos um link de redefinição de senha.");
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D25]">
        <div className="text-home-muted">Carregando...</div>
      </div>
    );
  }

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
          {!modoRecuperar ? (
            <>
              <h1 className="text-xl font-semibold text-[#EAEAEA] mb-2">Entrar</h1>
              <p className="text-[#9ca3af] text-sm mb-6">
                Use seu e-mail e senha para acessar o sistema.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Entrando..." : "Entrar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setModoRecuperar(true); setError(""); setInfo(""); }}
                  className="w-full text-center text-sm text-[#9ca3af] hover:text-[#EAEAEA] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-[#EAEAEA] mb-2">Recuperar senha</h1>
              <p className="text-[#9ca3af] text-sm mb-6">
                Informe seu e-mail. Se houver uma conta cadastrada, enviaremos um link para você definir uma nova senha.
              </p>
              <form onSubmit={handleRecuperar} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
                    {info}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
                <button
                  type="button"
                  onClick={() => { setModoRecuperar(false); setError(""); setInfo(""); }}
                  className="w-full text-center text-sm text-[#9ca3af] hover:text-[#EAEAEA] transition-colors"
                >
                  Voltar para o login
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
