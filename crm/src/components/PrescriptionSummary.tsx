import type { EyePrescription, Prescription } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

// Exibição somente-leitura de um receituário, em grid (uma caixa por
// campo), no mesmo espírito do layout usado no comprovante impresso.
// Usado tanto no formulário de venda (pré-visualização) quanto no modal
// de visualização — um único lugar para manter esse layout consistente.

function EyeGrid({ label, value }: { label: string; value: EyePrescription }) {
  const fields: { label: string; value: string | number }[] = [
    { label: "Esférico (SPH)", value: value.sph ?? "—" },
    { label: "Cilíndrico (CYL)", value: value.cyl ?? "—" },
    { label: "Eixo (AXIS) °", value: value.axis ?? "—" },
    { label: "Adição (ADD)", value: value.add ?? "—" },
  ];
  return (
    <div className="rounded-xl border border-[rgba(93,112,139,0.25)] bg-[#161a22]/60 p-3">
      <h4 className="text-sm font-semibold text-home-blue mb-2">{label}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[11px] text-home-muted mb-1">{f.label}</p>
            <div className="rounded-lg bg-[#1A1D25] border border-[rgba(93,112,139,0.2)] px-2.5 py-1.5 text-sm text-home-light">
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrescriptionSummary({
  prescription,
  clientName,
}: {
  prescription: Prescription;
  clientName: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-home-light">
          <FileText className="w-4 h-4 text-home-blue" />
          Receituário de {clientName}
        </div>
        <p className="text-xs text-home-muted">
          {format(new Date(prescription.date), "dd/MM/yyyy", { locale: ptBR })} · {prescription.doctorName}
          {prescription.doctorCrm ? ` (CRM ${prescription.doctorCrm})` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EyeGrid label="OD (Olho direito)" value={prescription.od} />
        <EyeGrid label="OS (Olho esquerdo)" value={prescription.os} />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-[11px] text-home-muted mb-1">Distância pupilar (PD)</p>
          <div className="rounded-lg bg-[#1A1D25] border border-[rgba(93,112,139,0.2)] px-2.5 py-1.5 text-sm text-home-light inline-block min-w-[80px]">
            {prescription.pd != null ? `${prescription.pd} mm` : "—"}
          </div>
        </div>
      </div>

      {prescription.notes && (
        <p className="text-sm text-home-muted whitespace-pre-wrap">{prescription.notes}</p>
      )}
    </div>
  );
}
