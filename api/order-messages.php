<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

// Verificar se order_id foi fornecido
if (!isset($_GET['order_id'])) {
    jsonResponse(['error' => 'ID do pedido é obrigatório'], 400);
}

$orderId = validateInput($_GET['order_id']);

switch ($method) {
    case 'GET':
        // Buscar mensagens do pedido
        try {
            $stmt = $pdo->prepare("
                SELECT ocm.*, u.full_name as user_name 
                FROM order_chat_messages ocm 
                LEFT JOIN users u ON ocm.user_id = u.id 
                WHERE ocm.order_id = ? 
                ORDER BY ocm.created_at ASC
            ");
            $stmt->execute([$orderId]);
            $messages = $stmt->fetchAll();
            
            jsonResponse($messages);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao buscar mensagens: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        // Enviar mensagem para o pedido
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['message']) || !isset($input['sender'])) {
            jsonResponse(['error' => 'Mensagem e remetente são obrigatórios'], 400);
        }
        
        $message = validateInput($input['message']);
        $sender = validateInput($input['sender']);
        $userId = isset($input['user_id']) ? validateInput($input['user_id']) : null;
        
        // Validar sender
        if (!in_array($sender, ['customer', 'system', 'user'])) {
            jsonResponse(['error' => 'Remetente deve ser customer, system ou user'], 400);
        }
        
        // Verificar se pedido existe
        $stmt = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Pedido não encontrado'], 404);
        }
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO order_chat_messages (order_id, sender, message, user_id, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$orderId, $sender, $message, $userId]);
            
            $messageId = $pdo->lastInsertId();
            
            // Buscar mensagem criada
            $stmt = $pdo->prepare("
                SELECT ocm.*, u.full_name as user_name 
                FROM order_chat_messages ocm 
                LEFT JOIN users u ON ocm.user_id = u.id 
                WHERE ocm.id = ?
            ");
            $stmt->execute([$messageId]);
            $newMessage = $stmt->fetch();
            
            logActivity('enviar_mensagem_pedido', [
                'order_id' => $orderId,
                'message_id' => $messageId,
                'sender' => $sender,
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