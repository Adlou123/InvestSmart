<?php
require_once __DIR__ . "/iniciar.php";

$host    = "localhost";
$banco   = "investsmart";
$usuario = "root";
$senha   = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$banco;charset=utf8mb4",
        $usuario,
        $senha,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]
    );
} catch (PDOException $e) {
    error_log("InvestSmart - conexão: " . $e->getMessage());
    $msg = DEBUG ? "ERRO NA CONEXAO: " . $e->getMessage() : "Não foi possível conectar ao banco de dados.";

    if (defined("RESPOSTA_JSON")) {
        json_out(["erro" => $msg], 500);
    }
    http_response_code(500);
    exit($msg);
}
