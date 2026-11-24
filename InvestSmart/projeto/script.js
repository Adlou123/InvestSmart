// As páginas PHP ficam na pasta acima de /projeto (ex.: PROJETO/salvar_simulacao.php)
const API = "../";

let grafico;
let ultimaSimulacao = null;
let usuarioLogado = false;

/* ---------------- Resposta do servidor (JSON) ---------------- */

async function chamarApi(url, opcoes) {
  const resposta = await fetch(API + url, opcoes);
  const texto = await resposta.text();
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch (erro) {
    console.error("Resposta do servidor:", texto);
    throw new Error("O servidor não respondeu como esperado (veja o console e rode o teste.php).");
  }
  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro no servidor.");
  }
  return dados;
}

function enviarJson(url, metodo, corpo) {
  return chamarApi(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo)
  });
}

/* ---------------- Sessão (login) ---------------- */

async function carregarSessao() {
  const elementoNome = document.getElementById("usuario-nome");
  const botaoLogin = document.getElementById("botao-login");
  const botaoSair = document.getElementById("botao-sair");

  try {
    const sessao = await chamarApi("sessao.php", { cache: "no-store" });
    usuarioLogado = Boolean(sessao.logado);

    if (usuarioLogado) {
      elementoNome.textContent = "Olá, " + sessao.nome;
    }
    elementoNome.hidden = !usuarioLogado;
    botaoLogin.hidden = usuarioLogado;
    botaoSair.hidden = !usuarioLogado;
  } catch (erro) {
    console.error("Não foi possível carregar a sessão do usuário.", erro);
  }
}

document.getElementById("botao-sair").addEventListener("click", () => {
  window.location.href = API + "sair.php";
});

/* ---------------- Simulador ---------------- */

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
    valor < 0 ||
    valormes < 0 ||
    tempo < 1 ||
    tempo > 600 ||
    taxa <= -1 ||
    taxaPercentual > 1000
  ) {
    resultado.innerText = "Preencha todos os campos corretamente (tempo de 1 a 600 meses)!";
    return;
  }

  let montante = valor;
  const valores = [valor];
  const labels = ["0"];

  for (let i = 1; i <= tempo; i++) {
    montante = montante * (1 + taxa) + valormes;
    valores.push(montante);
    labels.push(i.toString());
  }

  if (!Number.isFinite(montante) || montante > 1e15) {
    resultado.innerText = "O resultado é grande demais. Reduza o valor, a taxa ou o tempo.";
    return;
  }

  resultado.innerText = "Valor final: R$ " + montante.toFixed(2);
  ultimaSimulacao = {
    valorInicial: valor,
    aporteMensal: valormes,
    taxaMensal: taxaPercentual,
    tempoMeses: tempo,
    valorFinal: montante,
    id: null
  };

  criarGrafico(labels, valores);
  salvarSimulacaoNoBanco(ultimaSimulacao);
}

async function salvarSimulacaoNoBanco(simulacao) {
  const resultado = document.querySelector(".resultado p");

  if (!usuarioLogado) {
    resultado.innerText += " | Faça login para salvar esta simulação.";
    return;
  }

  try {
    const dados = await enviarJson("salvar_simulacao.php", "POST", {
      valor_inicial: simulacao.valorInicial,
      aporte_mensal: simulacao.aporteMensal,
      taxa_mensal: simulacao.taxaMensal,
      tempo_meses: simulacao.tempoMeses
    });

    simulacao.id = dados.id;

    // só mostra se ainda for a simulação mais recente na tela
    if (ultimaSimulacao === simulacao) {
      resultado.innerText += " | Salva no banco de dados!";
    }
  } catch (erro) {
    console.error("ERRO AO SALVAR SIMULAÇÃO:", erro);
    if (ultimaSimulacao === simulacao) {
      resultado.innerText += " | Não foi possível salvar: " + erro.message;
    }
  }
}

function criarGrafico(labels, dados) {
  const ctx = document.getElementById("grafico").getContext("2d");

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
      plugins: { legend: { display: true } }
    }
  });
}

document.querySelector(".form-simulador").addEventListener("submit", (evento) => {
  evento.preventDefault();
  calcular();
});

/* ---------------- Anotações (salvas no banco) ---------------- */

const formularioAnotacao = document.getElementById("form-anotacao");
const listaAnotacoes = document.getElementById("lista-anotacoes");
const mensagemAnotacao = document.getElementById("mensagem-anotacao");

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function mostrarTextoNaLista(texto) {
  const p = document.createElement("p");
  p.textContent = texto;
  listaAnotacoes.replaceChildren(p);
}

function renderizarAnotacoes(anotacoes) {
  if (anotacoes.length === 0) {
    mostrarTextoNaLista("Suas anotações salvas aparecerão aqui.");
    return;
  }

  listaAnotacoes.replaceChildren();

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
    data.textContent = "Salvo em " + new Date(anotacao.criadoEm.replace(" ", "T")).toLocaleString("pt-BR");

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir anotação";
    excluir.addEventListener("click", () => excluirAnotacao(anotacao.id));

    card.append(titulo, detalhes, texto, data, excluir);
    listaAnotacoes.append(card);
  });
}

async function carregarAnotacoes() {
  if (!usuarioLogado) {
    mostrarTextoNaLista("Faça login para salvar e ver suas anotações.");
    return;
  }

  try {
    const dados = await chamarApi("anotacoes.php", { cache: "no-store" });
    renderizarAnotacoes(dados.anotacoes);
  } catch (erro) {
    console.error(erro);
    mensagemAnotacao.textContent = "Não foi possível carregar as anotações: " + erro.message;
  }
}

async function excluirAnotacao(id) {
  try {
    await enviarJson("anotacoes.php", "DELETE", { id: id });
    mensagemAnotacao.textContent = "Anotação excluída.";
    carregarAnotacoes();
  } catch (erro) {
    mensagemAnotacao.textContent = "Não foi possível excluir: " + erro.message;
  }
}

formularioAnotacao.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!usuarioLogado) {
    mensagemAnotacao.textContent = "Faça login para salvar anotações.";
    return;
  }

  if (!ultimaSimulacao || !ultimaSimulacao.id) {
    mensagemAnotacao.textContent = "Faça uma simulação (e aguarde ela ser salva) antes de salvar uma anotação.";
    return;
  }

  const titulo = document.getElementById("anotacao-titulo").value.trim();
  const texto = document.getElementById("anotacao-texto").value.trim();

  if (!titulo || !texto) {
    mensagemAnotacao.textContent = "Preencha o investimento e suas anotações.";
    return;
  }

  try {
    await enviarJson("anotacoes.php", "POST", {
      simulacao_id: ultimaSimulacao.id,
      titulo: titulo,
      texto: texto
    });
    formularioAnotacao.reset();
    mensagemAnotacao.textContent = "Anotação salva!";
    carregarAnotacoes();
  } catch (erro) {
    mensagemAnotacao.textContent = "Não foi possível salvar: " + erro.message;
  }
});

/* ---------------- Início ---------------- */

carregarSessao().then(carregarAnotacoes);
