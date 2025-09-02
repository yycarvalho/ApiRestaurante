package com.sistema.pedidos.controller.handler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.config.ServerConfig;
import com.sistema.pedidos.context.RequestContext;
import com.sistema.pedidos.dto.ApiResponse;
import com.sistema.pedidos.enums.Permissions;
import com.sistema.pedidos.exception.ApiException;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.pedidos.util.ActionLogger;
import com.sistema.pedidos.util.HttpUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Classe base aprimorada para todos os handlers HTTP Inclui context de
 * requisição, logging melhorado e tratamento de erros
 */
@Slf4j
@RequiredArgsConstructor
public abstract class BaseHandler implements HttpHandler {

	protected final ServiceContainer services;
	protected final ObjectMapper objectMapper;
	protected final ServerConfig config = ServerConfig.getInstance();

	@Override
	public final void handle(HttpExchange exchange) throws IOException {
		String requestId = HttpUtils.generateRequestId();
		String clientIp = HttpUtils.getClientIp(exchange);

		try {
			// Inicializar context da requisição
			User authenticatedUser = getAuthenticatedUserSafely(exchange);
			RequestContext.initialize(requestId, clientIp, authenticatedUser);

			// Log início da requisição
			logRequestStart(exchange, requestId);

			addCorsHeaders(exchange);

			if (isOptionsRequest(exchange)) {
				handleOptionsRequest(exchange);
				return;
			}

			handleRequest(exchange);

			// Log sucesso da requisição
			logRequestSuccess(exchange, requestId);

		} catch (ApiException e) {
			log.warn("API error in request {}: {}", requestId, e.getMessage());
			sendErrorResponse(exchange, e.getStatusCode(), e.getMessage());

		} catch (IllegalArgumentException e) {
			log.warn("Validation error in request {}: {}", requestId, e.getMessage());
			sendBadRequestResponse(exchange, e.getMessage());

		} catch (Exception e) {
			log.error("Unexpected error in request {}: {}", requestId, e.getMessage(), e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor");

			// Log do erro no ActionLogger
			logError(exchange, e);

		} finally {
			// Log final da requisição com tempo de processamento
			logRequestEnd(exchange, requestId);

			// Limpar context
			RequestContext.clear();
		}
	}

	/**
	 * Método abstrato que deve ser implementado pelos handlers específicos
	 */
	protected abstract void handleRequest(HttpExchange exchange) throws IOException;

	protected void addCorsHeaders(HttpExchange exchange) {
		exchange.getResponseHeaders().add("Access-Control-Allow-Origin", config.getCorsAllowOrigin());
		exchange.getResponseHeaders().add("Access-Control-Allow-Methods", config.getCorsAllowMethods());
		exchange.getResponseHeaders().add("Access-Control-Allow-Headers", config.getCorsAllowHeaders());
	}

	protected boolean isOptionsRequest(HttpExchange exchange) {
		return "OPTIONS".equals(exchange.getRequestMethod());
	}

	protected void handleOptionsRequest(HttpExchange exchange) throws IOException {
		exchange.sendResponseHeaders(200, 0);
		exchange.close();
	}

	protected boolean isAuthenticated(HttpExchange exchange) {
		try {
			String token = extractToken(exchange);
			return services.getAuthService().validateToken(token);
		} catch (Exception e) {
			return false;
		}
	}

	protected User getAuthenticatedUser(HttpExchange exchange) {
		String token = extractToken(exchange);
		return services.getAuthService().getUserFromToken(token);
	}

	private User getAuthenticatedUserSafely(HttpExchange exchange) {
		try {
			return getAuthenticatedUser(exchange);
		} catch (Exception e) {
			return null;
		}
	}

	protected String extractToken(HttpExchange exchange) {
		String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}
		throw new IllegalArgumentException("Token não encontrado");
	}

