package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de métricas e relatórios
 */
public class MetricsService {
    
    private final OrderService orderService;
    private final ProductService productService;

    public MetricsService(OrderService orderService, ProductService productService) {
        this.orderService = orderService;
        this.productService = productService;
    }

    /**
     * Obtém métricas do dashboard
     */
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        List<Order> allOrders = orderService.findAll();
        LocalDateTime today = LocalDateTime.now();
        LocalDateTime startOfDay = today.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = today.withHour(23).withMinute(59).withSecond(59);
        
        // Pedidos de hoje
        List<Order> ordersToday = allOrders.stream()
                .filter(order -> order.getCreatedAt().isAfter(startOfDay) && 
                               order.getCreatedAt().isBefore(endOfDay))
                .collect(Collectors.toList());
        
        // Valor total arrecadado hoje
        BigDecimal valorTotalArrecadado = ordersToday.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Pedidos por status
        Map<String, Long> pedidosPorStatus = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        
        // Faturamento mensal (últimos 6 meses)
        List<BigDecimal> faturamentoMensal = calculateMonthlyRevenue(6);
        
        metrics.put("totalPedidosHoje", ordersToday.size());
        metrics.put("valorTotalArrecadado", valorTotalArrecadado);
        metrics.put("pedidosPorStatus", pedidosPorStatus);
        metrics.put("faturamentoMensal", faturamentoMensal);
        
