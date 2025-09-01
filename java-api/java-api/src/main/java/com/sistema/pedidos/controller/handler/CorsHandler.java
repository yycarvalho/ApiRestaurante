package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.config.ServerConfig;
import com.sistema.pedidos.dto.ApiResponse;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

/**
 * Handler para configuração de CORS
 */
public class CorsHandler implements HttpHandler {

	private final ServerConfig config = ServerConfig.getInstance();

	@Override
	public void handle(HttpExchange exchange) throws IOException {
		addCorsHeaders(exchange);

		if ("OPTIONS".equals(exchange.getRequestMethod())) {
			exchange.sendResponseHeaders(200, 0);
			exchange.close();
			return;
		}

		// Se não é uma rota da API conhecida, retornar 404
		sendNotFoundResponse(exchange);
	}

	private void addCorsHeaders(HttpExchange exchange) {
		exchange.getResponseHeaders().add("Access-Control-Allow-Origin", config.getCorsAllowOrigin());
		exchange.getResponseHeaders().add("Access-Control-Allow-Methods", config.getCorsAllowMethods());
		exchange.getResponseHeaders().add("Access-Control-Allow-Headers", config.getCorsAllowHeaders());
	}

	private void sendNotFoundResponse(HttpExchange exchange) throws IOException {
		ApiResponse response = ApiResponse.error("Endpoint não encontrado");
		String jsonResponse = new ObjectMapper().writeValueAsString(response);
		byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);

		exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
		exchange.sendResponseHeaders(404, responseBytes.length);

		try (OutputStream os = exchange.getResponseBody()) {
			os.write(responseBytes);
		}
	}
}