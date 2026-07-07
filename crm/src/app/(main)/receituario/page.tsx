"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Prescription, EyePrescription } from "@/types";
import { Plus, Pencil, Trash2, Search, FileText, Eye } from "lucide-react";
import { ModalLarge } from "@/components/Modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const emptyEye: EyePrescription = {};

function EyeFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: EyePrescription;
  onChange: (v: EyePrescription) => void;
}) {
  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-home-blue">{label}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-home-muted mb-1">Esférico (SPH)</label>
          <input
            type="number"
            step="0.25"
            value={value.sph ?? ""}
            onChange={(e) => onChange({ ...value, sph: e.target.value ? Number(e.target.value) : undefined })}
            className="input-field text-sm"
            placeholder="-"
          />
        </div>
        <div>
          <label className="block text-xs text-home-muted mb-1">Cilíndrico (CYL)</label>
          <input
            type="number"
            step="0.25"
            value={value.cyl ?? ""}
            onChange={(e) => onChange({ ...value, cyl: e.target.value ? Number(e.target.value) : undefined })}
            className="input-field text-sm"
            placeholder="-"
          />
        </div>
        <div>
          <label className="block text-xs text-home-muted mb-1">Eixo (AXIS) °</label>
          <input
            type="number"
            min="1"
            max="180"
            value={value.axis ?? ""}
            onChange={(e) => onChange({ ...value, axis: e.target.value ? Number(e.target.value) : undefined })}
            className="input-field text-sm"
            placeholder="1-180"
          />
        </div>
        <div>
          <label className="block text-xs text-home-muted mb-1">Adição (ADD)</label>
          <input
            type="number"
            step="0.25"
            value={value.add ?? ""}
            onChange={(e) => onChange({ ...value, add: e.target.value ? Number(e.target.value) : undefined })}
            className="input-field text-sm"
            placeholder="-"
          />
        </div>
      </div>
    </div>
  );
}

