const CHAVES = {
  cadastro: "usuarioCadastrado",
  anotacoes: "anotacoesInvestimentos",
  conteudo: "investsmart_conteudo"
};

const CAMPOS = [
  { id: "banner-titulo", nome: "Banner · título", padrao: "Aprenda a cuidar do seu dinheiro.", tipo: "text" },
  { id: "banner-texto", nome: "Banner · subtítulo", padrao: "Dicas simples e práticas sobre economia e investimentos para iniciantes.", tipo: "area" },
  { id: "economia-titulo", nome: "Seção Economia · título", padrao: "O que é economia?", tipo: "text" },
  { id: "economia-intro", nome: "Seção Economia · introdução", padrao: "Economia é o estudo de como as pessoas usam o dinheiro e os recursos para produzir, consumir e investir de forma inteligente.", tipo: "area" },
  { id: "invest-titulo", nome: "Seção Investimento · título", padrao: "Investimento", tipo: "text" },
  { id: "invest-intro", nome: "Seção Investimento · introdução", padrao: "Conheça diferentes formas de investir, entenda os riscos e aprenda conceitos importantes antes de tomar decisões.", tipo: "area" },
  { id: "aviso-simulador", nome: "Aviso do simulador", padrao: "Aviso: o simulador não desconta impostos ou outras cobranças. Os valores e o gráfico representam apenas o valor bruto estimado.", tipo: "area" }
];

const $ = (seletor) => document.querySelector(seletor);
const moeda = (valor) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
}).format(valor);
const quando = (data) => new Date(data).toLocaleString("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

let usuario = null;
let anotacoes = [];
let conteudo = {};
let erroDados = "";

function lerJson(chave, padrao) {
  const salvo = localStorage.getItem(chave);
  return salvo === null ? padrao : JSON.parse(salvo);
}

function carregarDados() {
  try {
    const cadastro = lerJson(CHAVES.cadastro, null);
    if (cadastro !== null &&
        (typeof cadastro.nome !== "string" || typeof cadastro.email !== "string")) {
      throw new TypeError("O cadastro salvo não tem nome e e-mail válidos.");
    }

    const registros = lerJson(CHAVES.anotacoes, []);
    if (!Array.isArray(registros) || registros.some((registro) =>
      !registro ||
      typeof registro.id !== "string" ||
      typeof registro.titulo !== "string" ||
      typeof registro.criadoEm !== "string" ||
      !Number.isFinite(Date.parse(registro.criadoEm)) ||
      !registro.simulacao ||
      !Number.isFinite(registro.simulacao.valorInicial) ||
      !Number.isFinite(registro.simulacao.aporteMensal) ||
      !Number.isFinite(registro.simulacao.taxaMensal) ||
      !Number.isFinite(registro.simulacao.tempoMeses) ||
      !Number.isFinite(registro.simulacao.valorFinal)
    )) {
      throw new TypeError("As anotações salvas têm formato inválido.");
    }

    const textos = lerJson(CHAVES.conteudo, {});
    if (!textos || typeof textos !== "object" || Array.isArray(textos)) {
      throw new TypeError("O conteúdo salvo tem formato inválido.");
    }

    usuario = cadastro;
    anotacoes = registros;
    conteudo = textos;
  } catch (erro) {
    erroDados = "Não foi possível ler os dados locais: " + erro.message;
    $("#status-dados").textContent = erroDados;
    $("#status-dados").hidden = false;
  }
}

function criarCelula(linha, valor, tag = "td") {
  const celula = document.createElement(tag);
  celula.textContent = valor;
  linha.append(celula);
  return celula;
}

function preencherVazio(tbody, colunas, mensagem) {
  const linha = document.createElement("tr");
  const celula = criarCelula(linha, mensagem);
  celula.colSpan = colunas;
  tbody.replaceChildren(linha);
}

function renderizarGeral() {
  $("#s-users").textContent = erroDados ? "—" : usuario ? "1" : "0";
  $("#s-sims").textContent = erroDados ? "—" : String(anotacoes.length);
  const media = anotacoes.length
    ? anotacoes.reduce((total, registro) => total + registro.simulacao.valorFinal, 0) / anotacoes.length
    : null;
  $("#s-media").textContent = erroDados ? "—" : media === null ? "—" : moeda(media);

  const barras = $("#barras");
  barras.replaceChildren();
  if (erroDados) {
    barras.textContent = "Dados locais indisponíveis.";
  } else if (anotacoes.length) {
    const resumo = document.createElement("p");
    resumo.textContent = `${anotacoes.length} simulação(ões) registrada(s) nas anotações deste navegador.`;
    barras.append(resumo);
  } else {
    barras.textContent = "Nenhuma simulação foi registrada em uma anotação neste navegador.";
  }

  const tbody = document.createElement("tbody");
  [...anotacoes]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5)
    .forEach((registro) => {
      const linha = document.createElement("tr");
      criarCelula(linha, quando(registro.criadoEm));
      criarCelula(linha, registro.titulo);
      criarCelula(linha, moeda(registro.simulacao.valorFinal));
      tbody.append(linha);
    });
  const tabela = document.createElement("table");
  tabela.append(tbody);
  $("#ultimas").replaceChildren(
    erroDados || anotacoes.length === 0
      ? document.createTextNode(erroDados ? "Dados locais indisponíveis." : "Nenhuma simulação registrada em anotação.")
      : tabela
  );
}

