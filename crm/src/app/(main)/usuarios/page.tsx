"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { User, UserRole, UserStatus } from "@/types";
import { Plus, Pencil, Trash2, Search, UserCog, Mail, KeyRound } from "lucide-react";
import { Modal } from "@/components/Modal";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  convidado: "Convite pendente",
  ativo: "Ativo",
  inativo: "Inativo",
};

const STATUS_CLASSES: Record<UserStatus, string> = {
  ativo: "bg-green-500/20 text-green-400 border border-green-500/30",
  convidado: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  inativo: "bg-home-gray/30 text-home-muted border border-home-gray/40",
};

export default function UsuariosPage() {
  const router = useRouter();
  const { users, addUser, updateUser, deleteUser, resendInvite, sendPasswordReset, currentUser } = useStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (currentUser && currentUser.role !== "admin") {
    return null;
  }
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({
      name: "",
      email: "",
      role: "vendedor",
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setForm({ ...u });
    setEditing(u);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim()) return;
    setSaving(true);
    if (editing) {
      await updateUser(editing.id, {
        name: form.name,
        role: form.role as UserRole,
        status: form.status,
      });
    } else {
      if (users.some((u) => u.email.toLowerCase() === form.email!.toLowerCase())) {
        alert("Já existe um usuário com este e-mail.");
        setSaving(false);
        return;
      }
      await addUser({
        name: form.name!,
        email: form.email!,
        role: (form.role as UserRole) || "vendedor",
      });
    }
    setSaving(false);
    setShowForm(false);
    setForm({});
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir seu próprio usuário.");
      return;
    }
    if (confirm("Excluir este usuário? Ele perderá o acesso ao sistema imediatamente.")) {
      await deleteUser(id);
    }
  };

  const handleResendInvite = async (u: User) => {
    const ok = await resendInvite(u.id, u.email);
    if (ok) {
      setActionMessage(`Convite reenviado para ${u.email}.`);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  const handleSendReset = async (u: User) => {
    if (!confirm(`Enviar um link de redefinição de senha para ${u.email}?`)) return;
    const ok = await sendPasswordReset(u.id, u.email);
    if (ok) {
      setActionMessage(`Link de redefinição enviado para ${u.email}.`);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-home-light">Usuários</h1>
          <p className="text-home-muted mt-1">Gerenciamento de usuários e níveis de acesso</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Convidar usuário
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
          {actionMessage}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-home-muted" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </div>

      <div className="card overflow-hidden p-0 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-home-gray/30">
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Nome</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">E-mail</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Nível</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Status</th>
                <th className="w-36 py-4 px-5 text-right text-home-muted font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-home-gray/20 table-row-hover">
                  <td className="py-3.5 px-5 text-home-light">{u.name}</td>
                  <td className="py-3.5 px-5 text-home-muted">{u.email}</td>
                  <td className="py-3.5 px-5 text-home-muted">{ROLE_LABELS[u.role]}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_CLASSES[u.status]}`}>
                      {STATUS_LABELS[u.status]}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    {u.status === "convidado" && (
                      <button
                        type="button"
                        onClick={() => handleResendInvite(u)}
                        title="Reenviar convite"
                        className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    {u.status === "ativo" && (
                      <button
                        type="button"
                        onClick={() => handleSendReset(u)}
                        title="Enviar link de redefinição de senha"
                        className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      title="Editar"
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === currentUser?.id}
                      title="Excluir"
                      className="p-2 text-home-muted hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-home-muted">
            {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm({}); }} className="p-6">
        <h2 className="text-lg font-semibold text-home-light mb-5 flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          {editing ? "Editar usuário" : "Convidar usuário"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-home-muted mb-1">Nome *</label>
            <input
              type="text"
              required
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-home-muted mb-1">E-mail *</label>
            <input
              type="email"
              required
              value={form.email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="email@exemplo.com"
              readOnly={!!editing}
            />
            {editing ? (
              <p className="text-xs text-home-muted mt-1">E-mail não pode ser alterado.</p>
            ) : (
              <p className="text-xs text-home-muted mt-1">
                Um e-mail de convite será enviado para esse endereço com um link para o usuário definir a própria senha.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-home-muted mb-1">Nível de acesso</label>
            <select
              value={form.role ?? "vendedor"}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="input-field"
            >
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <p className="text-xs text-home-muted mt-1">
              Admin: acesso total. Gerente: produtos, relatórios, dashboard. Vendedor: apenas vendas.
            </p>
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-home-muted mb-1">Status</label>
              <select
                value={form.status ?? "ativo"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
                className="input-field"
              >
                {(["convidado", "ativo", "inativo"] as UserStatus[]).map((v) => (
                  <option key={v} value={v}>{STATUS_LABELS[v]}</option>
                ))}
              </select>
              <p className="text-xs text-home-muted mt-1">
                Defina como "Inativo" para bloquear o acesso sem excluir o usuário.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Salvando..." : editing ? "Salvar" : "Enviar convite"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({}); }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
