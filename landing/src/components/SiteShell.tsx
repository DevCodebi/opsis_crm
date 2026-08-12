import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { NeuralField } from "./NeuralField";

const CONTACT_MAIL = "mailto:contato@devcode.com?subject=Contato%20Da'at%20Technologies";

type Props = {
  children: ReactNode;
  brandHref?: string;
};

export function SiteShell({ children, brandHref = "/" }: Props) {
  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true">
        <NeuralField />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="grid-wash" />
      </div>

      <header className="nav">
        <Link className="nav-brand" to={brandHref}>
          Da&apos;at
        </Link>
        <nav className="nav-links" aria-label="Principal">
          <Link className="nav-link" to="/sobre">
            Sobre nós
          </Link>
          <a className="nav-cta" href={CONTACT_MAIL}>
            Fale Conosco
          </a>
        </nav>
      </header>

      {children}

      <footer className="footer">
        <span>© {new Date().getFullYear()} Da&apos;at Technologies</span>
        <a href={CONTACT_MAIL}>contato@devcode.com</a>
      </footer>
    </div>
  );
}
