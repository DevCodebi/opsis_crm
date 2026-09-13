import { useState } from "react";

type AreaId = "vendas" | "logistica" | "saude";

type Area = {
  id: AreaId;
  label: string;
  kpis: { label: string; value: string }[];
  bars: number[];
};

const AREAS: Area[] = [
  {
    id: "vendas",
    label: "Vendas",
    kpis: [
      { label: "Receita", value: "R$ 48.2k" },
      { label: "Ticket médio", value: "R$ 382" },
      { label: "Conversão", value: "3.8%" },
    ],
    bars: [42, 58, 51, 74, 66, 88, 70],
  },
  {
    id: "logistica",
    label: "Logística",
    kpis: [
      { label: "Entregas no prazo", value: "96%" },
      { label: "Rotas ativas", value: "24" },
      { label: "Tempo médio", value: "2.4 dias" },
    ],
    bars: [60, 48, 72, 55, 80, 64, 90],
  },
  {
    id: "saude",
    label: "Saúde",
    kpis: [
      { label: "Ocupação", value: "78%" },
      { label: "Atendimentos/dia", value: "312" },
      { label: "Espera média", value: "18 min" },
    ],
    bars: [50, 65, 40, 70, 62, 85, 58],
  },
];

/**
 * Mini-dashboards ilustrativos (não são um cliente real) usados no card
 * "Análise de Dados" da seção Soluções. Cada área tem paleta própria via
 * CSS custom properties escopadas em [data-area], mantendo o "chrome"
 * ao redor (janela, tipografia) consistente com o resto do site.
 */
export function DataDashboards() {
  const [active, setActive] = useState<AreaId>("vendas");
  const area = AREAS.find((a) => a.id === active) ?? AREAS[0];

  return (
    <div className="mini-dash-wrap" aria-label="Exemplos ilustrativos de dashboards">
      <div className="mini-dash-tabs" role="tablist">
        {AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={a.id === active}
            className={`mini-dash-tab${a.id === active ? " is-active" : ""}`}
            onClick={() => setActive(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mini-dash screen" data-area={area.id}>
        <div className="screen-bar">
          <span />
          <span />
          <span />
          <em>{area.label} · exemplo ilustrativo</em>
        </div>
        <div className="mini-dash-body">
          <div className="mini-dash-kpis">
            {area.kpis.map((kpi) => (
              <div key={kpi.label}>
                <small>{kpi.label}</small>
                <strong>{kpi.value}</strong>
              </div>
            ))}
          </div>
          <div className="mini-dash-chart">
            {area.bars.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
