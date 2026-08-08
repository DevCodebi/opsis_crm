-- Rode isto UMA VEZ no Supabase → SQL Editor
-- Permite que o usuário leia o próprio perfil mesmo com status "convidado"
-- (necessário para o login e para o fluxo de ativação após definir senha).

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Desbloqueio imediato de quem já definiu senha mas ficou preso em "convidado":
-- (opcional) descomente e ajuste o e-mail se quiser ativar na mão:
-- update public.profiles set status = 'ativo', "updatedAt" = now()
-- where email = 'EMAIL-DO-VENDEDOR@exemplo.com';
