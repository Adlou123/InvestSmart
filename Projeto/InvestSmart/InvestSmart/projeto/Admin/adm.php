<?php
require_once __DIR__ . "/../../conexao.php";
require_once __DIR__ . "/../../tabelas.php";

criar_tabelas_extras($pdo);

function admin_h($v): string {
    return htmlspecialchars((string)$v, ENT_QUOTES, "UTF-8");
}
function admin_moeda($v): string {
    return "R$ " . number_format((float)$v, 2, ",", ".");
}
function admin_data($v): string {
    $t = strtotime((string)$v);
    return $t ? date("d/m/Y H:i", $t) : "—";
}
function admin_redirecionar(string $aba = "geral"): void {
    header("Location: adm.php?aba=" . urlencode($aba));
    exit;
}

// Sempre confirma a permissão no banco, não confia apenas na sessão.
if (empty($_SESSION["usuario_id"])) {
    header("Location: ../Login/Login.html");
    exit;
}

$stmtAdmin = $pdo->prepare("SELECT id, nome, email, tipo FROM usuarios WHERE id = :id LIMIT 1");
$stmtAdmin->execute([":id" => (int)$_SESSION["usuario_id"]]);
$adminAtual = $stmtAdmin->fetch();

if (!$adminAtual || $adminAtual["tipo"] !== "admin") {
    unset($_SESSION["usuario_id"], $_SESSION["usuario_nome"], $_SESSION["usuario_email"], $_SESSION["usuario_tipo"]);
    header("Location: ../index.html");
    exit;
}

$_SESSION["usuario_tipo"] = "admin";
if (empty($_SESSION["csrf"])) {
    $_SESSION["csrf"] = bin2hex(random_bytes(32));
}
$csrf = $_SESSION["csrf"];
$flash = $_SESSION["adm_flash"] ?? null;
unset($_SESSION["adm_flash"]);

function admin_flash(string $msg, bool $erro = false): void {
    $_SESSION["adm_flash"] = ["texto" => $msg, "erro" => $erro];
}

// Ações protegidas por POST + token CSRF.
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $token = (string)($_POST["csrf"] ?? "");
    if (!hash_equals((string)$_SESSION["csrf"], $token)) {
        admin_flash("Sessão expirada. Atualize a página e tente novamente.", true);
        admin_redirecionar();
    }

    $acao = (string)($_POST["acao"] ?? "");
    try {
        if ($acao === "sair") {
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $p = session_get_cookie_params();
                setcookie(session_name(), "", time() - 42000, $p["path"], $p["domain"], $p["secure"], $p["httponly"]);
            }
            session_destroy();
            header("Location: ../Login/Login.html");
            exit;
        }

        if ($acao === "excluir_usuario") {
            $id = filter_var($_POST["id"] ?? null, FILTER_VALIDATE_INT);
            if (!$id || $id === (int)$adminAtual["id"]) {
                admin_flash("Não é possível excluir esta conta.", true);
                admin_redirecionar("usuarios");
            }

            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM anotacoes WHERE usuario_id = :id")->execute([":id" => $id]);
            $pdo->prepare("DELETE FROM simulacoes WHERE usuario_id = :id")->execute([":id" => $id]);
            // Só remove contas comuns; não permite apagar outro administrador por engano.
            $del = $pdo->prepare("DELETE FROM usuarios WHERE id = :id AND tipo = 'usuario'");
            $del->execute([":id" => $id]);
            $pdo->commit();

            admin_flash($del->rowCount() ? "Usuário excluído com sucesso." : "Conta não encontrada ou é administradora.", !$del->rowCount());
            admin_redirecionar("usuarios");
        }

        if ($acao === "excluir_simulacao") {
            $id = filter_var($_POST["id"] ?? null, FILTER_VALIDATE_INT);
            if (!$id) {
                admin_flash("Simulação inválida.", true);
                admin_redirecionar("simulacoes");
            }
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM anotacoes WHERE simulacao_id = :id")->execute([":id" => $id]);
            $del = $pdo->prepare("DELETE FROM simulacoes WHERE id = :id");
            $del->execute([":id" => $id]);
            $pdo->commit();
            admin_flash($del->rowCount() ? "Simulação excluída." : "Simulação não encontrada.", !$del->rowCount());
            admin_redirecionar("simulacoes");
        }

        admin_flash("Ação desconhecida.", true);
        admin_redirecionar();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("InvestSmart ADM: " . $e->getMessage());
        admin_flash("Não foi possível concluir a ação. Confira a conexão e as tabelas do banco.", true);
        admin_redirecionar();
    }
}

