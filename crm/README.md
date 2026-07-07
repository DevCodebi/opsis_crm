# Home Ótica - CRM

Sistema de gestão e vendas para ótica, com cadastro de clientes, produtos, **receituário médico** (graus: OD/OS, SPH, CYL, AXIS, ADD, PD) e vendas, além de dashboard com indicadores.

## Tecnologias

- **Next.js 14** (App Router), **React**, **TypeScript**
- **Tailwind CSS** (tema com cores do logo Home Ótica)
- **Recharts** (gráficos do dashboard)
- **date-fns** (datas em pt-BR)
- **lucide-react** (ícones)

## Como rodar

```bash
cd crm
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Funcionalidades

- **Dashboard**: receita total, número de vendas, ticket médio, total de clientes; gráfico de receita por mês; gráfico de vendas por status (pendente, pago, entregue, cancelado).
- **Clientes**: listagem, busca, cadastro e edição (nome, e-mail, telefone, CPF, endereço).
- **Produtos**: cadastro de armações, lentes e acessórios (nome, tipo, SKU, preço, estoque, descrição).
- **Receituário médico**: cadastro por cliente com:
  - **OD** (olho direito) e **OS** (olho esquerdo): SPH (esférico), CYL (cilíndrico), AXIS (eixo 1–180°), ADD (adição).
  - Distância pupilar (PD) em mm.
  - Nome e CRM do médico oftalmologista, data da receita e observações.
- **Vendas**: registro de venda vinculado a cliente, opcionalmente a um receituário do cliente, com itens (produto, quantidade, preço), desconto, status e observações.

Os dados são salvos no **localStorage** do navegador (sem backend). Para persistência em servidor, você pode integrar Supabase ou outra API.

## Logo

Para exibir o logo da Home Ótica na sidebar, coloque a imagem em `crm/public/logo.png`. O layout já usa as cores do logo (fundo escuro `#1A1D25`, azul `#344B6F`, cinza `#5D708B`, texto claro `#EAEAEA`).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — rodar build de produção
- `npm run lint` — ESLint
