-- Criar banco
CREATE DATABASE IF NOT EXISTS db_loja
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE db_loja;

-- =====================================================
-- TABELA: usuarios
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    cpf_cnpj VARCHAR(20) DEFAULT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario INT NOT NULL DEFAULT 3,
    criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_usuarios_email (email),
    UNIQUE KEY uk_usuarios_cpf_cnpj (cpf_cnpj)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- TABELA: produtos
-- =====================================================

CREATE TABLE IF NOT EXISTS produtos (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    imagem VARCHAR(255) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_produtos_ativo_id (ativo, id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- TABELA: recuperacao_senhas
-- =====================================================

CREATE TABLE IF NOT EXISTS recuperacao_senhas (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    expira_em DATETIME NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_token_hash (token_hash),
    KEY idx_usuario_usado (usuario_id, usado),

    CONSTRAINT fk_recuperacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- TABELA: carrinho_reservas
-- =====================================================

CREATE TABLE IF NOT EXISTS carrinho_reservas (
    id INT NOT NULL AUTO_INCREMENT,
    produto_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('ativa','cancelada','expirada','finalizada')
        NOT NULL DEFAULT 'ativa',
    expiraEm DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_reservas_produto_status_expira
        (produto_id, status, expiraEm),

    KEY idx_reservas_session_status_expira
        (session_id, status, expiraEm),

    CONSTRAINT fk_carrinho_reservas_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- TABELA: pedidos
-- =====================================================

CREATE TABLE IF NOT EXISTS pedidos (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'finalizado',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_pedidos_usuario (usuario_id),
    KEY idx_pedidos_status (status),
    KEY idx_pedidos_usuario_criado (usuario_id, criado_em),

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- TABELA: pedido_itens
-- =====================================================

CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT NOT NULL AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    produto_id INT DEFAULT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (id),

    KEY idx_pedido_itens_pedido (pedido_id),
    KEY idx_pedido_itens_produto (produto_id),

    CONSTRAINT fk_pedido_itens_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pedido_itens_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;