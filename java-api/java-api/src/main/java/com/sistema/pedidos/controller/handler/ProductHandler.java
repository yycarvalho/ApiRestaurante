package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.websocket.NotificacaoWebSocketServer;
import com.sun.net.httpserver.HttpExchange;

import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações com produtos
 */
@Slf4j
public class ProductHandler extends BaseHandler {

	public ProductHandler(ServiceContainer services, ObjectMapper objectMapper) {
		super(services, objectMapper);
	}

	@Override
	protected void handleRequest(HttpExchange exchange) throws IOException {
		String method = exchange.getRequestMethod();
		String path = exchange.getRequestURI().getPath();

		try {
			switch (method) {
			case "GET":
				handleGetProducts(exchange);
				break;
			case "POST":
				handleCreateProduct(exchange);
				break;
			case "PUT":
				handleUpdateProduct(exchange, path);
				break;
			case "DELETE":
				handleDeleteProduct(exchange, path);
				break;
			default:
				sendMethodNotAllowedResponse(exchange);
			}
		} catch (NumberFormatException e) {
			sendBadRequestResponse(exchange, "ID inválido");
		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error handling product request", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	private void handleGetProducts(HttpExchange exchange) throws IOException {
		List<Product> products = null;
		try {
			products = services.getProductService().findAll();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		sendSuccessResponse(exchange, products);
	}

	private void handleCreateProduct(HttpExchange exchange) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		Product newProduct = parseRequestBody(exchange, Product.class);
		Product createdProduct = services.getProductService().create(newProduct);

		// Notificar via WebSocket
		notifyProductChange();

		sendCreatedResponse(exchange, createdProduct);
	}

	private void handleUpdateProduct(HttpExchange exchange, String path) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		Long productId = extractIdFromPath(path, 3);
		Product updateProduct = parseRequestBody(exchange, Product.class);
		Product updatedProduct = services.getProductService().update(productId, updateProduct);

		// Notificar via WebSocket
		notifyProductChange();

		sendSuccessResponse(exchange, updatedProduct);
	}

	private void handleDeleteProduct(HttpExchange exchange, String path) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		Long productId = extractIdFromPath(path, 3);
		boolean deleted = services.getProductService().delete(productId);

		if (deleted) {
			// Notificar via WebSocket
			notifyProductChange();

			sendJsonResponse(exchange, 200,
					com.sistema.pedidos.dto.ApiResponse.success("Produto excluído com sucesso"));
		} else {
			sendNotFoundResponse(exchange, "Produto");
		}
	}

	private void notifyProductChange() {
		try {
			NotificacaoWebSocketServer.enviarNotificacao("/produto");
		} catch (Exception e) {
			log.warn("Failed to send WebSocket notification for product change", e);
		}
	}
}