-- ───────────────────────────────────────────────────────────────
-- Migracao 0013 — "concluido" fora do fluxo (Opcao 2, nao destrutiva)
--
-- O status 'concluido' SAI do caminho normal: em_revisao_custo passa a ir
-- direto para 'enviado' (o terminal de sucesso). O valor 'concluido'
-- CONTINUA no enum (nada destrutivo) e as transicoes que SAEM dele ficam,
-- para que qualquer demanda que ja estivesse nesse estado nao trave.
-- Nenhuma demanda nova entra mais em 'concluido'.
--
-- Recria a funcao mover_status (unica mudanca real: a linha do
-- em_revisao_custo, que antes ia para 'concluido' e agora vai para 'enviado').
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ───────────────────────────────────────────────────────────────

create or replace function public.mover_status(
  p_demanda_id    bigint,
  p_novo_status   status_demanda,
  p_comentario    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid               uuid := auth.uid();
  v_papel             papel;
  v_status_atual      status_demanda;
  v_permitido         boolean := false;
  v_exige_comentario  boolean := false;
  v_comentario_id     bigint := null;
  v_texto             text := nullif(btrim(coalesce(p_comentario, '')), '');
begin
  select papel into v_papel from perfil where id = v_uid;
  if v_papel is null then
    raise exception 'Usuário sem perfil.';
  end if;
  if v_papel = 'vendedor' then
    raise exception 'Vendedor não pode mover status.';
  end if;

  select status into v_status_atual from demanda where id = p_demanda_id for update;
  if v_status_atual is null then
    raise exception 'Demanda não encontrada.';
  end if;

  if p_novo_status = 'cancelada' and v_papel <> 'admin' then
    raise exception 'Apenas o admin pode efetivar o cancelamento.';
  end if;

  -- Transicoes permitidas (§7). MUDANCA: em_revisao_custo vai para 'enviado'
  -- (antes ia para 'concluido'). O 'concluido' segue valido como LEGADO.
  v_permitido := case v_status_atual
    when 'nao_iniciado'     then p_novo_status in ('em_andamento', 'cancelada')
    when 'em_andamento'     then p_novo_status in ('em_revisao_custo', 'congelado', 'cancelada')
    when 'congelado'        then p_novo_status in ('em_andamento', 'cancelada')
    when 'em_revisao_custo' then p_novo_status in ('enviado', 'em_andamento', 'cancelada')
    when 'concluido'        then p_novo_status in ('enviado', 'em_revisao_custo', 'em_andamento', 'cancelada')
    else false
  end;
  if not v_permitido then
    raise exception 'Transição de % para % não é permitida.', v_status_atual, p_novo_status;
  end if;

  v_exige_comentario :=
       (v_status_atual = 'em_andamento'     and p_novo_status = 'congelado')
    or (p_novo_status = 'cancelada')
    or (v_status_atual = 'em_revisao_custo' and p_novo_status = 'em_andamento')
    or (v_status_atual = 'concluido'        and p_novo_status = 'em_andamento')
    or (v_status_atual = 'concluido'        and p_novo_status = 'em_revisao_custo');
  if v_exige_comentario and v_texto is null then
    raise exception 'Esta mudança de status exige um comentário.';
  end if;

  if v_texto is not null then
    insert into comentario (demanda_id, autor_id, texto, contexto)
    values (p_demanda_id, v_uid, v_texto, 'mudanca_status')
    returning id into v_comentario_id;
  end if;

  update demanda
    set status = p_novo_status,
        cancelamento_solicitado = false
  where id = p_demanda_id;

  insert into historico_status (demanda_id, de_status, para_status, autor_id, comentario_id)
  values (p_demanda_id, v_status_atual, p_novo_status, v_uid, v_comentario_id);
end;
$$;
