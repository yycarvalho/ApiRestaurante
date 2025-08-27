<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'GET':
        // Listar produtos ou buscar produto específico
        if (isset($_GET['id'])) {
            $id = validateInput($_GET['id']);
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch();
            
            if ($product) {
                jsonResponse($product);
            } else {
                jsonResponse(['error' => 'Produto não encontrado'], 404);
            }
        } else {
            // Listar todos os produtos
            $stmt = $pdo->query("SELECT * FROM products ORDER BY name");
            $products = $stmt->fetchAll();
            jsonResponse($products);
        }
        break;
        
    case 'POST':
        // Criar novo produto
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['price']) || !isset($input['description']) || !isset($input['category'])) {
            jsonResponse(['error' => 'Nome, preço, descrição e categoria são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $price = floatval($input['price']);
        $description = validateInput($input['description']);
        $category = validateInput($input['category']);
        $active = isset($input['active']) ? (bool)$input['active'] : true;
        
        if ($price <= 0) {
            jsonResponse(['error' => 'Preço deve ser maior que zero'], 400);
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, price, description, category, active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $price, $description, $category, $active]);
            
            $productId = $pdo->lastInsertId();
            
            // Buscar produto criado
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            logActivity('criar_produto', [
                'product_id' => $productId,
                'name' => $name,
                'price' => $price,
                'category' => $category
            ]);
            
            jsonResponse($product, 201);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao criar produto: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        // Atualizar produto
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do produto é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['price']) || !isset($input['description']) || !isset($input['category'])) {
            jsonResponse(['error' => 'Nome, preço, descrição e categoria são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $price = floatval($input['price']);
        $description = validateInput($input['description']);
        $category = validateInput($input['category']);
        $active = isset($input['active']) ? (bool)$input['active'] : true;
        
        if ($price <= 0) {
            jsonResponse(['error' => 'Preço deve ser maior que zero'], 400);
        }
        
        try {
            $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, description = ?, category = ?, active = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $price, $description, $category, $active, $id]);
            
            if ($stmt->rowCount() > 0) {
                // Buscar produto atualizado
                $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
                $stmt->execute([$id]);
                $product = $stmt->fetch();
                
                logActivity('atualizar_produto', [
                    'product_id' => $id,
                    'name' => $name,
                    'price' => $price,
                    'category' => $category,
                    'active' => $active
                ]);
                
                jsonResponse($product);
            } else {
                jsonResponse(['error' => 'Produto não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao atualizar produto: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        // Excluir produto
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do produto é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        
        try {
            // Verificar se produto tem pedidos
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                jsonResponse(['error' => 'Não é possível excluir produto com pedidos'], 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                logActivity('excluir_produto', ['product_id' => $id]);
                jsonResponse(['message' => 'Produto excluído com sucesso']);
            } else {
                jsonResponse(['error' => 'Produto não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao excluir produto: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>