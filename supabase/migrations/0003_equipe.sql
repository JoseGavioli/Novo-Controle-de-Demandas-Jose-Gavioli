-- ───────────────────────────────────────────────────────────────
-- Migracao 0003 — Fase 1c: gestao de equipe (perfis)
--
-- Cria:
--   - o gatilho handle_new_user(): ao criar um usuario no Auth, cria
--     automaticamente o perfil correspondente (papel inicial 'vendedor')
--   - RLS de equipe: admin/atendente leem todos os perfis; so admin edita
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ───────────────────────────────────────────────────────────────

-- ① Gatilho: cria o perfil junto com o usuario do Auth ───────────
-- security definer: roda com privilegio elevado, entao consegue inserir
-- em perfil mesmo com a RLS ligada (no momento da criacao ainda nao ha
-- usuario "logado"). O nome vem do metadado 'nome_completo' se existir,
-- senao usa o email; voce ajusta depois na tela Equipe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, nome_completo, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo', new.email),
    'vendedor'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ② RLS de equipe ───────────────────────────────────────────────
-- Admin e atendente leem TODOS os perfis (a policy de leitura propria da
-- Fase 0 continua valendo para o vendedor — policies permissivas se somam).
create policy "perfil_leitura_equipe" on perfil
  for select
  using ( public.meu_papel() in ('admin', 'atendente') );

-- Somente admin EDITA perfis (nome, celular, papel, ativo).
create policy "perfil_admin_edita" on perfil
  for update
  using ( public.meu_papel() = 'admin' )
  with check ( public.meu_papel() = 'admin' );
