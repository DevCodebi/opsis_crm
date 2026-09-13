import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SiteShell } from "../components/SiteShell";

const CONTACT_MAIL = "mailto:contato@devcodebi.com?subject=Sobre%20a%20Da'at%20Technologies";

type Step = {
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    title: "Entender",
    description:
      "Ouvimos o problema real do negócio antes de propor qualquer solução técnica.",
  },
  {
    title: "Propor",
    description:
      "Desenhamos um caminho claro — escopo, prazo e o resultado esperado.",
  },
  {
    title: "Construir",
    description:
      "Desenvolvemos com entregas visíveis ao longo do caminho, não só no final.",
  },
  {
    title: "Acompanhar",
    description:
      "Seguimos disponíveis depois da entrega, para ajustes e evolução do que foi feito.",
  },
];

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
              Somos uma empresa de tecnologia que trabalha com{" "}
              <strong>dados, automação e desenvolvimento de software</strong>.
            </p>
            <p>
              Atendemos negócios de portes diferentes, de quem precisa de
              uma primeira página bem-feita a quem já precisa de um sistema
              inteiro rodando a operação.
            </p>
            <p>
              O critério é sempre o mesmo: entender o problema de verdade
              antes de propor qualquer tela, automação ou linha de código.
            </p>
          </div>
          <div className="cta-row sobre-cta">
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Conversar com a Da&apos;at
            </a>
            <Link className="btn btn-ghost" to="/">
              Voltar à home
            </Link>
          </div>
        </motion.section>

        <section className="process" id="como-trabalhamos">
          <motion.div
            className="process-head"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Como trabalhamos</p>
            <h2>Um processo simples, do primeiro contato à entrega</h2>
          </motion.div>

          <div className="process-grid">
            {STEPS.map((step, index) => (
              <motion.article
                key={step.title}
                className="process-step"
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduceMotion ? 0 : Math.min(index * 0.06, 0.24),
                }}
              >
                <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
