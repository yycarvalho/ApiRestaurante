package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.enums.Permissions;
import com.sistema.pedidos.enums.Status;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.websocket.NotificacaoWebSocketServer;
import com.sun.net.httpserver.HttpExchange;

import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações com pedidos
 */
@Slf4j
public class OrderHandler extends BaseHandler {

	public OrderHandler(ServiceContainer services, ObjectMapper objectMapper) {
		super(services, objectMapper);
	}

	@Override
	protected void handleRequest(HttpExchange exchange) throws IOException {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		String method = exchange.getRequestMethod();
		String path = exchange.getRequestURI().getPath();

		try {
			switch (method) {
			case "GET":
				handleGetOrders(exchange);
				break;
			case "POST":
				handleCreateOrder(exchange);
				break;
			case "PATCH":
				handlePatchOrder(exchange, path);
				break;
			default:
				sendMethodNotAllowedResponse(exchange);
			}
		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error handling order request", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	private void handleGetOrders(HttpExchange exchange) throws IOException {
		List<Order> allOrders = services.getOrderService().findAll();

		// Filtrar apenas pedidos de hoje
		List<Order> todaysOrders = filterTodaysOrders(allOrders);

		for (Order order : todaysOrders) {
			order.setChat(null);
		}

		sendSuccessResponse(exchange, todaysOrders);
	}

	private List<Order> filterTodaysOrders(List<Order> allOrders) {
		LocalDateTime today = LocalDateTime.now();
		LocalDateTime startOfDay = today.withHour(0).withMinute(0).withSecond(0).withNano(0);
		LocalDateTime endOfDay = today.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

		return allOrders.stream().filter(order -> {
			LocalDateTime createdAt = order.getCreatedAt();
			boolean isToday = !createdAt.isBefore(startOfDay) && !createdAt.isAfter(endOfDay);
			boolean notFinalizado = !"finalizado".equalsIgnoreCase(order.getStatus());
			return isToday || (!isToday && notFinalizado);
		}).collect(Collectors.toList());
	}

	private void handleCreateOrder(HttpExchange exchange) throws IOException {
		Order newOrder = parseRequestBody(exchange, Order.class);
		Order createdOrder = services.getOrderService().create(newOrder);

		// Notificar via WebSocket
		notifyOrderChange("/novo_pedidos/" + createdOrder.getId());

		sendCreatedResponse(exchange, createdOrder);
	}

	private void handlePatchOrder(HttpExchange exchange, String path) throws IOException {
		String[] pathParts = path.split("/");

		if (pathParts.length >= 5 && "status".equals(pathParts[4])) {
			handleUpdateOrderStatus(exchange, pathParts[3]);
		} else {
			sendBadRequestResponse(exchange, "Endpoint inválido");
		}
	}

	private void handleUpdateOrderStatus(HttpExchange exchange, String orderIdStr) throws IOException {
		String orderId = orderIdStr;
		Map<String, Object> statusData = parseRequestBodyAsMap(exchange);
		String newStatus = (String) statusData.get("status");

		if (newStatus == null || newStatus.trim().isEmpty()) {
			sendBadRequestResponse(exchange, "Status é obrigatório");
			return;
		}
		if (newStatus == null || newStatus.trim().isEmpty() || !Status.containsName(newStatus.trim())) {
			sendBadRequestResponse(exchange, "Status é obrigatório");
			return;
		}
		User user = getAuthenticatedUser(exchange);
		Order findById = services.getOrderService().findById(orderId);
		String status = findById.getStatus();
		String type = findById.getType();

		if (!user.hasPermission(Permissions.SELECIONAR_STATUS_ESPECIFICO.getName())) {
			newStatus = Status.getNextStatus(status).getName();
		}
		if (type.equalsIgnoreCase("pickup")) {
			if (newStatus.equalsIgnoreCase(Status.COLETADO.getName()))
				newStatus = Status.getNextStatus(newStatus).getName();
		}

		Order updatedOrder = services.getOrderService().updateStatus(orderId, newStatus);

		// Notificar via WebSocket sobre mudança no pedido e no chat
		notifyOrderChange(
				"/status_pedidos/" + orderId + "/" + newStatus.substring(0, 1).toUpperCase() + newStatus.substring(1));
		notifyOrderChat(orderId);

		sendSuccessResponse(exchange, updatedOrder);
	}

	private void notifyOrderChange() {
		try {
			NotificacaoWebSocketServer.enviarNotificacao("/pedidos");
		} catch (Exception e) {
			log.warn("Failed to send WebSocket notification for order change", e);
		}
	}

	private void notifyOrderChange(String notify) {
		try {
			NotificacaoWebSocketServer.enviarNotificacao(notify);
		} catch (Exception e) {
			log.warn("Failed to send WebSocket notification for order change", e);
		}
	}

	private void notifyOrderChat(String orderId) {
		try {
			NotificacaoWebSocketServer.enviarNotificacao("/chat/" + orderId);
		} catch (Exception e) {
			log.warn("Failed to send WebSocket notification for order chat: {}", orderId, e);
		}
	}
}