package com.sistema.pedidos.service;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Order.ChatMessage;
import com.sistema.pedidos.model.Order.OrderItem;
import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.util.Db;

/**
 * Serviço de gerenciamento de pedidos
 */
public class OrderService {

	private final ProductService productService;
	private int orderCounter = 1;

	public OrderService(ProductService productService) {
		this.productService = productService;
		initializeOrderCounter();
		// initializeDefaultOrders();
	}

	/**
	 * Inicializa o contador de pedidos baseado no banco
	 */
	private void initializeOrderCounter() {
		String sql = "SELECT MAX(CAST(SUBSTRING(id, 9) AS UNSIGNED)) as max_counter FROM orders WHERE id REGEXP '^[0-9]{8}[0-9]{4}$'";

		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql);
				ResultSet rs = stmt.executeQuery()) {

			if (rs.next()) {
				int maxCounter = rs.getInt("max_counter");
				orderCounter = maxCounter + 1;
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Inicializa pedidos padrão para demonstração
	 */
	private void initializeDefaultOrders() {
		// Verificar se já existem pedidos no banco
		if (findAll().size() > 0) {
			return;
		}

		// Pedido 1 - Em atendimento
		createSampleOrder("João Silva", "(11) 99999-1234", "delivery", "atendimento", "Rua das Flores, 123 - Centro",
				Arrays.asList(new OrderItem(1L, "X-Burger Clássico", 2, new BigDecimal("15.90")),
						new OrderItem(5L, "Coca-Cola 350ml", 2, new BigDecimal("4.50"))));

		// Pedido 2 - Em preparo
		createSampleOrder("Maria Santos", "(11) 99999-5678", "pickup", "preparo", null,
				Arrays.asList(new OrderItem(2L, "X-Bacon", 1, new BigDecimal("18.90")),
						new OrderItem(9L, "Batata Frita", 1, new BigDecimal("8.90"))));

		// Pedido 3 - Pronto
		createSampleOrder("Pedro Costa", "(11) 99999-9012", "delivery", "pronto", "Av. Principal, 456 - Jardim",
				Arrays.asList(new OrderItem(3L, "X-Tudo", 1, new BigDecimal("22.90")),
						new OrderItem(6L, "Guaraná Antarctica 350ml", 1, new BigDecimal("4.50")),
						new OrderItem(12L, "Milkshake de Chocolate", 1, new BigDecimal("8.90"))));

		// Pedido 4 - Finalizado
		createSampleOrder("Ana Oliveira", "(11) 99999-3456", "pickup", "finalizado", null,
				Arrays.asList(new OrderItem(4L, "X-Frango", 1, new BigDecimal("16.90")),
						new OrderItem(8L, "Água Mineral 500ml", 1, new BigDecimal("3.00"))));
	}

	/**
	 * Método auxiliar para criar pedidos de exemplo
	 */
	private void createSampleOrder(String customer, String phone, String type, String status, String address,
			List<OrderItem> items) {
		Order order = new Order(customer, phone, type);
		order.setId(generateOrderId());
		order.setStatus(status);
		order.setAddress(address);
		order.setItems(items);
		order.calculateTotal();

		// Salvar no banco
		saveOrderToDatabase(order);

		// Adicionar algumas mensagens de chat para demonstração
		if ("atendimento".equals(status)) {
			addChatMessage(order.getId(), "Olá! Gostaria de fazer um pedido", "customer");
			addChatMessage(order.getId(), "Olá! Claro, qual seria o seu pedido?", "system");
		}
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
		List<Order> orders = new ArrayList<>();
		String sql = "SELECT * FROM orders ORDER BY created_at DESC";

		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql);
				ResultSet rs = stmt.executeQuery()) {

			while (rs.next()) {
				Order order = mapResultSetToOrder(rs);
				order.setItems(findOrderItems(order.getId()));
				order.setChat(findOrderChatMessages(order.getId()));
				orders.add(order);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
	}

	/**
	 * Busca pedido por ID
	 */
	public Order findById(String id) {
		String sql = "SELECT * FROM orders WHERE id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, id);
			try (ResultSet rs = stmt.executeQuery()) {
				if (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(id));
					order.setChat(findOrderChatMessages(id));
					return order;
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return null;
	}

	/**
	 * Busca pedidos por status
	 */
	public List<Order> findByStatus(String status) {
		List<Order> orders = new ArrayList<>();
		String sql = "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, status);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(order.getId()));
					order.setChat(findOrderChatMessages(order.getId()));
					orders.add(order);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
	}

	/**
	 * Busca pedidos por tipo
	 */
	public List<Order> findByType(String type) {
		List<Order> orders = new ArrayList<>();
		String sql = "SELECT * FROM orders WHERE type = ? ORDER BY created_at DESC";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, type);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(order.getId()));
					order.setChat(findOrderChatMessages(order.getId()));
					orders.add(order);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
	}

	/**
	 * Busca pedidos por cliente
	 */
	public List<Order> findByCustomer(String customer) {
		List<Order> orders = new ArrayList<>();
		String sql = "SELECT * FROM orders WHERE LOWER(customer_name) LIKE ? ORDER BY created_at DESC";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, "%" + customer.toLowerCase() + "%");
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(order.getId()));
					order.setChat(findOrderChatMessages(order.getId()));
					orders.add(order);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
	}

	/**
	 * Busca pedidos por período
	 */
	public List<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		List<Order> orders = new ArrayList<>();
		String sql = "SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setTimestamp(1, Timestamp.valueOf(startDate));
			stmt.setTimestamp(2, Timestamp.valueOf(endDate));

			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(order.getId()));
					order.setChat(findOrderChatMessages(order.getId()));
					orders.add(order);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
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

		// Salvar no banco
		saveOrderToDatabase(order);

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

		// Atualizar no banco
		updateOrderInDatabase(existingOrder);

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

		// Atualizar no banco
		updateOrderStatusInDatabase(id, newStatus);

		// Adicionar mensagem automática no chat
		String message = String.format("Status alterado de '%s' para '%s'", getStatusName(oldStatus),
				getStatusName(newStatus));
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

		// Salvar mensagem no banco
		saveChatMessage(orderId, message, sender);

		// Atualizar updated_at do pedido
		updateOrderTimestamp(orderId);

		// Recarregar order com as mensagens atualizadas
		return findById(orderId);
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

		String sql = "DELETE FROM orders WHERE id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, id);
			int rowsAffected = stmt.executeUpdate();
			return rowsAffected > 0;

		} catch (SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Obtém estatísticas dos pedidos
	 */
	public Map<String, Object> getOrderStats() {
		Map<String, Object> stats = new HashMap<>();

		try (Connection conn = Db.getConnection()) {
			// Contagem total de pedidos
			stats.put("totalOrders", getTotalOrdersCount(conn));

			// Contagem por status
			stats.put("ordersByStatus", getOrdersByStatus(conn));

			// Contagem por tipo
			stats.put("ordersByType", getOrdersByType(conn));

			// Valor total arrecadado
			stats.put("totalRevenue", getTotalRevenue(conn));

			// Ticket médio
			stats.put("averageTicket", getAverageTicket(conn));

			// Pedidos de hoje
			stats.put("ordersToday", getOrdersToday(conn));

			// Receita de hoje
			stats.put("revenueToday", getRevenueToday(conn));

		} catch (SQLException e) {
			e.printStackTrace();
		}

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
	public List<Order> findWithFilters(String customer, String status, String type, LocalDateTime startDate,
			LocalDateTime endDate) {
		List<Order> orders = new ArrayList<>();
		StringBuilder sql = new StringBuilder("SELECT * FROM orders WHERE 1=1");
		List<Object> params = new ArrayList<>();

		if (customer != null && !customer.trim().isEmpty()) {
			sql.append(" AND LOWER(customer_name) LIKE ?");
			params.add("%" + customer.toLowerCase() + "%");
		}

		if (status != null && !status.trim().isEmpty()) {
			sql.append(" AND status = ?");
			params.add(status);
		}

		if (type != null && !type.trim().isEmpty()) {
			sql.append(" AND type = ?");
			params.add(type);
		}

		if (startDate != null) {
			sql.append(" AND created_at >= ?");
			params.add(Timestamp.valueOf(startDate));
		}

		if (endDate != null) {
			sql.append(" AND created_at <= ?");
			params.add(Timestamp.valueOf(endDate));
		}

		sql.append(" ORDER BY created_at DESC");

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

			for (int i = 0; i < params.size(); i++) {
				stmt.setObject(i + 1, params.get(i));
			}

			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					Order order = mapResultSetToOrder(rs);
					order.setItems(findOrderItems(order.getId()));
					order.setChat(findOrderChatMessages(order.getId()));
					orders.add(order);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return orders;
	}

	// Métodos privados para operações do banco

	private void saveOrderToDatabase(Order order) {
		String sql = "INSERT INTO orders (id, customer_name, customer_phone, address, type, status, total, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, order.getId());
			stmt.setString(2, order.getCustomer());
			stmt.setString(3, order.getPhone());
			stmt.setString(4, order.getAddress());
			stmt.setString(5, order.getType());
			stmt.setString(6, order.getStatus());
			stmt.setBigDecimal(7, order.getTotal());
			stmt.setTimestamp(8, Timestamp.valueOf(order.getCreatedAt()));
			stmt.setTimestamp(9, Timestamp.valueOf(order.getUpdatedAt()));

			stmt.executeUpdate();

			// Salvar itens do pedido
			if (order.getItems() != null) {
				saveOrderItems(order.getId(), order.getItems());
			}

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private void updateOrderInDatabase(Order order) {
		String sql = "UPDATE orders SET customer_name = ?, customer_phone = ?, address = ?, type = ?, total = ?, updated_at = ? WHERE id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, order.getCustomer());
			stmt.setString(2, order.getPhone());
			stmt.setString(3, order.getAddress());
			stmt.setString(4, order.getType());
			stmt.setBigDecimal(5, order.getTotal());
			stmt.setTimestamp(6, Timestamp.valueOf(order.getUpdatedAt()));
			stmt.setString(7, order.getId());

			stmt.executeUpdate();

			// Atualizar itens do pedido
			if (order.getItems() != null) {
				deleteOrderItems(order.getId());
				saveOrderItems(order.getId(), order.getItems());
			}

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private void updateOrderStatusInDatabase(String orderId, String status) {
		String sql = "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, status);
			stmt.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
			stmt.setString(3, orderId);

			stmt.executeUpdate();

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private void updateOrderTimestamp(String orderId) {
		String sql = "UPDATE orders SET updated_at = ? WHERE id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
			stmt.setString(2, orderId);

			stmt.executeUpdate();

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private void saveOrderItems(String orderId, List<OrderItem> items) {
		String sql = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			for (OrderItem item : items) {
				stmt.setString(1, orderId);
				stmt.setLong(2, item.getProductId());
				stmt.setString(3, item.getProductName());
				stmt.setInt(4, item.getQuantity());
				stmt.setBigDecimal(5, item.getPrice());
				stmt.addBatch();
			}

			stmt.executeBatch();

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private void deleteOrderItems(String orderId) {
		String sql = "DELETE FROM order_items WHERE order_id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, orderId);
			stmt.executeUpdate();

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private List<OrderItem> findOrderItems(String orderId) {
		List<OrderItem> items = new ArrayList<>();
		String sql = "SELECT * FROM order_items WHERE order_id = ?";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, orderId);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					OrderItem item = new OrderItem();
					item.setProductId(rs.getLong("product_id"));
					item.setProductName(rs.getString("product_name"));
					item.setQuantity(rs.getInt("quantity"));
					item.setPrice(rs.getBigDecimal("unit_price"));
					items.add(item);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return items;
	}

	private void saveChatMessage(String orderId, String message, String sender) {
		String sql = "INSERT INTO order_chat_messages (order_id, sender, message, created_at) VALUES (?, ?, ?, ?)";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, orderId);
			stmt.setString(2, sender);
			stmt.setString(3, message);
			stmt.setTimestamp(4, Timestamp.valueOf(LocalDateTime.now()));

			stmt.executeUpdate();

		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	private List<ChatMessage> findOrderChatMessages(String orderId) {
		List<ChatMessage> messages = new ArrayList<>();
		String sql = "SELECT * FROM order_chat_messages WHERE order_id = ? ORDER BY created_at ASC";

		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, orderId);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					ChatMessage message = new ChatMessage(rs.getString("message"), rs.getString("sender"),
							rs.getTimestamp("created_at").toLocalDateTime());
					messages.add(message);
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}

		return messages;
	}

	private Order mapResultSetToOrder(ResultSet rs) throws SQLException {
		Order order = new Order();
		order.setId(rs.getString("id"));
		order.setCustomer(rs.getString("customer_name"));
		order.setPhone(rs.getString("customer_phone"));
		order.setAddress(rs.getString("address"));
		order.setType(rs.getString("type"));
		order.setStatus(rs.getString("status"));
		order.setTotal(rs.getBigDecimal("total"));
		order.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
		order.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
		return order;
	}

	// Métodos para estatísticas

	private int getTotalOrdersCount(Connection conn) throws SQLException {
		String sql = "SELECT COUNT(*) FROM orders";
		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			return rs.next() ? rs.getInt(1) : 0;
		}
	}

	private Map<String, Long> getOrdersByStatus(Connection conn) throws SQLException {
		Map<String, Long> result = new HashMap<>();
		String sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";

		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			while (rs.next()) {
				result.put(rs.getString("status"), rs.getLong("count"));
			}
		}
		return result;
	}

	private Map<String, Long> getOrdersByType(Connection conn) throws SQLException {
		Map<String, Long> result = new HashMap<>();
		String sql = "SELECT type, COUNT(*) as count FROM orders GROUP BY type";

		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			while (rs.next()) {
				result.put(rs.getString("type"), rs.getLong("count"));
			}
		}
		return result;
	}

	private BigDecimal getTotalRevenue(Connection conn) throws SQLException {
		String sql = "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'finalizado'";
		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			return rs.next() ? rs.getBigDecimal(1) : BigDecimal.ZERO;
		}
	}

	private double getAverageTicket(Connection conn) throws SQLException {
		String sql = "SELECT AVG(total) FROM orders WHERE status = 'finalizado'";
		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			return rs.next() ? rs.getDouble(1) : 0.0;
		}
	}

	private long getOrdersToday(Connection conn) throws SQLException {
		String sql = "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()";
		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			return rs.next() ? rs.getLong(1) : 0;
		}
	}

	private BigDecimal getRevenueToday(Connection conn) throws SQLException {
		String sql = "SELECT COALESCE(SUM(total), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status = 'finalizado'";
		try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
			return rs.next() ? rs.getBigDecimal(1) : BigDecimal.ZERO;
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

		if ("delivery".equals(order.getType()) && (order.getAddress() == null || order.getAddress().trim().isEmpty())) {
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

			Product product = null;
			try {
				product = productService.findById(item.getProductId());
			} catch (Exception e) {
				e.printStackTrace();
			}
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