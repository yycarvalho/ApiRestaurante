package com.sistema.pedidos.controller.handler;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.enums.Permissions;
import com.sistema.pedidos.model.Profile;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sun.net.httpserver.HttpExchange;

import lombok.extern.slf4j.Slf4j;

/**
 * Handler para operações com perfis
 */
@Slf4j
public class ProfileHandler extends BaseHandler {

	public ProfileHandler(ServiceContainer services, ObjectMapper objectMapper) {
		super(services, objectMapper);
	}

	@Override
	protected void handleRequest(HttpExchange exchange) throws IOException {
		String method = exchange.getRequestMethod();
		String path = exchange.getRequestURI().getPath();

		try {
			switch (method) {
			case "GET":
				handleGetProfiles(exchange);
				break;
			case "POST":
				handleCreateProfile(exchange);
				break;
			case "PUT":
				handleUpdateProfile(exchange, path);
				break;
			case "DELETE":
				handleDeleteProfile(exchange, path);
				break;
			default:
				sendMethodNotAllowedResponse(exchange);
			}
		} catch (IllegalArgumentException e) {
			sendBadRequestResponse(exchange, e.getMessage());
		} catch (Exception e) {
			log.error("Error handling profile request", e);
			sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
		}
	}

	private void handleGetProfiles(HttpExchange exchange) throws Exception {
		if (!isAuthenticated(exchange)) {
			// Para GET de profiles, permite acesso sem autenticação em alguns casos
			// Mantendo a lógica original do código
			log.debug("Unauthenticated access to profiles endpoint");
		}

		User currentUser = null;
		try {
			currentUser = getAuthenticatedUser(exchange);
		} catch (Exception e) {
			// Usuário não autenticado, continua
		}

		// Verificar se o usuário tem permissão para gerenciar perfis
		if (currentUser != null && !hasPermission(currentUser, Permissions.GERENCIAR_PERFIS)) {
			// Retorna apenas o perfil do usuário atual
			Profile userProfile = createUserProfile(currentUser);
			sendSuccessResponse(exchange, Arrays.asList(userProfile));
			return;
		}

		List<Profile> profiles = services.getProfileService().findAll();
		sendSuccessResponse(exchange, profiles);
	}

	private Profile createUserProfile(User user) {
		Profile profile = new Profile();
		profile.setId(-1L);
		profile.setPermissions(user.getPermissions());
		return profile;
	}

	private void handleCreateProfile(HttpExchange exchange) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		Profile newProfile = parseRequestBody(exchange, Profile.class);

		// Validar se todas as permissões existem
		if (!validatePermissions(newProfile)) {
			sendBadRequestResponse(exchange, "Uma ou mais permissões não existem");
			return;
		}

		Profile createdProfile = services.getProfileService().create(newProfile);
		sendCreatedResponse(exchange, createdProfile);
	}

	private void handleUpdateProfile(HttpExchange exchange, String path) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}

		Long profileId = extractIdFromPath(path, 3);
		Profile updateProfile = parseRequestBody(exchange, Profile.class);

		log.debug("Updating profile {} with data: {}", profileId, updateProfile);

		// Validar se todas as permissões existem
		if (!validatePermissions(updateProfile)) {
			sendBadRequestResponse(exchange, "Uma ou mais permissões não existem");
			return;
		}
		User currentUser = null;
		try {
			currentUser = getAuthenticatedUser(exchange);
		} catch (Exception e) {
			// Usuário não autenticado, continua
		}

		// Verificar se o usuário tem permissão para gerenciar perfis
		if (currentUser != null && !hasPermission(currentUser, Permissions.GERENCIAR_PERFIS)) {
			// Retorna apenas o perfil do usuário atual
			Profile userProfile = createUserProfile(currentUser);
			sendSuccessResponse(exchange, Arrays.asList(userProfile));
			return;
		}

		Profile updatedProfile = services.getProfileService().update(profileId, updateProfile);
		sendSuccessResponse(exchange, updatedProfile);
	}

	private void handleDeleteProfile(HttpExchange exchange, String path) throws Exception {
		if (!isAuthenticated(exchange)) {
			sendUnauthorizedResponse(exchange);
			return;
		}
		User currentUser = null;
		try {
			currentUser = getAuthenticatedUser(exchange);
		} catch (Exception e) {
			// Usuário não autenticado, continua
		}

		// Verificar se o usuário tem permissão para gerenciar perfis
		if (currentUser != null && !hasPermission(currentUser, Permissions.GERENCIAR_PERFIS)) {
			// Retorna apenas o perfil do usuário atual
			Profile userProfile = createUserProfile(currentUser);
			sendSuccessResponse(exchange, Arrays.asList(userProfile));
			return;
		}

		Long profileId = extractIdFromPath(path, 3);
		boolean deleted = services.getProfileService().delete(profileId);

		if (deleted) {
			sendJsonResponse(exchange, 200, com.sistema.pedidos.dto.ApiResponse.success("Perfil excluído com sucesso"));
		} else {
			sendNotFoundResponse(exchange, "Perfil");
		}
	}

	private boolean validatePermissions(Profile profile) {
		return profile.getPermissions().keySet().stream().allMatch(Permissions::containsName);
	}
}