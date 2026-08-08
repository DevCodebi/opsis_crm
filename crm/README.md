# Ópsis CRM / Home Ótica — CRM

Sistema de gestão e vendas para ótica: clientes, produtos, receituário médico, vendas, usuários por convite e dashboard. Marca do produto: **Ópsis CRM**; loja: **Home Ótica**.

Documentação completa na raiz do repositório: `DOCUMENTACAO.md`, `STATUS-ATUAL.md`, `ESTRATEGIA-SAAS.md`.

## Tecnologias

- **Next.js 14** (App Router), **React**, **TypeScript**
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS**
- **Recharts**, **date-fns**, **lucide-react**, **xlsx**, **jsPDF**

## Como rodar

```bash
cd crm
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Configure `crm/.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Schema: `supabase/schema.sql`.

## Funcionalidades

- **Dashboard:** indicadores por papel (vendedor vê só o total das próprias vendas).
- **Clientes / Produtos / Receituário:** admin e gerente.
- **Vendas:** todos os ativos; vendedor só as próprias.
- **Usuários:** só admin — convite por e-mail, reenvio, ativação automática após definir senha (`/api/activate-profile`).
- **Comprovante:** impressão e PDF.

## Produção

- Host: **Netlify** (base directory `crm`, ver `netlify.toml`)
- Domínio: `https://opsiscrm.com.br` (também `https://opsis-crm.netlify.app`)
- Deploy: automático a cada push/merge na `main`

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — rodar build
- `npm run lint` — ESLint
