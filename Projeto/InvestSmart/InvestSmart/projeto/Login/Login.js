// O login é validado pelo PHP (login.php) usando a senha_hash do MySQL.
// Não impedir o envio do formulário e não validar senha pelo localStorage.

document.addEventListener("DOMContentLoaded", () => {
    const mensagem = document.querySelector(".login-mensagem");
    if (!mensagem) return;

    const parametros = new URLSearchParams(window.location.search);
    const erros = {
        credenciais: "E-mail ou senha incorretos.",
        campos: "Preencha todos os campos.",
        erro: "Erro no servidor. Verifique o Apache, MySQL e a conexão com o banco."
    };

    const erro = parametros.get("erro");
    if (erro && erros[erro]) {
        mensagem.textContent = erros[erro];
        mensagem.classList.add("error");
    } else if (parametros.get("cadastro") === "ok") {
        mensagem.textContent = "Cadastro realizado! Faça seu login.";
        mensagem.classList.remove("error");
    }
});
