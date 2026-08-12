import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SiteShell } from "../components/SiteShell";
import { CrmMock } from "../components/CrmMock";
import { OPSIS_SCREENS } from "../data/opsisScreens";

const CONTACT_MAIL = "mailto:contato@devcode.com?subject=Ópsis%20CRM%20—%20Da'at";

export default function OpsisPage() {
  const reduceMotion = useReducedMotion();

  return (
    <SiteShell>
      <main className="opsis-page">
        <section className="opsis-hero">
          <p className="eyebrow">Produto</p>
          <h1>Ópsis CRM</h1>
          <p className="section-copy">
            Conheça as telas do sistema: do login ao fechamento da venda,
            com visão clara para o balcão e a gestão da ótica.
          </p>
          <div className="cta-row opsis-hero-cta">
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Fale Conosco
            </a>
            <Link className="btn btn-ghost" to="/">
              Voltar à home
            </Link>
          </div>
        </section>

        <section className="opsis-gallery" aria-label="Telas do Ópsis CRM">
          {OPSIS_SCREENS.map((screen, index) => (
            <motion.article
              key={screen.id}
              id={screen.id}
              className="opsis-card"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2),
              }}
            >
              <div className="opsis-card-media">
                {screen.image ? (
                  <img
                    src={screen.image}
                    alt={`Tela de ${screen.title} do Ópsis CRM`}
                    loading="lazy"
                  />
                ) : (
                  <CrmMock
                    kind={
                      screen.visual as
                        | "dashboard"
                        | "clientes"
                        | "produtos"
                        | "receituario"
                        | "vendas"
                        | "usuarios"
                    }
                  />
                )}
              </div>
              <div className="opsis-card-copy">
                <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                <h2>{screen.title}</h2>
                <p>{screen.description}</p>
              </div>
            </motion.article>
          ))}
        </section>

        <section className="contact opsis-contact">
          <div className="contact-panel">
            <h2>Quer ver o Ópsis na sua ótica?</h2>
            <p>
              Fale com a Da&apos;at em{" "}
              <a href={CONTACT_MAIL}>contato@devcode.com</a>.
            </p>
            <a className="btn btn-primary" href={CONTACT_MAIL}>
              Fale Conosco
            </a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
