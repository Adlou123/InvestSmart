
function limpa_formulário_cep() {
    document.getElementById('rua').value = "";
    document.getElementById('bairro').value = "";
    document.getElementById('cidade').value = "";
    document.getElementById('uf').value = "";
}

function meu_callback(conteudo) {
    if (!("erro" in conteudo)) {
        document.getElementById('rua').value = conteudo.logradouro;
        document.getElementById('bairro').value = conteudo.bairro;
        document.getElementById('cidade').value = conteudo.localidade;
        document.getElementById('uf').value = conteudo.uf;
    } else {
        limpa_formulário_cep();
        alert("CEP não encontrado.");
    }
}

function pesquisacep(valor) {
    var cep = valor.replace(/\D/g, '');

    if (cep !== "") {
        var validacep = /^[0-9]{8}$/;

        if (validacep.test(cep)) {
            document.getElementById('rua').value = "...";
            document.getElementById('bairro').value = "...";
            document.getElementById('cidade').value = "...";
            document.getElementById('uf').value = "...";

            var script = document.createElement('script');
            script.src = 'https://viacep.com.br/ws/' + cep + '/json/?callback=meu_callback';

            document.body.appendChild(script);
        } else {
            limpa_formulário_cep();
            alert("Formato de CEP inválido.");
        }
    } else {
        limpa_formulário_cep();
    }
}

const MENSAGENS_CADASTRO = {
    campos: "Preencha todos os campos.",
    tamanho: "Algum campo ficou grande demais.",
    email: "E-mail inválido.",
    cpf: "CPF inválido.",
    cep: "CEP inválido.",
    uf: "UF inválida.",
    senha_curta: "A senha deve ter pelo menos 8 caracteres.",
    senha_diferente: "As senhas não conferem.",
    duplicado: "Este e-mail ou CPF já está cadastrado.",
    erro: "Não foi possível realizar o cadastro. Tente novamente."
};

(function () {
    var codigo = new URLSearchParams(window.location.search).get("erro");
    var caixa = document.getElementById("mensagem-cadastro");
    if (codigo && caixa) {
        caixa.textContent = MENSAGENS_CADASTRO[codigo] || MENSAGENS_CADASTRO.erro;
    }
})();
