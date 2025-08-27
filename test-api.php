<?php
// Script de teste para verificar se a API está funcionando
echo "=== Teste da API do Sistema de Pedidos ===\n\n";

// Configurações
$baseUrl = 'http://localhost/api'; // Ajuste conforme necessário
$testData = [
    'customers' => [
        'name' => 'Teste Cliente',
        'phone' => '(11) 99999-9999'
    ],
    'products' => [
        'name' => 'Produto Teste',
        'price' => 15.90,
        'description' => 'Descrição do produto teste',
        'category' => 'lanches',
        'active' => true
    ]
];

// Função para fazer requisições
function makeRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// Teste 1: Verificar se o servidor está rodando
echo "1. Testando conexão com o servidor...\n";
$result = makeRequest($baseUrl . '/customers.php');
if ($result['code'] == 200) {
    echo "✅ Servidor funcionando!\n";
} else {
    echo "❌ Erro: " . $result['code'] . "\n";
    exit(1);
}

// Teste 2: Listar clientes
echo "\n2. Testando listagem de clientes...\n";
$result = makeRequest($baseUrl . '/customers.php');
if ($result['code'] == 200) {
    echo "✅ Clientes listados com sucesso! (" . count($result['response']) . " clientes)\n";
} else {
    echo "❌ Erro ao listar clientes: " . $result['code'] . "\n";
}

// Teste 3: Criar cliente
echo "\n3. Testando criação de cliente...\n";
$result = makeRequest($baseUrl . '/customers.php', 'POST', $testData['customers']);
if ($result['code'] == 201) {
    echo "✅ Cliente criado com sucesso!\n";
    $customerId = $result['response']['id'];
} else {
    echo "❌ Erro ao criar cliente: " . $result['code'] . " - " . ($result['response']['error'] ?? 'Erro desconhecido') . "\n";
}

// Teste 4: Listar produtos
echo "\n4. Testando listagem de produtos...\n";
$result = makeRequest($baseUrl . '/products.php');
if ($result['code'] == 200) {
    echo "✅ Produtos listados com sucesso! (" . count($result['response']) . " produtos)\n";
} else {
    echo "❌ Erro ao listar produtos: " . $result['code'] . "\n";
}

// Teste 5: Criar produto
echo "\n5. Testando criação de produto...\n";
$result = makeRequest($baseUrl . '/products.php', 'POST', $testData['products']);
if ($result['code'] == 201) {
    echo "✅ Produto criado com sucesso!\n";
    $productId = $result['response']['id'];
} else {
    echo "❌ Erro ao criar produto: " . $result['code'] . " - " . ($result['response']['error'] ?? 'Erro desconhecido') . "\n";
}

// Teste 6: Listar pedidos
echo "\n6. Testando listagem de pedidos...\n";
$result = makeRequest($baseUrl . '/orders.php');
if ($result['code'] == 200) {
    echo "✅ Pedidos listados com sucesso! (" . count($result['response']) . " pedidos)\n";
} else {
    echo "❌ Erro ao listar pedidos: " . $result['code'] . "\n";
}

// Teste 7: Métricas
echo "\n7. Testando métricas...\n";
$result = makeRequest($baseUrl . '/metrics.php');
if ($result['code'] == 200) {
    echo "✅ Métricas carregadas com sucesso!\n";
    echo "   - Pedidos hoje: " . $result['response']['ordersToday'] . "\n";
    echo "   - Faturamento hoje: R$ " . number_format($result['response']['revenueToday'], 2, ',', '.') . "\n";
    echo "   - Total de clientes: " . $result['response']['totalCustomers'] . "\n";
    echo "   - Produtos ativos: " . $result['response']['activeProducts'] . "\n";
} else {
    echo "❌ Erro ao carregar métricas: " . $result['code'] . "\n";
}

// Teste 8: Autenticação
echo "\n8. Testando autenticação...\n";
$loginData = [
    'username' => 'admin',
    'password' => '123'
];
$result = makeRequest($baseUrl . '/auth.php', 'POST', $loginData);
if ($result['code'] == 200) {
    echo "✅ Login realizado com sucesso!\n";
    echo "   - Usuário: " . $result['response']['user']['full_name'] . "\n";
    echo "   - Perfil: " . $result['response']['user']['profile_name'] . "\n";
} else {
    echo "❌ Erro no login: " . $result['code'] . " - " . ($result['response']['error'] ?? 'Erro desconhecido') . "\n";
}

echo "\n=== Teste concluído! ===\n";
echo "Se todos os testes passaram, a API está funcionando corretamente.\n";
echo "Agora você pode usar o sistema no navegador.\n";
?>