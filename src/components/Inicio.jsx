import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_ROTULO } from '../lib/status'

// Ordem em que os status "em aberto" (nao terminais) aparecem na quebra.
const STATUS_ABERTOS = [
  'nao_iniciado',
  'em_andamento',
  'congelado',
  'em_revisao_custo',
  'concluido',
]

// Tela inicial: boas-vindas + demandas em aberto (total e por status) +
// notificacoes (mudancas de status nao vistas, mais recentes primeiro).
//
// O total NAO filtra por vendedor_id de proposito: a RLS ja decide o que
// cada um ve (vendedor = as proprias; admin/atendente = todas).
export default function Inicio({ perfil, recarregarNovidades, aoAbrirDemanda }) {
  const [emAberto, setEmAberto] = useState(null) // { total, porStatus }
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: abertas } = await supabase
        .from('demanda')
        .select('status')
        .not('status', 'in', '(enviado,cancelada)')
      const porStatus = {}
      for (const d of abertas ?? []) {
        porStatus[d.status] = (porStatus[d.status] ?? 0) + 1
      }
      setEmAberto({ total: abertas?.length ?? 0, porStatus })

      const { data } = await supabase.rpc('notificacoes')
      setNotificacoes(data ?? [])
      setCarregando(false)
    }
    carregar()
  }, [perfil.id])

  // "Limpar": marca como vistas as demandas que estao gerando notificacao
  // (grava a hora atual em visualizacao) e atualiza o contador do menu.
  async function limpar() {
    const ids = [...new Set(notificacoes.map((n) => n.demanda_id))]
    if (ids.length === 0) return
    const agora = new Date().toISOString()
    await supabase.from('visualizacao').upsert(
      ids.map((id) => ({ user_id: perfil.id, demanda_id: id, visto_em: agora })),
      { onConflict: 'user_id,demanda_id' },
    )
    setNotificacoes([])
    recarregarNovidades?.()
  }

  return (
    <div className="bloco">
      <h1>Bem-vindo 👋</h1>
      <p>
        Olá, <strong>{perfil.nome_completo}</strong>!
      </p>

      {emAberto !== null && (
        <div className="resumo-aberto">
          {emAberto.total === 0 ? (
            'Você não possui demandas em aberto no momento.'
          ) : (
            <>
              <p className="resumo-titulo">
                Você possui <strong>{emAberto.total}</strong> demanda
                {emAberto.total > 1 ? 's' : ''} em aberto — consulte-as na tela
                de <strong>Demandas</strong>.
              </p>
              <ul className="resumo-status">
                {STATUS_ABERTOS.filter((s) => emAberto.porStatus[s]).map((s) => (
                  <li key={s}>
                    <span className={`status status-${s}`}>
                      {STATUS_ROTULO[s]}
                    </span>
                    <strong>{emAberto.porStatus[s]}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="notificacoes-inicio">
        <div className="cabecalho-notif">
          <h3>Notificações</h3>
          {notificacoes.length > 0 && (
            <button type="button" className="link" onClick={limpar}>
              Limpar
            </button>
          )}
        </div>
        {carregando ? (
          <p className="dica">Carregando…</p>
        ) : notificacoes.length === 0 ? (
          <p className="dica">Nenhuma novidade por enquanto.</p>
        ) : (
          <ul className="lista-notif">
            {notificacoes.map((n) => (
              <li key={n.historico_id}>
                <button
                  type="button"
                  className="notif-link"
                  onClick={() => aoAbrirDemanda?.(n.demanda_id)}
                  title="Abrir a demanda"
                >
                  <span className={`status status-${n.para_status}`}>
                    {STATUS_ROTULO[n.para_status]}
                  </span>
                  <div>
                    <div>
                      Demanda <strong>#{n.demanda_id}</strong> —{' '}
                      {STATUS_ROTULO[n.de_status]} → {STATUS_ROTULO[n.para_status]}
                    </div>
                    <div className="sub">
                      por {n.autor_nome} ·{' '}
                      {new Date(n.quando).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