$aba = (string)($_GET["aba"] ?? "geral");
$abasPermitidas = ["geral", "usuarios", "simulacoes", "admins"];
if (!in_array($aba, $abasPermitidas, true)) $aba = "geral";

try {
    $totalUsuarios = (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE tipo = 'usuario'")->fetchColumn();
    $totalAdmins = (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE tipo = 'admin'")->fetchColumn();
    $totalSims = (int)$pdo->query("SELECT COUNT(*) FROM simulacoes")->fetchColumn();
    $mediaSims = $pdo->query("SELECT AVG(valor_final) FROM simulacoes")->fetchColumn();
    $totalNotas = (int)$pdo->query("SELECT COUNT(*) FROM anotacoes")->fetchColumn();

    $ultimas = $pdo->query(
        "SELECT s.id, s.criado_em, s.valor_final, u.nome AS usuario
           FROM simulacoes s
      LEFT JOIN usuarios u ON u.id = s.usuario_id
       ORDER BY s.id DESC LIMIT 5"
    )->fetchAll();

    $usuarios = [];
    if ($aba === "usuarios") {
        $usuarios = $pdo->query(
            "SELECT u.id, u.nome, u.email, u.cidade, u.uf,
                    (SELECT COUNT(*) FROM simulacoes s WHERE s.usuario_id = u.id) AS qtd_sims
               FROM usuarios u
              WHERE u.tipo = 'usuario'
              ORDER BY u.id DESC LIMIT 300"
        )->fetchAll();
    }

    $simulacoes = [];
    if ($aba === "simulacoes") {
        $simulacoes = $pdo->query(
            "SELECT s.id, s.criado_em, s.valor_inicial, s.aporte_mensal, s.taxa_mensal,
                    s.tempo_meses, s.valor_final, u.nome AS usuario
               FROM simulacoes s
          LEFT JOIN usuarios u ON u.id = s.usuario_id
           ORDER BY s.id DESC LIMIT 300"
        )->fetchAll();
    }

    $admins = [];
    if ($aba === "admins") {
        $admins = $pdo->query(
            "SELECT id, nome, email, criado_em FROM usuarios WHERE tipo = 'admin' ORDER BY id"
        )->fetchAll();
    }
} catch (PDOException $e) {
    error_log("InvestSmart ADM consulta: " . $e->getMessage());
    http_response_code(500);
    exit("Erro ao consultar o banco. Abra o teste.php na pasta principal do projeto para diagnosticar.");
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>InvestSmart · Administração</title>
<link rel="stylesheet" href="adm.css">
</head>
<body>
<div id="painel-admin">
  <aside>
    <h1>InvestSmart</h1>
    <small>Olá, <?= admin_h($adminAtual["nome"]) ?></small>
    <a class="tab <?= $aba === "geral" ? "on" : "" ?>" href="adm.php?aba=geral">Visão geral</a>
    <a class="tab <?= $aba === "usuarios" ? "on" : "" ?>" href="adm.php?aba=usuarios">Usuários</a>
    <a class="tab <?= $aba === "simulacoes" ? "on" : "" ?>" href="adm.php?aba=simulacoes">Simulações</a>
    <a class="tab <?= $aba === "admins" ? "on" : "" ?>" href="adm.php?aba=admins">Administradores</a>
    <form method="post" action="adm.php">
      <input type="hidden" name="csrf" value="<?= admin_h($csrf) ?>">
      <input type="hidden" name="acao" value="sair">
      <button type="submit">Sair do painel</button>
    </form>
    <a href="../index.html">Ver site</a>
  </aside>

  <main>
    <?php if ($flash): ?>
      <p class="flash <?= !empty($flash["erro"]) ? "erro" : "" ?>" role="alert"><?= admin_h($flash["texto"]) ?></p>
    <?php endif; ?>

    <?php if ($aba === "geral"): ?>
      <section class="on">
        <h2>Visão geral</h2>
        <div class="stats">
          <div class="stat"><b><?= $totalUsuarios ?></b><span>Usuários cadastrados</span></div>
          <div class="stat"><b><?= $totalSims ?></b><span>Simulações salvas</span></div>
          <div class="stat"><b><?= $mediaSims === null ? "—" : admin_h(admin_moeda($mediaSims)) ?></b><span>Média dos resultados brutos</span></div>
          <div class="stat"><b><?= $totalNotas ?></b><span>Anotações salvas</span></div>
        </div>
        <div class="panel">
          <h3>Últimas simulações</h3>
          <?php if (!$ultimas): ?><p class="empty">Nenhuma simulação salva ainda.</p><?php else: ?>
          <table><thead><tr><th>Data</th><th>Usuário</th><th>Resultado bruto</th></tr></thead><tbody>
          <?php foreach ($ultimas as $s): ?>
            <tr><td><?= admin_h(admin_data($s["criado_em"])) ?></td><td><?= admin_h($s["usuario"] ?? "(removido)") ?></td><td><?= admin_h(admin_moeda($s["valor_final"])) ?></td></tr>
          <?php endforeach; ?>
          </tbody></table>
          <?php endif; ?>
        </div>
      </section>

    <?php elseif ($aba === "usuarios"): ?>
      <section class="on">
        <h2>Usuários cadastrados</h2>
        <div class="panel">
          <?php if (!$usuarios): ?><p class="empty">Nenhum usuário comum cadastrado.</p><?php else: ?>
          <table><thead><tr><th>Nome</th><th>E-mail</th><th>Cidade/UF</th><th>Simulações</th><th>Ação</th></tr></thead><tbody>
          <?php foreach ($usuarios as $u): ?>
            <tr>
              <td><?= admin_h($u["nome"]) ?></td><td><?= admin_h($u["email"]) ?></td>
              <td><?= admin_h(($u["cidade"] ?? "") . "/" . ($u["uf"] ?? "")) ?></td><td><?= (int)$u["qtd_sims"] ?></td>
              <td><form class="inline" method="post" action="adm.php" onsubmit="return confirm('Excluir este usuário e seus dados?');">
                <input type="hidden" name="csrf" value="<?= admin_h($csrf) ?>">
                <input type="hidden" name="acao" value="excluir_usuario">
                <input type="hidden" name="id" value="<?= (int)$u["id"] ?>">
                <button class="act del" type="submit">Excluir</button>
              </form></td>
            </tr>
          <?php endforeach; ?>
          </tbody></table>
          <?php endif; ?>
        </div>
      </section>

    <?php elseif ($aba === "simulacoes"): ?>
      <section class="on">
        <h2>Simulações registradas</h2>
        <p class="section-description">Mostrando até 300 simulações mais recentes. Os valores são estimativas brutas.</p>
        <div class="panel">
          <?php if (!$simulacoes): ?><p class="empty">Nenhuma simulação salva ainda.</p><?php else: ?>
          <table><thead><tr><th>Data</th><th>Usuário</th><th>Inicial</th><th>Aporte mensal</th><th>Taxa</th><th>Meses</th><th>Valor final</th><th>Ação</th></tr></thead><tbody>
          <?php foreach ($simulacoes as $s): ?>
            <tr>
              <td><?= admin_h(admin_data($s["criado_em"])) ?></td><td><?= admin_h($s["usuario"] ?? "(removido)") ?></td>
              <td><?= admin_h(admin_moeda($s["valor_inicial"])) ?></td><td><?= admin_h(admin_moeda($s["aporte_mensal"])) ?></td>
              <td><?= admin_h(rtrim(rtrim(number_format((float)$s["taxa_mensal"], 4, ",", ""), "0"), ",")) ?>%</td>
              <td><?= (int)$s["tempo_meses"] ?></td><td><?= admin_h(admin_moeda($s["valor_final"])) ?></td>
              <td><form class="inline" method="post" action="adm.php" onsubmit="return confirm('Excluir esta simulação e as anotações ligadas a ela?');">
                <input type="hidden" name="csrf" value="<?= admin_h($csrf) ?>">
                <input type="hidden" name="acao" value="excluir_simulacao">
                <input type="hidden" name="id" value="<?= (int)$s["id"] ?>">
                <button class="act del" type="submit">Excluir</button>
              </form></td>
            </tr>
          <?php endforeach; ?>
          </tbody></table>
          <?php endif; ?>
        </div>
      </section>

    <?php else: ?>
      <section class="on">
        <h2>Administradores</h2>
        <p class="section-description">Contas com permissão administrativa no sistema.</p>
        <div class="panel">
          <table><thead><tr><th>Nome</th><th>E-mail</th><th>Desde</th></tr></thead><tbody>
          <?php foreach ($admins as $a): ?>
            <tr><td><?= admin_h($a["nome"]) ?></td><td><?= admin_h($a["email"]) ?></td><td><?= admin_h(admin_data($a["criado_em"])) ?></td></tr>
          <?php endforeach; ?>
          </tbody></table>
        </div>
      </section>
    <?php endif; ?>
  </main>
</div>
</body>
</html>
