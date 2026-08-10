import { motion, useReducedMotion } from "framer-motion";

const CONTACT_MAIL = "mailto:contato@devcode.com?subject=Contato%20Da'at%20Technologies";
const OPSIS_URL = "https://opsiscrm.com.br";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export default function App() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="grid-wash" />
      </div>

      <header className="nav">
        <a className="nav-brand" href="#topo">
          Da&apos;at
        </a>
        <a className="nav-cta" href={CONTACT_MAIL}>
          Fale Conosco
        </a>
      </header>

      <main id="topo">
        <section className="hero">
          <motion.p
            className="brand"
            {...(reduceMotion ? {} : fadeUp(0))}
          >
            Da&apos;at Technologies
          </motion.p>
          <motion.h1
            className="headline"
            {...(reduceMotion ? {} : fadeUp(0.12))}
          >
            Dados, automações e software que fazem o negócio andar.
          </motion.h1>
          <motion.p
            className="lede"
            {...(reduceMotion ? {} : fadeUp(0.22))}
          >
            Desenvolvemos soluções digitais para transformar informação
            em operação — com foco em clareza, escala e resultado.
          </motion.p>
          <motion.div
            className="cta-row"
            {...(reduceMotion ? {} : fadeUp(0.32))}
          >
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Fale Conosco
            </a>
            <a className="btn btn-ghost" href="#produto">
              Ver produto
            </a>
          </motion.div>
        </section>

        <section className="product" id="produto">
          <motion.div
            className="section-head"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Produto</p>
            <h2>Ópsis CRM</h2>
            <p className="section-copy">
              Sistema web para gestão de óticas: clientes, produtos,
              receituário, vendas e equipe — com dashboard e controle
              por papéis em um só lugar.
            </p>
          </motion.div>

          <motion.article
            className="product-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          >
            <div className="product-visual" aria-hidden="true">
              <div className="screen">
                <div className="screen-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="screen-body">
                  <div className="metric">
                    <small>Vendas do mês</small>
                    <strong>R$ 48.2k</strong>
                  </div>
                  <div className="bars">
                    <i style={{ height: "42%" }} />
                    <i style={{ height: "68%" }} />
                    <i style={{ height: "55%" }} />
                    <i style={{ height: "86%" }} />
                    <i style={{ height: "72%" }} />
                  </div>
                  <ul className="chips">
                    <li>Clientes</li>
                    <li>Receituário</li>
                    <li>Estoque</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="product-copy">
              <h3>Gestão completa para o balcão e a retaguarda</h3>
              <p>
                O Ópsis CRM concentra o dia a dia da ótica: cadastro de
                clientes, controle de armações e lentes, receituário
                médico, vendas com pagamento combinado e visão clara
                de desempenho para admin, gerente e vendedor.
              </p>
              <a
                className="text-link"
                href={OPSIS_URL}
                target="_blank"
                rel="noreferrer"
              >
                Acessar Ópsis CRM
                <span aria-hidden="true"> →</span>
              </a>
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
              Unimos engenharia de software e inteligência de dados
              para construir produtos e automações que reduzem
              fricção operacional e aceleram decisões — do fluxo
              interno ao produto entregue ao cliente.
            </p>
            <ul className="pillars">
              <li>
                <strong>Dados</strong>
                <span>Modelagem, integração e visão acionável</span>
              </li>
              <li>
                <strong>Automações</strong>
                <span>Processos repetíveis com menos esforço manual</span>
              </li>
              <li>
                <strong>Softwares</strong>
                <span>Aplicações web sob medida para o negócio</span>
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
              Conte o desafio. Respondemos em{" "}
              <a href={CONTACT_MAIL}>contato@devcode.com</a>.
            </p>
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Fale Conosco
            </a>
          </motion.div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Da&apos;at Technologies</span>
        <a href={CONTACT_MAIL}>contato@devcode.com</a>
      </footer>
    </div>
  );
}
