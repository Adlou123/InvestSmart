let grafico;
let ultimaSimulacao = null;

function exibirNomeUsuario() {
  const elementoNome = document.getElementById("usuario-nome");
  const botaoLogin = document.getElementById("botao-login");
  const botaoSair = document.getElementById("botao-sair");

  try {
    const cadastroSalvo = localStorage.getItem("usuarioCadastrado");
    const sessaoSalva = localStorage.getItem("usuarioLogado");
    const usuario = cadastroSalvo ? JSON.parse(cadastroSalvo) : null;

    if (
      usuario &&
      typeof usuario.nome === "string" &&
      typeof usuario.email === "string" &&
      sessaoSalva === usuario.email
    ) {
      elementoNome.textContent = `Olá, ${usuario.nome.trim()}`;
      elementoNome.hidden = false;
      botaoLogin.hidden = true;
      botaoSair.hidden = false;
      return;
    }

    elementoNome.hidden = true;
    botaoLogin.hidden = false;
    botaoSair.hidden = true;
  } catch (erro) {
    console.error("Não foi possível carregar a sessão do usuário.", erro);
  }
}

function aplicarConteudoSalvo() {
  const elementosPorCampo = {
    "banner-titulo": ".banner .texto h1",
    "banner-texto": ".banner .texto p",
    "economia-titulo": "#economia h2",
    "economia-intro": "#economia .intro",
    "invest-titulo": "#investimento h2",
    "invest-intro": "#investimento .intro",
    "aviso-simulador": "#simulador .aviso-simulador"
  };

  try {
    const conteudo = JSON.parse(localStorage.getItem("investsmart_conteudo") || "{}");
    Object.entries(elementosPorCampo).forEach(([campo, seletor]) => {
      const texto = conteudo[campo];
      const elemento = document.querySelector(seletor);
      if (typeof texto === "string" && elemento) {
        elemento.textContent = texto;
      }
    });
  } catch (erro) {
    console.error("Não foi possível carregar o conteúdo personalizado do site.", erro);
  }
}

function calcular() {
  const valor = parseFloat(document.getElementById("valor").value);
  const valormes = parseFloat(document.getElementById("valormes").value);
  const taxaPercentual = parseFloat(document.getElementById("taxa").value);
  const taxa = taxaPercentual / 100;
  const tempo = parseInt(document.getElementById("tempo").value, 10);
  const resultado = document.querySelector(".resultado p");
  ultimaSimulacao = null;

  if (
    !Number.isFinite(valor) ||
    !Number.isFinite(valormes) ||
    !Number.isFinite(taxaPercentual) ||
    !Number.isFinite(tempo) ||
    tempo < 1 ||
    taxa <= -1
  ) {
    resultado.innerText = "Preencha todos os campos!";
    return;
  }

  let montante = valor;
  let valores = [valor];
  let labels = ["0"];

  for (let i = 1; i <= tempo; i++) {
    montante = montante * (1 + taxa);
    montante = montante + valormes;
    valores.push(montante);
    labels.push(i.toString());
  }

  resultado.innerText = "Valor final: R$ " + montante.toFixed(2);
  ultimaSimulacao = {
    valorInicial: valor,
    aporteMensal: valormes,
    taxaMensal: taxaPercentual,
    tempoMeses: tempo,
    valorFinal: montante
  };

  criarGrafico(labels, valores);
}

