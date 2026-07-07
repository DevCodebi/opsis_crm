"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Client } from "@/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Modal } from "@/components/Modal";

export default function ClientesPage() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});
  const [showForm, setShowForm] = useState(false);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, ""))
  );

  const openNew = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      birthDate: "",
      sex: undefined,
      address: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setForm({ ...c });
    setEditing(c);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.phone?.trim()) return;
    const payload = {
      name: form.name!,
      email: form.email?.trim() || undefined,
      phone: form.phone!,
      cpf: form.cpf,
      birthDate: form.birthDate,
      sex: form.sex,
      address: form.address,
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
    };
    if (editing) {
      updateClient(editing.id, payload);
    } else {
      addClient(payload);
    }
    setShowForm(false);
    setForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este cliente?")) deleteClient(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-home-light">Clientes</h1>
          <p className="text-home-muted mt-1">Cadastro e gestão de clientes</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-home-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
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
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Telefone</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Nascimento</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Sexo</th>
                <th className="w-24 py-4 px-5 text-right text-home-muted font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-home-gray/20 table-row-hover"
                  style={{ animationDelay: `${i * 0.02}s` }}
                >
                  <td className="py-3.5 px-5 text-home-light">{c.name}</td>
                  <td className="py-3.5 px-5 text-home-muted">{c.email || "—"}</td>
                  <td className="py-3.5 px-5 text-home-muted">{c.phone}</td>
                  <td className="py-3.5 px-5 text-home-muted">
                    {c.birthDate ? new Date(c.birthDate).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-home-muted">{c.sex === "M" ? "Masculino" : c.sex === "F" ? "Feminino" : c.sex === "Outro" ? "Outro" : "—"}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-home-muted hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-colors duration-200"
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
            {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm({}); }} className="p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-home-light mb-5">
          {editing ? "Editar cliente" : "Novo cliente"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-home-muted mb-1">E-mail</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-field"
                placeholder="email@exemplo.com (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-home-muted mb-1">Telefone *</label>
              <input
                type="tel"
                required
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-home-muted mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                className="input-field"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-home-muted mb-1">Data de nascimento</label>
              <input
                type="date"
                value={form.birthDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-home-muted mb-1">Sexo</label>
            <select
              value={form.sex ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, sex: (e.target.value || undefined) as "M" | "F" | "Outro" | undefined }))}
              className="input-field"
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div className="border-t border-home-gray/30 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-home-light mb-3">Endereço</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-home-muted mb-1">CEP</label>
                  <input
                    type="text"
                    value={form.cep ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
                    className="input-field"
                    placeholder="00000-000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-home-muted mb-1">Logradouro</label>
                  <input
                    type="text"
                    value={form.logradouro ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
                    className="input-field"
                    placeholder="Rua, avenida..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-home-muted mb-1">Número</label>
                  <input
                    type="text"
                    value={form.numero ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                    className="input-field"
                    placeholder="Nº"
                  />
                </div>
                <div>
                  <label className="block text-xs text-home-muted mb-1">Complemento</label>
                  <input
                    type="text"
                    value={form.complemento ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))}
                    className="input-field"
                    placeholder="Apto, bloco..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-home-muted mb-1">Bairro</label>
                  <input
                    type="text"
                    value={form.bairro ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
                    className="input-field"
                    placeholder="Bairro"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-home-muted mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                    className="input-field"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-xs text-home-muted mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.uf ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
                    className="input-field"
                    placeholder="UF"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" className="btn-primary flex-1">
              {editing ? "Salvar" : "Cadastrar"}
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
