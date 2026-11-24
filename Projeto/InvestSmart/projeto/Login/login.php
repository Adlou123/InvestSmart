<?php
require_once __DIR__ . "/../../conexao.php";

function voltar_login(string $codigo): void
{
    header("Location: Login.html?erro=" . urlencode($codigo));
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: Login.html");
    exit;
}

$email = strtolower(trim((string)($_POST["email"] ?? "")));
$senha = (string)($_POST["senha"] ?? "");

if ($email === "" || $senha === "") {
    voltar_login("campos");
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, nome, email, senha_hash, tipo
           FROM usuarios
          WHERE email = :email
          LIMIT 1"
    );
    $stmt->execute([":email" => $email]);
    $usuario = $stmt->fetch();
    
    if (!$usuario || !password_verify($senha, $usuario["senha_hash"])) {
        usleep(350000);
        voltar_login("credenciais");
    }

    session_regenerate_id(true);
    $_SESSION["usuario_id"] = (int)$usuario["id"];
    $_SESSION["usuario_nome"] = $usuario["nome"];
    $_SESSION["usuario_email"] = $usuario["email"];
    $_SESSION["usuario_tipo"] = $usuario["tipo"] ?? "usuario";

    if ($_SESSION["usuario_tipo"] === "admin") {
        header("Location: ../Admin/adm.php");
    } else {
        header("Location: ../index.html");
    }
    exit;
} catch (PDOException $e) {
    error_log("InvestSmart - login: " . $e->getMessage());
    voltar_login("erro");
}
