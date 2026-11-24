<?php
define("RESPOSTA_JSON", true);
require_once __DIR__ . "/conexao.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["erro" => "Método inválido."], 405);
}

$usuarioId = exigir_login_json();

$dados = json_decode(file_get_contents("php://input"), true);

if (!is_array($dados)) {
    json_out(["erro" => "Dados inválidos."], 400);
}

$valor  = $dados["valor_inicial"] ?? null;
$aporte = $dados["aporte_mensal"] ?? null;
$taxa   = $dados["taxa_mensal"] ?? null;
$tempo  = $dados["tempo_meses"] ?? null;

if (!is_numeric($valor) || !is_numeric($aporte) || !is_numeric($taxa) || !is_numeric($tempo)) {
    json_out(["erro" => "Preencha todos os campos corretamente."], 400);
}

$valor  = (float) $valor;
$aporte = (float) $aporte;
$taxa   = (float) $taxa;
$tempo  = filter_var($tempo, FILTER_VALIDATE_INT);

if (
    !is_finite($valor) || !is_finite($aporte) || !is_finite($taxa) ||
    $valor < 0 || $aporte < 0 ||
    $valor > 1e12 || $aporte > 1e12 ||
    $taxa <= -100 || $taxa > 1000 ||
    $tempo === false || $tempo < 1 || $tempo > 600
) {
    json_out(["erro" => "Valores fora dos limites permitidos."], 400);
}

// O cálculo é refeito no servidor (não confiamos no valor vindo do navegador)
$montante    = $valor;
$taxaDecimal = $taxa / 100;

for ($i = 1; $i <= $tempo; $i++) {
    $montante = ($montante * (1 + $taxaDecimal)) + $aporte;
}

if (!is_finite($montante) || $montante > 1e15) {
    json_out(["erro" => "O resultado é grande demais para ser salvo. Reduza o valor, a taxa ou o tempo."], 400);
}

$montante = round($montante, 2);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO simulacoes
            (usuario_id, valor_inicial, aporte_mensal, taxa_mensal, tempo_meses, valor_final)
         VALUES
            (:usuario_id, :valor, :aporte, :taxa, :tempo, :final)"
    );

    $stmt->execute([
        ":usuario_id" => $usuarioId,
        ":valor"      => round($valor, 2),
        ":aporte"     => round($aporte, 2),
        ":taxa"       => round($taxa, 4),
        ":tempo"      => $tempo,
        ":final"      => $montante
    ]);

    json_out([
        "sucesso"     => true,
        "id"          => (int) $pdo->lastInsertId(),
        "valor_final" => $montante
    ]);
} catch (PDOException $e) {
    error_log("InvestSmart - salvar simulação: " . $e->getMessage());
    json_out(["erro" => "Não foi possível salvar a simulação. Rode o teste.php para diagnosticar o banco."], 500);
}
