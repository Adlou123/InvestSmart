
<?php

require_once "proteger.php";

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

    <h2>
        Olá,
        <?= htmlspecialchars($_SESSION["usuario_nome"], ENT_QUOTES, "UTF-8"); ?>
    </h2>

    <p>Você está conectado ao sistema.</p>

    <a href="sair.php">Sair da conta</a>

</body>
</html>