export default function ReceituarioPage() {
  const { clients, prescriptions, addPrescription, updatePrescription, deletePrescription } = useStore();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [form, setForm] = useState<Partial<Prescription>>({});
  const [showForm, setShowForm] = useState(false);

  const filtered = prescriptions.filter((p) => {
    const client = clients.find((c) => c.id === p.clientId);
    const name = client?.name ?? "";
    const doctor = p.doctorName ?? "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openNew = () => {
    setForm({
      clientId: "",
      doctorName: "",
      doctorCrm: "",
      date: format(new Date(), "yyyy-MM-dd"),
      od: {},
      os: {},
      pd: undefined,
      notes: "",
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Prescription) => {
    setForm({
      ...p,
      date: p.date.slice(0, 10),
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.doctorName?.trim() || !form.date) return;
    const payload = {
      clientId: form.clientId,
      doctorName: form.doctorName,
      doctorCrm: form.doctorCrm,
      date: form.date,
      od: form.od ?? {},
      os: form.os ?? {},
      pd: form.pd,
      notes: form.notes,
    };
    if (editing) {
      updatePrescription(editing.id, payload);
    } else {
      addPrescription(payload);
    }
    setShowForm(false);
    setForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este receituário?")) deletePrescription(id);
  };

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-home-light">Receituário médico</h1>
          <p className="text-home-muted mt-1">Graus e prescrições dos clientes (OD/OS, SPH, CYL, AXIS, ADD, PD)</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nova receita
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-home-muted" />
        <input
          type="text"
          placeholder="Buscar por cliente ou médico..."
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
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Cliente</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Médico</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Data</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">OD</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">OS</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">PD</th>
                <th className="w-24 py-4 px-5 text-right text-home-muted font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-home-gray/20 table-row-hover">
                  <td className="py-3.5 px-5 text-home-light">{getClientName(p.clientId)}</td>
                  <td className="py-3.5 px-5 text-home-muted">{p.doctorName}</td>
                  <td className="py-3.5 px-5 text-home-muted">
                    {format(new Date(p.date), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="py-3.5 px-5 text-home-muted text-sm">
                    {[p.od.sph, p.od.cyl, p.od.axis, p.od.add].filter(Boolean).length
                      ? `SPH ${p.od.sph ?? "—"} CYL ${p.od.cyl ?? "—"} AX ${p.od.axis ?? "—"} ADD ${p.od.add ?? "—"}`
                      : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-home-muted text-sm">
                    {[p.os.sph, p.os.cyl, p.os.axis, p.os.add].filter(Boolean).length
                      ? `SPH ${p.os.sph ?? "—"} CYL ${p.os.cyl ?? "—"} AX ${p.os.axis ?? "—"} ADD ${p.os.add ?? "—"}`
                      : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-home-muted">{p.pd != null ? `${p.pd} mm` : "—"}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => setViewing(p)}
                      title="Visualizar"
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      title="Editar"
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      title="Excluir"
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
            {search ? "Nenhum receituário encontrado." : "Nenhum receituário cadastrado."}
          </div>
        )}
      </div>

      {/* Modal somente visualização */}
      <ModalLarge open={!!viewing} onClose={() => setViewing(null)} className="p-6">
        {viewing && (
          <>
            <h2 className="text-lg font-semibold text-home-light mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Visualizar receituário
            </h2>
            <div className="space-y-4 text-home-light">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Cliente</span>
                  <p className="font-medium">{getClientName(viewing.clientId)}</p>
                </div>
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Data da receita</span>
                  <p>{format(new Date(viewing.date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Médico</span>
                  <p>{viewing.doctorName}</p>
                  {viewing.doctorCrm && <p className="text-sm text-home-muted">CRM: {viewing.doctorCrm}</p>}
                </div>
              </div>
              <div className="card space-y-2">
                <h3 className="text-sm font-semibold text-home-blue">OD (Olho direito)</h3>
                <p className="text-sm">SPH: {viewing.od?.sph ?? "—"} | CYL: {viewing.od?.cyl ?? "—"} | Eixo: {viewing.od?.axis ?? "—"}° | ADD: {viewing.od?.add ?? "—"}</p>
              </div>
              <div className="card space-y-2">
                <h3 className="text-sm font-semibold text-home-blue">OS (Olho esquerdo)</h3>
                <p className="text-sm">SPH: {viewing.os?.sph ?? "—"} | CYL: {viewing.os?.cyl ?? "—"} | Eixo: {viewing.os?.axis ?? "—"}° | ADD: {viewing.os?.add ?? "—"}</p>
              </div>
              <div>
                <span className="text-home-muted text-sm block mb-0.5">Distância pupilar (PD)</span>
                <p>{viewing.pd != null ? `${viewing.pd} mm` : "—"}</p>
              </div>
              {viewing.notes && (
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Observações</span>
                  <p className="whitespace-pre-wrap">{viewing.notes}</p>
                </div>
              )}
              <div className="flex justify-end pt-3">
                <button type="button" onClick={() => setViewing(null)} className="btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </>
        )}
      </ModalLarge>

      <ModalLarge open={showForm} onClose={() => { setShowForm(false); setForm({}); }} className="p-6">
            <h2 className="text-lg font-semibold text-home-light mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editing ? "Editar receituário" : "Nova receita"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Cliente *</label>
                  <select
                    required
                    value={form.clientId ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Data da receita *</label>
                  <input
                    type="date"
                    required
                    value={form.date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Médico oftalmologista *</label>
                  <input
                    type="text"
                    required
                    value={form.doctorName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                    className="input-field"
                    placeholder="Nome do médico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">CRM (opcional)</label>
                  <input
                    type="text"
                    value={form.doctorCrm ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, doctorCrm: e.target.value }))}
                    className="input-field"
                    placeholder="Número do CRM"
                  />
                </div>
              </div>

              <EyeFields
                label="OD (Olho direito)"
                value={form.od ?? {}}
                onChange={(od) => setForm((f) => ({ ...f, od }))}
              />
              <EyeFields
                label="OS (Olho esquerdo)"
                value={form.os ?? {}}
                onChange={(os) => setForm((f) => ({ ...f, os }))}
              />

              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Distância pupilar (PD) mm</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.pd ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, pd: e.target.value ? Number(e.target.value) : undefined }))}
                  className="input-field max-w-[120px]"
                  placeholder="Ex: 62"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Observações</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-field min-h-[80px]"
                  placeholder="Anotações da receita"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? "Salvar" : "Cadastrar receita"}
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
