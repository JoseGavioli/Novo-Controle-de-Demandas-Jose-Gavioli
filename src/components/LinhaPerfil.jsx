import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PAPEIS = ['admin', 'atendente', 'vendedor']

// Uma linha editavel da tela Equipe (um perfil). Cada linha cuida do
// proprio rascunho (estado local) e salva com um update no banco.
export default function LinhaPerfil({ perfilDaLinha, euId, aoSalvar }) {
  const [nome, setNome] = useState(perfilDaLinha.nome_completo)
  const [celular, setCelular] = useState(perfilDaLinha.celular || '')
  const [papel, setPapel] = useState(perfilDaLinha.papel)
  const [ativo, setAtivo] = useState(perfilDaLinha.ativo)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  // Trava de seguranca: voce nao pode mudar o PROPRIO papel nem se
  // desativar (evita se trancar para fora por engano).
  const souEu = perfilDaLinha.id === euId

  async function salvar() {
    setSalvando(true)
    setMsg('')

    const { error } = await supabase
      .from('perfil')
      .update({
        nome_completo: nome.trim(),
        celular: celular.trim() || null,
        papel,
        ativo,
      })
      .eq('id', perfilDaLinha.id)

    if (error) {
      setMsg('Erro ao salvar.')
    } else {
      setMsg('Salvo ✓')
      aoSalvar() // pede para a Equipe recarregar a lista
    }
    setSalvando(false)
  }

  return (
    <li className="linha-perfil">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome completo"
      />
      <input
        type="text"
        value={celular}
        onChange={(e) => setCelular(e.target.value)}
        placeholder="Celular"
      />
      <select
        value={papel}
        onChange={(e) => setPapel(e.target.value)}
        disabled={souEu}
        title={souEu ? 'Você não pode mudar o próprio papel' : ''}
      >
        {PAPEIS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <label className="ativo-check">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          disabled={souEu}
        />
        ativo
      </label>
      <button type="button" onClick={salvar} disabled={salvando}>
        {salvando ? '…' : 'Salvar'}
      </button>
      {souEu && <span className="voce">(você)</span>}
      {msg && <span className="msg">{msg}</span>}
    </li>
  )
}