function renderizarUsuario() {
  const tbody = $("#tb-users");
  tbody.replaceChildren();
  if (erroDados || !usuario) {
    preencherVazio(tbody, 3, erroDados ? "Dados locais indisponíveis." : "Nenhum cadastro encontrado neste navegador.");
    return;
  }

  const linha = document.createElement("tr");
  criarCelula(linha, usuario.nome);
  criarCelula(linha, usuario.email);
  const acoes = criarCelula(linha, "");
  const excluir = document.createElement("button");
  excluir.type = "button";
  excluir.className = "act del";
  excluir.textContent = "Excluir cadastro local";
  excluir.addEventListener("click", excluirCadastro);
  acoes.append(excluir);
  tbody.append(linha);
}

function renderizarSimulacoes() {
  const tbody = $("#tb-sims");
  tbody.replaceChildren();
  if (erroDados || anotacoes.length === 0) {
    preencherVazio(tbody, 8, erroDados ? "Dados locais indisponíveis." : "Nenhuma simulação registrada em anotação neste navegador.");
    return;
  }

  [...anotacoes]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .forEach((registro) => {
      const linha = document.createElement("tr");
      criarCelula(linha, quando(registro.criadoEm));
      criarCelula(linha, registro.titulo);
      criarCelula(linha, moeda(registro.simulacao.valorInicial));
      criarCelula(linha, moeda(registro.simulacao.aporteMensal));
      criarCelula(linha, `${registro.simulacao.taxaMensal}%`);
      criarCelula(linha, String(registro.simulacao.tempoMeses));
      criarCelula(linha, moeda(registro.simulacao.valorFinal));
      const acoes = criarCelula(linha, "");
      const excluir = document.createElement("button");
      excluir.type = "button";
      excluir.className = "act del";
      excluir.textContent = "Excluir anotação";
      excluir.addEventListener("click", () => excluirAnotacao(registro.id));
      acoes.append(excluir);
      tbody.append(linha);
    });
}

function renderizarCampos() {
  const campos = $("#campos");
  campos.replaceChildren();
  CAMPOS.forEach((campo) => {
    const label = document.createElement("label");
    label.htmlFor = `c-${campo.id}`;
    label.textContent = campo.nome;
    const input = document.createElement(campo.tipo === "area" ? "textarea" : "input");
    input.id = `c-${campo.id}`;
    input.value = typeof conteudo[campo.id] === "string" ? conteudo[campo.id] : campo.padrao;
    if (campo.tipo === "area") {
      input.rows = 3;
    } else {
      input.type = "text";
    }
    campos.append(label, input);
  });
}

function renderizar() {
  renderizarGeral();
  renderizarUsuario();
  renderizarSimulacoes();
}

function salvarLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    $("#status-dados").textContent = `Não foi possível salvar neste navegador: ${erro.message}`;
    $("#status-dados").hidden = false;
    return false;
  }
}

function excluirCadastro() {
  if (!confirm("Excluir o cadastro armazenado neste navegador?")) return;
  try {
    localStorage.removeItem(CHAVES.cadastro);
    usuario = null;
    renderizar();
  } catch (erro) {
    $("#status-dados").textContent = `Não foi possível excluir o cadastro: ${erro.message}`;
    $("#status-dados").hidden = false;
  }
}

function excluirAnotacao(id) {
  if (!confirm("Excluir esta anotação e a simulação registrada nela?")) return;
  const atualizadas = anotacoes.filter((registro) => registro.id !== id);
  if (salvarLocal(CHAVES.anotacoes, atualizadas)) {
    anotacoes = atualizadas;
    renderizar();
  }
}

$("#salvar-conteudo").addEventListener("click", () => {
  const atualizado = {};
  CAMPOS.forEach((campo) => {
    atualizado[campo.id] = $(`#c-${campo.id}`).value.trim();
  });
  if (!salvarLocal(CHAVES.conteudo, atualizado)) return;
  conteudo = atualizado;
  $("#msg-conteudo").textContent = "Salvo neste navegador. Atualize a página inicial para ver as alterações.";
});

document.querySelectorAll("aside button").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll("aside button, main section").forEach((elemento) => elemento.classList.remove("on"));
    botao.classList.add("on");
    $(`#${botao.dataset.tab}`).classList.add("on");
  });
});

carregarDados();
renderizar();
renderizarCampos();
