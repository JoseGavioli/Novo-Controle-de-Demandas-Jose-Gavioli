-- ───────────────────────────────────────────────────────────────
-- Migracao 0002 — Fase 1: clientes e obras
--
-- Cria:
--   - a funcao auxiliar meu_papel() (reutilizada nas regras por papel)
--   - a tabela cliente + RLS
--   - a tabela obra    + RLS
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ───────────────────────────────────────────────────────────────

-- ── Funcao auxiliar: papel do usuario logado ─────────────────────
-- Retorna o papel ('admin' | 'atendente' | 'vendedor') de quem fez a
-- requisicao. SECURITY DEFINER faz a funcao rodar com privilegio
-- elevado, entao ela le a tabela perfil SEM esbarrar na RLS — e sem
-- risco de recursao quando, na sub-etapa 1c, o admin puder ler todos
-- os perfis. "stable" = nao altera dados; "set search_path = public"
-- e uma protecao de seguranca recomendada.
create or replace function public.meu_papel()
returns papel
language sql
security definer
set search_path = public
stable
as $$
  select papel from public.perfil where id = auth.uid();
$$;

-- ── Tabela cliente ───────────────────────────────────────────────
create table cliente (
  id          bigint generated always as identity primary key,
  nome        text        not null,
  observacoes text,
  created_at  timestamptz not null default now()
);

alter table cliente enable row level security;

-- Ler/buscar: qualquer usuario logado (visibilidade compartilhada — viabiliza a busca-primeiro)
create policy "cliente_leitura" on cliente
  for select
  using ( auth.uid() is not null );

-- Criar: qualquer usuario logado (vendedor incluso)
create policy "cliente_criar" on cliente
  for insert
  with check ( auth.uid() is not null );

-- Editar: somente admin/atendente
create policy "cliente_editar" on cliente
  for update
  using ( public.meu_papel() in ('admin', 'atendente') )
  with check ( public.meu_papel() in ('admin', 'atendente') );

-- Excluir: somente admin/atendente
create policy "cliente_excluir" on cliente
  for delete
  using ( public.meu_papel() in ('admin', 'atendente') );

-- ── Tabela obra ──────────────────────────────────────────────────
-- on delete restrict: nao deixa apagar um cliente que ainda tem obras
-- (protege o historico).
create table obra (
  id         bigint      generated always as identity primary key,
  cliente_id bigint      not null references cliente (id) on delete restrict,
  nome       text        not null,
  endereco   text,
  created_at timestamptz not null default now()
);

alter table obra enable row level security;

create policy "obra_leitura" on obra
  for select
  using ( auth.uid() is not null );

create policy "obra_criar" on obra
  for insert
  with check ( auth.uid() is not null );

create policy "obra_editar" on obra
  for update
  using ( public.meu_papel() in ('admin', 'atendente') )
  with check ( public.meu_papel() in ('admin', 'atendente') );

create policy "obra_excluir" on obra
  for delete
  using ( public.meu_papel() in ('admin', 'atendente') );
