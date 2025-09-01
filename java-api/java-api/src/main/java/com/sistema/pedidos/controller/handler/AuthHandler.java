package com.sistema.pedidos.controller.handler;

import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.dto.ApiResponse;
import com.sistema.pedidos.dto.LoginRequest;
import com.sistema.pedidos.dto.LoginResponse;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.AuthService;
import com.sun.net.httpserver.HttpExchange;

import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações de autenticação
 */
@Slf4j
public class AuthHandler {

	private final AuthService authService;
	private final ObjectMapper objectMapper;

	public AuthHandler(AuthService authService, ObjectMapper objectMapper) {
		this.authService = authService;
		this.objectMapper = objectMapper;
	}

	public void handleLogin(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if (isOptionsRequest(exchange)) {
			handleOptionsRequest(exchange);
			return;
		}

		if (!"POST".equals(exchange.getRequestMethod())) {
			sendErrorResponse(exchange, 405, "Método não permitido");
			return;
		}

		try {
			String requestBody = readRequestBody(exchange);
			log.debug("Login request: {}", requestBody);

			LoginRequest loginRequest = objectMapper.readValue(requestBody, LoginRequest.class);
			LoginResponse response = authService.login(loginRequest);

			sendJsonResponse(exchange, 200, response);

		} catch (IllegalArgumentException e) {
			log.warn("Login failed: {}", e.getMessage());
			sendErrorResponse(exchange, 401, e.getMessage());
		} catch (Exception e) {
			log.error("Error during login", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor");
		}
	}

	public void handleLogout(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if (isOptionsRequest(exchange)) {
			handleOptionsRequest(exchange);
			return;
		}

		if (!"POST".equals(exchange.getRequestMethod())) {
			sendErrorResponse(exchange, 405, "Método não permitido");
			return;
		}

		try {
			String token = extractToken(exchange);
			authService.logout(token);
			sendJsonResponse(exchange, 200, ApiResponse.success("Logout realizado com sucesso"));

		} catch (Exception e) {
			log.error("Error during logout", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor");
		}
	}

	public void handleValidateToken(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if (isOptionsRequest(exchange)) {
			handleOptionsRequest(exchange);
			return;
		}

		if (!"GET".equals(exchange.getRequestMethod())) {
			sendErrorResponse(exchange, 405, "Método não permitido");
			return;
		}

		try {
			String token = extractToken(exchange);
			boolean isValid = authService.validateToken(token);

			if (isValid) {
				User user = authService.getUserFromToken(token);
				// Remove dados sensíveis antes de retornar
				user.setPassword("");
				user.setUsername("");
				sendJsonResponse(exchange, 200, ApiResponse.success("Token válido", user));
			} else {
				sendErrorResponse(exchange, 401, "Token inválido");
			}

		} catch (Exception e) {
			log.warn("Token validation failed: {}", e.getMessage());
			sendErrorResponse(exchange, 401, "Token inválido");
		}
	}

	// Métodos utilitários privados
	private void addCorsHeaders(HttpExchange exchange) {
		exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
		exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
		exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	private boolean isOptionsRequest(HttpExchange exchange) {
		return "OPTIONS".equals(exchange.getRequestMethod());
	}

	private void handleOptionsRequest(HttpExchange exchange) throws IOException {
		exchange.sendResponseHeaders(200, 0);
		exchange.close();
	}

	private String extractToken(HttpExchange exchange) {
		String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}
		throw new IllegalArgumentException("Token não encontrado");
	}

	private String readRequestBody(HttpExchange exchange) throws IOException {
		StringBuilder body = new StringBuilder();
		try (java.io.BufferedReader reader = new java.io.BufferedReader(
				new java.io.InputStreamReader(exchange.getRequestBody(), java.nio.charset.StandardCharsets.UTF_8))) {
			String line;
			while ((line = reader.readLine()) != null) {
				body.append(line);
			}
		}
		return body.toString();
	}

	private void sendJsonResponse(HttpExchange exchange, int statusCode, Object response) throws IOException {
		String jsonResponse = objectMapper.writeValueAsString(response);
		byte[] responseBytes = jsonResponse.getBytes(java.nio.charset.StandardCharsets.UTF_8);

		exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
		exchange.sendResponseHeaders(statusCode, responseBytes.length);

		try (java.io.OutputStream os = exchange.getResponseBody()) {
			os.write(responseBytes);
		}
	}

	private void sendErrorResponse(HttpExchange exchange, int statusCode, String message) throws IOException {
		sendJsonResponse(exchange, statusCode, ApiResponse.error(message));
	}

}