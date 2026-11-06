function limpa_formulário_cep() {
    //Limpa valores do formulário de cep.
    document.getElementById('rua').value=("");
    document.getElementById('bairro').value=("");
    document.getElementById('cidade').value=("");
    document.getElementById('uf').value=("");
}

function meu_callback(conteudo) {
if (!("erro" in conteudo)) {
    //Atualiza os campos com os valores.
    document.getElementById('rua').value=(conteudo.logradouro);
    document.getElementById('bairro').value=(conteudo.bairro);
    document.getElementById('cidade').value=(conteudo.localidade);
    document.getElementById('uf').value=(conteudo.uf);
} //end if.
else {
    //CEP não Encontrado.
    limpa_formulário_cep();
    alert("CEP não encontrado.");
}
}

function pesquisacep(valor) {

//Nova variável "cep" somente com dígitos.
var cep = valor.replace(/\D/g, '');

//Verifica se campo cep possui valor informado.
if (cep != "") {

    //Expressão regular para validar o CEP.
    var validacep = /^[0-9]{8}$/;

    //Valida o formato do CEP.
    if(validacep.test(cep)) {

        //Preenche os campos com "..." enquanto consulta webservice.
        document.getElementById('rua').value="...";
        document.getElementById('bairro').value="...";
        document.getElementById('cidade').value="...";
        document.getElementById('uf').value="...";

        //Cria um elemento javascript.
        var script = document.createElement('script');

        //Sincroniza com o callback.
        script.src = 'https://viacep.com.br/ws/'+ cep + '/json/?callback=meu_callback';

        //Insere script no documento e carrega o conteúdo.
        document.body.appendChild(script);

    } //end if.
    else {
        //cep é inválido.
        limpa_formulário_cep();
        alert("Formato de CEP inválido.");
    }
} //end if.
else {
    //cep sem valor, limpa formulário.
    limpa_formulário_cep();
}
};

// Aguarda o HTML carregar completamente
document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.querySelector(".cadastro");
    const tipoCadastro = document.getElementById("tipo-cadastro");
    const camposEndereco = document.getElementById("campos-endereco");
    const campoNome = document.querySelector(".nome");
    const camposEnderecoInputs = camposEndereco.querySelectorAll("input");

    function atualizarFormulario() {
        const ehAdministrador = tipoCadastro.value === "administrador";
        camposEndereco.hidden = ehAdministrador;
        camposEnderecoInputs.forEach((campo) => {
            campo.disabled = ehAdministrador;
        });
        campoNome.placeholder = ehAdministrador ? "Nome completo" : "Nome";
    }

    tipoCadastro.addEventListener("change", atualizarFormulario);
    atualizarFormulario();

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const senha = document.querySelector(".senha").value;
        const confirmacao = document.querySelector(".confirmacao").value;
        if (senha !== confirmacao) {
            alert("As senhas não conferem.");
            return;
        }

        const dadosUsuario = {
            nome: document.querySelector(".nome").value.trim(),
            email: document.querySelector(".email").value.trim(),
            cpf: document.querySelector(".cpf").value,
            tipo: tipoCadastro.value,
            senha: senha
        };

        if (tipoCadastro.value === "usuario") {
            dadosUsuario.cep = document.getElementById("cep").value;
            dadosUsuario.rua = document.getElementById("rua").value;
            dadosUsuario.bairro = document.getElementById("bairro").value;
            dadosUsuario.cidade = document.getElementById("cidade").value;
            dadosUsuario.uf = document.getElementById("uf").value;
        }

        try {
            localStorage.setItem("usuarioCadastrado", JSON.stringify(dadosUsuario));
            localStorage.setItem("usuarioLogado", dadosUsuario.email);
            window.location.href = "../index.html";
        } catch (erro) {
            alert("Não foi possível salvar o cadastro neste navegador. Tente novamente.");
        }
    });
});
