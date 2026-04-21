import React from "react";

// Componente com vários problemas de acessibilidade intencionais para teste

export function LoginForm() {
  const handleSubmit = () => {};

  return (
    <div>
      {/* ❌ img sem alt */}
      <img src="logo.png" />

      {/* ❌ link sem texto acessível */}
      <a href="/home"></a>

      {/* ❌ botão sem label */}
      <button></button>

      {/* ❌ input sem label associado */}
      <input type="text" placeholder="Digite seu email" />

      {/* ❌ onClick em div sem role nem teclado */}
      <div onClick={handleSubmit}>Entrar</div>

      {/* ❌ iframe sem title */}
      <iframe src="https://example.com" />

      {/* ❌ tabIndex positivo */}
      <span tabIndex={3}>Foco errado</span>

      {/* ❌ onMouseOver sem onFocus */}
      <p onMouseOver={() => console.log("hover")}>Passe o mouse</p>

      {/* ✅ correto — para comparação */}
      <img src="foto.jpg" alt="Foto de perfil do usuário" />
      <button type="submit" aria-label="Enviar formulário">
        Enviar
      </button>
    </div>
  );
}
