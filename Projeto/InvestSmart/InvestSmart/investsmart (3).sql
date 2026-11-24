
CREATE DATABASE IF NOT EXISTS investsmart
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE investsmart;

CREATE TABLE usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    cpf CHAR(11) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    rua VARCHAR(150) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',

    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    UNIQUE KEY cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE simulacoes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    valor_inicial DECIMAL(20,2) NOT NULL,
    aporte_mensal DECIMAL(20,2) NOT NULL,
    taxa_mensal DECIMAL(12,4) NOT NULL,
    tempo_meses INT NOT NULL,
    valor_final DECIMAL(20,2) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_simulacoes_usuario (usuario_id),

    CONSTRAINT fk_simulacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE anotacoes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    simulacao_id INT UNSIGNED NOT NULL,
    titulo VARCHAR(80) NOT NULL,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_anotacoes_usuario (usuario_id),
    KEY idx_anotacoes_simulacao (simulacao_id),

    CONSTRAINT fk_anotacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_anotacoes_simulacao
        FOREIGN KEY (simulacao_id)
        REFERENCES simulacoes (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
