type Props = {
  kind: "dashboard" | "clientes" | "produtos" | "receituario" | "vendas" | "usuarios";
};

const NAV = [
  "Dashboard",
  "Clientes",
  "Produtos",
  "Receituário",
  "Vendas",
  "Usuários",
] as const;

const ACTIVE: Record<Props["kind"], string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  produtos: "Produtos",
  receituario: "Receituário",
  vendas: "Vendas",
  usuarios: "Usuários",
};

export function CrmMock({ kind }: Props) {
  return (
    <div className="crm-mock" aria-hidden="true">
      <aside className="crm-side">
        <div className="crm-brand">
          <span className="crm-logo">HO</span>
          <div>
            <strong>Home Ótica</strong>
            <small>by Ópsis CRM</small>
          </div>
        </div>
        <ul>
          {NAV.map((item) => (
            <li key={item} className={item === ACTIVE[kind] ? "is-active" : undefined}>
              {item}
            </li>
          ))}
        </ul>
      </aside>
      <div className="crm-main">
        <header className="crm-top">
          <span>{ACTIVE[kind]}</span>
          <em>Admin</em>
        </header>
        <div className="crm-content">{renderBody(kind)}</div>
      </div>
    </div>
  );
}

function renderBody(kind: Props["kind"]) {
  switch (kind) {
    case "dashboard":
      return (
        <>
          <div className="crm-kpis">
            <div><small>Receita</small><strong>R$ 48.2k</strong></div>
            <div><small>Vendas</small><strong>126</strong></div>
            <div><small>Ticket</small><strong>R$ 382</strong></div>
            <div><small>Clientes</small><strong>318</strong></div>
          </div>
          <div className="crm-chart">
            <i style={{ height: "45%" }} />
            <i style={{ height: "62%" }} />
            <i style={{ height: "38%" }} />
            <i style={{ height: "78%" }} />
            <i style={{ height: "55%" }} />
            <i style={{ height: "88%" }} />
            <i style={{ height: "70%" }} />
          </div>
        </>
      );
    case "clientes":
      return (
        <div className="crm-table">
          <div className="crm-table-head"><span>Nome</span><span>Telefone</span><span>Cidade</span></div>
          <div><span>Ana Souza</span><span>(11) 98888-1100</span><span>São Paulo</span></div>
          <div><span>Bruno Lima</span><span>(11) 97777-2200</span><span>Osasco</span></div>
          <div><span>Carla Dias</span><span>(11) 96666-3300</span><span>Guarulhos</span></div>
          <div><span>Diego Alves</span><span>(11) 95555-4400</span><span>São Paulo</span></div>
        </div>
      );
    case "produtos":
      return (
        <div className="crm-cards">
          <article><strong>Armação Acetato</strong><span>Estoque 24</span><em>R$ 289</em></article>
          <article><strong>Lente Transitions</strong><span>Estoque 40</span><em>R$ 520</em></article>
          <article><strong>Estojo Premium</strong><span>Estoque 61</span><em>R$ 45</em></article>
          <article><strong>Armação Metal</strong><span>Estoque 18</span><em>R$ 349</em></article>
        </div>
      );
    case "receituario":
      return (
        <div className="crm-rx">
          <div className="crm-rx-block">
            <strong>OD</strong>
            <span>SPH -1.25 · CYL -0.50 · AXIS 180</span>
          </div>
          <div className="crm-rx-block">
            <strong>OS</strong>
            <span>SPH -1.00 · CYL -0.75 · AXIS 175</span>
          </div>
          <div className="crm-rx-meta">
            <span>PD 62 mm</span>
            <span>Dr. Marcos Vieira</span>
          </div>
        </div>
      );
    case "vendas":
      return (
        <div className="crm-sale">
          <div className="crm-sale-row"><span>Armação Acetato</span><em>R$ 289</em></div>
          <div className="crm-sale-row"><span>Lente Transitions</span><em>R$ 520</em></div>
          <div className="crm-sale-pay">
            <span>Dinheiro + Cartão</span>
            <strong>R$ 809</strong>
          </div>
          <div className="crm-sale-tag">Entrega prevista · 18/08</div>
        </div>
      );
    case "usuarios":
      return (
        <div className="crm-table">
          <div className="crm-table-head"><span>Nome</span><span>Papel</span><span>Status</span></div>
          <div><span>Mariana Costa</span><span>Admin</span><span className="ok">Ativo</span></div>
          <div><span>Paulo Mendes</span><span>Gerente</span><span className="ok">Ativo</span></div>
          <div><span>Juliana Reis</span><span>Vendedor</span><span className="ok">Ativo</span></div>
          <div><span>Rafael Nunes</span><span>Vendedor</span><span className="wait">Convidado</span></div>
        </div>
      );
  }
}
