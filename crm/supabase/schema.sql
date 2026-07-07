-- Home Ótica CRM — schema Supabase
-- Rode este arquivo inteiro em: Supabase Dashboard > SQL Editor > New query > Run
--
-- Observação de convenção: as colunas usam camelCase entre aspas (ex: "createdAt")
-- para bater 1:1 com os tipos TypeScript do app (src/types/index.ts) e simplificar
-- o código. Não é o padrão usual do Postgres (que prefere snake_case), mas evita
-- uma camada extra de conversão de nomes no front-end.

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ========================================================================
-- PROFILES (dados do funcionário/usuário do sistema, ligados ao auth.users)
-- ========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin','gerente','vendedor')),
  -- 'convidado': convite enviado, ainda não definiu senha/logou pela primeira vez.
  status text not null default 'convidado' check (status in ('convidado','ativo','inativo')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ========================================================================
-- CLIENTS
-- ========================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  cpf text,
  "birthDate" date,
  sex text check (sex in ('M','F','Outro')),
  address text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ========================================================================
-- PRODUCTS
-- ========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('armacao','lente','acessorio')),
  sku text,
  description text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2),
  stock integer not null default 0,
  "minStock" integer,
  supplier text,
  "frameType" text,
  "lensType" text,
  "treatmentType" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ========================================================================
-- PRESCRIPTIONS (receituário)
-- ========================================================================
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  "clientId" uuid not null references public.clients(id) on delete cascade,
  "doctorName" text not null,
  "doctorCrm" text,
  date date not null,
  od jsonb not null default '{}'::jsonb,   -- { sph, cyl, axis, add }
  os jsonb not null default '{}'::jsonb,   -- { sph, cyl, axis, add }
  pd numeric(6,2),
  notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ========================================================================
-- SALES (vendas)
-- ========================================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  "clientId" uuid not null references public.clients(id),
  "clientName" text not null,
  "sellerId" uuid references public.profiles(id),
  "sellerName" text,
  "paymentMethod" text check ("paymentMethod" in ('dinheiro','pix','cartao_debito','cartao_credito','parcelado','boleto','outro')),
  "boletoParcelas" jsonb,        -- array de { id, dueDate, amount, status, paidAt, paymentMethodUsed }
  -- ON DELETE SET NULL: excluir um receituário antigo não pode travar a
  -- exclusão nem apagar o histórico da venda — só desfaz o vínculo.
  "prescriptionId" uuid references public.prescriptions(id) on delete set null,
  items jsonb not null default '[]'::jsonb, -- array de { productId, productName, quantity, unitPrice, total }
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pendente' check (status in ('pendente','pago','entregue','cancelado')),
  "paidAt" timestamptz,
  "deliveredAt" timestamptz,
  "expectedDeliveryDate" date, -- data prevista de entrega
  notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ========================================================================
-- ÍNDICES úteis
-- ========================================================================
create index if not exists idx_prescriptions_client on public.prescriptions("clientId");
create index if not exists idx_sales_client on public.sales("clientId");
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_prescription on public.sales("prescriptionId");
create index if not exists idx_sales_seller on public.sales("sellerId");

-- ========================================================================
-- FUNÇÕES AUXILIARES DE RLS
-- Centralizam a checagem de papel/status do usuário logado, evitando
-- repetir a mesma subquery em toda política. `stable` permite ao Postgres
-- cachear o resultado dentro da mesma consulta (melhor desempenho).
-- ========================================================================

-- Usuário está autenticado E com status "ativo" (bloqueia "convidado" que
-- ainda não definiu senha, e "inativo" cujo acesso foi revogado mesmo que
-- o token JWT dele ainda não tenha expirado).
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'ativo'
  );
$$;

-- Usuário ativo E com um dos papéis informados (ex: has_role(array['admin','gerente'])).
create or replace function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'ativo' and role = any(roles)
  );
$$;

-- As duas funções são "security definer" para poder ler public.profiles
-- independente da política de RLS da própria tabela profiles (evita
-- recursão/dependência circular). Only leem dados de perfil, não alteram nada.

-- ========================================================================
-- RLS — políticas por papel, seguindo o princípio do menor privilégio.
-- ========================================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.prescriptions enable row level security;
alter table public.sales enable row level security;

-- Remove políticas antigas (permissivas) antes de recriar, se existirem.
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "clients_all_authenticated" on public.clients;
drop policy if exists "products_all_authenticated" on public.products;
drop policy if exists "prescriptions_all_authenticated" on public.prescriptions;
drop policy if exists "sales_all_authenticated" on public.sales;

-- ---------- PROFILES ----------
-- Leitura liberada pra qualquer usuário ativo: a UI precisa listar nomes de
-- vendedores/funcionários em vários lugares (seletor de vendedor na venda,
-- tela de Usuários, etc.).
create policy "profiles_select_active" on public.profiles
  for select using (public.is_active_user());
-- Sem política de INSERT/UPDATE/DELETE para o papel "authenticated": toda
-- criação/edição/exclusão de usuário passa pela rota /api/users, que usa a
-- service_role key (ignora RLS) e já valida que quem pede é admin. Deixar
-- essas operações sem política aqui é reforço: mesmo com o token de um
-- usuário comum em mãos, não dá para alterar perfis direto no banco.

-- ---------- CLIENTS ----------
-- Leitura: qualquer usuário ativo (o vendedor precisa consultar clientes
-- para registrar uma venda, mesmo sem acesso à tela de Clientes).
create policy "clients_select_active" on public.clients
  for select using (public.is_active_user());
