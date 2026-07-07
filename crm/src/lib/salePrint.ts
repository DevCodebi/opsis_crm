import type { EyePrescription, Prescription, Sale } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Lib compartilhada para gerar o "comprovante de venda" (impressão em
// tela e exportação em PDF), garantindo que os dois botões mostrem
// exatamente as mesmas informações a partir da mesma fonte.

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

function fmtMoney(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const EYE_FIELD_LABELS = ["Esférico (SPH)", "Cilíndrico (CYL)", "Eixo (AXIS) °", "Adição (ADD)"] as const;

function eyeFieldValues(eye: EyePrescription): (string | number)[] {
  return [eye.sph ?? "—", eye.cyl ?? "—", eye.axis ?? "—", eye.add ?? "—"];
}

// ---------- Impressão (window.print + CSS @media print já existente) ----------
export function buildSaleReceiptHtml(sale: Sale, prescription?: Prescription): string {
  const itemsRows = sale.items
    .map(
      (it) => `
      <tr>
        <td>${it.productName}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${fmtMoney(it.unitPrice)}</td>
        <td style="text-align:right">${fmtMoney(it.total)}</td>
      </tr>`
    )
    .join("");

  const eyeGridHtml = (label: string, eye: Prescription["od"]) => `
    <div style="border:1px solid #ccc; border-radius:8px; padding:10px; flex:1; min-width:220px;">
      <p style="margin:0 0 6px; font-weight:bold; font-size:13px;">${label}</p>
      <div style="display:flex; gap:6px;">
        ${EYE_FIELD_LABELS.map(
          (fieldLabel, i) => `
          <div style="flex:1;">
            <p style="margin:0 0 2px; font-size:9px; color:#666;">${fieldLabel}</p>
            <div style="border:1px solid #ddd; border-radius:4px; padding:4px 6px; font-size:12px; text-align:center;">
              ${eyeFieldValues(eye)[i]}
            </div>
          </div>`
        ).join("")}
      </div>
    </div>`;

  const prescriptionBlock = prescription
    ? `
      <h2 style="margin-top:24px;">Receituário</h2>
      <p style="margin:0 0 10px; font-size:13px;">
        <strong>Médico:</strong> ${prescription.doctorName}${prescription.doctorCrm ? ` (CRM ${prescription.doctorCrm})` : ""}
        &nbsp;·&nbsp; <strong>Data da receita:</strong> ${fmtDate(prescription.date)}
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${eyeGridHtml("OD (Olho direito)", prescription.od)}
        ${eyeGridHtml("OS (Olho esquerdo)", prescription.os)}
      </div>
      <p style="margin:10px 0 0; font-size:13px;">
        <strong>Distância pupilar (PD):</strong> ${prescription.pd != null ? `${prescription.pd} mm` : "—"}
      </p>
      ${prescription.notes ? `<p style="margin:6px 0 0; font-size:13px;"><strong>Observações da receita:</strong> ${prescription.notes}</p>` : ""}`
    : "";

  return `
    <div class="sale-print" style="font-family: sans-serif; max-width: 800px; margin: 0 auto; color:#111;">
      <h1 style="text-align:center; margin-bottom: 4px;">Home Ótica</h1>
      <p style="text-align:center; margin:0; color:#888; font-size:11px;">by Ópsis CRM</p>
      <p style="text-align:center; margin-top:8px; color:#555;">Comprovante de venda</p>

      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr>
          <td style="padding:4px 8px 4px 0; font-weight:bold; width:180px;">Cliente</td>
          <td style="padding:4px 0;">${sale.clientName}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px 4px 0; font-weight:bold;">Data da venda</td>
          <td style="padding:4px 0;">${fmtDateTime(sale.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px 4px 0; font-weight:bold;">Data prevista de entrega</td>
          <td style="padding:4px 0;">${fmtDate(sale.expectedDeliveryDate)}</td>
        </tr>
        ${sale.sellerName ? `<tr><td style="padding:4px 8px 4px 0; font-weight:bold;">Vendedor</td><td style="padding:4px 0;">${sale.sellerName}</td></tr>` : ""}
      </table>

      <h2 style="margin-top:24px;">Itens</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr><th style="text-align:left">Produto</th><th>Qtd</th><th style="text-align:right">Preço</th><th style="text-align:right">Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <table style="width:100%; margin-top:8px;">
        <tr>
          <td></td>
          <td style="text-align:right; padding:2px 0;">Subtotal: ${fmtMoney(sale.subtotal)}</td>
        </tr>
        ${sale.discount > 0 ? `<tr><td></td><td style="text-align:right; padding:2px 0;">Desconto: -${fmtMoney(sale.discount)}</td></tr>` : ""}
        <tr>
          <td></td>
          <td style="text-align:right; padding:4px 0; font-weight:bold; font-size:1.1em;">Total: ${fmtMoney(sale.total)}</td>
        </tr>
      </table>

      ${prescriptionBlock}

      ${sale.notes ? `<h2 style="margin-top:24px;">Observações</h2><p>${sale.notes}</p>` : ""}

      <p style="margin-top:32px; font-size:12px; color:#777;">Emitido em ${fmtDateTime(new Date().toISOString())}</p>
      <p style="margin-top:4px; font-size:11px; color:#999; text-align:center;">Documento gerado pelo Ópsis CRM</p>
    </div>`;
}

export function printSaleReceipt(printRef: HTMLDivElement, sale: Sale, prescription?: Prescription) {
  printRef.innerHTML = buildSaleReceiptHtml(sale, prescription);
  printRef.style.display = "block";
  printRef.style.position = "fixed";
  printRef.style.left = "0";
  printRef.style.top = "0";
  printRef.style.zIndex = "9999";
  printRef.style.background = "white";
  printRef.style.color = "black";
  printRef.style.padding = "24px";
  printRef.style.maxWidth = "800px";
  printRef.style.margin = "0 auto";
  setTimeout(() => {
    window.print();
    printRef.style.display = "none";
    printRef.style.position = "absolute";
    printRef.style.left = "-9999px";
  }, 250);
}

// ---------- Exportação em PDF (jsPDF, texto vetorial) ----------
export async function exportSaleReceiptToPdf(sale: Sale, prescription?: Prescription) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 56;

  const addLine = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, marginX + 150, y);
    y += 18;
  };

  const addSectionTitle = (title: string) => {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, marginX, y);
    doc.setDrawColor(200);
    doc.line(marginX, y + 4, pageWidth - marginX, y + 4);
    y += 22;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Home Ótica", pageWidth / 2, y, { align: "center" });
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text("by Ópsis CRM", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 16;
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text("Comprovante de venda", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 30;

  addLine("Cliente:", sale.clientName);
  addLine("Data da venda:", fmtDateTime(sale.createdAt));
  addLine("Data prevista de entrega:", fmtDate(sale.expectedDeliveryDate));
  if (sale.sellerName) addLine("Vendedor:", sale.sellerName);

  addSectionTitle("Itens");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Produto", marginX, y);
  doc.text("Qtd", 320, y);
  doc.text("Preço", 380, y);
  doc.text("Total", 460, y, { align: "right" });
  y += 6;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  for (const it of sale.items) {
    doc.text(it.productName, marginX, y, { maxWidth: 260 });
    doc.text(String(it.quantity), 320, y);
    doc.text(fmtMoney(it.unitPrice), 380, y);
    doc.text(fmtMoney(it.total), 460, y, { align: "right" });
    y += 16;
  }

  y += 8;
  doc.setDrawColor(220);
  doc.line(300, y, pageWidth - marginX, y);
  y += 16;
  doc.text(`Subtotal: ${fmtMoney(sale.subtotal)}`, pageWidth - marginX, y, { align: "right" });
  y += 16;
  if (sale.discount > 0) {
    doc.text(`Desconto: -${fmtMoney(sale.discount)}`, pageWidth - marginX, y, { align: "right" });
    y += 16;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: ${fmtMoney(sale.total)}`, pageWidth - marginX, y, { align: "right" });
  y += 10;

  if (prescription) {
    addSectionTitle("Receituário");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const doctorLine = `Médico: ${prescription.doctorName}${prescription.doctorCrm ? ` (CRM ${prescription.doctorCrm})` : ""}   |   Data da receita: ${fmtDate(prescription.date)}`;
    doc.text(doctorLine, marginX, y);
    y += 20;

    const drawEyeGrid = (label: string, eye: EyePrescription, startX: number) => {
      const boxWidth = 110;
      const gridWidth = boxWidth * 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, startX, y);
      const rowY = y + 8;
      const values = eyeFieldValues(eye);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      EYE_FIELD_LABELS.forEach((fieldLabel, i) => {
        const bx = startX + i * boxWidth;
        doc.setTextColor(90);
        doc.text(fieldLabel, bx, rowY + 8);
        doc.setDrawColor(210);
        doc.rect(bx, rowY + 12, boxWidth - 6, 18);
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text(String(values[i]), bx + (boxWidth - 6) / 2, rowY + 24, { align: "center" });
        doc.setFontSize(8);
      });
      return gridWidth;
    };

    drawEyeGrid("OD (Olho direito)", prescription.od, marginX);
    y += 42;
    drawEyeGrid("OS (Olho esquerdo)", prescription.os, marginX);
    y += 42;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Distância pupilar (PD): ${prescription.pd != null ? `${prescription.pd} mm` : "—"}`,
      marginX,
      y
    );
    y += 18;

    if (prescription.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Observações da receita:", marginX, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(prescription.notes, pageWidth - marginX * 2);
      doc.text(noteLines, marginX, y);
      y += noteLines.length * 12 + 8;
    }
  }

  if (sale.notes) {
    addSectionTitle("Observações");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(sale.notes, pageWidth - marginX * 2);
    doc.text(lines, marginX, y);
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Documento gerado pelo Ópsis CRM", pageWidth / 2, pageHeight - 24, { align: "center" });
  doc.setTextColor(0);

  doc.save(`venda-${sale.clientName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
