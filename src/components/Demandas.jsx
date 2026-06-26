import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_ROTULO } from '../lib/status'
import NovaDemanda from './NovaDemanda'
import DetalheDemanda from './DetalheDemanda'

// Secao "Demandas": lista (a RLS ja filtra — vendedor ve as proprias,
// admin/atendente veem todas), abrir o detalhe ao clicar, e o botao
// para criar uma nova.
export default function Demandas() {
  const [demandas, setDemandas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [detalheId, setDetalheId] = useState(null)

  async function carregar() {
    setCarregando(true)
    // O select "puxa junto" o nome do tipo, da obra e do cliente (joins).
    const { data, error } = await supabase
      .from('demanda')
      .select(
        'id, descricao, prazo, status, created_at, tipo_demanda(nome), obra(nome, cliente(nome))',
      )
      .order('created_at', { ascending: false })
    if (error) setErro('Não foi possível carregar as demandas.')
    else setDemandas(data)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  if (criando) {
    return (
      <NovaDemanda
        aoCriar={() => {
          setCriando(false)
          carregar()
        }}
        aoCancelar={() => setCriando(false)}
      />
    )
  }

  if (detalheId) {
    return (
      <DetalheDemanda demandaId={detalheId} aoVoltar={() => setDetalheId(null)} />
    )
  }

  return (
    <div className="secao-demandas">
      <div className="cabecalho">
        <h2>Demandas</h2>
        <button type="button" onClick={() => setCriando(true)}>
          ➕ Nova demanda
        </button>
      </div>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando demandas…</p>
      ) : demandas.length === 0 ? (
        <p className="vazio">Nenhuma demanda ainda.</p>
      ) : (
        <ul className="lista-demandas">
          {demandas.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="item-demanda"
                onClick={() => setDetalheId(d.id)}
              >
                <div>
                  <strong>#{d.id}</strong> — {d.tipo_demanda?.nome}
                  <div className="sub">
                    {d.obra?.cliente?.nome} / {d.obra?.nome} · prazo {d.prazo}
                  </div>
                </div>
                <span className={`status status-${d.status}`}>
                  {STATUS_ROTULO[d.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
