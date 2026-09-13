import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type AreaId = "vendas" | "logistica" | "saude";

const AREA_LABEL: Record<AreaId, string> = {
  vendas: "Vendas",
  logistica: "Logística",
  saude: "Saúde",
};

/**
 * Mini-dashboards ilustrativos (não são um cliente real) usados no card
 * "Análise de Dados" da seção Soluções.
 *
 * Cada aba usa uma visualização estruturalmente diferente — não é o mesmo
 * componente repetido com cor trocada:
 * - Vendas: sparkline de tendência + ranking de produtos mais vendidos.
 * - Logística: trilha de rota com paradas + lista de entregas com status.
 * - Saúde: gauge circular de ocupação + fila de atendimento.
 *
 * A paleta de cada área é escopada via [data-area] em index.css — única
 * exceção intencional à paleta oliva da marca, restrita a estes mockups.
 */
export function DataDashboards() {
  const [active, setActive] = useState<AreaId>("vendas");
  const reduceMotion = useReducedMotion();

  return (
    <div className="mini-dash-wrap" aria-label="Exemplos ilustrativos de dashboards">
      <div className="mini-dash-tabs" role="tablist">
        {(Object.keys(AREA_LABEL) as AreaId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === active}
            className={`mini-dash-tab${id === active ? " is-active" : ""}`}
            onClick={() => setActive(id)}
          >
            {AREA_LABEL[id]}
          </button>
        ))}
      </div>

      <div className="mini-dash screen" data-area={active}>
        <div className="screen-bar">
          <span />
          <span />
          <span />
          <em>{AREA_LABEL[active]} · exemplo ilustrativo</em>
        </div>
        <div className="mini-dash-body">
          {active === "vendas" && <VendasPanel />}
          {active === "logistica" && <LogisticaPanel reduceMotion={!!reduceMotion} />}
          {active === "saude" && <SaudePanel />}
        </div>
      </div>
    </div>
  );
}

/* —— Vendas: sparkline + ranking de produtos —— */

function VendasPanel() {
  const trend = [42, 58, 51, 74, 66, 88, 70];
  const ranking = [
    { name: "Armação Acetato", value: "R$ 12.4k", pct: 92 },
    { name: "Lente Transitions", value: "R$ 9.1k", pct: 68 },
    { name: "Óculos Solar", value: "R$ 7.8k", pct: 54 },
  ];

  return (
    <>
      <div className="mini-dash-kpis mini-dash-kpis--compact">
        <div>
          <small>Receita</small>
          <strong>R$ 48.2k</strong>
        </div>
        <div>
          <small>Ticket médio</small>
          <strong>R$ 382</strong>
        </div>
      </div>

      <div className="mini-dash-sparkline" aria-hidden="true">
        {trend.map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>

      <ul className="mini-dash-ranking">
        {ranking.map((item, index) => (
          <li key={item.name}>
            <div className="mini-dash-ranking-row">
              <span>
                {index + 1}. {item.name}
              </span>
              <strong>{item.value}</strong>
            </div>
            <div className="mini-dash-ranking-bar">
              <i style={{ width: `${item.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* —— Logística: trilha de rota + entregas com status —— */

type DeliveryStatus = "entregue" | "em-rota" | "atrasado";

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  entregue: "Entregue",
  "em-rota": "Em rota",
  atrasado: "Atrasado",
};

function LogisticaPanel({ reduceMotion }: { reduceMotion: boolean }) {
  const stops = 5;
  const current = 2;
  const deliveries: { dest: string; status: DeliveryStatus }[] = [
    { dest: "Zona Sul", status: "entregue" },
    { dest: "Centro", status: "em-rota" },
    { dest: "Zona Norte", status: "atrasado" },
    { dest: "Zona Leste", status: "em-rota" },
  ];

  return (
    <>
      <div className="mini-dash-kpis mini-dash-kpis--compact">
        <div>
          <small>No prazo</small>
          <strong>96%</strong>
        </div>
        <div>
          <small>Rotas ativas</small>
          <strong>24</strong>
        </div>
      </div>

      <div className="route-track" aria-hidden="true">
        {Array.from({ length: stops }).map((_, index) => {
          const state =
            index < current ? "done" : index === current ? "current" : "pending";
          return (
            <div className="route-segment" key={index}>
              <span className={`route-stop route-stop--${state}`}>
                {state === "current" && (
                  <motion.span
                    className="route-pulse"
                    animate={
                      reduceMotion
                        ? undefined
                        : { scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                )}
              </span>
              {index < stops - 1 && <span className="route-line" />}
            </div>
          );
        })}
      </div>

      <ul className="mini-dash-deliveries">
        {deliveries.map((d) => (
          <li key={d.dest}>
            <span>{d.dest}</span>
            <span className={`status-badge status-badge--${d.status}`}>
              {STATUS_LABEL[d.status]}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* —— Saúde: gauge de ocupação + fila de atendimento —— */

function SaudePanel() {
  const percent = 78;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const queue = [
    { code: "A12", wait: "8 min" },
    { code: "A13", wait: "15 min" },
    { code: "A14", wait: "22 min" },
  ];

  return (
    <>
      <div className="mini-dash-gauge-row">
        <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="7" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#4fd1c5"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
          />
          <text
            x="40"
            y="45"
            textAnchor="middle"
            fontSize="16"
            fontWeight={700}
            fill="#eafffb"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {percent}%
          </text>
        </svg>
        <div className="mini-dash-kpis mini-dash-kpis--stacked">
          <div>
            <small>Atendimentos/dia</small>
            <strong>312</strong>
          </div>
          <div>
            <small>Espera média</small>
            <strong>18 min</strong>
          </div>
        </div>
      </div>

      <ul className="mini-dash-queue">
        {queue.map((q) => (
          <li key={q.code}>
            <span className="queue-code">{q.code}</span>
            <span className="queue-wait">{q.wait}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
