import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_ROTULO } from '../lib/status'

// Detalhe (somente leitura) de uma demanda. Carrega pelo id, trazendo
// junto (joins) o tipo, a obra/cliente e o nome do vendedor.
export default function DetalheDemanda({ demandaId, aoVoltar }) {
  const [d, setD] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('demanda')
        .select(
          'id, descricao, prazo, status, created_at, tipo_demanda(nome), obra(nome, endereco, cliente(nome)), vendedor:perfil(nome_completo)',
        )
        .eq('id', demandaId)
        .single()
      if (error) setErro('Não foi possível carregar a demanda.')
      else setD(data)
      setCarregando(false)
    }
    carregar()
  }, [demandaId])

  if (carregando) return <p>Carregando…</p>

  if (erro) {
    return (
      <div className="detalhe-demanda">
        <p className="erro">{erro}</p>
        <button type="button" className="link" onClick={aoVoltar}>
          ← Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="detalhe-demanda">
      <button type="button" className="link" onClick={aoVoltar}>
        ← Voltar
      </button>

      <h2>Demanda #{d.id}</h2>
      <span className={`status status-${d.status}`}>
        {STATUS_ROTULO[d.status]}
      </span>

      <dl>
        <dt>Tipo</dt>
        <dd>{d.tipo_demanda?.nome}</dd>

        <dt>Cliente</dt>
        <dd>{d.obra?.cliente?.nome}</dd>

        <dt>Obra</dt>
        <dd>
          {d.obra?.nome}
          {d.obra?.endereco ? ` — ${d.obra.endereco}` : ''}
        </dd>

        <dt>Vendedor</dt>
        <dd>{d.vendedor?.nome_completo}</dd>

        <dt>Prazo</dt>
        <dd>{d.prazo}</dd>

        <dt>Criada em</dt>
        <dd>{new Date(d.created_at).toLocaleString('pt-BR')}</dd>
      </dl>

      <div className="descricao">
        <h3>Descrição</h3>
        <p>{d.descricao}</p>
      </div>
    </div>
  )
}
