-- MySQL schema for the pedidos system
-- Charset and engine
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS pedidos CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE pedidos;

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSON NOT NULL,
  default_username VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150),
  phone VARCHAR(30),
  profile_id BIGINT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
) ENGINE=InnoDB;

-- Products (cardapio)
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Customers (clientes)
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  UNIQUE KEY uk_phone (phone),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Orders (pedidos)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) PRIMARY KEY,
  customer_id BIGINT,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  address VARCHAR(255),
  type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(32) NOT NULL,
  product_id BIGINT,
  product_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Chat messages associated to orders
CREATE TABLE IF NOT EXISTS order_chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(32) NOT NULL,
  sender ENUM('customer','system','user') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Customer conversation history (full conversation outside order context)
CREATE TABLE IF NOT EXISTS customer_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  channel VARCHAR(30) DEFAULT 'chat',
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  level VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  message TEXT,
  actor_username VARCHAR(100),
  actor_user_id BIGINT,
  ip VARCHAR(64),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_level (level),
  INDEX idx_logs_actor (actor_username)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS=1;

-- Seed data minimal
INSERT INTO profiles (name, description, permissions, default_username)
VALUES
  ('Administrador', 'Acesso completo ao sistema', JSON_OBJECT(
    'verDashboard', true,
    'verPedidos', true,
    'verClientes', true,
    'verCardapio', true,
    'criarEditarProduto', true,
    'excluirProduto', true,
    'desativarProduto', true,
    'verChat', true,
    'enviarChat', true,
    'imprimirPedido', true,
    'acessarEndereco', true,
    'visualizarValorPedido', true,
    'acompanharEntregas', true,
    'gerarRelatorios', true,
    'gerenciarPerfis', true,
    'alterarStatusPedido', true,
    'selecionarStatusEspecifico', true,
    'criarUsuarios', true,
    'editarUsuarios', true,
    'excluirUsuarios', true
  ), 'admin'),
  ('Atendente', 'Gerenciamento de pedidos e atendimento', JSON_OBJECT(
    'verDashboard', true,
    'verPedidos', true,
    'verClientes', true,
    'alterarStatusPedido', true,
    'verChat', true,
    'imprimirPedido', true,
    'visualizarValorPedido', true,
    'acessarEndereco', true,
    'verCardapio', true,
    'criarEditarProduto', false,
    'excluirProduto', false,
    'desativarProduto', false,
    'gerarRelatorios', false,
    'gerenciarPerfis', false
  ), 'atendente'),
  ('Entregador', 'Visualização e atualização de status de entrega', JSON_OBJECT(
    'verDashboard', false,
    'verPedidos', true,
    'verClientes', false,
    'alterarStatusPedido', true,
    'verChat', false,
    'imprimirPedido', false,
    'visualizarValorPedido', false,
    'acessarEndereco', true,
    'verCardapio', false,
    'criarEditarProduto', false,
    'excluirProduto', false,
    'desativarProduto', false,
    'gerarRelatorios', false,
    'gerenciarPerfis', false
  ), 'entregador')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO users (username, password_hash, full_name, phone, profile_id)
SELECT 'admin', '$2y$10$replace_with_bcrypt', 'Administrador', NULL, p.id FROM profiles p WHERE p.name='Administrador'
ON DUPLICATE KEY UPDATE username = username;

