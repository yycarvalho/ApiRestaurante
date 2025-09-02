package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.enums.Permissions;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sun.net.httpserver.HttpExchange;

import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações com usuários
 */
@Slf4j
public class UserHandler extends BaseHandler {

	public UserHandler(ServiceContainer services, ObjectMapper objectMapper) {
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
				handleGetUsers(exchange);
				break;
			case "POST":
				handleCreateUser(exchange);
				break;
			case "PUT":
				handleUpdateUser(exchange, path);
				break;
			case "PATCH":
				handlePatchUser(exchange, path);
				break;
			case "DELETE":
				handleDeleteUser(exchange, path);
				break;
			default:
				sendMethodNotAllowedResponse(exchange);
			}
		} catch (NumberFormatException e) {
			sendBadRequestResponse(exchange, "ID inválido");
		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error handling user request", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	private void handleGetUsers(HttpExchange exchange) throws IOException {
		User currentUser = getAuthenticatedUser(exchange);

		// Verificar se o usuário tem permissão para listar todos os usuários
		if (!hasPermission(currentUser, Permissions.GERENCIAR_PERFIS)) {
			// Retorna apenas o próprio usuário
			sendSuccessResponse(exchange, Arrays.asList(currentUser));
			return;
		}

		List<User> users = services.getUserService().findAll();
		sendSuccessResponse(exchange, users);
	}

	private void handleCreateUser(HttpExchange exchange) throws IOException {
		User newUser = parseRequestBody(exchange, User.class);
		User createdUser = services.getUserService().create(newUser);
		sendCreatedResponse(exchange, createdUser);
	}

	private void handleUpdateUser(HttpExchange exchange, String path) throws IOException {
		Long userId = extractIdFromPath(path, 3);
		User updateUser = parseRequestBody(exchange, User.class);
		User updatedUser = services.getUserService().update(userId, updateUser);
		sendSuccessResponse(exchange, updatedUser);
	}

	private void handlePatchUser(HttpExchange exchange, String path) throws IOException {
		String[] pathParts = path.split("/");

		if (pathParts.length >= 5 && "password".equals(pathParts[4])) {
			handlePasswordChange(exchange, pathParts[3]);
		} else {
			sendBadRequestResponse(exchange, "Endpoint inválido");
		}
	}

	private void handlePasswordChange(HttpExchange exchange, String userIdStr) throws IOException {
		Long userId = Long.parseLong(userIdStr);
		Map<String, Object> data = parseRequestBodyAsMap(exchange);

		String currentPassword = (String) data.get("currentPassword");
		String newPassword = (String) data.get("newPassword");

		if (newPassword == null || newPassword.trim().isEmpty()) {
			sendBadRequestResponse(exchange, "Nova senha é obrigatória");
			return;
		}

		User user = services.getUserService().findById(userId);
		if (user == null) {
			sendNotFoundResponse(exchange, "Usuário");
			return;
		}

		// Verificar senha atual se fornecida
		if (currentPassword != null && !currentPassword.equals(user.getPassword())) {
			sendBadRequestResponse(exchange, "Senha atual incorreta");
			return;
		}

		services.getUserService().resetPassword(userId, newPassword);
		User updatedUser = services.getUserService().findById(userId);
		sendSuccessResponse(exchange, updatedUser);
	}

	private void handleDeleteUser(HttpExchange exchange, String path) throws IOException {
		Long userId = extractIdFromPath(path, 3);
		boolean deleted = services.getUserService().delete(userId);

		if (deleted) {
			sendJsonResponse(exchange, 200,
					com.sistema.pedidos.dto.ApiResponse.success("Usuário excluído com sucesso"));
		} else {
			sendNotFoundResponse(exchange, "Usuário");
		}
	}

}