        return metrics;
    }

    /**
     * Obtém relatórios detalhados
     */
    public Map<String, Object> getReports(String period) {
        Map<String, Object> reports = new HashMap<>();
        
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = calculateStartDate(period, endDate);
        
        List<Order> ordersInPeriod = orderService.findByDateRange(startDate, endDate);
        List<Order> finishedOrders = ordersInPeriod.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .collect(Collectors.toList());
        
        // Métricas básicas
        reports.put("totalPedidos", ordersInPeriod.size());
        reports.put("faturamentoTotal", calculateTotalRevenue(finishedOrders));
        reports.put("ticketMedio", calculateAverageTicket(finishedOrders));
        reports.put("taxaConversao", calculateConversionRate(ordersInPeriod));
        
        // Comparação com período anterior
        LocalDateTime previousEndDate = startDate.minusDays(1);
        LocalDateTime previousStartDate = calculateStartDate(period, previousEndDate);
        List<Order> previousOrders = orderService.findByDateRange(previousStartDate, previousEndDate);
        
        reports.put("pedidosChange", calculatePercentageChange(ordersInPeriod.size(), previousOrders.size()));
        reports.put("faturamentoChange", calculateRevenueChange(finishedOrders, previousOrders));
        reports.put("ticketMedioChange", calculateTicketChange(finishedOrders, previousOrders));
        reports.put("conversaoChange", calculateConversionChange(ordersInPeriod, previousOrders));
        
        // Dados para gráficos
        reports.put("vendasPorPeriodo", generateSalesChart(period, startDate, endDate));
        reports.put("produtosMaisVendidos", getMostSoldProducts(finishedOrders));
        reports.put("horariosPico", getPeakHours(ordersInPeriod));
        reports.put("tiposPedido", getOrderTypes(ordersInPeriod));
        
        // Tabelas detalhadas
        reports.put("topProdutos", getTopProductsTable(finishedOrders));
        reports.put("resumoPorCategoria", getCategorySummary(finishedOrders));
        
        return reports;
    }

    /**
     * Calcula faturamento mensal
     */
    private List<BigDecimal> calculateMonthlyRevenue(int months) {
        List<BigDecimal> revenue = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1)
                    .withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusDays(1)
                    .withHour(23).withMinute(59).withSecond(59);
            
            List<Order> monthOrders = orderService.findByDateRange(monthStart, monthEnd);
            BigDecimal monthRevenue = monthOrders.stream()
                    .filter(order -> "finalizado".equals(order.getStatus()))
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            revenue.add(monthRevenue);
        }
        
        return revenue;
    }

    /**
     * Calcula data de início baseada no período
     */
    private LocalDateTime calculateStartDate(String period, LocalDateTime endDate) {
        switch (period) {
            case "week":
                return endDate.minusWeeks(1);
            case "month":
                return endDate.minusMonths(1);
            case "quarter":
                return endDate.minusMonths(3);
            case "year":
                return endDate.minusYears(1);
            default:
                return endDate.minusMonths(1);
        }
    }

    /**
     * Calcula faturamento total
     */
    private BigDecimal calculateTotalRevenue(List<Order> orders) {
        return orders.stream()
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula ticket médio
     */
    private BigDecimal calculateAverageTicket(List<Order> orders) {
        if (orders.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal total = calculateTotalRevenue(orders);
        return total.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula taxa de conversão
     */
    private double calculateConversionRate(List<Order> orders) {
        if (orders.isEmpty()) {
            return 0.0;
        }
        
        long finishedOrders = orders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .count();
        
        return (double) finishedOrders / orders.size() * 100;
    }

    /**
     * Calcula mudança percentual
     */
    private double calculatePercentageChange(int current, int previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        
        return ((double) (current - previous) / previous) * 100;
    }

    /**
     * Calcula mudança no faturamento
     */
    private double calculateRevenueChange(List<Order> currentOrders, List<Order> previousOrders) {
        BigDecimal currentRevenue = calculateTotalRevenue(currentOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .collect(Collectors.toList()));
        
        BigDecimal previousRevenue = calculateTotalRevenue(previousOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .collect(Collectors.toList()));
        
        if (previousRevenue.equals(BigDecimal.ZERO)) {
            return currentRevenue.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        
        return currentRevenue.subtract(previousRevenue)
                .divide(previousRevenue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    /**
     * Calcula mudança no ticket médio
     */
    private double calculateTicketChange(List<Order> currentOrders, List<Order> previousOrders) {
        List<Order> currentFinished = currentOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .collect(Collectors.toList());
        
        List<Order> previousFinished = previousOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .collect(Collectors.toList());
        
        BigDecimal currentTicket = calculateAverageTicket(currentFinished);
        BigDecimal previousTicket = calculateAverageTicket(previousFinished);
        
        if (previousTicket.equals(BigDecimal.ZERO)) {
            return currentTicket.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        
        return currentTicket.subtract(previousTicket)
                .divide(previousTicket, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    /**
     * Calcula mudança na conversão
     */
    private double calculateConversionChange(List<Order> currentOrders, List<Order> previousOrders) {
        double currentConversion = calculateConversionRate(currentOrders);
        double previousConversion = calculateConversionRate(previousOrders);
        
        if (previousConversion == 0) {
            return currentConversion > 0 ? 100.0 : 0.0;
        }
        
        return ((currentConversion - previousConversion) / previousConversion) * 100;
    }

    /**
     * Gera dados para gráfico de vendas
     */
    private Map<String, Object> generateSalesChart(String period, LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<BigDecimal> values = new ArrayList<>();
        
        // Gerar pontos de dados baseado no período
        int points = period.equals("week") ? 7 : period.equals("month") ? 30 : 12;
        
        for (int i = 0; i < points; i++) {
            LocalDateTime pointStart, pointEnd;
            String label;
            
            if (period.equals("week")) {
                pointStart = startDate.plusDays(i);
                pointEnd = pointStart.plusDays(1);
                label = pointStart.format(DateTimeFormatter.ofPattern("dd/MM"));
            } else if (period.equals("month")) {
                pointStart = startDate.plusDays(i);
                pointEnd = pointStart.plusDays(1);
                label = pointStart.format(DateTimeFormatter.ofPattern("dd/MM"));
            } else {
                pointStart = startDate.plusMonths(i);
                pointEnd = pointStart.plusMonths(1);
                label = pointStart.format(DateTimeFormatter.ofPattern("MMM"));
            }
            
            List<Order> periodOrders = orderService.findByDateRange(pointStart, pointEnd);
            BigDecimal periodRevenue = periodOrders.stream()
                    .filter(order -> "finalizado".equals(order.getStatus()))
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            labels.add(label);
            values.add(periodRevenue);
        }
        
        chartData.put("labels", labels);
        chartData.put("values", values);
        
        return chartData;
    }

    /**
     * Obtém produtos mais vendidos
     */
    private Map<String, Object> getMostSoldProducts(List<Order> orders) {
        Map<Long, Integer> productQuantities = new HashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        
        // Contar quantidades vendidas
        for (Order order : orders) {
            if (order.getItems() != null) {
                for (Order.OrderItem item : order.getItems()) {
                    productQuantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
                    productNames.put(item.getProductId(), item.getProductName());
                }
            }
        }
        
        // Ordenar por quantidade e pegar top 5
        List<Map.Entry<Long, Integer>> sortedProducts = productQuantities.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toList());
        
        List<String> labels = new ArrayList<>();
        List<Integer> values = new ArrayList<>();
        
        for (Map.Entry<Long, Integer> entry : sortedProducts) {
            labels.add(productNames.get(entry.getKey()));
            values.add(entry.getValue());
        }
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("values", values);
        
        return chartData;
    }

    /**
     * Obtém horários de pico
     */
    private Map<String, Object> getPeakHours(List<Order> orders) {
        Map<Integer, Long> hourCounts = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().getHour(),
                        Collectors.counting()
                ));
        
        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();
        
        for (int hour = 0; hour < 24; hour++) {
            labels.add(String.format("%02d:00", hour));
            values.add(hourCounts.getOrDefault(hour, 0L));
        }
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("values", values);
        
        return chartData;
    }

    /**
     * Obtém tipos de pedido
     */
    private Map<String, Object> getOrderTypes(List<Order> orders) {
        Map<String, Long> typeCounts = orders.stream()
                .collect(Collectors.groupingBy(Order::getType, Collectors.counting()));
        
        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();
        
        for (Map.Entry<String, Long> entry : typeCounts.entrySet()) {
            String typeName = "delivery".equals(entry.getKey()) ? "Entrega" : "Retirada";
            labels.add(typeName);
            values.add(entry.getValue());
        }
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("values", values);
        
        return chartData;
    }

    /**
     * Obtém tabela de top produtos
     */
    private List<Map<String, Object>> getTopProductsTable(List<Order> orders) {
        Map<Long, Integer> productQuantities = new HashMap<>();
        Map<Long, BigDecimal> productRevenues = new HashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        
        // Calcular dados dos produtos
        for (Order order : orders) {
            if (order.getItems() != null) {
                for (Order.OrderItem item : order.getItems()) {
                    productQuantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
                    
                    BigDecimal itemRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    productRevenues.merge(item.getProductId(), itemRevenue, BigDecimal::add);
                    
                    productNames.put(item.getProductId(), item.getProductName());
                }
            }
        }
        
        BigDecimal totalRevenue = productRevenues.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Criar lista ordenada
        return productRevenues.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Map<String, Object> product = new HashMap<>();
                    Long productId = entry.getKey();
                    BigDecimal revenue = entry.getValue();
                    
                    product.put("nome", productNames.get(productId));
                    product.put("quantidade", productQuantities.get(productId));
                    product.put("faturamento", revenue);
                    
                    double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0 ?
                            revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100)).doubleValue() : 0.0;
                    product.put("percentual", percentage);
                    
                    return product;
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtém resumo por categoria
     */
    private List<Map<String, Object>> getCategorySummary(List<Order> orders) {
        Map<String, Integer> categoryOrders = new HashMap<>();
        Map<String, BigDecimal> categoryRevenues = new HashMap<>();
        
        // Mapear produtos por categoria
        Map<Long, String> productCategories = new HashMap<>();
        for (Product product : productService.findAll()) {
            productCategories.put(product.getId(), product.getCategory());
        }
        
        // Calcular dados por categoria
        for (Order order : orders) {
            if (order.getItems() != null) {
                Set<String> orderCategories = new HashSet<>();
                
                for (Order.OrderItem item : order.getItems()) {
                    String category = productCategories.get(item.getProductId());
                    if (category != null) {
                        orderCategories.add(category);
                        
                        BigDecimal itemRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                        categoryRevenues.merge(category, itemRevenue, BigDecimal::add);
                    }
                }
                
                // Contar pedido para cada categoria presente
                for (String category : orderCategories) {
                    categoryOrders.merge(category, 1, Integer::sum);
                }
            }
        }
        
        // Criar lista de resumo
        return categoryRevenues.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> summary = new HashMap<>();
                    String category = entry.getKey();
                    BigDecimal revenue = entry.getValue();
                    int orderCount = categoryOrders.getOrDefault(category, 0);
                    
                    summary.put("categoria", getCategoryName(category));
                    summary.put("pedidos", orderCount);
                    summary.put("faturamento", revenue);
                    
                    BigDecimal ticketMedio = orderCount > 0 ?
                            revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP) :
                            BigDecimal.ZERO;
                    summary.put("ticketMedio", ticketMedio);
                    
                    return summary;
                })
                .sorted((s1, s2) -> ((BigDecimal) s2.get("faturamento"))
                        .compareTo((BigDecimal) s1.get("faturamento")))
                .collect(Collectors.toList());
    }

    /**
     * Obtém nome amigável da categoria
     */
    private String getCategoryName(String category) {
        Map<String, String> categoryNames = new HashMap<>();
        categoryNames.put("lanches", "Lanches");
        categoryNames.put("bebidas", "Bebidas");
        categoryNames.put("acompanhamentos", "Acompanhamentos");
        categoryNames.put("sobremesas", "Sobremesas");
        
        return categoryNames.getOrDefault(category, category);
    }
}

