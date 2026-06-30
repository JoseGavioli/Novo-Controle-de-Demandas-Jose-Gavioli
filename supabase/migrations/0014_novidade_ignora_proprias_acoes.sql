-- ───────────────────────────────────────────────────────────────
-- Migracao 0014 — novidade ignora as PROPRIAS acoes
--
-- demandas_com_novidade() (marcadores na lista + badge do menu) passa a
-- ignorar mudancas de status feitas pelo PROPRIO usuario (h.autor_id <> uid),
-- ficando consistente com notificacoes() e demandas_com_comentario_novo().
--
-- Motivo: o admin/atendente faz as mudancas de status. Antes, as proprias
-- acoes apareciam como "novidade" na lista (mas nunca na Inicio, que ja
-- ignorava). Agora "novidade" = alguem MAIS mexeu desde a sua ultima visita.
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ───────────────────────────────────────────────────────────────

create or replace function public.demandas_com_novidade()
returns table (demanda_id bigint)
language sql
stable
as $$
  select d.id
  from demanda d
  left join visualizacao v
    on v.demanda_id = d.id and v.user_id = auth.uid()
  where exists (
    select 1 from historico_status h
    where h.demanda_id = d.id
      and h.autor_id <> auth.uid()                       -- ignora as minhas acoes
      and h.created_at > coalesce(v.visto_em, d.created_at)
  )
$$;

grant execute on function public.demandas_com_novidade() to authenticated;
