import { STATUS_ROTULO } from '../lib/status'
import { URGENCIA_NIVEIS } from '../lib/urgencia'

// Barra de filtros da lista de demandas. Recebe o objeto de filtros (f)
// e o setter (setF); cada controle atualiza um campo.
export default function FiltrosDemandas({ f, setF }) {
  function set(campo, valor) {
    setF((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="filtros">
      <input
        type="search"
        placeholder="Buscar (cliente, obra, descrição)…"
        value={f.busca}
        onChange={(e) => set('busca', e.target.value)}
      />

      <select value={f.status} onChange={(e) => set('status', e.target.value)}>
        <option value="">Todos os status</option>
        {Object.entries(STATUS_ROTULO).map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>

      <select
        value={f.urgencia}
        onChange={(e) => set('urgencia', e.target.value)}
      >
        <option value="">Todas as urgências</option>
        {URGENCIA_NIVEIS.map((u) => (
          <option key={u.nivel} value={u.nivel}>
            {u.rotulo}
          </option>
        ))}
      </select>

      <label className="check">
        <input
          type="checkbox"
          checked={f.soAtivas}
          onChange={(e) => set('soAtivas', e.target.checked)}
        />
        Só ativas
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={f.ordenar}
          onChange={(e) => set('ordenar', e.target.checked)}
        />
        Ordenar por urgência
      </label>
    </div>
  )
}
