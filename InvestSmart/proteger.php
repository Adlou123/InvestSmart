<?php
require_once __DIR__ . "/iniciar.php";

// $destino é relativo à pasta onde está este arquivo (a raiz do PROJETO)
function verificarLogin(string $destino = "projeto/Login/Login.html"): void
{
    if (empty($_SESSION["usuario_id"])) {
        header("Location: " . $destino);
        exit;
    }
}
