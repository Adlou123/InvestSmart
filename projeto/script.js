let grafico;

function calcular() {
  const valor = parseFloat(document.getElementById("valor").value);
  const taxa = parseFloat(document.getElementById("taxa").value) / 100;
  const tempo = parseInt(document.getElementById("tempo").value);

  const resultado = document.querySelector(".resultado p");

  if (isNaN(valor) || isNaN(taxa) || isNaN(tempo)) {
    resultado.innerText = "Preencha todos os campos!";
    return;
  }

  let montante = valor;
  let valores = [valor];
  let labels = ["0"];

  for (let i = 1; i <= tempo; i++) {
    montante = montante * (1 + taxa);
    valores.push(montante);
    labels.push(i.toString());
  }

  resultado.innerText = "Valor final: R$ " + montante.toFixed(2);

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