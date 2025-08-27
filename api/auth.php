<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'POST':
        // Login simples (simulado)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['username']) || !isset($input['password'])) {
            jsonResponse(['error' => 'Usuário e senha são obrigatórios'], 400);
        }
        
        $username = validateInput($input['username']);
        $password = validateInput($input['password']);
        
        // Usuários padrão (simulados)
        $defaultUsers = [
            'admin' => [
                'id' => 1,
                'username' => 'admin',
                'full_name' => 'Administrador',
                'profile_id' => 1,
                'profile_name' => 'Administrador',
                'permissions' => [
                    'verDashboard' => true,
                    'verPedidos' => true,
                    'verClientes' => true,
                    'verCardapio' => true,
                    'criarEditarProduto' => true,
                    'excluirProduto' => true,
                    'desativarProduto' => true,
                    'verChat' => true,
                    'enviarChat' => true,
                    'imprimirPedido' => true,
                    'acessarEndereco' => true,
                    'visualizarValorPedido' => true,
                    'acompanharEntregas' => true,
                    'gerarRelatorios' => true,
                    'gerenciarPerfis' => true,
                    'alterarStatusPedido' => true,
                    'selecionarStatusEspecifico' => true,
                    'criarUsuarios' => true,
                    'editarUsuarios' => true,
                    'excluirUsuarios' => true
                ]
            ],
            'atendente' => [
                'id' => 2,
                'username' => 'atendente',
                'full_name' => 'Atendente',
                'profile_id' => 2,
                'profile_name' => 'Atendente',
                'permissions' => [
                    'verDashboard' => true,
                    'verPedidos' => true,
                    'verClientes' => true,
                    'alterarStatusPedido' => true,
                    'verChat' => true,
                    'enviarChat' => true,
                    'imprimirPedido' => true,
                    'visualizarValorPedido' => true,
                    'acessarEndereco' => true,
                    'verCardapio' => true,
                    'criarEditarProduto' => false,
                    'excluirProduto' => false,
                    'desativarProduto' => false,
                    'gerarRelatorios' => false,
                    'gerenciarPerfis' => false,
                    'selecionarStatusEspecifico' => false,
                    'criarUsuarios' => false,
                    'editarUsuarios' => false,
                    'excluirUsuarios' => false
                ]
            ],
            'entregador' => [
                'id' => 3,
                'username' => 'entregador',
                'full_name' => 'Entregador',
                'profile_id' => 3,
                'profile_name' => 'Entregador',
                'permissions' => [
                    'verDashboard' => false,
                    'verPedidos' => true,
                    'verClientes' => false,
                    'alterarStatusPedido' => true,
                    'verChat' => false,
                    'enviarChat' => false,
                    'imprimirPedido' => false,
                    'visualizarValorPedido' => false,
                    'acessarEndereco' => true,
                    'verCardapio' => false,
                    'criarEditarProduto' => false,
                    'excluirProduto' => false,
                    'desativarProduto' => false,
                    'gerarRelatorios' => false,
                    'gerenciarPerfis' => false,
                    'selecionarStatusEspecifico' => false,
                    'criarUsuarios' => false,
                    'editarUsuarios' => false,
                    'excluirUsuarios' => false
                ]
            ]
        ];
        
        // Verificar credenciais
        if (isset($defaultUsers[$username]) && $password === '123') {
            $user = $defaultUsers[$username];
            
            // Gerar token simples (em produção, usar JWT)
            $token = base64_encode(json_encode([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'exp' => time() + (24 * 60 * 60) // 24 horas
            ]));
            
            logActivity('login', [
                'username' => $username,
                'user_id' => $user['id']
            ], $user['id']);
            
            jsonResponse([
                'token' => $token,
                'user' => $user
            ]);
        } else {
            jsonResponse(['error' => 'Usuário ou senha inválidos'], 401);
        }
        break;
        
    case 'GET':
        // Validar token
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
        }
        
        if (!$token) {
            jsonResponse(['error' => 'Token não fornecido'], 401);
        }
        
        try {
            $tokenData = json_decode(base64_decode($token), true);
            
            if (!$tokenData || !isset($tokenData['exp']) || $tokenData['exp'] < time()) {
                jsonResponse(['error' => 'Token expirado ou inválido'], 401);
            }
            
            jsonResponse(['valid' => true, 'user_id' => $tokenData['user_id']]);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Token inválido'], 401);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>