package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Order.OrderItem;
import com.sistema.pedidos.model.Order.ChatMessage;
import com.sistema.pedidos.model.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de pedidos
 */
public class OrderService {
    
    private final Map<String, Order> orders = new HashMap<>();
    private final ProductService productService;
    private int orderCounter = 1;

    public OrderService(ProductService productService) {
        this.productService = productService;
        initializeDefaultOrders();
    }

    /**
     * Inicializa pedidos padrão para demonstração
     */
    private void initializeDefaultOrders() {
        // Pedido 1 - Em atendimento
        createSampleOrder("João Silva", "(11) 99999-1234", "delivery", "atendimento",
                "Rua das Flores, 123 - Centro", Arrays.asList(
                        new OrderItem(1L, "X-Burger Clássico", 2, new BigDecimal("15.90")),
                        new OrderItem(5L, "Coca-Cola 350ml", 2, new BigDecimal("4.50"))
                ));

        // Pedido 2 - Em preparo
        createSampleOrder("Maria Santos", "(11) 99999-5678", "pickup", "preparo",
                null, Arrays.asList(
                        new OrderItem(2L, "X-Bacon", 1, new BigDecimal("18.90")),
                        new OrderItem(9L, "Batata Frita", 1, new BigDecimal("8.90"))
                ));

        // Pedido 3 - Pronto
        createSampleOrder("Pedro Costa", "(11) 99999-9012", "delivery", "pronto",
                "Av. Principal, 456 - Jardim", Arrays.asList(
                        new OrderItem(3L, "X-Tudo", 1, new BigDecimal("22.90")),
                        new OrderItem(6L, "Guaraná Antarctica 350ml", 1, new BigDecimal("4.50")),
                        new OrderItem(12L, "Milkshake de Chocolate", 1, new BigDecimal("8.90"))
                ));

        // Pedido 4 - Finalizado
        createSampleOrder("Ana Oliveira", "(11) 99999-3456", "pickup", "finalizado",
                null, Arrays.asList(
                        new OrderItem(4L, "X-Frango", 1, new BigDecimal("16.90")),
                        new OrderItem(8L, "Água Mineral 500ml", 1, new BigDecimal("3.00"))
                ));
    }

    /**
     * Método auxiliar para criar pedidos de exemplo
     */
    private void createSampleOrder(String customer, String phone, String type, String status,
                                 String address, List<OrderItem> items) {
        Order order = new Order(customer, phone, type);
        order.setId(generateOrderId());
        order.setStatus(status);
        order.setAddress(address);
        order.setItems(items);
        order.calculateTotal();
        
        // Adicionar algumas mensagens de chat para demonstração
        List<ChatMessage> chat = new ArrayList<>();
        if ("atendimento".equals(status)) {
            chat.add(new ChatMessage("Olá! Gostaria de fazer um pedido", "customer", 
                    LocalDateTime.now().minusMinutes(5)));
            chat.add(new ChatMessage("Olá! Claro, qual seria o seu pedido?", "system", 
                    LocalDateTime.now().minusMinutes(4)));
        }
        order.setChat(chat);
        
        orders.put(order.getId(), order);
    }

