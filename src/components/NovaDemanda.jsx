import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import SeletorCliente from './SeletorCliente'
import SeletorObra from './SeletorObra'

// Formulario de nova demanda: cliente -> obra -> tipo -> descricao -> prazo.
// O vendedor_id NAO e enviado: o banco preenche com auth.uid() (default +
// RLS), entao o autor e sempre o usuario logado e inforjavel (§5).
export default function NovaDemanda({ aoCriar, aoCancelar }) {
  const [cliente, setCliente] = useState(null)
  const [obra, setObra] = useState(null)
  const [tipos, setTipos] = useState([])
  const [tipoId, setTipoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarTipos() {
      const { data } = await supabase
        .from('tipo_demanda')
        .select('id, nome')
        .eq('ativo', true)
        .order('id')
      if (data) setTipos(data)
    }
    carregarTipos()
  }, [])

  // Ao trocar de cliente, zera a obra (a obra pertence a um cliente).
  function selecionarCliente(c) {
    setCliente(c)
    setObra(null)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setSalvando(true)
    const { error } = await supabase.from('demanda').insert({
      obra_id: obra.id,
      tipo_demanda_id: Number(tipoId),
      descricao: descricao.trim(),
      prazo,
    })
    setSalvando(false)
    if (error) setErro('Não foi possível criar a demanda.')
    else aoCriar() // volta para a lista e recarrega
  }

  const pronto = obra && tipoId && descricao.trim() && prazo

  return (
    <form className="nova-demanda" onSubmit={salvar}>
      <h2>Nova demanda</h2>

      <SeletorCliente selecionado={cliente} aoSelecionar={selecionarCliente} />

      {cliente && (
        <SeletorObra cliente={cliente} selecionado={obra} aoSelecionar={setObra} />
      )}

      {obra && (
        <>
          <label>
            Tipo
            <select
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              required
            >
              <option value="">— escolha —</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Descrição <em>(não poderá ser editada depois)</em>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              required
            />
          </label>

          <label>
            Prazo
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              required
            />
          </label>
        </>
      )}

      {erro && <p className="erro">{erro}</p>}

      <div className="acoes">
        <button type="submit" disabled={!pronto || salvando}>
          {salvando ? 'Salvando…' : 'Criar demanda'}
        </button>
        <button type="button" className="link" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
