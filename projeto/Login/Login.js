document.querySelector(".login").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const mensagem = document.querySelector(".login-mensagem");
    const email = document.querySelector(".loginemail").value.trim().toLowerCase();
    const senha = document.querySelector(".loginsenha").value;
    const cadastroSalvo = localStorage.getItem("usuarioCadastrado");

    if (!cadastroSalvo) {
        mensagem.textContent = "Nenhum cadastro encontrado. Cadastre-se antes de realizar o login.";
        mensagem.className = "login-mensagem error";
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(cadastroSalvo);
    } catch (erro) {
        mensagem.textContent = "Não foi possível ler os dados do cadastro. Faça o cadastro novamente.";
        mensagem.className = "login-mensagem error";
        return;
    }

    if (
        !usuario ||
        typeof usuario.email !== "string" ||
        typeof usuario.senha !== "string" ||
        email !== usuario.email.trim().toLowerCase() ||
        senha !== usuario.senha
    ) {
        mensagem.textContent = "E-mail ou senha incorretos.";
        mensagem.className = "login-mensagem error";
        return;
    }

    try {
        localStorage.setItem("usuarioLogado", usuario.email);
        window.location.href = "../index.html";
    } catch (erro) {
        mensagem.textContent = "Não foi possível iniciar a sessão neste navegador.";
        mensagem.className = "login-mensagem error";
    }
});