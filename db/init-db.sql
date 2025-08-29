-- Script de inicialização do banco de dados MySQL
-- Sistema de Gestão de Pedidos - Versão 4.0

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS sistema_pedidos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_pedidos;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(20) PRIMARY KEY,
    customer_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- delivery, pickup
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Índices para performance
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Inserir dados de exemplo

-- Clientes de exemplo
INSERT IGNORE INTO customers (name, phone, email, address) VALUES
('João Silva', '(11) 99999-1234', 'joao@email.com', 'Rua das Flores, 123 - Centro'),
('Maria Santos', '(11) 99999-5678', 'maria@email.com', 'Av. Principal, 456 - Jardim'),
('Pedro Costa', '(11) 99999-9012', 'pedro@email.com', 'Rua do Comércio, 789 - Centro'),
('Ana Oliveira', '(11) 99999-3456', 'ana@email.com', 'Av. das Palmeiras, 321 - Jardim'),
('Carlos Ferreira', '(11) 99999-7890', 'carlos@email.com', 'Rua das Acácias, 654 - Centro');

-- Produtos de exemplo
INSERT IGNORE INTO products (name, description, price, category) VALUES
('X-Burger Clássico', 'Hambúrguer com queijo, alface e tomate', 15.90, 'lanches'),
('X-Bacon', 'Hambúrguer com bacon, queijo e salada', 18.90, 'lanches'),
('X-Tudo', 'Hambúrguer completo com todos os ingredientes', 22.90, 'lanches'),
('X-Frango', 'Hambúrguer de frango grelhado', 16.90, 'lanches'),
('Coca-Cola 350ml', 'Refrigerante Coca-Cola', 4.50, 'bebidas'),
('Guaraná Antarctica 350ml', 'Refrigerante Guaraná', 4.50, 'bebidas'),
('Água Mineral 500ml', 'Água mineral sem gás', 3.00, 'bebidas'),
('Batata Frita', 'Porção de batatas fritas crocantes', 8.90, 'acompanhamentos'),
('Onion Rings', 'Anéis de cebola empanados', 7.90, 'acompanhamentos'),
('Milkshake de Chocolate', 'Milkshake cremoso de chocolate', 8.90, 'sobremesas');

-- Pedidos de exemplo
INSERT IGNORE INTO orders (id, customer_id, total, status, type, address) VALUES
('20250101001', 1, 40.80, 'em_atendimento', 'delivery', 'Rua das Flores, 123 - Centro'),
('20250101002', 2, 27.80, 'pedido_feito', 'pickup', NULL),
('20250101003', 3, 36.30, 'pronto', 'delivery', 'Rua do Comércio, 789 - Centro'),
('20250101004', 4, 19.90, 'finalizado', 'pickup', NULL),
('20250101005', 5, 45.70, 'aguardando_pagamento', 'delivery', 'Rua das Acácias, 654 - Centro');

-- Itens dos pedidos
INSERT IGNORE INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
('20250101001', 1, 'X-Burger Clássico', 2, 15.90, 31.80),
('20250101001', 5, 'Coca-Cola 350ml', 2, 4.50, 9.00),
('20250101002', 2, 'X-Bacon', 1, 18.90, 18.90),
('20250101002', 8, 'Batata Frita', 1, 8.90, 8.90),
('20250101003', 3, 'X-Tudo', 1, 22.90, 22.90),
('20250101003', 6, 'Guaraná Antarctica 350ml', 1, 4.50, 4.50),
('20250101003', 10, 'Milkshake de Chocolate', 1, 8.90, 8.90),
('20250101004', 4, 'X-Frango', 1, 16.90, 16.90),
('20250101004', 7, 'Água Mineral 500ml', 1, 3.00, 3.00),
('20250101005', 1, 'X-Burger Clássico', 1, 15.90, 15.90),
('20250101005', 2, 'X-Bacon', 1, 18.90, 18.90),
('20250101005', 8, 'Batata Frita', 1, 8.90, 8.90),
('20250101005', 5, 'Coca-Cola 350ml', 1, 4.50, 4.50);

COMMIT;
