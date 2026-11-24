<?php
require_once __DIR__ . "/../../conexao.php";

function voltar(string $codigo): void
{
    header("Location: Cadastro.html?erro=" . urlencode($codigo));
    exit;
}

function cpf_valido(string $cpf): bool
{
    if (!preg_match('/^\d{11}$/', $cpf) || preg_match('/^(\d)\1{10}$/', $cpf)) {
        return false;
    }
    for ($t = 9; $t < 11; $t++) {
        $soma = 0;
        for ($i = 0; $i < $t; $i++) {
            $soma += (int) $cpf[$i] * (($t + 1) - $i);
        }
        $digito = ((10 * $soma) % 11) % 10;
        if ((int) $cpf[$t] !== $digito) {
            return false;
        }
    }
    return true;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: Cadastro.html");
    exit;
}

$nome        = trim($_POST["nome"] ?? "");
$email       = strtolower(trim($_POST["email"] ?? ""));
$cpf         = preg_replace('/\D/', '', $_POST["cpf"] ?? "");
$cep         = preg_replace('/\D/', '', $_POST["cep"] ?? "");
$rua         = trim($_POST["rua"] ?? "");
$bairro      = trim($_POST["bairro"] ?? "");
$cidade      = trim($_POST["cidade"] ?? "");
$uf          = strtoupper(trim($_POST["uf"] ?? ""));
$senha       = $_POST["senha"] ?? "";
$confirmacao = $_POST["confirmacao"] ?? "";

if ($nome === "" || $email === "" || $cpf === "" || $cep === "" || $rua === "" ||
    $bairro === "" || $cidade === "" || $uf === "" || $senha === "") {
    voltar("campos");
}

if (tamanho($nome) > 100 || tamanho($rua) > 150 || tamanho($bairro) > 100 ||
    tamanho($cidade) > 100 || strlen($email) > 150) {
    voltar("tamanho");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    voltar("email");
}

if (!cpf_valido($cpf)) {
    voltar("cpf");
}

if (!preg_match('/^\d{8}$/', $cep)) {
    voltar("cep");
}

if (!preg_match('/^[A-Z]{2}$/', $uf)) {
    voltar("uf");
}

if (strlen($senha) < 8) {
    voltar("senha_curta");
}

if ($senha !== $confirmacao) {
    voltar("senha_diferente");
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO usuarios
            (nome, email, cpf, cep, rua, bairro, cidade, uf, senha_hash)
         VALUES
            (:nome, :email, :cpf, :cep, :rua, :bairro, :cidade, :uf, :senha_hash)"
    );

    $stmt->execute([
        ":nome"       => $nome,
        ":email"      => $email,
        ":cpf"        => $cpf,
        ":cep"        => $cep,
        ":rua"        => $rua,
        ":bairro"     => $bairro,
        ":cidade"     => $cidade,
        ":uf"         => $uf,
        ":senha_hash" => $senhaHash
    ]);

    header("Location: ../Login/Login.html?cadastro=ok");
    exit;
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) {
        voltar("duplicado");
    }
    error_log("InvestSmart - cadastro: " . $e->getMessage());
    voltar("erro");
}
