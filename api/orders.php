<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'GET':
        // Listar pedidos ou buscar pedido específico
        if (isset($_GET['id'])) {
            $id = validateInput($_GET['id']);
            
            // Buscar pedido com itens
            $stmt = $pdo->prepare("
                SELECT o.*, c.name as customer_name, c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            
            if ($order) {
                // Buscar itens do pedido
                $stmt = $pdo->prepare("
                    SELECT oi.*, p.name as product_name, p.price as product_price
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                ");
                $stmt->execute([$id]);
                $order['items'] = $stmt->fetchAll();
                
                jsonResponse($order);
            } else {
                jsonResponse(['error' => 'Pedido não encontrado'], 404);
            }
        } else {
            // Listar todos os pedidos com itens
            $stmt = $pdo->query("
                SELECT o.*, c.name as customer_name, c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
            ");
            $orders = $stmt->fetchAll();
            
            // Buscar itens para cada pedido
            foreach ($orders as &$order) {
                $stmt = $pdo->prepare("
                    SELECT oi.*, p.name as product_name, p.price as product_price
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                ");
                $stmt->execute([$order['id']]);
                $order['items'] = $stmt->fetchAll();
            }
            
            jsonResponse($orders);
        }
        break;
        
    case 'POST':
        // Criar novo pedido
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['customerId']) || !isset($input['customer']) || !isset($input['phone']) || !isset($input['type']) || !isset($input['items'])) {
            jsonResponse(['error' => 'Dados do cliente, tipo e itens são obrigatórios'], 400);
        }
        
        $customerId = validateInput($input['customerId']);
        $customerName = validateInput($input['customer']);
        $customerPhone = validateInput($input['phone']);
        $type = validateInput($input['type']);
        $address = isset($input['address']) ? validateInput($input['address']) : null;
        $items = $input['items'];
        
        if (empty($items)) {
            jsonResponse(['error' => 'Pedido deve ter pelo menos um item'], 400);
        }
        
        // Verificar se cliente existe
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Cliente não encontrado'], 404);
        }
        
        try {
            $pdo->beginTransaction();
            
            // Gerar ID único para o pedido
            $orderId = generateUniqueId();
            
            // Calcular total
            $total = 0;
            foreach ($items as $item) {
                $stmt = $pdo->prepare("SELECT price FROM products WHERE id = ?");
                $stmt->execute([$item['productId']]);
                $product = $stmt->fetch();
                if ($product) {
                    $total += $product['price'] * $item['quantity'];
                }
            }
            
            // Criar pedido
            $stmt = $pdo->prepare("
                INSERT INTO orders (id, customer_id, customer_name, customer_phone, address, type, status, total)
                VALUES (?, ?, ?, ?, ?, ?, 'em_atendimento', ?)
            ");
            $stmt->execute([$orderId, $customerId, $customerName, $customerPhone, $address, $type, $total]);
            
            // Criar itens do pedido
            foreach ($items as $item) {
                $stmt = $pdo->prepare("SELECT name, price FROM products WHERE id = ?");
                $stmt->execute([$item['productId']]);
                $product = $stmt->fetch();
                
                if ($product) {
                    $stmt = $pdo->prepare("
                        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([$orderId, $item['productId'], $product['name'], $item['quantity'], $product['price']]);
                }
            }
            
            $pdo->commit();
            
            // Buscar pedido criado
            $stmt = $pdo->prepare("
                SELECT o.*, c.name as customer_name, c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.id = ?
            ");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            
            // Buscar itens do pedido
            $stmt = $pdo->prepare("
                SELECT oi.*, p.name as product_name, p.price as product_price
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $stmt->execute([$orderId]);
            $order['items'] = $stmt->fetchAll();
            
            logActivity('criar_pedido', [
                'order_id' => $orderId,
                'customer_id' => $customerId,
                'total' => $total,
                'items_count' => count($items)
            ]);
            
            jsonResponse($order, 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Erro ao criar pedido: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        // Atualizar status do pedido
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do pedido é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['status'])) {
            jsonResponse(['error' => 'Status é obrigatório'], 400);
        }
        
        $status = validateInput($input['status']);
        
        // Validar status
        $validStatuses = ['em_atendimento', 'aguardando_pagamento', 'pedido_feito', 'cancelado', 'coletado', 'pronto', 'finalizado'];
        if (!in_array($status, $validStatuses)) {
            jsonResponse(['error' => 'Status inválido'], 400);
        }
        
        try {
            $stmt = $pdo->prepare("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $id]);
            
            if ($stmt->rowCount() > 0) {
                // Buscar pedido atualizado
                $stmt = $pdo->prepare("
                    SELECT o.*, c.name as customer_name, c.phone as customer_phone
                    FROM orders o
                    LEFT JOIN customers c ON o.customer_id = c.id
                    WHERE o.id = ?
                ");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                
                // Buscar itens do pedido
                $stmt = $pdo->prepare("
                    SELECT oi.*, p.name as product_name, p.price as product_price
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                ");
                $stmt->execute([$id]);
                $order['items'] = $stmt->fetchAll();
                
                logActivity('atualizar_status_pedido', [
                    'order_id' => $id,
                    'old_status' => $order['status'],
                    'new_status' => $status
                ]);
                
                jsonResponse($order);
            } else {
                jsonResponse(['error' => 'Pedido não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao atualizar pedido: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        // Excluir pedido
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do pedido é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        
        try {
            $pdo->beginTransaction();
            
            // Excluir itens do pedido
            $stmt = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
            $stmt->execute([$id]);
            
            // Excluir pedido
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                $pdo->commit();
                logActivity('excluir_pedido', ['order_id' => $id]);
                jsonResponse(['message' => 'Pedido excluído com sucesso']);
            } else {
                $pdo->rollBack();
                jsonResponse(['error' => 'Pedido não encontrado'], 404);
            }
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Erro ao excluir pedido: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>