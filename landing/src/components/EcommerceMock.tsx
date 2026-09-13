import { useState } from "react";

type Line = "feminino" | "masculino";

type Product = {
  name: string;
  price: string;
  tone: string;
};

const PRODUCTS: Record<Line, Product[]> = {
  feminino: [
    { name: "Vestido Linho", price: "R$ 189", tone: "#cdbba0" },
    { name: "Blazer Alfaiataria", price: "R$ 259", tone: "#8f8577" },
    { name: "Calça Wide Leg", price: "R$ 149", tone: "#b7a68d" },
    { name: "Blusa Seda", price: "R$ 129", tone: "#d8cdb8" },
  ],
  masculino: [
    { name: "Camisa Linho", price: "R$ 169", tone: "#7d7466" },
    { name: "Calça Chino", price: "R$ 179", tone: "#5f5a4f" },
    { name: "Jaqueta Sarja", price: "R$ 299", tone: "#4a463d" },
    { name: "Polo Piquet", price: "R$ 119", tone: "#a89a80" },
  ],
};

/**
 * Mockup ilustrativo de e-commerce de moda (nome/loja fictícios,
 * sem fotos reais — blocos de cor no lugar de imagens de produto) usado
 * no card "Landing Pages" para exemplificar o tipo de loja/site que a
 * Da'at consegue construir.
 */
export function EcommerceMock() {
  const [line, setLine] = useState<Line>("feminino");

  return (
    <div className="ecom-mock screen" aria-label="Exemplo ilustrativo de e-commerce de moda">
      <div className="screen-bar">
        <span />
        <span />
        <span />
        <em>loja-exemplo.com.br · ilustrativo</em>
      </div>
      <div className="ecom-body">
        <div className="ecom-top">
          <strong className="ecom-logo">LOJA EXEMPLO</strong>
          <div className="ecom-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={line === "feminino"}
              className={`ecom-tab${line === "feminino" ? " is-active" : ""}`}
              onClick={() => setLine("feminino")}
            >
              Feminino
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={line === "masculino"}
              className={`ecom-tab${line === "masculino" ? " is-active" : ""}`}
              onClick={() => setLine("masculino")}
            >
              Masculino
            </button>
          </div>
        </div>
        <div className="ecom-grid">
          {PRODUCTS[line].map((product) => (
            <div className="ecom-product" key={product.name}>
              <div className="ecom-swatch" style={{ background: product.tone }} />
              <span className="ecom-name">{product.name}</span>
              <span className="ecom-price">{product.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
