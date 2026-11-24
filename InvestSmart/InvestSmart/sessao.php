<?php
define("RESPOSTA_JSON", true);
require_once __DIR__ . "/iniciar.php";

json_out([
    "logado" => !empty($_SESSION["usuario_id"]),
    "nome"   => $_SESSION["usuario_nome"] ?? ""
]);
