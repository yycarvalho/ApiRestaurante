<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

// Verificar se customer_id foi fornecido
if (!isset($_GET['customer_id'])) {
    jsonResponse(['error' => 'ID do cliente é obrigatório'], 400);
}

$customerId = validateInput($_GET['customer_id']);

switch ($method) {
    case 'GET':
        // Buscar mensagens do cliente
        try {
            $stmt = $pdo->prepare("
                SELECT cm.*, u.full_name as user_name 
                FROM customer_messages cm 
                LEFT JOIN users u ON cm.user_id = u.id 
                WHERE cm.customer_id = ? 
                ORDER BY cm.created_at ASC
            ");
            $stmt->execute([$customerId]);
            $messages = $stmt->fetchAll();
            
            jsonResponse($messages);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao buscar mensagens: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        // Enviar mensagem para o cliente
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['message']) || !isset($input['direction'])) {
            jsonResponse(['error' => 'Mensagem e direção são obrigatórios'], 400);
        }
        
        $message = validateInput($input['message']);
        $direction = validateInput($input['direction']);
        $channel = isset($input['channel']) ? validateInput($input['channel']) : 'chat';
        $userId = isset($input['user_id']) ? validateInput($input['user_id']) : null;
        
        // Validar direção
        if (!in_array($direction, ['inbound', 'outbound'])) {
            jsonResponse(['error' => 'Direção deve ser inbound ou outbound'], 400);
        }
        
        // Verificar se cliente existe
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Cliente não encontrado'], 404);
        }
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO customer_messages (customer_id, direction, channel, message, user_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$customerId, $direction, $channel, $message, $userId]);
            
            $messageId = $pdo->lastInsertId();
            
            // Buscar mensagem criada
            $stmt = $pdo->prepare("
                SELECT cm.*, u.full_name as user_name 
                FROM customer_messages cm 
                LEFT JOIN users u ON cm.user_id = u.id 
                WHERE cm.id = ?
            ");
            $stmt->execute([$messageId]);
            $newMessage = $stmt->fetch();
            
            logActivity('enviar_mensagem_cliente', [
                'customer_id' => $customerId,
                'message_id' => $messageId,
                'direction' => $direction,
                'message' => $message
            ], $userId);
            
            jsonResponse($newMessage, 201);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao enviar mensagem: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>