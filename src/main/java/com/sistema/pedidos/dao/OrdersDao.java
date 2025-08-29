package com.sistema.pedidos.dao;

import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Order.OrderItem;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;

/**
 * DAO para operações de pedidos no banco de dados
 */
public class OrdersDao {
    
    private final DataSource dataSource;
    
    public OrdersDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    /**
     * Conta o total de pedidos no período especificado
     */
    public long countOrders(LocalDate start, LocalDate end, String status) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM orders WHERE created_at BETWEEN ? AND ?");
        if (status != null && !status.trim().isEmpty()) {
            sql.append(" AND status = ?");
        }
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            
            ps.setDate(1, Date.valueOf(start));
            ps.setDate(2, Date.valueOf(end));
            
            if (status != null && !status.trim().isEmpty()) {
                ps.setString(3, status);
            }
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
                return 0;
            }
        }
    }
    
    /**
     * Busca pedidos com paginação e filtros
     */
    public List<Order> findOrders(LocalDate start, LocalDate end, String status, int page, int size) throws SQLException {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT o.id, o.customer_id, o.total, o.status, o.type, o.address, o.created_at ");
        sql.append("FROM orders o ");
        sql.append("WHERE o.created_at BETWEEN ? AND ? ");
        
        if (status != null && !status.trim().isEmpty()) {
            sql.append("AND o.status = ? ");
        }
        
        sql.append("ORDER BY o.created_at DESC LIMIT ? OFFSET ?");
        
        int offset = (page - 1) * size;
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            
            int paramIndex = 1;
            ps.setDate(paramIndex++, Date.valueOf(start));
            ps.setDate(paramIndex++, Date.valueOf(end));
            
            if (status != null && !status.trim().isEmpty()) {
                ps.setString(paramIndex++, status);
            }
            
            ps.setInt(paramIndex++, size);
            ps.setInt(paramIndex, offset);
            
            List<Order> orders = new ArrayList<>();
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order order = mapResultSetToOrder(rs);
                    orders.add(order);
                }
            }
            
            return orders;
        }
    }
    
    /**
     * Busca pedido por ID
     */
    public Order findById(String orderId) throws SQLException {
        String sql = "SELECT o.id, o.customer_id, o.total, o.status, o.type, o.address, o.created_at " +
                    "FROM orders o WHERE o.id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setString(1, orderId);
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Order order = mapResultSetToOrder(rs);
                    loadOrderItems(order);
                    return order;
                }
                return null;
            }
        }
    }
    
    /**
     * Cria um novo pedido
     */
    public String createOrder(Order order) throws SQLException {
        String orderId = generateOrderId();
        order.setId(orderId);
        
        String sql = "INSERT INTO orders (id, customer_id, total, status, type, address) VALUES (?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setString(1, order.getId());
            ps.setInt(2, order.getCustomerId());
            ps.setBigDecimal(3, order.getTotal());
            ps.setString(4, order.getStatus());
            ps.setString(5, order.getType());
            ps.setString(6, order.getAddress());
            
            ps.executeUpdate();
            
            // Salvar itens do pedido
            if (order.getItems() != null) {
                saveOrderItems(order);
            }
            
            return orderId;
        }
    }
    
    /**
     * Exclui um pedido
     */
    public boolean deleteOrder(String orderId) throws SQLException {
        String sql = "DELETE FROM orders WHERE id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setString(1, orderId);
            
            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        }
    }
    
    // Métodos auxiliares privados
    
    private Order mapResultSetToOrder(ResultSet rs) throws SQLException {
        Order order = new Order();
        order.setId(rs.getString("id"));
        order.setCustomerId(rs.getInt("customer_id"));
        order.setTotal(rs.getBigDecimal("total"));
        order.setStatus(rs.getString("status"));
        order.setType(rs.getString("type"));
        order.setAddress(rs.getString("address"));
        order.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return order;
    }
    
    private void loadOrderItems(Order order) throws SQLException {
        String sql = "SELECT product_id, product_name, quantity, unit_price, total_price " +
                    "FROM order_items WHERE order_id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setString(1, order.getId());
            
            List<OrderItem> items = new ArrayList<>();
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderItem item = new OrderItem();
                    item.setProductId(rs.getLong("product_id"));
                    item.setProductName(rs.getString("product_name"));
                    item.setQuantity(rs.getInt("quantity"));
                    item.setUnitPrice(rs.getBigDecimal("unit_price"));
                    item.setTotalPrice(rs.getBigDecimal("total_price"));
                    items.add(item);
                }
            }
            
            order.setItems(items);
        }
    }
    
    private void saveOrderItems(Order order) throws SQLException {
        String sql = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) " +
                    "VALUES (?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            for (OrderItem item : order.getItems()) {
                ps.setString(1, order.getId());
                ps.setLong(2, item.getProductId());
                ps.setString(3, item.getProductName());
                ps.setInt(4, item.getQuantity());
                ps.setBigDecimal(5, item.getUnitPrice());
                ps.setBigDecimal(6, item.getTotalPrice());
                ps.addBatch();
            }
            
            ps.executeBatch();
        }
    }
    
    private String generateOrderId() {
        String timestamp = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        return timestamp + String.format("%04d", (int)(Math.random() * 10000));
    }
}