-- Escrita: só quem tem acesso à tela de Clientes no menu (admin/gerente).
create policy "clients_write_admin_gerente" on public.clients
  for insert with check (public.has_role(array['admin','gerente']));
create policy "clients_update_admin_gerente" on public.clients
  for update using (public.has_role(array['admin','gerente']))
  with check (public.has_role(array['admin','gerente']));
create policy "clients_delete_admin_gerente" on public.clients
  for delete using (public.has_role(array['admin','gerente']));

-- ---------- PRODUCTS ----------
-- Leitura: qualquer usuário ativo (vendedor precisa ver produtos/preços
-- para montar uma venda).
create policy "products_select_active" on public.products
  for select using (public.is_active_user());
-- Escrita: só admin/gerente (mesma regra de acesso da tela de Produtos).
create policy "products_write_admin_gerente" on public.products
  for insert with check (public.has_role(array['admin','gerente']));
create policy "products_update_admin_gerente" on public.products
  for update using (public.has_role(array['admin','gerente']))
  with check (public.has_role(array['admin','gerente']));
create policy "products_delete_admin_gerente" on public.products
  for delete using (public.has_role(array['admin','gerente']));

-- ---------- PRESCRIPTIONS ----------
-- Leitura: qualquer usuário ativo (vendedor precisa ver o receituário do
-- cliente ao vincular numa venda).
create policy "prescriptions_select_active" on public.prescriptions
  for select using (public.is_active_user());
-- Escrita: só admin/gerente (mesma regra de acesso da tela de Receituário).
create policy "prescriptions_write_admin_gerente" on public.prescriptions
  for insert with check (public.has_role(array['admin','gerente']));
create policy "prescriptions_update_admin_gerente" on public.prescriptions
  for update using (public.has_role(array['admin','gerente']))
  with check (public.has_role(array['admin','gerente']));
create policy "prescriptions_delete_admin_gerente" on public.prescriptions
  for delete using (public.has_role(array['admin','gerente']));

-- ---------- SALES ----------
-- Leitura: admin/gerente veem todas as vendas; vendedor só as próprias
-- (onde é o vendedor responsável).
create policy "sales_select_admin_gerente" on public.sales
  for select using (public.has_role(array['admin','gerente']));
create policy "sales_select_own_vendedor" on public.sales
  for select using (public.has_role(array['vendedor']) and "sellerId" = auth.uid());
-- Inserção: qualquer usuário ativo pode registrar uma venda (admin, gerente
-- e vendedor usam a tela de Vendas para isso).
create policy "sales_insert_active" on public.sales
  for insert with check (public.is_active_user());
-- Atualização: admin/gerente em qualquer venda; vendedor só nas próprias
-- (ex: para marcar como "pago"/"entregue" as vendas que ele mesmo fez).
create policy "sales_update_admin_gerente" on public.sales
  for update using (public.has_role(array['admin','gerente']))
  with check (public.has_role(array['admin','gerente']));
create policy "sales_update_own_vendedor" on public.sales
  for update using (public.has_role(array['vendedor']) and "sellerId" = auth.uid())
  with check (public.has_role(array['vendedor']) and "sellerId" = auth.uid());
-- Exclusão: só admin/gerente — vendedor não apaga vendas (a UI já esconde
-- esse botão para esse papel, e o banco garante mesmo se alguém tentar
-- chamar a API diretamente).
create policy "sales_delete_admin_gerente" on public.sales
  for delete using (public.has_role(array['admin','gerente']));

-- ========================================================================
-- PRONTO (setup do zero). Depois de rodar este script:
-- 1. Vá em Authentication > Users > Add user, crie o admin
--    (email: admin@homeotica.com, defina uma senha forte, marque "Auto Confirm User").
-- 2. Copie o UUID do usuário criado e rode o insert abaixo (troque o UUID):
--
-- insert into public.profiles (id, name, email, role, status)
-- values ('COLE-O-UUID-AQUI', 'Administrador', 'admin@homeotica.com', 'admin', 'ativo');
-- ========================================================================

-- ========================================================================
-- MIGRAÇÃO INCREMENTAL — rode só isto se o schema acima já estava aplicado
-- (ex: você já tinha rodado este arquivo antes). Todos os comandos abaixo
-- são seguros de rodar de novo (idempotentes). Alternativamente, como as
-- seções de tabelas usam "if not exists" e a de RLS já dá "drop policy if
-- exists" antes de recriar, rodar o arquivo INTEIRO de novo também funciona.
-- ========================================================================

-- Data prevista de entrega da venda
alter table public.sales
  add column if not exists "expectedDeliveryDate" date;

-- Novo status "convidado" para profiles (fluxo de convite por e-mail)
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('convidado','ativo','inativo'));
alter table public.profiles alter column status set default 'convidado';

-- FK de sales.prescriptionId passa a ON DELETE SET NULL (excluir um
-- receituário antigo não deve mais travar nem apagar a venda vinculada).
-- Busca dinamicamente qualquer constraint de FK existente na coluna
-- "prescriptionId" (não confia em adivinhar o nome) e recria com
-- ON DELETE SET NULL — assim funciona não importa o nome gerado antes.
do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.sales'::regclass
      and contype = 'f'
      and 'prescriptionId' = any(
        select attname from pg_attribute
        where attrelid = 'public.sales'::regclass
          and attnum = any(conkey)
      )
  loop
    execute format('alter table public.sales drop constraint %I', fk.conname);
  end loop;
end $$;

alter table public.sales
  add constraint "sales_prescriptionId_fkey"
  foreign key ("prescriptionId") references public.prescriptions(id) on delete set null;
