-- ========================================================================
-- Migração: vendedor cadastra clientes/receituário + pagamento combinado
-- Rode no SQL Editor do Supabase se o banco já existir (schema.sql antigo).
-- ========================================================================

-- Pagamento combinado nas vendas
alter table public.sales
  add column if not exists "paymentSplits" jsonb;

-- Políticas antigas de escrita (admin/gerente) → cadastro inclui vendedor
drop policy if exists "clients_write_admin_gerente" on public.clients;
drop policy if exists "clients_update_admin_gerente" on public.clients;
drop policy if exists "clients_write_cadastro" on public.clients;
drop policy if exists "clients_update_cadastro" on public.clients;

create policy "clients_write_cadastro" on public.clients
  for insert with check (public.has_role(array['admin','gerente','vendedor']));
create policy "clients_update_cadastro" on public.clients
  for update using (public.has_role(array['admin','gerente','vendedor']))
  with check (public.has_role(array['admin','gerente','vendedor']));

drop policy if exists "prescriptions_write_admin_gerente" on public.prescriptions;
drop policy if exists "prescriptions_update_admin_gerente" on public.prescriptions;
drop policy if exists "prescriptions_write_cadastro" on public.prescriptions;
drop policy if exists "prescriptions_update_cadastro" on public.prescriptions;

create policy "prescriptions_write_cadastro" on public.prescriptions
  for insert with check (public.has_role(array['admin','gerente','vendedor']));
create policy "prescriptions_update_cadastro" on public.prescriptions
  for update using (public.has_role(array['admin','gerente','vendedor']))
  with check (public.has_role(array['admin','gerente','vendedor']));
