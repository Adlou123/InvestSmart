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
    
    // Seleciona o formulário pela classe
    const formulario = document.querySelector(".cadastro");

    // Escuta o momento em que o usuário clica em "Cadastrar-se"
    formulario.addEventListener("submit", function (evento) {
        // Impede a página de recarregar imediatamente (comportamento padrão do form)
        evento.preventDefault();

        // Captura os valores digitados usando as classes ou IDs do seu HTML
        const dadosUsuario = {
            nome: document.querySelector(".nome").value,
            email: document.querySelector(".email").value,
            cpf: document.querySelector(".cpf").value,
            cep: document.getElementById("cep").value,
            rua: document.getElementById("rua").value,
            bairro: document.getElementById("bairro").value,
            cidade: document.getElementById("cidade").value,
            uf: document.getElementById("uf").value,
            // Nota: Geralmente não é recomendado salvar a senha no localStorage por segurança,
            // mas se for para fins de teste/estudo local, você pode incluir:
            senha: document.querySelector(".senha").value 
        };

        // O localStorage só guarda TEXTO. 
        // Usamos JSON.stringify para transformar o nosso objeto 'dadosUsuario' em uma string.
        localStorage.setItem("usuarioCadastrado", JSON.stringify(dadosUsuario));

        // Mensagem de sucesso
        alert("Cadastro realizado e salvo no LocalStorage com sucesso!");

        window.location.href = '../Login/Login.html';
    });
});