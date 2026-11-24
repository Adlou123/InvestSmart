<?php
// Prepara tabelas auxiliares do InvestSmart sem apagar dados existentes.
function criar_tabelas_extras(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS anotacoes (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        simulacao_id INT NOT NULL,
        titulo VARCHAR(80) NOT NULL,
        texto TEXT NOT NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_anotacoes_usuario (usuario_id),
        INDEX idx_anotacoes_simulacao (simulacao_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // O painel precisa da data da simulação. Adiciona somente se ainda não existir.
    $temData = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'simulacoes'
          AND COLUMN_NAME = 'criado_em'")->fetchColumn();

    if (!(int)$temData) {
        $pdo->exec("ALTER TABLE simulacoes
            ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
    }

    // A coluna tipo diferencia usuário comum e administrador.
    $temTipo = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'usuarios'
          AND COLUMN_NAME = 'tipo'")->fetchColumn();

    if (!(int)$temTipo) {
        $pdo->exec("ALTER TABLE usuarios
            ADD COLUMN tipo ENUM('usuario','admin') NOT NULL DEFAULT 'usuario'");
    }
}
