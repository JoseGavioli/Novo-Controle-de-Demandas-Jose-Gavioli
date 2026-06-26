import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Painel from './components/Painel'
import './App.css'

// Componente raiz. Sua unica tarefa: saber se ha alguem logado (a
// "sessao") e mostrar a tela certa — Login ou a casca do app (Painel).
export default function App() {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregando(false)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange(
      (_evento, novaSessao) => {
        setSessao(novaSessao)
      },
    )

    return () => assinatura.subscription.unsubscribe()
  }, [])

  if (carregando) {
    return (
      <main className="tela">
        <div className="cartao">Carregando…</div>
      </main>
    )
  }

  // Sem sessao -> Login (centralizado). Com sessao -> casca do app logado.
  return sessao ? <Painel sessao={sessao} /> : <Login />
}
