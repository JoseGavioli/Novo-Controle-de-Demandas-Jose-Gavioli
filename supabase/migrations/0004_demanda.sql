-- ───────────────────────────────────────────────────────────────
-- Migracao 0004 — Fase 2: demandas
--
-- Cria:
--   - tipo_demanda (data-driven, §10) + os 6 tipos iniciais
--   - o enum de status (§7) — apenas o TIPO (transicoes sao da Fase 3)
--   - a tabela demanda + RLS por papel
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ───────────────────────────────────────────────────────────────

-- ① tipo_demanda + os 6 tipos iniciais (§10) ─────────────────────
create table tipo_demanda (
  id         bigint      generated always as identity primary key,
  nome       text        not null unique,
  ativo      boolean     not null default true,
  created_at timestamptz not null default now()
);

insert into tipo_demanda (nome) values
  ('Orçamento novo'),
  ('Revisão de orçamento'),
  ('Fechamento'),
  ('Adendo de obra fechada'),
  ('Adendo de orçamento apresentado ao cliente'),
  ('Orçamento novo para obra em andamento');

alter table tipo_demanda enable row level security;

-- Todos os logados leem os tipos (para escolher ao criar a demanda).
create policy "tipo_leitura" on tipo_demanda
  for select
  using ( auth.uid() is not null );

-- Somente admin gerencia os tipos (a tela vem num passo futuro).
create policy "tipo_admin_gerencia" on tipo_demanda
  for all
  using ( public.meu_papel() = 'admin' )
  with check ( public.meu_papel() = 'admin' );

-- ② enum de status (§7) — apenas o TIPO; transicoes sao da Fase 3 ──
create type status_demanda as enum (
  'nao_iniciado',
  'em_andamento',
  'congelado',
  'em_revisao_custo',
  'concluido',
  'enviado',
  'cancelada'
);

-- ③ demanda ──────────────────────────────────────────────────────
-- vendedor_id: default auth.uid() => o app nem precisa enviar o autor;
-- o banco preenche com o usuario logado. A RLS de criacao (abaixo) ainda
-- exige vendedor_id = auth.uid(), tornando o autor INFORJAVEL (§5).
-- on delete restrict nos FKs protege o historico.
create table demanda (
  id              bigint         generated always as identity primary key,
  obra_id         bigint         not null references obra (id)         on delete restrict,
  tipo_demanda_id bigint         not null references tipo_demanda (id) on delete restrict,
  vendedor_id     uuid           not null references perfil (id)       on delete restrict default auth.uid(),
  descricao       text           not null,
  prazo           date           not null,
  status          status_demanda not null default 'nao_iniciado',
  demanda_pai_id  bigint         references demanda (id) on delete restrict, -- reservado para a Fase 5
  created_at      timestamptz    not null default now()
);

alter table demanda enable row level security;

-- Leitura: o vendedor ve as PROPRIAS; admin/atendente veem TODAS (a fila).
create policy "demanda_leitura" on demanda
  for select
  using (
    vendedor_id = auth.uid()
    or public.meu_papel() in ('admin', 'atendente')
  );

-- Criar: qualquer logado, mas o autor e SEMPRE ele mesmo (inforjavel).
create policy "demanda_criar" on demanda
  for insert
  with check ( vendedor_id = auth.uid() );

-- Observacao: SEM policy de UPDATE/DELETE de proposito. Com a RLS ligada
-- e sem essas policies, ninguem edita nem apaga demanda nesta fase —
-- descricao imutavel (§9) e transicoes de status ficam para a Fase 3.
