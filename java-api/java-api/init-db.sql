-- Script de inicialização do banco de dados
CREATE DATABASE IF NOT EXISTS db;
USE db;

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_id BIGINT,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(20) PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    type ENUM('delivery', 'pickup') NOT NULL,
    address TEXT,
    status VARCHAR(50) DEFAULT 'em_atendimento',
    total DECIMAL(10,2) DEFAULT 0.00,
    items JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Inserir dados iniciais
INSERT IGNORE INTO profiles (id, name, permissions) VALUES 
(1, 'Administrador', '{"all": true}'),
(2, 'Atendente', '{"orders": true, "customers": true, "products": true}'),
(3, 'Entregador', '{"orders": true, "delivery": true}');

INSERT IGNORE INTO users (id, name, username, password, profile_id) VALUES 
(1, 'Administrador', 'admin', '123', 1),
(2, 'Atendente', 'atendente', '123', 2),
(3, 'Entregador', 'entregador', '123', 3);

INSERT IGNORE INTO products (id, name, description, price, category) VALUES 
(1, 'X-Burger Clássico', 'Hambúrguer, queijo, alface, tomate e molho especial', 15.90, 'lanches'),
(2, 'X-Bacon', 'Hambúrguer, bacon, queijo, alface, tomate e molho especial', 18.90, 'lanches'),
(3, 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 4.50, 'bebidas'),
(4, 'Batata Frita', 'Porção de batata frita crocante', 8.90, 'acompanhamentos');

INSERT IGNORE INTO customers (id, name, phone) VALUES 
(1, 'João Silva', '(11) 99999-1111'),
(2, 'Maria Santos', '(11) 99999-2222');