    /**
     * Gera um ID único para o pedido
     */
    private String generateOrderId() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return timestamp + String.format("%04d", orderCounter++);
    }

    /**
     * Busca todos os pedidos
     */
    public List<Order> findAll() {
        return new ArrayList<>(orders.values());
    }

    /**
     * Busca pedido por ID
     */
    public Order findById(String id) {
        return orders.get(id);
    }

    /**
     * Busca pedidos por status
     */
    public List<Order> findByStatus(String status) {
        return orders.values().stream()
                .filter(order -> order.getStatus().equals(status))
                .collect(Collectors.toList());
    }

    /**
     * Busca pedidos por tipo
     */
    public List<Order> findByType(String type) {
        return orders.values().stream()
                .filter(order -> order.getType().equals(type))
                .collect(Collectors.toList());
    }

    /**
     * Busca pedidos por cliente
     */
    public List<Order> findByCustomer(String customer) {
        return orders.values().stream()
                .filter(order -> order.getCustomer().toLowerCase().contains(customer.toLowerCase()))
                .collect(Collectors.toList());
    }

    /**
     * Busca pedidos por período
     */
    public List<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orders.values().stream()
                .filter(order -> order.getCreatedAt().isAfter(startDate) && 
                               order.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());
    }

    /**
     * Cria um novo pedido
     */
    public Order create(Order order) {
        // Validar dados
        validateOrder(order);

        // Gerar ID
        order.setId(generateOrderId());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setStatus("atendimento");

        // Validar e calcular itens
        if (order.getItems() != null) {
            validateOrderItems(order.getItems());
            order.calculateTotal();
        }

        // Inicializar chat
        if (order.getChat() == null) {
            order.setChat(new ArrayList<>());
        }

        orders.put(order.getId(), order);
        return order;
    }

    /**
     * Atualiza um pedido existente
     */
    public Order update(String id, Order updatedOrder) {
        Order existingOrder = findById(id);
        if (existingOrder == null) {
            throw new IllegalArgumentException("Pedido não encontrado");
        }

        // Atualizar campos permitidos
        if (updatedOrder.getCustomer() != null) {
            existingOrder.setCustomer(updatedOrder.getCustomer());
        }
        if (updatedOrder.getPhone() != null) {
            existingOrder.setPhone(updatedOrder.getPhone());
        }
        if (updatedOrder.getAddress() != null) {
            existingOrder.setAddress(updatedOrder.getAddress());
        }
        if (updatedOrder.getType() != null) {
            existingOrder.setType(updatedOrder.getType());
        }
        if (updatedOrder.getItems() != null) {
            validateOrderItems(updatedOrder.getItems());
            existingOrder.setItems(updatedOrder.getItems());
            existingOrder.calculateTotal();
        }

        existingOrder.setUpdatedAt(LocalDateTime.now());
        return existingOrder;
    }

    /**
     * Atualiza o status de um pedido
     */
    public Order updateStatus(String id, String newStatus) {
        Order order = findById(id);
        if (order == null) {
            throw new IllegalArgumentException("Pedido não encontrado");
        }

        if (!isValidStatus(newStatus)) {
            throw new IllegalArgumentException("Status inválido");
        }

        String oldStatus = order.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        // Adicionar mensagem automática no chat
        String message = String.format("Status alterado de '%s' para '%s'", 
                getStatusName(oldStatus), getStatusName(newStatus));
        addChatMessage(id, message, "system");

        return order;
    }

    /**
     * Adiciona mensagem ao chat do pedido
     */
    public Order addChatMessage(String orderId, String message, String sender) {
        Order order = findById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("Pedido não encontrado");
        }

        if (order.getChat() == null) {
            order.setChat(new ArrayList<>());
        }

        order.getChat().add(new ChatMessage(message, sender, LocalDateTime.now()));
        order.setUpdatedAt(LocalDateTime.now());

        return order;
    }

    /**
     * Remove um pedido
     */
    public boolean delete(String id) {
        Order order = findById(id);
        if (order == null) {
            return false;
        }

        // Só permitir exclusão de pedidos em atendimento
        if (!"atendimento".equals(order.getStatus())) {
            throw new IllegalArgumentException("Só é possível excluir pedidos em atendimento");
        }

        orders.remove(id);
        return true;
    }

    /**
     * Obtém estatísticas dos pedidos
     */
    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Order> allOrders = findAll();
        
        // Contagem por status
        Map<String, Long> ordersByStatus = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        
        // Contagem por tipo
        Map<String, Long> ordersByType = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getType, Collectors.counting()));
        
        // Valor total arrecadado
        BigDecimal totalRevenue = allOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Ticket médio
        OptionalDouble averageTicket = allOrders.stream()
                .filter(order -> "finalizado".equals(order.getStatus()))
                .mapToDouble(order -> order.getTotal().doubleValue())
                .average();
        
        // Pedidos de hoje
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        long ordersToday = allOrders.stream()
                .filter(order -> order.getCreatedAt().isAfter(startOfDay) && 
                               order.getCreatedAt().isBefore(endOfDay))
                .count();
        
        BigDecimal revenueToday = allOrders.stream()
                .filter(order -> order.getCreatedAt().isAfter(startOfDay) && 
                               order.getCreatedAt().isBefore(endOfDay) &&
                               "finalizado".equals(order.getStatus()))
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("totalOrders", allOrders.size());
        stats.put("ordersByStatus", ordersByStatus);
        stats.put("ordersByType", ordersByType);
        stats.put("totalRevenue", totalRevenue);
        stats.put("averageTicket", averageTicket.orElse(0.0));
        stats.put("ordersToday", ordersToday);
        stats.put("revenueToday", revenueToday);
        
        return stats;
    }

    /**
     * Obtém status disponíveis
     */
    public List<String> getAvailableStatuses() {
        return Arrays.asList("atendimento", "pagamento", "feito", "preparo", "pronto", "coletado", "finalizado");
    }

    /**
     * Obtém tipos disponíveis
     */
    public List<String> getAvailableTypes() {
        return Arrays.asList("delivery", "pickup");
    }

    /**
     * Busca pedidos com filtros
     */
    public List<Order> findWithFilters(String customer, String status, String type, 
                                     LocalDateTime startDate, LocalDateTime endDate) {
        return orders.values().stream()
                .filter(order -> {
                    if (customer != null && !order.getCustomer().toLowerCase().contains(customer.toLowerCase())) {
                        return false;
                    }
                    if (status != null && !order.getStatus().equals(status)) {
                        return false;
                    }
                    if (type != null && !order.getType().equals(type)) {
                        return false;
                    }
                    if (startDate != null && order.getCreatedAt().isBefore(startDate)) {
                        return false;
                    }
                    if (endDate != null && order.getCreatedAt().isAfter(endDate)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    /**
     * Valida os dados do pedido
     */
    private void validateOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Pedido não pode ser nulo");
        }
        
        if (order.getCustomer() == null || order.getCustomer().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do cliente é obrigatório");
        }
        
        if (order.getType() == null || !getAvailableTypes().contains(order.getType())) {
            throw new IllegalArgumentException("Tipo de pedido inválido");
        }
        
        if ("delivery".equals(order.getType()) && 
            (order.getAddress() == null || order.getAddress().trim().isEmpty())) {
            throw new IllegalArgumentException("Endereço é obrigatório para entrega");
        }
    }

    /**
     * Valida os itens do pedido
     */
    private void validateOrderItems(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Pedido deve ter pelo menos um item");
        }
        
        for (OrderItem item : items) {
            if (item.getProductId() == null) {
                throw new IllegalArgumentException("ID do produto é obrigatório");
            }
            
            Product product = productService.findById(item.getProductId());
            if (product == null) {
                throw new IllegalArgumentException("Produto não encontrado: " + item.getProductId());
            }
            
            if (!product.isActive()) {
                throw new IllegalArgumentException("Produto inativo: " + product.getName());
            }
            
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantidade deve ser maior que zero");
            }
            
            // Definir nome e preço do produto no item
            item.setProductName(product.getName());
            item.setPrice(product.getPrice());
        }
    }

    /**
     * Verifica se o status é válido
     */
    private boolean isValidStatus(String status) {
        return getAvailableStatuses().contains(status);
    }

    /**
     * Obtém o nome amigável do status
     */
    private String getStatusName(String status) {
        Map<String, String> statusNames = new HashMap<>();
        statusNames.put("atendimento", "Em Atendimento");
        statusNames.put("pagamento", "Aguardando Pagamento");
        statusNames.put("feito", "Pedido Feito");
        statusNames.put("preparo", "Em Preparo");
        statusNames.put("pronto", "Pronto");
        statusNames.put("coletado", "Coletado");
        statusNames.put("finalizado", "Finalizado");
        
        return statusNames.getOrDefault(status, status);
    }
}

