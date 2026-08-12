import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SiteShell } from "../components/SiteShell";

const CONTACT_MAIL = "mailto:contato@devcode.com?subject=Sobre%20a%20Da'at%20Technologies";

export default function SobrePage() {
  const reduceMotion = useReducedMotion();

  return (
    <SiteShell>
      <main className="sobre-page">
        <motion.section
          className="sobre-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">Institucional</p>
          <h1>Sobre a Da&apos;at Technologies</h1>
          <div className="sobre-body">
            <p>
              Somos uma empresa de tecnologia em atuação nas áreas de{" "}
              <strong>dados, automação e desenvolvimento de software</strong>.
            </p>
            <p>
              Entregamos soluções para negócios de diferentes portes e
              segmentos — do operacional do dia a dia à visão estratégica —
              com foco em clareza, escala e resultado.
            </p>
            <p>
              Unimos engenharia e inteligência de dados para reduzir fricção,
              automatizar processos e construir produtos digitais que
              acompanham o crescimento da operação.
            </p>
          </div>
          <div className="cta-row sobre-cta">
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Fale Conosco
            </a>
            <Link className="btn btn-ghost" to="/">
              Voltar à home
            </Link>
          </div>
        </motion.section>
      </main>
    </SiteShell>
  );
}
