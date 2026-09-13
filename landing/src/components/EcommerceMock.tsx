import { useState, type ReactNode } from "react";

type StoreId = "moda" | "autopecas" | "esportes";
type ModaLine = "feminino" | "masculino";
type IconKind = "dress" | "shirt" | "tire" | "battery" | "wrench" | "ball" | "sneaker" | "dumbbell";

type Product = {
  name: string;
  price: string;
  tone: string;
  icon: IconKind;
};

type Store = {
  id: StoreId;
  tabLabel: string;
  domain: string;
  storeName: string;
  navItems: string[];
  bannerTitle: string;
  bannerCta: string;
  bannerGradient: string;
};

const STORES: Record<StoreId, Store> = {
  moda: {
    id: "moda",
    tabLabel: "Moda",
    domain: "loja-exemplo.com.br",
    storeName: "LOJA EXEMPLO",
    navItems: ["Novidades", "Coleção", "Sobre"],
    bannerTitle: "Coleção Nova",
    bannerCta: "Ver tudo",
    bannerGradient:
      "linear-gradient(135deg, rgba(205,187,160,0.55), rgba(143,133,119,0.25)), linear-gradient(160deg, #241f18, #14110d)",
  },
  autopecas: {
    id: "autopecas",
    tabLabel: "Autopeças",
    domain: "autopecas-exemplo.com.br",
    storeName: "AUTOPEÇAS EXEMPLO",
    navItems: ["Categorias", "Marcas", "Suporte"],
    bannerTitle: "Peças em Oferta",
    bannerCta: "Ver tudo",
    bannerGradient:
      "linear-gradient(135deg, rgba(224,87,79,0.4), rgba(60,60,60,0.2)), linear-gradient(160deg, #1c1c1c, #0d0d0d)",
  },
  esportes: {
    id: "esportes",
    tabLabel: "Esportes",
    domain: "esporte-exemplo.com.br",
    storeName: "ESPORTE EXEMPLO",
    navItems: ["Modalidades", "Marcas", "Promoções"],
    bannerTitle: "Performance para Todo Treino",
    bannerCta: "Ver tudo",
    bannerGradient:
      "linear-gradient(135deg, rgba(61,125,216,0.5), rgba(242,153,74,0.3)), linear-gradient(160deg, #12202f, #0b141d)",
  },
};

const MODA_PRODUCTS: Record<ModaLine, Product[]> = {
  feminino: [
    { name: "Vestido Linho", price: "R$ 189", tone: "#cdbba0", icon: "dress" },
    { name: "Blazer Alfaiataria", price: "R$ 259", tone: "#8f8577", icon: "shirt" },
    { name: "Calça Wide Leg", price: "R$ 149", tone: "#b7a68d", icon: "dress" },
    { name: "Blusa Seda", price: "R$ 129", tone: "#d8cdb8", icon: "shirt" },
  ],
  masculino: [
    { name: "Camisa Linho", price: "R$ 169", tone: "#7d7466", icon: "shirt" },
    { name: "Calça Chino", price: "R$ 179", tone: "#5f5a4f", icon: "shirt" },
    { name: "Jaqueta Sarja", price: "R$ 299", tone: "#4a463d", icon: "shirt" },
    { name: "Polo Piquet", price: "R$ 119", tone: "#a89a80", icon: "shirt" },
  ],
};

const AUTOPECAS_PRODUCTS: Product[] = [
  { name: "Pneu Aro 15", price: "R$ 349", tone: "#2c2c2c", icon: "tire" },
  { name: "Bateria 60Ah", price: "R$ 429", tone: "#3a3a3a", icon: "battery" },
  { name: "Kit Amortecedor", price: "R$ 599", tone: "#242424", icon: "wrench" },
  { name: "Filtro de Óleo", price: "R$ 39", tone: "#4a4a4a", icon: "wrench" },
];

const ESPORTES_PRODUCTS: Product[] = [
  { name: "Bola Oficial", price: "R$ 129", tone: "#1d3a56", icon: "ball" },
  { name: "Tênis Corrida", price: "R$ 349", tone: "#24445f", icon: "sneaker" },
  { name: "Kit Halteres", price: "R$ 219", tone: "#16293b", icon: "dumbbell" },
  { name: "Camiseta Dry-fit", price: "R$ 89", tone: "#2a4d6c", icon: "shirt" },
];

