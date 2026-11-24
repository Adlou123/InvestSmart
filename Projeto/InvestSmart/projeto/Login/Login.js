
document.querySelector(".login").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const mensagem = document.querySelector(".login-mensagem");
    const email = document.querySelector(".loginemail").value.trim().toLowerCase();
    const senha = document.querySelector(".loginsenha").value;

    // Verificar primeiro se é administrador
    const administradorSalvo = localStorage.getItem("administradorCadastrado");

    if (administradorSalvo) {
        const administrador = JSON.parse(administradorSalvo);

        if (
            email === administrador.email.toLowerCase() &&
            senha === administrador.senha
        ) {
            sessionStorage.setItem("sessaoAdministrador", administrador.email);
            window.location.href = "../Admin/adm.html";
            return;
        }
    }

    // Login normal de usuário
    const cadastroSalvo = localStorage.getItem("usuarioCadastrado");

    if (!cadastroSalvo) {
        mensagem.textContent = "Nenhum cadastro encontrado.";
        mensagem.className = "login-mensagem error";
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(cadastroSalvo);
    } catch (erro) {
        mensagem.textContent = "Erro ao ler cadastro.";
        mensagem.className = "login-mensagem error";
        return;
    }

    if (
        !usuario ||
        email !== usuario.email.trim().toLowerCase() ||
        senha !== usuario.senha
    ) {
        mensagem.textContent = "E-mail ou senha incorretos.";
        mensagem.className = "login-mensagem error";
        return;
    }

    localStorage.setItem("usuarioLogado", usuario.email);
    window.location.href = "../index.html";
});
