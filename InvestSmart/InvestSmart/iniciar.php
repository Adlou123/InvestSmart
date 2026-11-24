<?php
// Inicialização comum a todas as páginas PHP.
// IMPORTANTE: este arquivo (e todos os .php) NÃO pode ter nada antes do "<?php" (nem linha em branco),
// senão o PHP já "enviou a página" e não consegue mais criar sessão nem redirecionar.

if (!defined("DEBUG")) {
    define("DEBUG", false);
}

// Erros vão para o log do servidor, nunca para a tela (para não quebrar as respostas JSON)
ini_set("display_errors", DEBUG ? "1" : "0");
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        "lifetime" => 0,
        "path"     => "/",
        "httponly" => true,
        "samesite" => "Lax",
        "secure"   => !empty($_SERVER["HTTPS"])
    ]);
    session_start();
}

function json_out(array $dados, int $codigo = 200): void
{
    http_response_code($codigo);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store");
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function h($texto): string
{
    return htmlspecialchars((string) $texto, ENT_QUOTES, "UTF-8");
}

// Conta caracteres (UTF-8) sem depender da extensão mbstring
function tamanho(string $texto): int
{
    if (function_exists("mb_strlen")) {
        return mb_strlen($texto, "UTF-8");
    }
    $n = preg_match_all("/./su", $texto);
    return $n === false ? strlen($texto) : $n;
}

function csrf_token(): string
{
    if (empty($_SESSION["csrf"])) {
        $_SESSION["csrf"] = bin2hex(random_bytes(32));
    }
    return $_SESSION["csrf"];
}

function csrf_valido(): bool
{
    $enviado = $_POST["csrf"] ?? "";
    return is_string($enviado)
        && !empty($_SESSION["csrf"])
        && hash_equals($_SESSION["csrf"], $enviado);
}

function exigir_login_json(): int
{
    if (empty($_SESSION["usuario_id"])) {
        json_out(["erro" => "Você precisa fazer login."], 401);
    }
    return (int) $_SESSION["usuario_id"];
}
