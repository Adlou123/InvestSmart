<?php
define("RESPOSTA_JSON", true);
require_once __DIR__ . "/conexao.php";
require_once __DIR__ . "/tabelas.php";

$usuarioId = exigir_login_json();
$metodo    = $_SERVER["REQUEST_METHOD"];

try {
    criar_tabelas_extras($pdo);

    // ---------- LISTAR ----------
    if ($metodo === "GET") {
        $stmt = $pdo->prepare(
            "SELECT a.id, a.titulo, a.texto, a.criado_em,
                    s.valor_inicial, s.aporte_mensal, s.taxa_mensal, s.tempo_meses, s.valor_final
               FROM anotacoes a
               JOIN simulacoes s ON s.id = a.simulacao_id
              WHERE a.usuario_id = :u
              ORDER BY a.id DESC"
        );
        $stmt->execute([":u" => $usuarioId]);

        $lista = [];
        foreach ($stmt->fetchAll() as $l) {
            $lista[] = [
                "id"       => (int) $l["id"],
                "titulo"   => $l["titulo"],
                "texto"    => $l["texto"],
                "criadoEm" => $l["criado_em"],
                "simulacao" => [
                    "valorInicial" => (float) $l["valor_inicial"],
                    "aporteMensal" => (float) $l["aporte_mensal"],
                    "taxaMensal"   => (float) $l["taxa_mensal"],
                    "tempoMeses"   => (int) $l["tempo_meses"],
                    "valorFinal"   => (float) $l["valor_final"]
                ]
            ];
        }
        json_out(["anotacoes" => $lista]);
    }

    $dados = json_decode(file_get_contents("php://input"), true);
    if (!is_array($dados)) {
        json_out(["erro" => "Dados inválidos."], 400);
    }

    // ---------- CRIAR ----------
    if ($metodo === "POST") {
        $simulacaoId = filter_var($dados["simulacao_id"] ?? null, FILTER_VALIDATE_INT);
        $titulo      = trim((string) ($dados["titulo"] ?? ""));
        $texto       = trim((string) ($dados["texto"] ?? ""));

        if (!$simulacaoId || $titulo === "" || $texto === "") {
            json_out(["erro" => "Preencha o investimento e suas anotações."], 400);
        }
        if (tamanho($titulo) > 80 || tamanho($texto) > 5000) {
            json_out(["erro" => "Texto grande demais."], 400);
        }

        // A simulação precisa ser do próprio usuário
        $stmt = $pdo->prepare("SELECT id FROM simulacoes WHERE id = :s AND usuario_id = :u");
        $stmt->execute([":s" => $simulacaoId, ":u" => $usuarioId]);
        if (!$stmt->fetch()) {
            json_out(["erro" => "Simulação não encontrada. Faça a simulação novamente."], 404);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO anotacoes (usuario_id, simulacao_id, titulo, texto)
             VALUES (:u, :s, :t, :x)"
        );
        $stmt->execute([":u" => $usuarioId, ":s" => $simulacaoId, ":t" => $titulo, ":x" => $texto]);

        json_out(["sucesso" => true, "id" => (int) $pdo->lastInsertId()]);
    }

    // ---------- EXCLUIR ----------
    if ($metodo === "DELETE") {
        $id = filter_var($dados["id"] ?? null, FILTER_VALIDATE_INT);
        if (!$id) {
            json_out(["erro" => "Anotação inválida."], 400);
        }
        $stmt = $pdo->prepare("DELETE FROM anotacoes WHERE id = :id AND usuario_id = :u");
        $stmt->execute([":id" => $id, ":u" => $usuarioId]);
        json_out(["sucesso" => true]);
    }

    json_out(["erro" => "Método inválido."], 405);
} catch (PDOException $e) {
    error_log("InvestSmart - anotações: " . $e->getMessage());
    json_out(["erro" => "Erro ao acessar as anotações. Rode o teste.php para diagnosticar o banco."], 500);
}