	protected String readRequestBody(HttpExchange exchange) throws IOException {
		StringBuilder body = new StringBuilder();
		try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
			String line;
			while ((line = reader.readLine()) != null) {
				body.append(line);
			}
		}
		return body.toString();
	}

	protected <T> T parseRequestBody(HttpExchange exchange, Class<T> valueType) throws IOException {
		String body = readRequestBody(exchange);
		if (body.trim().isEmpty()) {
			throw new IllegalArgumentException("Corpo da requisição não pode estar vazio");
		}
		return objectMapper.readValue(body, valueType);
	}

	protected Map<String, Object> parseRequestBodyAsMap(HttpExchange exchange) throws IOException {
		String body = readRequestBody(exchange);
		if (body.trim().isEmpty()) {
			throw new IllegalArgumentException("Corpo da requisição não pode estar vazio");
		}
		return objectMapper.readValue(body, Map.class);
	}

	protected void sendJsonResponse(HttpExchange exchange, int statusCode, Object response) throws IOException {
		String jsonResponse = objectMapper.writeValueAsString(response);
		byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);

		exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
		exchange.sendResponseHeaders(statusCode, responseBytes.length);

		try (OutputStream os = exchange.getResponseBody()) {
			os.write(responseBytes);
		}
	}

	protected void sendSuccessResponse(HttpExchange exchange, Object data) throws IOException {
		sendJsonResponse(exchange, 200, data);
	}

	protected void sendCreatedResponse(HttpExchange exchange, Object data) throws IOException {
		sendJsonResponse(exchange, 201, data);
	}

	protected void sendErrorResponse(HttpExchange exchange, int statusCode, String message) throws IOException {
		sendJsonResponse(exchange, statusCode, ApiResponse.error(message));
	}

	protected void sendUnauthorizedResponse(HttpExchange exchange) throws IOException {
		sendErrorResponse(exchange, 401, "Token inválido ou ausente");
	}

	protected void sendForbiddenResponse(HttpExchange exchange) throws IOException {
		sendErrorResponse(exchange, 403, "Acesso negado");
	}

	protected void sendNotFoundResponse(HttpExchange exchange, String resource) throws IOException {
		sendErrorResponse(exchange, 404, resource + " não encontrado");
	}

	protected void sendMethodNotAllowedResponse(HttpExchange exchange) throws IOException {
		sendErrorResponse(exchange, 405, "Método não permitido");
	}

	protected void sendBadRequestResponse(HttpExchange exchange, String message) throws IOException {
		sendErrorResponse(exchange, 400, message);
	}

	protected Long extractIdFromPath(String path, int position) {
		String[] parts = path.split("/");
		if (parts.length > position) {
			try {
				return Long.parseLong(parts[position]);
			} catch (NumberFormatException e) {
				throw new IllegalArgumentException("ID inválido: " + parts[position]);
			}
		}
		throw new IllegalArgumentException("ID é obrigatório na posição " + position + " do caminho");
	}

	protected String extractPathParameter(String path, int position) {
		String[] parts = path.split("/");
		if (parts.length > position) {
			return parts[position];
		}
		return null;
	}

	// Métodos de logging
	private void logRequestStart(HttpExchange exchange, String requestId) {
		if (log.isDebugEnabled()) {
			log.debug("Request {} started: {} {} from {}", requestId, exchange.getRequestMethod(),
					exchange.getRequestURI(), HttpUtils.getClientIp(exchange));
		}
	}

	private void logRequestSuccess(HttpExchange exchange, String requestId) {
		if (log.isDebugEnabled()) {
			log.debug("Request {} completed successfully in {}ms", requestId, RequestContext.getProcessingTime());
		}
	}

	private void logRequestEnd(HttpExchange exchange, String requestId) {
		if (log.isInfoEnabled()) {
			log.info("Request {} - {} {} - {}ms - {}", requestId, exchange.getRequestMethod(),
					HttpUtils.getEndpointName(exchange), RequestContext.getProcessingTime(),
					HttpUtils.getClientIp(exchange));
		}
	}

	private void logError(HttpExchange exchange, Exception e) {
		try {
			User user = RequestContext.getAuthenticatedUser();
			ActionLogger.log("ERROR", "request_error", e.getMessage(), user != null ? user.getName() : null,
					user != null ? user.getId() : null, RequestContext.getClientIp(),
					exchange.getRequestURI().toString());
		} catch (Exception logError) {
			log.warn("Failed to log error to ActionLogger", logError);
		}
	}

	public boolean hasPermission(User user, Permissions permission) {
		if (user == null || permission == null)
			return false;
		return user.getPermissions().getOrDefault(permission.getName(), false);
	}
}