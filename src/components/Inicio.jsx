// Tela inicial (boas-vindas) do app logado. So mostra quem esta logado.
export default function Inicio({ perfil, sessao }) {
  return (
    <div className="bloco">
      <h1>Bem-vindo 👋</h1>
      <p>
        Olá, <strong>{perfil.nome_completo}</strong>!
      </p>
      <p>
        Seu papel: <strong>{perfil.papel}</strong>
      </p>
      <p className="email">{sessao.user.email}</p>
      <p className="dica">
        Use o menu acima para acessar os <strong>Clientes</strong> (e as obras
        de cada cliente).
      </p>
    </div>
  )
}
