package com.sistema.pedidos.service;

import com.sistema.pedidos.dao.OrdersDao;
import com.sistema.pedidos.config.DatabaseConfig;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Order.OrderItem;
import com.sistema.pedidos.model.Order.ChatMessage;
import com.sistema.pedidos.model.Product;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de pedidos - Refatorado para usar DAO
 */
public class OrderService {
    
    private final OrdersDao ordersDao;
    private final ProductService productService;

    public OrderService(ProductService productService) {
        this.productService = productService;
        this.ordersDao = new OrdersDao(DatabaseConfig.getDataSource());
    }

    /**
     * Busca pedidos com paginação e filtros
     */
    public Map<String, Object> findOrders(LocalDate start, LocalDate end, String status, int page, int size) {
        try {
            long totalItems = ordersDao.countOrders(start, end, status);
            List<Order> orders = ordersDao.findOrders(start, end, status, page, size);
            
            int totalPages = (int) Math.ceil((double) totalItems / size);
            
            Map<String, Object> result = new HashMap<>();
            result.put("data", orders);
            
            Map<String, Object> meta = new HashMap<>();
            meta.put("totalItems", totalItems);
            meta.put("totalPages", totalPages);
            meta.put("page", page);
            meta.put("size", size);
            result.put("meta", meta);
            
            return result;
            
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedidos: " + e.getMessage(), e);
        }
    }

    /**
     * Busca todos os pedidos (mantido para compatibilidade)
     */
    public List<Order> findAll() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        
        try {
            return ordersDao.findOrders(thirtyDaysAgo, today, null, 1, 1000);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedidos: " + e.getMessage(), e);
        }
    }

    /**
     * Busca pedido por ID
     */
    public Order findById(String id) {
        try {
            return ordersDao.findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedido: " + e.getMessage(), e);
        }
    }

    /**
     * Busca pedidos por status (agora usa DAO)
     */
    public List<Order> findByStatus(String status) {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        
        try {
            return ordersDao.findOrders(thirtyDaysAgo, today, status, 1, 1000);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedidos por status: " + e.getMessage(), e);
        }
    }

    /**
     * Busca pedidos por período (agora usa DAO)
     */
    public List<Order> findByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            return ordersDao.findOrders(startDate, endDate, null, 1, 1000);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedidos por período: " + e.getMessage(), e);
        }
    }
    
    /**
     * Busca pedidos por período (compatibilidade com LocalDateTime)
     */
    public List<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = endDate.toLocalDate();
        return findByDateRange(startLocalDate, endLocalDate);
    }

    /**
     * Cria um novo pedido (agora usa DAO)
     */
    public Order create(Order order) {
        // Validar dados
        validateOrder(order);

        // Configurar pedido
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setStatus("em_atendimento");

        // Validar e calcular itens
        if (order.getItems() != null) {
            validateOrderItems(order.getItems());
            order.calculateTotal();
        }

        // Inicializar chat
        if (order.getChat() == null) {
            order.setChat(new ArrayList<>());
        }

        try {
            String orderId = ordersDao.createOrder(order);
            return ordersDao.findById(orderId);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao criar pedido: " + e.getMessage(), e);
        }
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
        if (!"em_atendimento".equals(order.getStatus())) {
            throw new IllegalArgumentException("Só é possível excluir pedidos em atendimento");
        }

        try {
            return ordersDao.deleteOrder(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir pedido: " + e.getMessage(), e);
        }
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
        return Arrays.asList("em_atendimento", "aguardando_pagamento", "pedido_feito", "cancelado", "coletado", "pronto", "finalizado");
    }

    /**
     * Obtém tipos disponíveis
     */
    public List<String> getAvailableTypes() {
        return Arrays.asList("delivery", "pickup");
    }

    /**
     * Busca pedidos com filtros (removido - usar findOrders do DAO)
     */
    @Deprecated
    public List<Order> findWithFilters(String customer, String status, String type, 
                                     LocalDate startDate, LocalDate endDate) {
        // Este método foi deprecado - usar findOrders() com paginação
        try {
            return ordersDao.findOrders(startDate, endDate, status, 1, 1000);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar pedidos com filtros: " + e.getMessage(), e);
        }
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

