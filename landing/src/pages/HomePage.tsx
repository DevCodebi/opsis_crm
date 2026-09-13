import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SiteShell } from "../components/SiteShell";
import { DataDashboards } from "../components/DataDashboards";
import { AutomationLoop } from "../components/AutomationLoop";
import { EcommerceMock } from "../components/EcommerceMock";

const CONTACT_MAIL = "mailto:contato@devcodebi.com?subject=Contato%20Da'at%20Technologies";

type Solution = {
  id: string;
  title: string;
  pain: string;
  example?: string;
  mailSubject: string;
  ctaLabel: string;
  exampleLink?: { to: string; label: string };
};

const SOLUTIONS: Solution[] = [
  {
    id: "landing-pages",
    title: "Landing Pages",
    pain: "O primeiro contato com o cliente costuma ser uma página — e ela só passa credibilidade se for pensada pra isso.",
    mailSubject: "Landing%20Page%20—%20Da'at",
    ctaLabel: "Quero uma landing page",
  },
  {
    id: "automacoes",
    title: "Automações",
    pain: "Tarefas manuais repetidas todos os dias tomam um tempo que dava para automatizar.",
    example:
      "Abaixo, um exemplo ilustrativo: uma planilha alimentando um processo que dispara e-mails sozinho.",
    mailSubject: "Automação%20—%20Da'at",
    ctaLabel: "Quero automatizar um processo",
  },
  {
    id: "dados",
    title: "Análise de Dados",
    pain: "Quando os números disponíveis não mostram o que realmente importa, a decisão acaba no feeling.",
    example: "Exemplos ilustrativos.",
    mailSubject: "Análise%20de%20Dados%20—%20Da'at",
    ctaLabel: "Quero organizar meus dados",
  },
  {
    id: "webapps",
    title: "Webapps para Empresas",
    pain: "Sistema pronto do mercado nem sempre encaixa no jeito que uma empresa trabalha.",
    example: "O Ópsis CRM é um exemplo direto: sistema sob medida para gestão de óticas.",
    mailSubject: "Webapp%20sob%20medida%20—%20Da'at",
    ctaLabel: "Quero um sistema sob medida",
    exampleLink: { to: "/opsis", label: "Veja um exemplo real" },
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export default function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <SiteShell brandHref="/#topo">
      <main id="topo">
        <section className="hero">
          <motion.p className="brand" {...(reduceMotion ? {} : fadeUp(0))}>
            <span className="brand-line">Da&apos;at</span>
            <span className="brand-line">Technologies</span>
          </motion.p>
          <motion.h1 className="headline" {...(reduceMotion ? {} : fadeUp(0.12))}>
            Landing pages, automações, dados e sistemas sob medida.
          </motion.h1>
          <motion.p className="lede" {...(reduceMotion ? {} : fadeUp(0.22))}>
            Da primeira página que o seu cliente vê ao sistema que roda a
            operação por trás dela — projetamos, automatizamos e construímos
            sob medida, peça por peça.
          </motion.p>
          <motion.div className="cta-row" {...(reduceMotion ? {} : fadeUp(0.32))}>
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Conversar com a Da&apos;at
            </a>
            <Link className="btn btn-ghost" to="/opsis">
              Ver produto
            </Link>
          </motion.div>
        </section>

        <section className="solutions" id="solucoes">
          <motion.div
            className="section-head"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Soluções</p>
            <h2>O que construímos para o seu negócio</h2>
            <p className="section-copy">
              Da página que ainda falta ao sistema que já devia ter
              substituído a planilha — veja onde a Da&apos;at entra.
            </p>
          </motion.div>

          <div className="solutions-grid">
            {SOLUTIONS.map((solution, index) => (
              <motion.article
                key={solution.id}
                className={[
                  "solution-card",
                  ["landing-pages", "automacoes", "dados"].includes(solution.id)
                    ? "solution-card--visual"
                    : "",
                  solution.id === "dados" ? "solution-card--full" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                initial={reduceMotion ? false : { opacity: 0, y: 26 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduceMotion ? 0 : Math.min(index * 0.06, 0.24),
                }}
              >
                <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                <h3>{solution.title}</h3>
                <p className="solution-pain">{solution.pain}</p>
                {solution.example && <p className="solution-example">{solution.example}</p>}

                {solution.id === "landing-pages" && (
                  <div className="solution-visual">
                    <EcommerceMock />
                  </div>
                )}
                {solution.id === "automacoes" && (
                  <div className="solution-visual">
                    <AutomationLoop />
                  </div>
                )}
                {solution.id === "dados" && (
                  <div className="solution-visual">
                    <DataDashboards />
                  </div>
                )}

                {solution.exampleLink && (
                  <Link className="text-link solution-link" to={solution.exampleLink.to}>
                    {solution.exampleLink.label}
                    <span aria-hidden="true"> →</span>
                  </Link>
                )}
                <a
                  className="text-link solution-cta"
                  href={`mailto:contato@devcodebi.com?subject=${solution.mailSubject}`}
                >
                  {solution.ctaLabel}
                  <span aria-hidden="true"> →</span>
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="product" id="produto">
          <motion.div
            className="section-head"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Ópsis CRM</h2>
            <p className="section-copy">
              Um exemplo do que construímos sob encomenda: sistema web
              completo de gestão para óticas, do balcão à retaguarda.
            </p>
          </motion.div>

          <motion.article
            className="product-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          >
            <div className="product-visual">
              <div className="screen product-screen">
                <div className="screen-bar">
                  <span />
                  <span />
                  <span />
                  <em>Ópsis CRM · dashboard real</em>
                </div>
                <img
                  src="/screens/dashboard.png"
                  alt="Dashboard do Ópsis CRM em produção, com receita, vendas, ticket médio e produtos mais vendidos"
                  loading="lazy"
                  className="product-screenshot"
                />
              </div>
            </div>
            <div className="product-copy">
              <p className="proof-badge">Já em uso na Home Ótica</p>
              <h3>Gestão completa para o balcão e a retaguarda</h3>
              <p>
                O Ópsis CRM concentra o dia a dia da ótica: cadastro de
                clientes, controle de armações e lentes, receituário
                médico, vendas com pagamento combinado e visão clara
                de desempenho para admin, gerente e vendedor.
              </p>
              <Link className="text-link" to="/opsis">
                Ver telas do produto
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </motion.article>
        </section>

        <section className="about" id="sobre">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Sobre a Da&apos;at</p>
            <h2>Soluções em dados, automações e softwares</h2>
            <p className="section-copy">
              Juntamos desenvolvimento de software e trabalho com dados numa
              coisa só: menos tarefa manual, menos número perdido em
              planilha solta, e decisões que saem mais rápido.
            </p>
            <ul className="pillars">
              <li>
                <strong>Dados</strong>
                <span>Números organizados para decisão, não só para relatório</span>
              </li>
              <li>
                <strong>Automações</strong>
                <span>Tarefas repetitivas rodando sozinhas, sem depender de alguém lembrar</span>
              </li>
              <li>
                <strong>Softwares</strong>
                <span>Sistema web construído para o seu processo, não o contrário</span>
              </li>
            </ul>
          </motion.div>
        </section>

        <section className="contact" id="contato">
          <motion.div
            className="contact-panel"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Vamos conversar sobre o seu próximo projeto</h2>
            <p>
              Descreva o problema em poucas linhas — a gente responde em{" "}
              <a href={CONTACT_MAIL}>contato@devcodebi.com</a>.
            </p>
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Começar a conversa
            </a>
          </motion.div>
        </section>
      </main>
    </SiteShell>
  );
}
