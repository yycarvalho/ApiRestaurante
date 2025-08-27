<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch ($method) {
    case 'GET':
        // Buscar métricas do dashboard
        try {
            // Total de pedidos por status
            $stmt = $pdo->query("
                SELECT status, COUNT(*) as count 
                FROM orders 
                GROUP BY status
            ");
            $ordersByStatus = $stmt->fetchAll();
            
            // Total de pedidos hoje
            $stmt = $pdo->query("
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE DATE(created_at) = CURDATE()
            ");
            $ordersToday = $stmt->fetch()->fetch()['count'];
            
            // Faturamento hoje
            $stmt = $pdo->query("
                SELECT COALESCE(SUM(total), 0) as total 
                FROM orders 
                WHERE DATE(created_at) = CURDATE() AND status != 'cancelado'
            ");
            $revenueToday = $stmt->fetch()->fetch()['total'];
            
            // Total de clientes
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM customers");
            $totalCustomers = $stmt->fetch()->fetch()['count'];
            
            // Total de produtos ativos
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM products WHERE active = 1");
            $activeProducts = $stmt->fetch()->fetch()['count'];
            
            // Pedidos recentes (últimos 10)
            $stmt = $pdo->query("
                SELECT o.*, c.name as customer_name 
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id 
                ORDER BY o.created_at DESC 
                LIMIT 10
            ");
            $recentOrders = $stmt->fetchAll();
            
            // Produtos mais vendidos
            $stmt = $pdo->query("
                SELECT p.name, SUM(oi.quantity) as total_sold 
                FROM order_items oi 
                LEFT JOIN products p ON oi.product_id = p.id 
                LEFT JOIN orders o ON oi.order_id = o.id 
                WHERE o.status != 'cancelado' 
                GROUP BY p.id, p.name 
                ORDER BY total_sold DESC 
                LIMIT 5
            ");
            $topProducts = $stmt->fetchAll();
            
            $metrics = [
                'ordersByStatus' => $ordersByStatus,
                'ordersToday' => $ordersToday,
                'revenueToday' => $revenueToday,
                'totalCustomers' => $totalCustomers,
                'activeProducts' => $activeProducts,
                'recentOrders' => $recentOrders,
                'topProducts' => $topProducts
            ];
            
            jsonResponse($metrics);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Erro ao buscar métricas: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Método não permitido'], 405);
        break;
}
?>