function criarGrafico(labels, dados) {
  const ctx = document.getElementById("grafico").getContext("2d");

  // destrói gráfico anterior (se existir)
  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Evolução do investimento",
        data: dados,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

document.querySelector(".form-simulador").addEventListener("submit", (evento) => {
  evento.preventDefault();
  calcular();
});

exibirNomeUsuario();
document.getElementById("botao-sair").addEventListener("click", () => {
  try {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "Login/Login.html";
  } catch (erro) {
    console.error("Não foi possível encerrar a sessão do usuário.", erro);
    window.alert("Não foi possível sair. Tente novamente.");
  }
});
aplicarConteudoSalvo();

const formularioAnotacao = document.getElementById("form-anotacao");
const listaAnotacoes = document.getElementById("lista-anotacoes");
const mensagemAnotacao = document.getElementById("mensagem-anotacao");

function carregarAnotacoes() {
  try {
    const anotacoesSalvas = JSON.parse(localStorage.getItem("anotacoesInvestimentos") || "[]");
    if (!Array.isArray(anotacoesSalvas)) {
      throw new TypeError("O formato das anotações salvas é inválido.");
    }
    return anotacoesSalvas;
  } catch (erro) {
    mensagemAnotacao.textContent = "Não foi possível carregar as anotações salvas. Os dados armazenados estão inválidos.";
    return [];
  }
}

function renderizarAnotacoes(anotacoes) {
  listaAnotacoes.replaceChildren();

  if (anotacoes.length === 0) {
    const vazio = document.createElement("p");
    vazio.textContent = "Suas anotações salvas aparecerão aqui.";
    listaAnotacoes.append(vazio);
    return;
  }

  anotacoes.forEach((anotacao) => {
    const card = document.createElement("article");
    card.className = "anotacao-card";

    const titulo = document.createElement("h3");
    titulo.textContent = anotacao.titulo;

    const detalhes = document.createElement("p");
    detalhes.textContent =
      `Simulação: inicial ${formatarMoeda(anotacao.simulacao.valorInicial)}, ` +
      `aporte mensal ${formatarMoeda(anotacao.simulacao.aporteMensal)}, ` +
      `taxa ${anotacao.simulacao.taxaMensal}% ao mês por ${anotacao.simulacao.tempoMeses} meses. ` +
      `Valor final estimado: ${formatarMoeda(anotacao.simulacao.valorFinal)}.`;

    const texto = document.createElement("p");
    texto.textContent = anotacao.texto;

    const data = document.createElement("p");
    data.textContent = `Salvo em ${new Date(anotacao.criadoEm).toLocaleString("pt-BR")}`;

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir anotação";
    excluir.addEventListener("click", () => excluirAnotacao(anotacao.id));

    card.append(titulo, detalhes, texto, data, excluir);
    listaAnotacoes.append(card);
  });
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function excluirAnotacao(id) {
  const anotacoes = carregarAnotacoes().filter((anotacao) => anotacao.id !== id);
  localStorage.setItem("anotacoesInvestimentos", JSON.stringify(anotacoes));
  renderizarAnotacoes(anotacoes);
  mensagemAnotacao.textContent = "Anotação excluída.";
}

formularioAnotacao.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!ultimaSimulacao) {
    mensagemAnotacao.textContent = "Faça uma simulação antes de salvar uma anotação.";
    return;
  }

  const anotacoes = carregarAnotacoes();
  const novaAnotacao = {
    id: crypto.randomUUID(),
    titulo: document.getElementById("anotacao-titulo").value.trim(),
    texto: document.getElementById("anotacao-texto").value.trim(),
    simulacao: ultimaSimulacao,
    criadoEm: new Date().toISOString()
  };

  if (!novaAnotacao.titulo || !novaAnotacao.texto) {
    mensagemAnotacao.textContent = "Preencha o investimento e suas anotações.";
    return;
  }

  anotacoes.unshift(novaAnotacao);
  try {
    localStorage.setItem("anotacoesInvestimentos", JSON.stringify(anotacoes));
  } catch (erro) {
    mensagemAnotacao.textContent = "Não foi possível salvar. Verifique o espaço disponível no navegador.";
    return;
  }

  renderizarAnotacoes(anotacoes);
  formularioAnotacao.reset();
  mensagemAnotacao.textContent = "Anotação salva neste navegador.";
});

renderizarAnotacoes(carregarAnotacoes());
