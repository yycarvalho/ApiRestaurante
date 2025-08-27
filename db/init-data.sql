-- Script para inserir dados de exemplo no banco de dados
USE pedidos;

-- Inserir produtos de exemplo
INSERT INTO products (name, description, price, category, active) VALUES
('X-Burger', 'Hambúrguer com queijo, alface, tomate e maionese', 15.90, 'lanches', 1),
('X-Salada', 'Hambúrguer com queijo, alface, tomate, cebola e maionese', 17.90, 'lanches', 1),
('X-Bacon', 'Hambúrguer com queijo, bacon, alface, tomate e maionese', 19.90, 'lanches', 1),
('X-Tudo', 'Hambúrguer com queijo, bacon, ovo, alface, tomate, cebola e maionese', 22.90, 'lanches', 1),
('Refrigerante Coca-Cola', 'Refrigerante Coca-Cola 350ml', 6.50, 'bebidas', 1),
('Refrigerante Pepsi', 'Refrigerante Pepsi 350ml', 6.00, 'bebidas', 1),
('Suco Natural', 'Suco natural de laranja 300ml', 8.00, 'bebidas', 1),
('Batata Frita', 'Porção de batata frita crocante', 12.00, 'acompanhamentos', 1),
('Onion Rings', 'Anéis de cebola empanados', 10.00, 'acompanhamentos', 1),
('Sorvete', 'Sorvete de creme com calda de chocolate', 8.50, 'sobremesas', 1),
('Milk Shake', 'Milk shake de chocolate, morango ou baunilha', 12.00, 'sobremesas', 1)
ON DUPLICATE KEY UPDATE name = name;

-- Inserir clientes de exemplo
INSERT INTO customers (name, phone) VALUES
('João Silva', '(11) 99999-1111'),
('Maria Santos', '(11) 99999-2222'),
('Pedro Oliveira', '(11) 99999-3333'),
('Ana Costa', '(11) 99999-4444'),
('Carlos Ferreira', '(11) 99999-5555'),
('Lucia Rodrigues', '(11) 99999-6666'),
('Roberto Almeida', '(11) 99999-7777'),
('Fernanda Lima', '(11) 99999-8888')
ON DUPLICATE KEY UPDATE name = name;

-- Inserir pedidos de exemplo
INSERT INTO orders (id, customer_id, customer_name, customer_phone, type, status, total) VALUES
('PED001', 1, 'João Silva', '(11) 99999-1111', 'delivery', 'em_atendimento', 32.80),
('PED002', 2, 'Maria Santos', '(11) 99999-2222', 'pickup', 'aguardando_pagamento', 28.90),
('PED003', 3, 'Pedro Oliveira', '(11) 99999-3333', 'delivery', 'pedido_feito', 45.80),
('PED004', 4, 'Ana Costa', '(11) 99999-4444', 'pickup', 'pronto', 22.90),
('PED005', 5, 'Carlos Ferreira', '(11) 99999-5555', 'delivery', 'coletado', 38.50),
('PED006', 6, 'Lucia Rodrigues', '(11) 99999-6666', 'pickup', 'finalizado', 25.40)
ON DUPLICATE KEY UPDATE id = id;

-- Inserir itens dos pedidos
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES
-- Pedido 1
('PED001', 1, 'X-Burger', 1, 15.90),
('PED001', 5, 'Refrigerante Coca-Cola', 1, 6.50),
('PED001', 8, 'Batata Frita', 1, 12.00),

-- Pedido 2
('PED002', 2, 'X-Salada', 1, 17.90),
('PED002', 6, 'Refrigerante Pepsi', 1, 6.00),
('PED002', 9, 'Onion Rings', 1, 10.00),

-- Pedido 3
('PED003', 3, 'X-Bacon', 2, 19.90),
('PED003', 5, 'Refrigerante Coca-Cola', 2, 6.50),

-- Pedido 4
('PED004', 4, 'X-Tudo', 1, 22.90),

-- Pedido 5
('PED005', 1, 'X-Burger', 1, 15.90),
('PED005', 2, 'X-Salada', 1, 17.90),
('PED005', 7, 'Suco Natural', 1, 8.00),

-- Pedido 6
('PED006', 3, 'X-Bacon', 1, 19.90),
('PED006', 8, 'Batata Frita', 1, 12.00)
ON DUPLICATE KEY UPDATE order_id = order_id;

-- Inserir mensagens de chat de exemplo
INSERT INTO order_chat_messages (order_id, sender, message, user_id) VALUES
('PED001', 'customer', 'Olá, gostaria de fazer um pedido', NULL),
('PED001', 'user', 'Olá! Claro, como posso ajudar?', 1),
('PED001', 'customer', 'Quero um X-Burger com batata frita e Coca-Cola', NULL),
('PED001', 'user', 'Perfeito! Seu pedido foi registrado. Tempo estimado: 25 minutos', 1),

('PED002', 'customer', 'Boa tarde! Tem X-Salada?', NULL),
('PED002', 'user', 'Boa tarde! Sim, temos sim. Quer fazer o pedido?', 1),
('PED002', 'customer', 'Sim, quero um X-Salada com Pepsi e onion rings', NULL),
('PED002', 'user', 'Ótimo! Pedido confirmado. Pode retirar em 20 minutos', 1),

('PED003', 'customer', 'Oi! Quero 2 X-Bacon com Coca-Cola', NULL),
('PED003', 'user', 'Oi! Pedido anotado. Para entrega ou retirada?', 1),
('PED003', 'customer', 'Entrega, por favor', NULL),
('PED003', 'user', 'Certo! Tempo estimado para entrega: 35 minutos', 1)
ON DUPLICATE KEY UPDATE order_id = order_id;

-- Inserir mensagens de cliente de exemplo
INSERT INTO customer_messages (customer_id, direction, channel, message, user_id) VALUES
(1, 'inbound', 'chat', 'Olá, vocês fazem delivery?', NULL),
(1, 'outbound', 'chat', 'Sim! Fazemos delivery em toda a região', 1),
(1, 'inbound', 'chat', 'Que ótimo! Qual o tempo de entrega?', NULL),
(1, 'outbound', 'chat', 'O tempo médio é de 30 minutos', 1),

(2, 'inbound', 'chat', 'Boa tarde! Vocês têm promoções hoje?', NULL),
(2, 'outbound', 'chat', 'Boa tarde! Sim, temos 10% de desconto em pedidos acima de R$ 30', 1),
(2, 'inbound', 'chat', 'Perfeito! Vou fazer um pedido então', NULL),

(3, 'inbound', 'chat', 'Oi! Quais são os sabores de milk shake?', NULL),
(3, 'outbound', 'chat', 'Oi! Temos chocolate, morango e baunilha', 1),
(3, 'inbound', 'chat', 'Quero de chocolate!', NULL)
ON DUPLICATE KEY UPDATE customer_id = customer_id;