
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["usuario_id"])) {
    http_response_code(401);
    echo json_encode([
        "erro" => "Você precisa fazer login."
    ]);
    exit;
}

require_once "conexao.php";

$dados = json_decode(file_get_contents("php://input"), true);

if (!is_array($dados)) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados inválidos."]);
    exit;
}

$valor = $dados["valor_inicial"] ?? null;
$aporte = $dados["aporte_mensal"] ?? null;
$taxa = $dados["taxa_mensal"] ?? null;
$tempo = $dados["tempo_meses"] ?? null;

if (
    !is_numeric($valor) ||
    !is_numeric($aporte) ||
    !is_numeric($taxa) ||
    !is_numeric($tempo)
) {
    http_response_code(400);
    echo json_encode(["erro" => "Preencha todos os campos corretamente."]);
    exit;
}

$valor = (float) $valor;
$aporte = (float) $aporte;
$taxa = (float) $taxa;
$tempo = filter_var($tempo, FILTER_VALIDATE_INT);

if (
    !is_finite($valor) ||
    !is_finite($aporte) ||
    !is_finite($taxa) ||
    $valor < 0 ||
    $aporte < 0 ||
    $taxa <= -100 ||
    $tempo === false ||
    $tempo < 1 ||
    $tempo > 600
) {
    http_response_code(400);
    echo json_encode(["erro" => "Valores fora dos limites permitidos."]);
    exit;
}

// Calcular novamente no servidor
$montante = $valor;
$taxaDecimal = $taxa / 100;

for ($i = 1; $i <= $tempo; $i++) {
    $montante = ($montante * (1 + $taxaDecimal)) + $aporte;
}

try {

    $sql = "INSERT INTO simulacoes
    (usuario_id, valor_inicial, aporte_mensal,
     taxa_mensal, tempo_meses, valor_final)
    VALUES
    (:usuario_id, :valor, :aporte, :taxa, :tempo, :final)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":usuario_id" => $_SESSION["usuario_id"],
        ":valor" => $valor,
        ":aporte" => $aporte,
        ":taxa" => $taxa,
        ":tempo" => $tempo,
        ":final" => $montante
    ]);

    echo json_encode([
        "sucesso" => true,
        "id" => $pdo->lastInsertId(),
        "valor_final" => round($montante, 2)
    ]);

} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "erro" => "Não foi possível salvar a simulação."
    ]);

}

?>
