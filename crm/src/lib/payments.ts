import type { PaymentMethod, PaymentSplit, Sale } from "@/types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  parcelado: "Parcelado",
  boleto: "Boleto",
  outro: "Outro",
};

/** Resolve os splits de pagamento de uma venda (compatível com registros antigos). */
export function getSalePaymentSplits(sale: Pick<Sale, "paymentMethod" | "paymentSplits" | "total">): PaymentSplit[] {
  if (sale.paymentSplits && sale.paymentSplits.length > 0) {
    return sale.paymentSplits;
  }
  if (sale.paymentMethod) {
    return [{ method: sale.paymentMethod, amount: sale.total }];
  }
  return [];
}

/** Texto resumido das formas de pagamento (lista / comprovante). */
export function formatPaymentSummary(sale: Pick<Sale, "paymentMethod" | "paymentSplits" | "total">): string {
  const splits = getSalePaymentSplits(sale);
  if (splits.length === 0) return "—";
  if (splits.length === 1) {
    return PAYMENT_LABELS[splits[0].method];
  }
  return splits
    .map(
      (s) =>
        `${PAYMENT_LABELS[s.method]} (R$ ${s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`
    )
    .join(" + ");
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function paymentSplitsTotal(splits: { amount: number }[]): number {
  return roundMoney(splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0));
}
