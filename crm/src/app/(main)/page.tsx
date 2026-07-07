"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  TrendingUp,
  Gift,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

type PeriodKey = "7" | "30" | "90";

export default function DashboardPage() {
  const { clients, products, sales, users, currentUser } = useStore();
  const [periodKey, setPeriodKey] = useState<PeriodKey>("30");
  const [sellerFilter, setSellerFilter] = useState<string>(() => currentUser?.role === "vendedor" ? (currentUser?.id ?? "") : "");

  const periodDays = Number(periodKey);
  const startDate = useMemo(() => subDays(new Date(), periodDays), [periodDays]);
  const endDate = useMemo(() => new Date(), []);

  const filteredSales = useMemo(() => {
    let list = sales.filter(
      (s) =>
        s.status !== "cancelado" &&
        isWithinInterval(parseISO(s.createdAt), { start: startDate, end: endDate })
    );
    if (sellerFilter) {
      list = list.filter((s) => s.sellerId === sellerFilter);
    }
    return list;
  }, [sales, startDate, endDate, sellerFilter]);

  const stats = useMemo(() => {
    const totalVendas = filteredSales.length;
    const receitaTotal = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;

    let lucroTotal = 0;
    for (const s of filteredSales) {
      for (const item of s.items) {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod?.cost ?? 0;
        lucroTotal += (item.unitPrice - cost) * item.quantity;
      }
    }

    return {
      receitaTotal,
      totalVendas,
      ticketMedio,
      lucroTotal,
      totalClientes: clients.length,
      totalProdutos: products.length,
    };
  }, [filteredSales, products, clients.length]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    for (const s of filteredSales) {
      for (const item of s.items) {
        const cur = map.get(item.productId) ?? {
          name: item.productName,
          qty: 0,
          total: 0,
        };
        cur.name = item.productName;
        cur.qty += item.quantity;
        cur.total += item.total;
        map.set(item.productId, cur);
      }
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ productId: id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredSales]);

  const aniversariantes = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth();
    return clients.filter((c) => {
      if (!c.birthDate) return false;
      const d = new Date(c.birthDate);
      return d.getMonth() === mes;
    });
  }, [clients]);

  const produtosEstoqueMinimo = useMemo(() => {
    return products.filter((p) => p.minStock != null && p.stock < p.minStock);
  }, [products]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      byDay.set(format(d, "yyyy-MM-dd"), 0);
    }
    for (const s of filteredSales) {
      const day = format(parseISO(s.createdAt), "yyyy-MM-dd");
      byDay.set(day, (byDay.get(day) ?? 0) + s.total);
    }
    return Array.from(byDay.entries())
      .map(([date, total]) => ({ date, total, label: format(parseISO(date), "dd/MM", { locale: ptBR }) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, startDate, endDate]);

  const vendedoresOptions = useMemo(() => {
    return users.filter((u) => u.status === "ativo" && (u.role === "vendedor" || u.role === "admin" || u.role === "gerente"));
  }, [users]);

  const exportCSV = () => {
    const rows: string[][] = [
      [
        "Data",
        "Vendedor",
        "Cliente",
        "Total (R$)",
        "Qtd itens",
        "Status",
      ],
    ];
    for (const s of filteredSales) {
      const qtdItens = s.items.reduce((acc, i) => acc + i.quantity, 0);
      rows.push([
        format(parseISO(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        s.sellerName ?? "—",
        s.clientName,
        s.total.toFixed(2),
        String(qtdItens),
        s.status,
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();

    const vendasData = [
      ["Data", "Vendedor", "Cliente", "Total (R$)", "Qtd itens", "Status"],
      ...filteredSales.map((s) => [
        format(parseISO(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        s.sellerName ?? "—",
        s.clientName,
        s.total,
        s.items.reduce((acc, i) => acc + i.quantity, 0),
        s.status,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vendasData), "Vendas");

    const resumoData = [
      ["Métrica", "Valor"],
      ["Faturamento total (período)", stats.receitaTotal],
      ["Número de vendas", stats.totalVendas],
      ["Ticket médio", stats.ticketMedio],
      ["Lucro total", stats.lucroTotal],
      ["Total clientes (base)", stats.totalClientes],
      ["Total produtos (base)", stats.totalProdutos],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), "Resumo");

    const topData = [
      ["Produto", "Quantidade vendida", "Valor total (R$)"],
      ...topProducts.map((p) => [p.name, p.qty, p.total]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topData), "Produtos mais vendidos");

    const porVendedor = new Map<string, { vendas: number; total: number }>();
    for (const s of filteredSales) {
      const key = s.sellerName ?? "Não informado";
      const cur = porVendedor.get(key) ?? { vendas: 0, total: 0 };
      cur.vendas += 1;
      cur.total += s.total;
      porVendedor.set(key, cur);
    }
    const vendedorData = [
      ["Vendedor", "Qtd vendas", "Total (R$)"],
      ...Array.from(porVendedor.entries()).map(([nome, v]) => [nome, v.vendas, v.total]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vendedorData), "Por vendedor");

    XLSX.writeFile(wb, `relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#EAEAEA]">
            Bem-vindo(a), {currentUser?.name ?? "Usuário"}
          </h1>
          <p className="text-[#9ca3af] text-sm mt-1">
            Resumo do período e indicadores do negócio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value as PeriodKey)}
            className="input-field text-sm w-auto"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="input-field text-sm w-auto min-w-[140px]"
          >
            <option value="">Todos os vendedores</option>
            {vendedoresOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button type="button" onClick={exportXLSX} className="btn-primary text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              XLSX
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Receita Total</p>
              <p className="text-xl font-bold text-[#344B6F] mt-1">
                R$ {stats.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F]/25 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#344B6F]" />
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Total de Vendas</p>
              <p className="text-xl font-bold text-[#344B6F] mt-1">+{stats.totalVendas}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F]/25 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#344B6F]" />
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Ticket Médio</p>
              <p className="text-xl font-bold text-[#344B6F] mt-1">
                R$ {stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F]/25 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#344B6F]" />
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Lucro</p>
              <p className="text-xl font-bold text-green-500 mt-1">
                R$ {stats.lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Clientes</p>
              <p className="text-xl font-bold text-[#344B6F] mt-1">+{stats.totalClientes}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F]/25 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#344B6F]" />
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium">Produtos</p>
              <p className="text-xl font-bold text-[#344B6F] mt-1">{stats.totalProdutos}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#344B6F]/25 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#344B6F]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#344B6F]" />
            <h2 className="text-lg font-semibold text-[#EAEAEA]">Vendas por período</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,112,139,0.2)" />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1e2430", border: "1px solid rgba(93,112,139,0.3)", borderRadius: "12px" }}
                  labelStyle={{ color: "#EAEAEA" }}
                  formatter={(value: number) => ["R$ " + value.toFixed(2), "Total"]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="total" fill="#344B6F" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#344B6F]" />
            <h2 className="text-lg font-semibold text-[#EAEAEA]">Produtos mais vendidos</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topProducts.length === 0 ? (
              <p className="text-[#9ca3af] text-sm py-4">Nenhuma venda no período.</p>
            ) : (
              topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#161a22]/50 border border-[rgba(93,112,139,0.15)]"
                >
                  <span className="text-[#EAEAEA] text-sm font-medium">
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-[#344B6F] text-sm font-semibold">
                    {p.qty} un · R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[#344B6F]" />
            <h2 className="text-lg font-semibold text-[#EAEAEA]">Aniversariantes do mês</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {aniversariantes.length === 0 ? (
              <p className="text-[#9ca3af] text-sm py-4">Nenhum aniversariante este mês.</p>
            ) : (
              aniversariantes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#161a22]/50 border border-[rgba(93,112,139,0.15)]"
                >
                  <span className="text-[#EAEAEA] text-sm">{c.name}</span>
                  <span className="text-[#9ca3af] text-xs">
                    {c.birthDate ? format(new Date(c.birthDate), "dd/MM", { locale: ptBR }) : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-[#EAEAEA]">Produtos com estoque mínimo</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {produtosEstoqueMinimo.length === 0 ? (
              <p className="text-[#9ca3af] text-sm py-4">Nenhum produto abaixo do estoque mínimo.</p>
            ) : (
              produtosEstoqueMinimo.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                >
                  <span className="text-[#EAEAEA] text-sm font-medium">{p.name}</span>
                  <span className="text-amber-400 text-sm font-semibold">
                    Estoque: {p.stock} (mín: {p.minStock})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
