package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.websocket.NotificacaoWebSocketServer;
import com.sun.net.httpserver.HttpExchange;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações de chat
 */
@Slf4j
public class ChatHandler extends BaseHandler {

	public ChatHandler(ServiceContainer services, ObjectMapper objectMapper) {
		super(services, objectMapper);
	}

	@Override
	protected void handleRequest(HttpExchange exchange) throws IOException {
		// Este método não é usado diretamente, pois usamos métodos específicos
		sendMethodNotAllowedResponse(exchange);
	}

	public void handleGetMessages(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if (isOptionsRequest(exchange)) {
			handleOptionsRequest(exchange);
			return;
		}

		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		if (!"GET".equals(exchange.getRequestMethod())) {
			sendMethodNotAllowedResponse(exchange);
			return;
		}

		try {
			String orderId = extractOrderIdFromPath(exchange);
			Order order = services.getOrderService().findById(orderId);

			if (order == null) {
				sendNotFoundResponse(exchange, "Pedido");
				return;
			}

			List<Order.ChatMessage> chatMessages = order.getChat();
			sendSuccessResponse(exchange, chatMessages);

		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error getting chat messages", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	public void handleSendMessage(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if (isOptionsRequest(exchange)) {
			handleOptionsRequest(exchange);
			return;
		}

		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		if (!"POST".equals(exchange.getRequestMethod())) {
			sendMethodNotAllowedResponse(exchange);
			return;
		}

		try {
			ChatMessageRequest request = parseRequestBody(exchange, ChatMessageRequest.class);

			if (!isValidChatRequest(request)) {
				sendBadRequestResponse(exchange, "Dados da mensagem inválidos");
				return;
			}

			User currentUser = getAuthenticatedUser(exchange);
			String formattedMessage = formatMessage(currentUser, request.getMessage());

			services.getOrderService().addChatMessage(request.getOrderId(), formattedMessage, "user");

			// Notificar via WebSocket
			notifyChatUpdate(request.getOrderId());

			sendJsonResponse(exchange, 200,
					com.sistema.pedidos.dto.ApiResponse.success("Mensagem enviada com sucesso"));

		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error sending chat message", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	private String extractOrderIdFromPath(HttpExchange exchange) {
		String path = exchange.getRequestURI().getPath();
		String[] pathParts = path.split("/");

		if (pathParts.length >= 5) {
			return pathParts[4];
		}

		throw new IllegalArgumentException("ID do pedido é obrigatório");
	}

	private boolean isValidChatRequest(ChatMessageRequest request) {
		return request != null && request.getOrderId() != null && !request.getOrderId().trim().isEmpty()
				&& request.getMessage() != null && !request.getMessage().trim().isEmpty();
	}

	private String formatMessage(User user, String message) {
		return user.getName() + ": " + message;
	}

	private void notifyChatUpdate(String orderId) {
		try {
			NotificacaoWebSocketServer.enviarNotificacao("/chat/" + orderId);
		} catch (Exception e) {
			log.warn("Failed to send WebSocket notification for chat update: {}", orderId, e);
		}
	}

	/**
	 * Classe interna para representar uma requisição de mensagem de chat
	 */
	@Data
	public static class ChatMessageRequest {
		private String clientId;
		private String message;
		private String orderId;
		private String senderId;
		private String phone;
	}

}