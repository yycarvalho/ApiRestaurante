<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'GET':
        // Listar perfis ou buscar perfil específico
        if (isset($_GET['id'])) {
            $id = validateInput($_GET['id']);
            $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = ?");
            $stmt->execute([$id]);
            $profile = $stmt->fetch();
            
            if ($profile) {
                // Converter JSON de permissões
                $profile['permissions'] = json_decode($profile['permissions'], true);
                jsonResponse($profile);
            } else {
                jsonResponse(['error' => 'Perfil não encontrado'], 404);
            }
        } else {
            // Listar todos os perfis
            $stmt = $pdo->query("SELECT * FROM profiles ORDER BY name");
            $profiles = $stmt->fetchAll();
            
            // Converter JSON de permissões para cada perfil
            foreach ($profiles as &$profile) {
                $profile['permissions'] = json_decode($profile['permissions'], true);
            }
            
            jsonResponse($profiles);
        }
        break;
        
    case 'POST':
        // Criar novo perfil
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['permissions'])) {
            jsonResponse(['error' => 'Nome e permissões são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $description = isset($input['description']) ? validateInput($input['description']) : null;
        $permissions = $input['permissions'];
        $defaultUsername = isset($input['default_username']) ? validateInput($input['default_username']) : null;
        
        // Verificar se nome já existe
        $stmt = $pdo->prepare("SELECT id FROM profiles WHERE name = ?");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Nome de perfil já existe'], 409);
        }
        
        try {
            $permissionsJson = json_encode($permissions);
            
            $stmt = $pdo->prepare("INSERT INTO profiles (name, description, permissions, default_username) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $description, $permissionsJson, $defaultUsername]);
            
            $profileId = $pdo->lastInsertId();
            
            // Buscar perfil criado
            $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = ?");
            $stmt->execute([$profileId]);
            $profile = $stmt->fetch();
            $profile['permissions'] = json_decode($profile['permissions'], true);
            
            logActivity('criar_perfil', [
                'profile_id' => $profileId,
                'name' => $name,
                'permissions_count' => count($permissions)
            ]);
            
            jsonResponse($profile, 201);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao criar perfil: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        // Atualizar perfil
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do perfil é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['permissions'])) {
            jsonResponse(['error' => 'Nome e permissões são obrigatórios'], 400);
        }
        
        $name = validateInput($input['name']);
        $description = isset($input['description']) ? validateInput($input['description']) : null;
        $permissions = $input['permissions'];
        $defaultUsername = isset($input['default_username']) ? validateInput($input['default_username']) : null;
        
        // Verificar se nome já existe em outro perfil
        $stmt = $pdo->prepare("SELECT id FROM profiles WHERE name = ? AND id != ?");
        $stmt->execute([$name, $id]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Nome de perfil já existe'], 409);
        }
        
        try {
            $permissionsJson = json_encode($permissions);
            
            $stmt = $pdo->prepare("UPDATE profiles SET name = ?, description = ?, permissions = ?, default_username = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $description, $permissionsJson, $defaultUsername, $id]);
            
            if ($stmt->rowCount() > 0) {
                // Buscar perfil atualizado
                $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = ?");
                $stmt->execute([$id]);
                $profile = $stmt->fetch();
                $profile['permissions'] = json_decode($profile['permissions'], true);
                
                logActivity('atualizar_perfil', [
                    'profile_id' => $id,
                    'name' => $name,
                    'permissions_count' => count($permissions)
                ]);
                
                jsonResponse($profile);
            } else {
                jsonResponse(['error' => 'Perfil não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao atualizar perfil: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        // Excluir perfil
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'ID do perfil é obrigatório'], 400);
        }
        
        $id = validateInput($_GET['id']);
        
        try {
            // Verificar se perfil tem usuários
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE profile_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                jsonResponse(['error' => 'Não é possível excluir perfil com usuários'], 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM profiles WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                logActivity('excluir_perfil', ['profile_id' => $id]);
                jsonResponse(['message' => 'Perfil excluído com sucesso']);
            } else {
                jsonResponse(['error' => 'Perfil não encontrado'], 404);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao excluir perfil: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>