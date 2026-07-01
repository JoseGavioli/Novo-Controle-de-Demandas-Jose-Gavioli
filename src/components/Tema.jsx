import { useState } from 'react'

// Tela de Tema (aberta pelo menu lateral): duas opcoes, Claro e Escuro.
// Aplica no <html> e salva no localStorage (mesma logica do antigo botao).
export default function Tema() {
  const [tema, setTema] = useState(
    () => document.documentElement.dataset.theme || 'light',
  )

  function aplicar(novo) {
    document.documentElement.dataset.theme = novo
    localStorage.setItem('tema', novo)
    setTema(novo)
  }

  return (
    <div className="bloco">
      <h2>Tema</h2>
      <div className="opcoes-tema">
        <button
          type="button"
          className={tema === 'light' ? 'ativo' : ''}
          onClick={() => aplicar('light')}
        >
          ☀️ Tema claro
        </button>
        <button
          type="button"
          className={tema === 'dark' ? 'ativo' : ''}
          onClick={() => aplicar('dark')}
        >
          🌙 Tema escuro
        </button>
      </div>
    </div>
  )
}