/**
 * Mockup ilustrativo de e-commerce (loja, produtos e domínio fictícios —
 * sem fotos reais, só blocos de cor com ícone de silhueta) usado no card
 * "Landing Pages" para exemplificar o tipo de loja/site que a Da'at
 * consegue construir. Três segmentos em abas (Moda / Autopeças /
 * Esportes) reaproveitando a mesma estrutura de página (header + banner
 * + grade de produtos), cada um com paleta e ícones próprios.
 */
export function EcommerceMock() {
  const [storeId, setStoreId] = useState<StoreId>("moda");
  const [modaLine, setModaLine] = useState<ModaLine>("feminino");
  const store = STORES[storeId];

  const products: Product[] =
    storeId === "moda"
      ? MODA_PRODUCTS[modaLine]
      : storeId === "autopecas"
        ? AUTOPECAS_PRODUCTS
        : ESPORTES_PRODUCTS;

  return (
    <div className="ecom-mock-wrap">
      <div className="ecom-store-tabs" role="tablist">
        {(Object.keys(STORES) as StoreId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === storeId}
            className={`ecom-store-tab${id === storeId ? " is-active" : ""}`}
            onClick={() => setStoreId(id)}
          >
            {STORES[id].tabLabel}
          </button>
        ))}
      </div>

      <div className="ecom-mock screen" aria-label={`Exemplo ilustrativo de e-commerce — ${store.tabLabel}`}>
        <div className="screen-bar">
          <span />
          <span />
          <span />
          <em>{store.domain} · ilustrativo</em>
        </div>

        <div className="ecom-body">
          <div className="ecom-nav">
            <strong className="ecom-logo">{store.storeName}</strong>
            <div className="ecom-nav-items">
              {store.navItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="ecom-banner" style={{ background: store.bannerGradient }}>
            <span className="ecom-banner-title">{store.bannerTitle}</span>
            <span className="ecom-banner-cta">{store.bannerCta}</span>
          </div>

          {storeId === "moda" && (
            <div className="ecom-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={modaLine === "feminino"}
                className={`ecom-tab${modaLine === "feminino" ? " is-active" : ""}`}
                onClick={() => setModaLine("feminino")}
              >
                Feminino
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modaLine === "masculino"}
                className={`ecom-tab${modaLine === "masculino" ? " is-active" : ""}`}
                onClick={() => setModaLine("masculino")}
              >
                Masculino
              </button>
            </div>
          )}

          <div className="ecom-grid">
            {products.map((product) => (
              <div className="ecom-product" key={product.name}>
                <div className="ecom-swatch" style={{ background: product.tone }}>
                  <ProductIcon kind={product.icon} />
                </div>
                <span className="ecom-name">{product.name}</span>
                <span className="ecom-price">{product.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductIcon({ kind }: { kind: IconKind }): ReactNode {
  const common = { width: 56, height: 56, viewBox: "0 0 24 24", className: "ecom-swatch-icon" };

  switch (kind) {
    case "dress":
      return (
        <svg {...common}>
          <path
            d="M9 2h6l1.4 4-2 2 2.6 12H6l2.6-12-2-2L9 2z"
            fill="currentColor"
          />
        </svg>
      );
    case "shirt":
      return (
        <svg {...common}>
          <path
            d="M8 2 4 6l2 2.2 2-1V20h8V7.2l2 1L20 6l-4-4-2 2H10L8 2z"
            fill="currentColor"
          />
        </svg>
      );
    case "tire":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="17" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="19" y="10.5" width="2.5" height="3" fill="currentColor" />
          <line x1="7" y1="10" x2="7" y2="14" stroke="currentColor" strokeWidth="1.6" />
          <line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.6" />
          <line x1="13" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path
            d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.1-.6-.6-2.1 2.3-2.3z"
            fill="currentColor"
          />
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <path
            d="M12 5v14M5.5 8.5 18.5 8.5M5.5 15.5 18.5 15.5"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
        </svg>
      );
    case "sneaker":
      return (
        <svg {...common}>
          <path
            d="M3 16c0-1.5 1-2 2.5-2.6L11 11c1-1.6 2.6-2.5 4.4-2.5.9 0 1.6.7 1.6 1.6 0 .5.3.9.8 1l2.7 1c.9.3 1.5 1.2 1.5 2.1V16H3z"
            fill="currentColor"
          />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...common}>
          <rect x="2" y="10" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="19" y="10" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="8" width="2.5" height="8" rx="1" fill="currentColor" />
          <rect x="16.5" y="8" width="2.5" height="8" rx="1" fill="currentColor" />
          <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="currentColor" strokeWidth="2.4" />
        </svg>
      );
  }
}
