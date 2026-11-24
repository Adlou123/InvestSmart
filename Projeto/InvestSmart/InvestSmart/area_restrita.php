<?php
require_once __DIR__ . "/proteger.php";

verificarLogin();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Área do usuário</title>
</head>
<body>
    <h1>Bem-vindo ao InvestSmart!</h1>
    <h2>Olá, <?= h($_SESSION["usuario_nome"] ?? "") ?></h2>
    <p>Você está conectado ao sistema.</p>
    <p><a href="projeto/index.html#simulador">Ir para o simulador</a></p>
    <a href="sair.php">Sair da conta</a>
</body>
</html>
