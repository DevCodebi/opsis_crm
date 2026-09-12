export type OpsisScreen = {
  id: string;
  title: string;
  description: string;
  /** CSS mock key or image path under /screens */
  visual: "login" | "dashboard" | "clientes" | "produtos" | "receituario" | "vendas" | "usuarios";
  image?: string;
};

export const OPSIS_SCREENS: OpsisScreen[] = [
  {
    id: "login",
    title: "Login",
    description:
      "Acesso seguro por e-mail e senha, com recuperação de conta para a equipe da ótica.",
    visual: "login",
    image: "/screens/login.webp",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Visão de faturamento, vendas, ticket médio, produtos em destaque e alertas de estoque.",
    visual: "dashboard",
  },
  {
    id: "clientes",
    title: "Clientes",
    description:
      "Cadastro completo de clientes com contato, endereço e histórico ligado às vendas.",
    visual: "clientes",
  },
  {
    id: "produtos",
    title: "Produtos",
    description:
      "Controle de armações, lentes e acessórios: preço, custo, estoque e fornecedor.",
    visual: "produtos",
  },
  {
    id: "receituario",
    title: "Receituário",
    description:
      "Graus OD/OS, distância pupilar e médico responsável — prontos para a venda.",
    visual: "receituario",
  },
  {
    id: "vendas",
    title: "Vendas",
    description:
      "Vendas com pagamento único ou combinado, desconto autorizado e comprovante em PDF.",
    visual: "vendas",
  },
  {
    id: "usuarios",
    title: "Usuários",
    description:
      "Convites por e-mail e papéis (admin, gerente, vendedor) com permissões por tela.",
    visual: "usuarios",
  },
];
