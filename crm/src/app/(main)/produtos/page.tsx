"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Product, ProductType } from "@/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { ModalLarge } from "@/components/Modal";

const TYPE_LABELS: Record<ProductType, string> = {
  armacao: "Armação",
  lente: "Lente",
  acessorio: "Acessório",
};

// Tipos de armação (mercado óptico)
const FRAME_TYPES = [
  "Acetato",
  "Metal",
  "Fino de nylon",
  "TR90",
  "Flutuante",
  "Titânio",
  "Monel",
  "Policarbonato",
  "Outro",
];

// Tipos de lente (mercado óptico)
const LENS_TYPES = [
  "Visão simples (monofocal)",
  "Bifocal",
  "Multifocal / Progressiva",
  "Acabada",
  "Orgânica",
  "Anti-UV",
  "Outro",
];

// Tipos de tratamento (mercado óptico)
const TREATMENT_TYPES = [
  "Antirreflexo",
  "Coloração",
  "Fotossensível (fotocromática)",
  "Anti-risco",
  "Hidrofóbico",
  "Blue cut / Filtro azul",
  "Sem tratamento",
  "Outro",
];

export default function ProdutosPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setForm({
      name: "",
      type: "armacao",
      price: 0,
      cost: undefined,
      stock: 0,
      minStock: undefined,
      sku: "",
      description: "",
      supplier: "",
      frameType: "",
      lensType: "",
      treatmentType: "",
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({ ...p });
    setEditing(p);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || form.price == null) return;
    const payload = {
      name: form.name!,
      type: (form.type as ProductType) || "armacao",
      sku: form.sku,
      description: form.description,
      price: Number(form.price) || 0,
      cost: form.cost != null ? Number(form.cost) : undefined,
      stock: Number(form.stock) || 0,
      minStock: form.minStock != null ? Number(form.minStock) : undefined,
      supplier: form.supplier?.trim() || undefined,
      frameType: form.frameType?.trim() || undefined,
      lensType: form.lensType?.trim() || undefined,
      treatmentType: form.treatmentType?.trim() || undefined,
    };
    if (editing) {
      updateProduct(editing.id, payload);
    } else {
      addProduct(payload);
    }
    setShowForm(false);
    setForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este produto?")) deleteProduct(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-home-light">Produtos</h1>
          <p className="text-home-muted mt-1">Cadastro de armações, lentes e acessórios</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-home-muted" />
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
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
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Tipo</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">SKU</th>
                <th className="text-right py-4 px-5 text-home-muted font-medium text-sm">Custo</th>
                <th className="text-right py-4 px-5 text-home-muted font-medium text-sm">Venda</th>
                <th className="text-right py-4 px-5 text-home-muted font-medium text-sm">Estoque</th>
                <th className="text-right py-4 px-5 text-home-muted font-medium text-sm">Mín.</th>
                <th className="w-24 py-4 px-5 text-right text-home-muted font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-home-gray/20 table-row-hover">
                  <td className="py-3.5 px-5 text-home-light">{p.name}</td>
                  <td className="py-3.5 px-5 text-home-muted">{TYPE_LABELS[p.type]}</td>
                  <td className="py-3.5 px-5 text-home-muted">{p.sku || "—"}</td>
                  <td className="py-3.5 px-5 text-right text-home-muted">
                    {p.cost != null ? `R$ ${p.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right text-home-light">
                    R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-5 text-right text-home-muted">{p.stock}</td>
                  <td className="py-3.5 px-5 text-right text-home-muted">
                    {p.minStock != null ? p.minStock : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
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
            {search ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
          </div>
        )}
      </div>

      <ModalLarge open={showForm} onClose={() => { setShowForm(false); setForm({}); }} className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-home-light mb-4">
              {editing ? "Editar produto" : "Novo produto"}
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
                  placeholder="Ex: Armação Titanium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Tipo</label>
                <select
                  value={form.type ?? "armacao"}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))}
                  className="input-field"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={form.supplier ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do fornecedor"
                />
              </div>
              {(form.type ?? "armacao") === "armacao" && (
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Tipo de armação</label>
                  <select
                    value={form.frameType ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, frameType: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecione</option>
                    {FRAME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
              {(form.type ?? "armacao") === "lente" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-home-muted mb-1">Tipo de lente</label>
                    <select
                      value={form.lensType ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, lensType: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      {LENS_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-home-muted mb-1">Tipo de tratamento</label>
                    <select
                      value={form.treatmentType ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, treatmentType: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      {TREATMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="input-field"
                  placeholder="Código do produto"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Preço de custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="input-field"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Preço de venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Estoque mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="input-field"
                    placeholder="Alerta"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Descrição</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field min-h-[80px]"
                  placeholder="Observações"
                />
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
      </ModalLarge>
    </div>
  );
}
