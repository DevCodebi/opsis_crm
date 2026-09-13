import { motion, useReducedMotion } from "framer-motion";

/**
 * Loop animado leve (sem vídeo/imagens externas) ilustrando o conceito de
 * automação: planilha -> processo -> envio automático. Respeita
 * prefers-reduced-motion (fica estático) e usa apenas SVG + framer-motion,
 * no mesmo espírito discreto do NeuralField.
 */
export function AutomationLoop() {
  const reduceMotion = useReducedMotion();

  const dotTransition = (delay: number) =>
    reduceMotion
      ? { duration: 0 }
      : {
          duration: 2.2,
          repeat: Infinity,
          ease: "linear" as const,
          delay,
        };

  return (
    <div className="automation-loop" aria-hidden="true">
      <div className="automation-track">
        <div className="automation-node">
          <SpreadsheetIcon />
          <span>Planilha</span>
        </div>

        <div className="automation-line">
          {!reduceMotion && (
            <motion.span
              className="automation-dot"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={dotTransition(0)}
            />
          )}
        </div>

        <div className="automation-node">
          <motion.div
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 6, repeat: Infinity, ease: "linear" }
            }
          >
            <GearIcon />
          </motion.div>
          <span>Processo</span>
        </div>

        <div className="automation-line">
          {!reduceMotion && (
            <motion.span
              className="automation-dot"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={dotTransition(1.1)}
            />
          )}
        </div>

        <div className="automation-node">
          <EnvelopeIcon />
          <span>Envio automático</span>
        </div>
      </div>
    </div>
  );
}

function SpreadsheetIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect x="3" y="3" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <line x1="3" y1="12" x2="27" y2="12" stroke="currentColor" strokeWidth="1.4" />
      <line x1="3" y1="20" x2="27" y2="20" stroke="currentColor" strokeWidth="1.4" />
      <line x1="12" y1="3" x2="12" y2="27" stroke="currentColor" strokeWidth="1.4" />
      <line x1="20" y1="3" x2="20" y2="27" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="2" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 15 + Math.cos(angle) * 9.5;
        const y1 = 15 + Math.sin(angle) * 9.5;
        const x2 = 15 + Math.cos(angle) * 13;
        const y2 = 15 + Math.sin(angle) * 13;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect x="3" y="6" width="24" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7.5L15 17L26 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
