"use client";

import { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import type { Sale, SaleItem, PaymentMethod, BoletoParcela, PaymentMethodQuitar } from "@/types";
import { Plus, Pencil, Trash2, Search, ShoppingCart, Eye, Printer, CheckCircle, Truck, Download } from "lucide-react";
import { ModalLarge } from "@/components/Modal";
import { format, addMonths, parseISO, differenceInDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { printSaleReceipt, exportSaleReceiptToPdf } from "@/lib/salePrint";
import { PrescriptionSummary } from "@/components/PrescriptionSummary";

const STATUS_LABELS: Record<Sale["status"], string> = {
  pendente: "Pendente",
  pago: "Pago",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  parcelado: "Parcelado",
  boleto: "Boleto",
  outro: "Outro",
};

const PAYMENT_QUITAR_LABELS: Record<PaymentMethodQuitar, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
};

const MULTA_ATRASO = 14.99;
const JUROS_POR_DIA = 0.03; // 3% ao dia

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function calcBoletoJuros(dueDate: string, amount: number): { diasAtraso: number; multa: number; juros: number; total: number } {
  const hoje = startOfDay(new Date());
  const venc = startOfDay(parseISO(dueDate));
  if (!isBefore(venc, hoje)) {
    return { diasAtraso: 0, multa: 0, juros: 0, total: amount };
  }
  const diasAtraso = differenceInDays(hoje, venc);
  const multa = MULTA_ATRASO;
  const juros = amount * JUROS_POR_DIA * diasAtraso;
  return { diasAtraso, multa, juros, total: amount + multa + juros };
}

export default function VendasPage() {
  const { clients, products, prescriptions, sales, addSale, updateSale, deleteSale, currentUser, users } = useStore();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Sale | null>(null);
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    clientId: string;
    sellerId: string;
    prescriptionId: string;
    paymentMethod: PaymentMethod;
    boletoNumParcelas: number;
    boletoPrimeiroVencimento: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    discount: number;
    status: Sale["status"];
    expectedDeliveryDate: string;
    notes: string;
  }>({
    clientId: "",
    sellerId: "",
    prescriptionId: "",
    paymentMethod: "dinheiro",
    boletoNumParcelas: 1,
    boletoPrimeiroVencimento: "",
    items: [],
    discount: 0,
    status: "pendente",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [baixaBoletoSale, setBaixaBoletoSale] = useState<Sale | null>(null);
  const [baixaParcelasIds, setBaixaParcelasIds] = useState<string[]>([]);
  const [baixaFormaPagamento, setBaixaFormaPagamento] = useState<PaymentMethodQuitar>("dinheiro");
  const boletoPrintRef = useRef<HTMLDivElement>(null);
  const salePrintRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const vendedoresOptions = useMemo(
    () => users.filter((u) => u.status === "ativo" && (u.role === "vendedor" || u.role === "admin" || u.role === "gerente")),
    [users]
  );

  // Excluir venda é restrito a admin/gerente — espelha a política de RLS
  // no banco (vendedor não tem permissão de DELETE em sales).
  const canDeleteSale = currentUser?.role === "admin" || currentUser?.role === "gerente";

  const filtered = sales.filter((s) =>
    s.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => {
    const first = products[0];
    if (!first) return;
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { productId: first.id, quantity: 1, unitPrice: first.price },
      ],
    }));
  };

  const updateItem = (index: number, upd: Partial<(typeof form.items)[0]>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...upd } : it)),
    }));
  };

  const removeItem = (index: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (acc, it) => acc + it.quantity * it.unitPrice,
      0
    );
    const discount = Number(form.discount) || 0;
    return { subtotal, total: Math.max(0, subtotal - discount) };
  }, [form.items, form.discount]);

  const openNew = () => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    setForm({
      clientId: "",
      sellerId: currentUser?.id ?? "",
      prescriptionId: "",
      paymentMethod: "dinheiro",
      boletoNumParcelas: 1,
      boletoPrimeiroVencimento: hoje,
      items: [],
      discount: 0,
      status: "pendente",
      expectedDeliveryDate: "",
      notes: "",
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (s: Sale) => {
    setForm({
      clientId: s.clientId,
      sellerId: s.sellerId ?? currentUser?.id ?? "",
      prescriptionId: s.prescriptionId ?? "",
      paymentMethod: s.paymentMethod ?? "dinheiro",
      boletoNumParcelas: s.boletoParcelas?.length ?? 1,
      boletoPrimeiroVencimento: s.boletoParcelas?.[0]?.dueDate?.slice(0, 10) ?? format(new Date(), "yyyy-MM-dd"),
      items: s.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      discount: s.discount,
      status: s.status,
      expectedDeliveryDate: s.expectedDeliveryDate ?? "",
      notes: s.notes ?? "",
    });
    setEditing(s);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === form.clientId);
    if (!client || form.items.length === 0) return;

    if (form.paymentMethod === "boleto") {
      let boletoParcelas: BoletoParcela[];
      if (editing?.boletoParcelas?.length) {
        boletoParcelas = editing.boletoParcelas;
      } else {
        const num = Math.min(6, Math.max(1, form.boletoNumParcelas));
        const primeiroVenc = form.boletoPrimeiroVencimento || format(new Date(), "yyyy-MM-dd");
        const valorParcela = totals.total / num;
        boletoParcelas = [];
        for (let i = 0; i < num; i++) {
          const dueDate = format(addMonths(parseISO(primeiroVenc), i), "yyyy-MM-dd");
          const venc = startOfDay(parseISO(dueDate));
          const status: BoletoParcela["status"] = isBefore(venc, startOfDay(new Date())) ? "vencido" : "pendente";
          boletoParcelas.push({
            id: generateId(),
            dueDate,
            amount: Math.round(valorParcela * 100) / 100,
            status,
          });
        }
      }

      const seller = vendedoresOptions.find((u) => u.id === form.sellerId);
      const items: SaleItem[] = form.items.map((it) => {
        const p = products.find((x) => x.id === it.productId);
        const total = it.quantity * it.unitPrice;
        return {
          productId: it.productId,
          productName: p?.name ?? "Produto",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total,
        };
      });

      const payload = {
        clientId: form.clientId,
        clientName: client.name,
        sellerId: form.sellerId || undefined,
        sellerName: seller?.name,
        paymentMethod: "boleto" as const,
        boletoParcelas,
        prescriptionId: form.prescriptionId || undefined,
        items,
        subtotal: totals.subtotal,
        discount: form.discount,
        total: totals.total,
        status: form.status,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      };

      if (editing) {
        updateSale(editing.id, payload);
      } else {
        addSale(payload);
      }
      setShowForm(false);
      return;
    }

    const seller = vendedoresOptions.find((u) => u.id === form.sellerId);

    const items: SaleItem[] = form.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      const total = it.quantity * it.unitPrice;
      return {
        productId: it.productId,
        productName: p?.name ?? "Produto",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total,
      };
    });

    const payload = {
      clientId: form.clientId,
      clientName: client.name,
      sellerId: form.sellerId || undefined,
      sellerName: seller?.name,
      paymentMethod: form.paymentMethod,
      boletoParcelas: undefined as BoletoParcela[] | undefined,
      prescriptionId: form.prescriptionId || undefined,
      items,
      subtotal: totals.subtotal,
      discount: form.discount,
      total: totals.total,
      status: form.status,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      notes: form.notes || undefined,
    };

    if (editing) {
      updateSale(editing.id, payload);
    } else {
      addSale(payload);
    }
    setShowForm(false);
  };

  const handleDarBaixaBoleto = () => {
    if (!baixaBoletoSale?.boletoParcelas?.length || baixaParcelasIds.length === 0) return;
    const now = new Date().toISOString();
    const updated = baixaBoletoSale.boletoParcelas.map((p) =>
      baixaParcelasIds.includes(p.id)
        ? { ...p, status: "pago" as const, paidAt: now, paymentMethodUsed: baixaFormaPagamento }
        : p
    );
    const allPaid = updated.every((p) => p.status === "pago");
    updateSale(baixaBoletoSale.id, {
      boletoParcelas: updated,
      ...(allPaid ? { status: "pago" as const, paidAt: now } : {}),
    });
    setBaixaBoletoSale(null);
    setBaixaParcelasIds([]);
    if (viewing?.id === baixaBoletoSale.id) setViewing({ ...baixaBoletoSale, boletoParcelas: updated, ...(allPaid ? { status: "pago", paidAt: now } : {}) });
  };

  const imprimirBoletoPDF = (sale: Sale) => {
    if (!boletoPrintRef.current || !sale.boletoParcelas?.length) return;
    boletoPrintRef.current.innerHTML = buildBoletoHTML(sale);
    boletoPrintRef.current.style.display = "block";
    boletoPrintRef.current.style.position = "fixed";
    boletoPrintRef.current.style.left = "0";
    boletoPrintRef.current.style.top = "0";
    boletoPrintRef.current.style.zIndex = "9999";
    boletoPrintRef.current.style.background = "white";
    boletoPrintRef.current.style.color = "black";
    boletoPrintRef.current.style.padding = "24px";
    boletoPrintRef.current.style.maxWidth = "800px";
    boletoPrintRef.current.style.margin = "0 auto";
    setTimeout(() => {
      window.print();
      boletoPrintRef.current!.style.display = "none";
      boletoPrintRef.current!.style.position = "absolute";
      boletoPrintRef.current!.style.left = "-9999px";
    }, 250);
  };

  function buildBoletoHTML(sale: Sale): string {
    const parcelas = sale.boletoParcelas ?? [];
    const rows = parcelas
      .map((p, i) => {
        const calc = p.status !== "pago" ? calcBoletoJuros(p.dueDate, p.amount) : null;
        const valorFinal = calc ? calc.total : p.amount;
        return `
        <tr>
          <td>${i + 1}</td>
          <td>${format(parseISO(p.dueDate), "dd/MM/yyyy", { locale: ptBR })}</td>
          <td>R$ ${p.amount.toFixed(2)}</td>
          <td>${p.status === "pago" ? "Pago" : calc ? `Multa R$ ${calc.multa.toFixed(2)} + Juros R$ ${calc.juros.toFixed(2)} (${calc.diasAtraso} dias)` : "—"}</td>
          <td>R$ ${valorFinal.toFixed(2)}</td>
        </tr>`;
      })
      .join("");
    return `
      <div class="boleto-print p-6" style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center;">BOLETO - Home Ótica</h1>
        <p><strong>Cliente:</strong> ${sale.clientName}</p>
        <p><strong>Data da venda:</strong> ${format(parseISO(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
        <p><strong>Total:</strong> R$ ${sale.total.toFixed(2)}</p>
        <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Multa/Juros</th><th>Total a pagar</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top: 24px; font-size: 12px;">Multa por atraso: R$ ${MULTA_ATRASO.toFixed(2)} + 3% ao dia após o vencimento.</p>
        <p style="margin-top: 16px; font-size: 11px; color:#999; text-align:center;">Documento gerado pelo Ópsis CRM</p>
      </div>`;
  }

  const handleDelete = (id: string) => {
    if (confirm("Excluir esta venda?")) deleteSale(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-home-light">Vendas</h1>
          <p className="text-home-muted mt-1">Registro de vendas vinculadas a clientes e receituário</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nova venda
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-home-muted" />
        <input
          type="text"
          placeholder="Buscar por cliente..."
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
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Data</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Cliente</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Vendedor</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Pagamento</th>
                <th className="text-right py-4 px-5 text-home-muted font-medium text-sm">Total</th>
                <th className="text-left py-4 px-5 text-home-muted font-medium text-sm">Status</th>
                <th className="w-28 py-4 px-5 text-right text-home-muted font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-home-gray/20 table-row-hover">
                  <td className="py-3.5 px-5 text-home-muted">
                    {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="py-3.5 px-5 text-home-light">{s.clientName}</td>
                  <td className="py-3.5 px-5 text-home-muted">{s.sellerName ?? "—"}</td>
                  <td className="py-3.5 px-5 text-home-muted text-sm">
                    {s.paymentMethod ? PAYMENT_LABELS[s.paymentMethod] : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right text-home-light font-medium">
                    R$ {s.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        s.status === "entregue"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : s.status === "pago"
                            ? "bg-home-blue/25 text-home-light border border-home-blue/40"
                            : s.status === "cancelado"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => setViewing(s)}
                      title="Visualizar"
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      title="Editar"
                      className="p-2 text-home-muted hover:text-home-blue hover:bg-home-blue/20 rounded-xl transition-colors duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {canDeleteSale && (
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        title="Excluir"
                        className="p-2 text-home-muted hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-home-muted">
            {search ? "Nenhuma venda encontrada." : "Nenhuma venda registrada."}
          </div>
        )}
      </div>

      {/* Modal somente visualização */}
      <ModalLarge open={!!viewing} onClose={() => setViewing(null)} className="p-6">
        {viewing && (
          <>
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-home-light flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Visualizar venda
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => salePrintRef.current && printSaleReceipt(
                    salePrintRef.current,
                    viewing,
                    prescriptions.find((p) => p.id === viewing.prescriptionId)
                  )}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  type="button"
                  disabled={exportingPdf}
                  onClick={async () => {
                    setExportingPdf(true);
                    try {
                      await exportSaleReceiptToPdf(viewing, prescriptions.find((p) => p.id === viewing.prescriptionId));
                    } finally {
                      setExportingPdf(false);
                    }
                  }}
                  className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {exportingPdf ? "Gerando..." : "Exportar PDF"}
                </button>
              </div>
            </div>
            <div className="space-y-4 text-home-light">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Data da venda</span>
                  <p>{format(new Date(viewing.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Cliente</span>
                  <p className="font-medium">{viewing.clientName}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Vendedor</span>
                  <p>{viewing.sellerName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Forma de pagamento</span>
                  <p>{viewing.paymentMethod ? PAYMENT_LABELS[viewing.paymentMethod] : "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Data prevista de entrega
                  </span>
                  <p>{viewing.expectedDeliveryDate ? format(new Date(viewing.expectedDeliveryDate), "dd/MM/yyyy", { locale: ptBR }) : "—"}</p>
                </div>
              </div>

              {viewing.prescriptionId && (() => {
                const p = prescriptions.find((x) => x.id === viewing.prescriptionId);
                // Blindagem: só exibe se o receituário pertencer ao mesmo
                // cliente da venda — nunca mostra receita de outro cliente.
                if (!p || p.clientId !== viewing.clientId) return null;
                return (
                  <div className="card bg-home-blue/10 border-home-blue/30">
                    <PrescriptionSummary prescription={p} clientName={viewing.clientName} />
                  </div>
                );
              })()}

              {viewing.paymentMethod === "boleto" && viewing.boletoParcelas && viewing.boletoParcelas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-home-muted text-sm block">Parcelas do boleto</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imprimirBoletoPDF(viewing)}
                        className="btn-secondary text-sm flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir boleto (PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBaixaBoletoSale(viewing); setBaixaParcelasIds([]); setBaixaFormaPagamento("dinheiro"); }}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Dar baixa
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-home-gray/20 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-home-gray/10 border-b border-home-gray/20">
                          <th className="text-left py-2 px-3 text-home-muted font-medium">Parcela</th>
                          <th className="text-left py-2 px-3 text-home-muted font-medium">Vencimento</th>
                          <th className="text-right py-2 px-3 text-home-muted font-medium">Valor</th>
                          <th className="text-right py-2 px-3 text-home-muted font-medium">Multa/Juros</th>
                          <th className="text-right py-2 px-3 text-home-muted font-medium">Total</th>
                          <th className="text-left py-2 px-3 text-home-muted font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewing.boletoParcelas.map((p, i) => {
                          const calc = p.status !== "pago" ? calcBoletoJuros(p.dueDate, p.amount) : null;
                          const totalPagar = calc ? calc.total : p.amount;
                          return (
                            <tr key={p.id} className="border-b border-home-gray/10">
                              <td className="py-2 px-3 text-home-light">{i + 1}ª</td>
                              <td className="py-2 px-3 text-home-muted">{format(parseISO(p.dueDate), "dd/MM/yyyy", { locale: ptBR })}</td>
                              <td className="py-2 px-3 text-right text-home-light">R$ {p.amount.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right text-amber-400">
                                {p.status === "pago" ? "—" : calc && calc.diasAtraso > 0 ? `R$ ${(calc.multa + calc.juros).toFixed(2)} (${calc.diasAtraso} dias)` : "—"}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-home-light">R$ {totalPagar.toFixed(2)}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs ${p.status === "pago" ? "bg-green-500/20 text-green-400" : p.status === "vencido" ? "bg-amber-500/20 text-amber-400" : "bg-home-gray/30 text-home-muted"}`}>
                                  {p.status === "pago" ? `Pago ${p.paymentMethodUsed ? `(${PAYMENT_QUITAR_LABELS[p.paymentMethodUsed]})` : ""}` : p.status === "vencido" ? "Vencido" : "Pendente"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <span className="text-home-muted text-sm block mb-2">Itens</span>
                <div className="rounded-xl bg-home-gray/10 border border-home-gray/20 divide-y divide-home-gray/20 overflow-hidden">
                  {viewing.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 px-4 text-sm">
                      <span className="text-home-light">{it.productName}</span>
                      <span className="text-home-muted">
                        {it.quantity} × R$ {it.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} = R$ {it.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-home-gray/20">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Subtotal</span>
                  <p>R$ {viewing.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                {viewing.discount > 0 && (
                  <div>
                    <span className="text-home-muted text-sm block mb-0.5">Desconto</span>
                    <p className="text-amber-400">- R$ {viewing.discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                <div className="ml-auto">
                  <span className="text-home-muted text-sm block mb-0.5">Total</span>
                  <p className="text-lg font-bold text-home-light">R$ {viewing.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Status</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                      viewing.status === "entregue"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : viewing.status === "pago"
                          ? "bg-home-blue/25 text-home-light border border-home-blue/40"
                          : viewing.status === "cancelado"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {STATUS_LABELS[viewing.status]}
                  </span>
                </div>
                <button type="button" onClick={() => setViewing(null)} className="btn-secondary">
                  Fechar
                </button>
              </div>
              {viewing.notes && (
                <div>
                  <span className="text-home-muted text-sm block mb-0.5">Observações</span>
                  <p className="whitespace-pre-wrap text-sm">{viewing.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </ModalLarge>

      <ModalLarge open={showForm} onClose={() => setShowForm(false)} className="p-6">
            <h2 className="text-lg font-semibold text-home-light mb-5 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {editing ? "Editar venda" : "Nova venda"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Cliente *</label>
                  <select
                    required
                    value={form.clientId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        clientId: e.target.value,
                        // Troca de cliente invalida o receituário selecionado
                        // antes — garante que a receita exibida sempre
                        // corresponda ao cliente da venda.
                        prescriptionId: e.target.value === f.clientId ? f.prescriptionId : "",
                      }))
                    }
                    className="input-field"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Vendedor *</label>
                  <select
                    required
                    value={form.sellerId}
                    onChange={(e) => setForm((f) => ({ ...f, sellerId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecione o vendedor</option>
                    {vendedoresOptions.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Receituário (opcional)</label>
                  <select
                    value={form.prescriptionId}
                    disabled={!form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, prescriptionId: e.target.value }))}
                    className="input-field disabled:opacity-50"
                  >
                    <option value="">Nenhum</option>
                    {prescriptions
                      .filter((p) => p.clientId === form.clientId)
                      .map((p) => {
                        const client = clients.find((c) => c.id === p.clientId);
                        return (
                          <option key={p.id} value={p.id}>
                            {client?.name ?? "Cliente"} — {format(new Date(p.date), "dd/MM/yyyy")} (Dr. {p.doctorName})
                          </option>
                        );
                      })}
                  </select>
                  {!form.clientId && (
                    <p className="text-xs text-home-muted mt-1">Selecione o cliente para ver os receituários dele.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Forma de pagamento</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                    className="input-field"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.prescriptionId && (() => {
                const selectedPrescription = prescriptions.find((p) => p.id === form.prescriptionId);
                const selectedClient = clients.find((c) => c.id === form.clientId);
                // Blindagem: só exibe se o receituário realmente pertencer ao
                // cliente selecionado na venda (nunca mostra dado de outro cliente).
                if (!selectedPrescription || !selectedClient || selectedPrescription.clientId !== selectedClient.id) {
                  return null;
                }
                return (
                  <div className="card bg-home-blue/10 border-home-blue/30">
                    <PrescriptionSummary prescription={selectedPrescription} clientName={selectedClient.name} />
                  </div>
                );
              })()}

              {form.paymentMethod === "boleto" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-home-gray/10 border border-home-gray/20">
                  <h3 className="sm:col-span-2 text-sm font-semibold text-home-light">Boleto (até 6x)</h3>
                  <div>
                    <label className="block text-sm font-medium text-home-muted mb-1">Número de parcelas</label>
                    <select
                      value={form.boletoNumParcelas}
                      onChange={(e) => setForm((f) => ({ ...f, boletoNumParcelas: Number(e.target.value) }))}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-home-muted mb-1">Data do 1º vencimento</label>
                    <input
                      type="date"
                      value={form.boletoPrimeiroVencimento}
                      onChange={(e) => setForm((f) => ({ ...f, boletoPrimeiroVencimento: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <p className="sm:col-span-2 text-xs text-home-muted">
                    Valor por parcela: R$ {(totals.total / form.boletoNumParcelas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Após vencimento: multa de R$ 14,99 + 3% ao dia.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-home-muted">Itens *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-home-blue hover:underline"
                  >
                    + Adicionar produto
                  </button>
                </div>
                {form.items.length === 0 ? (
                  <p className="text-home-muted text-sm py-2">
                    Nenhum item. Clique em &quot;Adicionar produto&quot;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((it, i) => {
                      const p = products.find((x) => x.id === it.productId);
                      return (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-home-gray/10 border border-home-gray/20"
                        >
                          <select
                            value={it.productId}
                            onChange={(e) => {
                              const prod = products.find((x) => x.id === e.target.value);
                              updateItem(i, {
                                productId: e.target.value,
                                unitPrice: prod?.price ?? 0,
                              });
                            }}
                            className="input-field flex-1 min-w-[140px]"
                          >
                            {products.map((pr) => (
                              <option key={pr.id} value={pr.id}>
                                {pr.name} - R$ {pr.price.toFixed(2)}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                            className="input-field w-20"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) || 0 })}
                            className="input-field w-24"
                          />
                          <span className="text-home-muted text-sm w-16">
                            R$ {(it.quantity * it.unitPrice).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discount}
                    onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) || 0 }))}
                    className="input-field w-28"
                  />
                </div>
                <div className="ml-auto text-right">
                  <p className="text-home-muted text-sm">Subtotal: R$ {totals.subtotal.toFixed(2)}</p>
                  <p className="text-lg font-bold text-home-light">Total: R$ {totals.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Sale["status"] }))}
                    className="input-field"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-home-muted mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Data prevista de entrega
                  </label>
                  <input
                    type="date"
                    value={form.expectedDeliveryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-home-muted mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-field min-h-[60px]"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={form.items.length === 0 || !form.clientId}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? "Salvar" : "Registrar venda"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
      </ModalLarge>

      {/* Modal Dar baixa no boleto */}
      <ModalLarge open={!!baixaBoletoSale} onClose={() => { setBaixaBoletoSale(null); setBaixaParcelasIds([]); }} className="p-6">
        {baixaBoletoSale?.boletoParcelas && (
          <>
            <h2 className="text-lg font-semibold text-home-light mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Dar baixa no boleto
            </h2>
            <p className="text-home-muted text-sm mb-4">
              Selecione a(s) parcela(s) a quitar e a forma de pagamento.
            </p>
            {(() => {
              const pendentes = baixaBoletoSale.boletoParcelas.filter((p) => p.status !== "pago");
              if (pendentes.length === 0) {
                return (
                  <div className="flex gap-3 pt-2">
                    <p className="text-home-muted flex-1">Todas as parcelas já foram quitadas.</p>
                    <button type="button" onClick={() => { setBaixaBoletoSale(null); setBaixaParcelasIds([]); }} className="btn-secondary">
                      Fechar
                    </button>
                  </div>
                );
              }
              return (
                <>
                  <div className="space-y-3 mb-4">
                    {baixaBoletoSale.boletoParcelas.map((p, i) => {
                      if (p.status === "pago") return null;
                      const calc = calcBoletoJuros(p.dueDate, p.amount);
                      const totalPagar = calc.total;
                      const checked = baixaParcelasIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-home-gray/10 border border-home-gray/20 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setBaixaParcelasIds((ids) => e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id))}
                            className="rounded border-home-gray/40"
                          />
                          <span className="text-home-light flex-1">
                            {i + 1}ª parcela – Venc. {format(parseISO(p.dueDate), "dd/MM/yyyy", { locale: ptBR })} – R$ {totalPagar.toFixed(2)}
                            {calc.diasAtraso > 0 && <span className="text-amber-400 text-xs ml-1">(multa + juros)</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBaixaParcelasIds(pendentes.map((p) => p.id))}
                    className="text-sm text-home-blue hover:underline mb-4"
                  >
                    Marcar todas as parcelas pendentes
                  </button>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-home-muted mb-1">Forma de pagamento ao quitar</label>
                    <select
                      value={baixaFormaPagamento}
                      onChange={(e) => setBaixaFormaPagamento(e.target.value as PaymentMethodQuitar)}
                      className="input-field"
                    >
                      {Object.entries(PAYMENT_QUITAR_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDarBaixaBoleto}
                      disabled={baixaParcelasIds.length === 0}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar baixa
                    </button>
                    <button type="button" onClick={() => { setBaixaBoletoSale(null); setBaixaParcelasIds([]); }} className="btn-secondary">
                      Cancelar
                    </button>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </ModalLarge>

      {/* Área para impressão do boleto (fora da tela; exibida ao imprimir) */}
      <div
        ref={boletoPrintRef}
        id="boleto-print"
        style={{ position: "absolute", left: "-9999px", top: 0 }}
        aria-hidden
      />

      {/* Área para impressão do comprovante de venda (fora da tela; exibida ao imprimir) */}
      <div
        ref={salePrintRef}
        id="sale-print"
        style={{ position: "absolute", left: "-9999px", top: 0 }}
        aria-hidden
      />
    </div>
  );
}
