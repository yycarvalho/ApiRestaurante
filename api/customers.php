<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'GET':
        // Listar clientes ou buscar cliente específico
        if (isset($_GET['id'])) {
            $id = validateInput($_GET['id']);
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
            $stmt->execute([$id]);
            $customer = $stmt->fetch();
            
            if ($customer) {
                jsonResponse($customer);
            } else {
                jsonResponse(['error' => 'Cliente não encontrado'], 404);
            }
        } else {
            // Listar todos os clientes
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY name");
            $customers = $stmt->fetchAll();
            jsonResponse($customers);
        }
        break;
        
    case 'POST':
        // Criar novo cliente
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['phone'])) {
            jsonResponse(['error' => 'Nome e telefone são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $phone = validateInput($input['phone']);
        
        // Verificar se telefone já existe
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Telefone já cadastrado'], 409);
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO customers (name, phone) VALUES (?, ?)");
            $stmt->execute([$name, $phone]);
            
            $customerId = $pdo->lastInsertId();
            
            // Buscar cliente criado
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch();
            
            logActivity('criar_cliente', ['customer_id' => $customerId, 'name' => $name, 'phone' => $phone]);
            
            jsonResponse($customer, 201);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao criar cliente: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        // Atualizar cliente
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do cliente é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['phone'])) {
            jsonResponse(['error' => 'Nome e telefone são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $phone = validateInput($input['phone']);
        
        // Verificar se telefone já existe em outro cliente
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE phone = ? AND id != ?");
        $stmt->execute([$phone, $id]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Telefone já cadastrado para outro cliente'], 409);
        }
        
        try {
            $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $phone, $id]);
            
            if ($stmt->rowCount() > 0) {
                // Buscar cliente atualizado
                $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
                $stmt->execute([$id]);
                $customer = $stmt->fetch();
                
                logActivity('atualizar_cliente', ['customer_id' => $id, 'name' => $name, 'phone' => $phone]);
                
                jsonResponse($customer);
            } else {
                jsonResponse(['error' => 'Cliente não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao atualizar cliente: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        // Excluir cliente
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do cliente é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        
        try {
            // Verificar se cliente tem pedidos
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE customer_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                jsonResponse(['error' => 'Não é possível excluir cliente com pedidos'], 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                logActivity('excluir_cliente', ['customer_id' => $id]);
                jsonResponse(['message' => 'Cliente excluído com sucesso']);
            } else {
                jsonResponse(['error' => 'Cliente não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao excluir cliente: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>