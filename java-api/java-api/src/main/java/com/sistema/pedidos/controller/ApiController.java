package com.sistema.pedidos.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;

import org.java_websocket.server.WebSocketServer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.dto.ApiResponse;
import com.sistema.pedidos.dto.LoginRequest;
import com.sistema.pedidos.dto.LoginResponse;
import com.sistema.pedidos.model.Customer;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Order.ChatMessage;
import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.model.Profile;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.AuthService;
import com.sistema.pedidos.service.CustomerService;
import com.sistema.pedidos.service.MetricsService;
import com.sistema.pedidos.service.OrderService;
import com.sistema.pedidos.service.PERMISSIONS;
import com.sistema.pedidos.service.ProductService;
import com.sistema.pedidos.service.ProfileService;
import com.sistema.pedidos.service.UserService;
import com.sistema.pedidos.util.ActionLogger;
import com.sistema.websocket.NotificacaoWebSocketServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

/**
 * Controlador principal da API REST Implementa servidor HTTP simples usando
 * apenas Java 11
 */
public class ApiController {

	private final ObjectMapper objectMapper;
	private final AuthService authService;

	public AuthService getAuthService() {
		return authService;
	}

	private final UserService userService;
	private final ProfileService profileService;
	private final ProductService productService;
	private final OrderService orderService;
	private final MetricsService metricsService;
	private final CustomerService customerService;

	public ApiController() {
		this.objectMapper = new ObjectMapper();
		// Configurar ObjectMapper para suportar LocalDateTime
		this.objectMapper.findAndRegisterModules();
		this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		// Não falhar em propriedades desconhecidas vindas do frontend
		this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
				false);

		// Inicializar serviços
		this.profileService = new ProfileService();
		this.userService = new UserService();
		this.productService = new ProductService();
		this.orderService = new OrderService(productService);
		this.metricsService = new MetricsService(orderService, productService);
		this.authService = new AuthService(userService, profileService);
		this.customerService = new CustomerService();
	}

	public static ApiController getInstance() {
		return SingletonHolder.INSTANCE;
	}

	private static class SingletonHolder {
		protected static final ApiController INSTANCE = new ApiController();
	}

	/**
	 * Inicia o servidor HTTP
	 */
	public void start(int port) throws IOException {
		HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);

		// Configurar rotas

		server.createContext("/api/auth/login", new LoginHandler());
		server.createContext("/api/auth/logout", new LogoutHandler());
		server.createContext("/api/auth/validate", new ValidateTokenHandler());

		server.createContext("/api/users", new UsersHandler());
		server.createContext("/api/profiles", new ProfilesHandler());
		server.createContext("/api/products", new ProductsHandler());
		server.createContext("/api/orders", new OrdersHandler());
		server.createContext("/api/metrics/dashboard", new DashboardMetricsHandler());
		server.createContext("/api/metrics/reports", new ReportsHandler());
		server.createContext("/api/clientes", new CustomersHandler());

		server.createContext("/api/chat/send", new ChatSendHandler());
		server.createContext("/api/chat/messages", new ChatShowHandler());

		// Handler para CORS
		server.createContext("/", new CorsHandler());

		server.setExecutor(null);
		server.start();

		System.out.println("Servidor iniciado na porta " + port);
		System.out.println("API disponível em: http://localhost:" + port + "/api");
		ActionLogger.log("INFO", "server_start", "Servidor iniciado", null, null, null, null);
	}

	/**
	 * Handler para CORS
	 */
	private class CorsHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			// Adicionar headers CORS
			exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
			exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
			exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			// Se não é uma rota da API, retornar 404
			sendJsonResponse(exchange, 404, ApiResponse.error("Endpoint não encontrado"));
		}
	}

	/**
	 * Handler para login
	 */
	private class LoginHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!"POST".equals(exchange.getRequestMethod())) {
				sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				return;
			}

			try {
				String requestBody = readRequestBody(exchange);
				System.out.println(requestBody);
				LoginRequest loginRequest = objectMapper.readValue(requestBody, LoginRequest.class);

				LoginResponse response = authService.login(loginRequest);
				sendJsonResponse(exchange, 200, response);

			} catch (IllegalArgumentException e) {
				sendJsonResponse(exchange, 401, ApiResponse.error(e.getMessage()));
			} catch (Exception e) {
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor"));
			}
		}
	}

	/**
	 * Handler para logout
	 */
	private class LogoutHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!"POST".equals(exchange.getRequestMethod())) {
				sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				return;
			}

			try {
				String token = extractToken(exchange);
				authService.logout(token);
				sendJsonResponse(exchange, 200, ApiResponse.success("Logout realizado com sucesso"));

			} catch (Exception e) {
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor"));
			}
		}
	}

	/**
	 * Handler para validação de token
	 */
	private class ValidateTokenHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!"GET".equals(exchange.getRequestMethod())) {
				sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				return;
			}

			try {
				String token = extractToken(exchange);
				boolean isValid = authService.validateToken(token);

				if (isValid) {
					User user = authService.getUserFromToken(token);
					user.setPassword("");
					user.setUsername("");
					sendJsonResponse(exchange, 200, ApiResponse.success("Token válido", user));
				} else {
					sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				}

			} catch (Exception e) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
			}
		}
	}

	/**
	 * Handler para usuários
	 */
	private class UsersHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			// Verificar autenticação
			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
					for (Entry<String, Boolean> iterable_element : getUser(exchange).getPermissions().entrySet()) {
						if (iterable_element.getKey().equalsIgnoreCase(PERMISSIONS.GERENCIAR_PERFIS.getName()))
							if (!iterable_element.getValue()) {
								// profile.setName(getUser(exchange).getProfileName());
								// profile.setDescription(getUser(exchange).getProfileName());

								sendJsonResponse(exchange, 200, Arrays.asList(getUser(exchange)));
								return;
							}
					}
					List<User> users = userService.findAll();
					sendJsonResponse(exchange, 200, users);
					break;

				case "POST":
					String requestBody = readRequestBody(exchange);
					User newUser = objectMapper.readValue(requestBody, User.class);
					User createdUser = userService.create(newUser);
					sendJsonResponse(exchange, 201, createdUser);
					break;

				case "PUT":
					// Extrair ID da URL (assumindo formato /api/users/{id})
					String[] pathParts = path.split("/");
					if (pathParts.length >= 4) {
						Long userId = Long.parseLong(pathParts[3]);
						String updateBody = readRequestBody(exchange);
						User updateUser = objectMapper.readValue(updateBody, User.class);
						User updatedUser = userService.update(userId, updateUser);
						sendJsonResponse(exchange, 200, updatedUser);
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do usuário é obrigatório"));
					}
					break;

				case "PATCH":
					// Suporta alteração de senha: /api/users/{id}/password
					String[] patchPathParts = path.split("/");
					if (patchPathParts.length >= 5 && "password".equals(patchPathParts[4])) {
						Long userIdForPassword = Long.parseLong(patchPathParts[3]);
						String body = readRequestBody(exchange);
						Map<String, String> data = objectMapper.readValue(body, Map.class);
						String currentPassword = data.get("currentPassword");
						String newPassword = data.get("newPassword");

						User user = userService.findById(userIdForPassword);
						if (user == null) {
							sendJsonResponse(exchange, 404, ApiResponse.error("Usuário não encontrado"));
							return;
						}

						if (newPassword == null || newPassword.trim().isEmpty()) {
							sendJsonResponse(exchange, 400, ApiResponse.error("Nova senha é obrigatória"));
							return;
						}

						// Verificar senha atual se fornecida
						if (currentPassword != null && !currentPassword.equals(user.getPassword())) {
							sendJsonResponse(exchange, 400, ApiResponse.error("Senha atual incorreta"));
							return;
						}

						userService.resetPassword(userIdForPassword, newPassword);
						sendJsonResponse(exchange, 200, ApiResponse.success("Senha alterada com sucesso",
								userService.findById(userIdForPassword)));
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("Endpoint inválido"));
					}
					break;

				case "DELETE":
					String[] deletePathParts = path.split("/");
					if (deletePathParts.length >= 4) {
						Long userId = Long.parseLong(deletePathParts[3]);
						boolean deleted = userService.delete(userId);
						if (deleted) {
							sendJsonResponse(exchange, 200, ApiResponse.success("Usuário excluído com sucesso"));
						} else {
							sendJsonResponse(exchange, 404, ApiResponse.error("Usuário não encontrado"));
						}
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do usuário é obrigatório"));
					}
					break;

				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}

			} catch (NumberFormatException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error("ID inválido"));
			} catch (IllegalArgumentException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error(e.getMessage()));
			} catch (Exception e) {
				e.printStackTrace(); // Para debug
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	/**
	 * Handler para perfis
	 */
	private class ProfilesHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
//					if (!isAuthenticated(exchange)) {
//						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
//						return;
//					}
					System.out.println("Lista de Perfils");

					for (Entry<String, Boolean> iterable_element : getUser(exchange).getPermissions().entrySet()) {
						System.out.println(iterable_element.getKey());
						if (iterable_element.getKey().equalsIgnoreCase(PERMISSIONS.GERENCIAR_PERFIS.getName()))
							if (!iterable_element.getValue()) {
								Profile profile = new Profile();
								profile.setId(-1L);
								// profile.setName(getUser(exchange).getProfileName());
								// profile.setDescription(getUser(exchange).getProfileName());
								profile.setPermissions(getUser(exchange).getPermissions());
								sendJsonResponse(exchange, 200, Arrays.asList(profile));
								return;
							}
					}

//					if (getUser(exchange).getPermissions().get(PERMISSIONS.GERENCIAR_PERFIS.getName())) {
//						sendJsonResponse(exchange, 200, ApiResponse.error("Sem permisao para lista perfils"));
//						return;
//					}

					List<Profile> profiles = profileService.findAll();
					sendJsonResponse(exchange, 200, profiles);
					break;

				case "POST":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}
					String requestBody = readRequestBody(exchange);

					Profile newProfile = objectMapper.readValue(requestBody, Profile.class);

					if (!newProfile.getPermissions().keySet().stream().allMatch(x -> PERMISSIONS.containsName(x))) {
						sendJsonResponse(exchange, 200, ApiResponse.error("Um dos perfies não existe"));
						return;
					}
					Profile createdProfile = profileService.create(newProfile);
					sendJsonResponse(exchange, 201, createdProfile);
					break;

				case "PUT":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}
					String[] pathParts = path.split("/");
					if (pathParts.length >= 4) {
						Long profileId = Long.parseLong(pathParts[3]);
						String updateBody = readRequestBody(exchange);

						System.out.println(updateBody);

						Profile updateProfile = objectMapper.readValue(updateBody, Profile.class);

						if (!updateProfile.getPermissions().keySet().stream()
								.allMatch(x -> PERMISSIONS.containsName(x))) {
							sendJsonResponse(exchange, 200, ApiResponse.error("Um dos perfies não existe"));
							return;
						}

						Profile updatedProfile = profileService.update(profileId, updateProfile);
						sendJsonResponse(exchange, 200, updatedProfile);
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do perfil é obrigatório"));
					}
					break;

				case "DELETE":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}
					String[] deletePathParts = path.split("/");
					if (deletePathParts.length >= 4) {
						Long profileId = Long.parseLong(deletePathParts[3]);
						boolean deleted = profileService.delete(profileId);
						if (deleted) {
							sendJsonResponse(exchange, 200, ApiResponse.success("Perfil excluído com sucesso"));
						} else {
							sendJsonResponse(exchange, 404, ApiResponse.error("Perfil não encontrado"));
						}
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do perfil é obrigatório"));
					}
					break;

				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}

			} catch (IllegalArgumentException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error(e.getMessage()));
			} catch (Exception e) {
				e.printStackTrace(); // Para debug
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	/**
	 * Handler para produtos
	 */
	private class ProductsHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
					List<Product> products = productService.findAll();
					sendJsonResponse(exchange, 200, products);
					break;

				case "POST":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}

					NotificacaoWebSocketServer.enviarNotificacao("/produto");

					String requestBody = readRequestBody(exchange);
					Product newProduct = objectMapper.readValue(requestBody, Product.class);
					Product createdProduct = productService.create(newProduct);
					sendJsonResponse(exchange, 201, createdProduct);
					break;

				case "PUT":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}
					String[] pathParts = path.split("/");
					if (pathParts.length >= 4) {

						NotificacaoWebSocketServer.enviarNotificacao("/produto");

						Long productId = Long.parseLong(pathParts[3]);
						String updateBody = readRequestBody(exchange);
						Product updateProduct = objectMapper.readValue(updateBody, Product.class);
						Product updatedProduct = productService.update(productId, updateProduct);
						sendJsonResponse(exchange, 200, updatedProduct);
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do produto é obrigatório"));
					}
					break;

				case "DELETE":
					if (!isAuthenticated(exchange)) {
						sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
						return;
					}
					String[] deletePathParts = path.split("/");
					if (deletePathParts.length >= 4) {
						Long productId = Long.parseLong(deletePathParts[3]);
						boolean deleted = productService.delete(productId);
						NotificacaoWebSocketServer.enviarNotificacao("/produto");
						if (deleted) {
							sendJsonResponse(exchange, 200, ApiResponse.success("Produto excluído com sucesso"));
						} else {
							sendJsonResponse(exchange, 404, ApiResponse.error("Produto não encontrado"));
						}
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("ID do produto é obrigatório"));
					}
					break;

				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}

			} catch (NumberFormatException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error("ID inválido"));
			} catch (IllegalArgumentException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error(e.getMessage()));
			} catch (Exception e) {
				e.printStackTrace(); // Para debug
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	/**
	 * Handler para pedidos
	 */
	private class OrdersHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
					List<Order> allOrders = orderService.findAll();
					LocalDateTime today = LocalDateTime.now();
					LocalDateTime startOfDay = today.withHour(0).withMinute(0).withSecond(0);
					LocalDateTime endOfDay = today.withHour(23).withMinute(59).withSecond(59);

					// Pedidos de hoje
					List<Order> ordersToday = allOrders.stream()
							.filter(order -> order.getCreatedAt().isAfter(startOfDay)
									&& order.getCreatedAt().isBefore(endOfDay))
							.collect(Collectors.toList());
					sendJsonResponse(exchange, 200, ordersToday);
					break;

				case "POST":
					String requestBody = readRequestBody(exchange);
					Order newOrder = objectMapper.readValue(requestBody, Order.class);
					Order createdOrder = orderService.create(newOrder);
					NotificacaoWebSocketServer.enviarNotificacao("/pedidos");
					sendJsonResponse(exchange, 201, createdOrder);
					break;

				case "PATCH":
					// Para atualização de status: /api/orders/{id}/status
					String[] pathParts = path.split("/");
					if (pathParts.length >= 5 && "status".equals(pathParts[4])) {
						String orderId = pathParts[3];
						String statusBody = readRequestBody(exchange);
						Map<String, String> statusData = objectMapper.readValue(statusBody, Map.class);
						String newStatus = statusData.get("status");
						NotificacaoWebSocketServer.enviarNotificacao("/pedidos");
						Order updatedOrder = orderService.updateStatus(orderId, newStatus);
						NotificacaoWebSocketServer.enviarNotificacao("/chat/" + orderId);
						sendJsonResponse(exchange, 200, updatedOrder);
					} else {
						sendJsonResponse(exchange, 400, ApiResponse.error("Endpoint inválido"));
					}
					break;

				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}

			} catch (IllegalArgumentException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error(e.getMessage()));
			} catch (Exception e) {
				e.printStackTrace(); // Para debug
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	/**
	 * Handler para métricas do dashboard
	 */
	private class DashboardMetricsHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!"GET".equals(exchange.getRequestMethod())) {
				sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			if (!metricsService.isPermimissions(getUser(exchange))) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Permissão inválid"));
				return;
			}

			try {
				Map<String, Object> metrics = metricsService.getDashboardMetrics();
				sendJsonResponse(exchange, 200, metrics);

			} catch (Exception e) {
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor"));
			}
		}
	}

	/**
	 * Handler para relatórios
	 */
	private class ReportsHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!"GET".equals(exchange.getRequestMethod())) {
				sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			try {
				String query = exchange.getRequestURI().getQuery();
				String period = "month"; // padrão

				if (query != null && query.contains("period=")) {
					String[] params = query.split("&");
					for (String param : params) {
						if (param.startsWith("period=")) {
							period = param.split("=")[1];
							break;
						}
					}
				}

				Map<String, Object> reports = metricsService.getReports(period);
				sendJsonResponse(exchange, 200, reports);

			} catch (Exception e) {
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor"));
			}
		}
	}

	/**
	 * Handler para clientes (lista e detalhes)
	 */
	private class CustomersHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
					// /api/clientes or /api/clientes/{id}
					String[] parts = path.split("/");
					if (parts.length >= 4) {
						Long id = Long.parseLong(parts[3]);
						Customer cu = customerService.findById(id);
						if (cu == null) {
							sendJsonResponse(exchange, 404, ApiResponse.error("Cliente não encontrado"));
						} else {
							sendJsonResponse(exchange, 200, cu);
						}
					} else {
						List<Customer> list = customerService.findAll();
						sendJsonResponse(exchange, 200, list);
					}
					break;
				case "POST":
					String body = readRequestBody(exchange);
					Map data = objectMapper.readValue(body, Map.class);
					String name = (String) data.get("name");
					String phone = (String) data.get("phone");
					if (name == null || phone == null) {
						sendJsonResponse(exchange, 400, ApiResponse.error("Nome e telefone são obrigatórios"));
						return;
					}
					Customer saved = customerService.upsertByPhone(name, phone);

					User userFromToken = getUser(exchange);

					ActionLogger.log("INFO", "cliente_upsert", "SAVE CLIENT", userFromToken.getName(),
							userFromToken.getId(), exchange.getRemoteAddress().getAddress().getHostAddress(), body);

					sendJsonResponse(exchange, 201, saved);
					break;
				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}
			} catch (NumberFormatException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error("ID inválido"));
			} catch (Exception e) {
				e.printStackTrace();
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	private class ChatShowHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "GET":
					System.out.println(path);
					// /api/clientes or /api/clientes/{id}
					String[] parts = path.split("/");

					if (parts.length >= 3) {
						Order findById = orderService.findById(parts[4]);
						List<ChatMessage> chat = findById.getChat();
						sendJsonResponse(exchange, 200, chat);
					}
					break;
				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}
			} catch (NumberFormatException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error("ID inválido"));
			} catch (Exception e) {
				e.printStackTrace();
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	private class ChatSendHandler implements HttpHandler {
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			addCorsHeaders(exchange);

			if ("OPTIONS".equals(exchange.getRequestMethod())) {
				exchange.sendResponseHeaders(200, 0);
				exchange.close();
				return;
			}

			if (!isAuthenticated(exchange)) {
				sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
				return;
			}

			String method = exchange.getRequestMethod();
			String path = exchange.getRequestURI().getPath();

			try {
				switch (method) {
				case "POST":
					// /api/clientes or /api/clientes/{id}
					String body = readRequestBody(exchange);
					Map data = objectMapper.readValue(body, Map.class);
					String clientId = (String) data.get("clientId");
					String message = (String) data.get("message");
					String orderId = (String) data.get("orderId");
					String senderId = (String) data.get("senderId");
					String phone = (String) data.get("phone");

					User user = getUser(exchange);

					message = user.getName() + ": " + message;

					orderService.addChatMessage(orderId, message, "user");

					NotificacaoWebSocketServer.enviarNotificacao("/chat/" + orderId);

					sendJsonResponse(exchange, 200, ApiResponse.error("Método não encontrado"));
					break;
				default:
					sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
				}
			} catch (NumberFormatException e) {
				sendJsonResponse(exchange, 400, ApiResponse.error("ID inválido"));
			} catch (Exception e) {
				e.printStackTrace();
				sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor: " + e.getMessage()));
			}
		}
	}

	// Métodos utilitários

	private void addCorsHeaders(HttpExchange exchange) {
		exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
		exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
		exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	private boolean isAuthenticated(HttpExchange exchange) {
		try {
			String token = extractToken(exchange);
			return authService.validateToken(token);
		} catch (Exception e) {
			return false;
		}
	}

	private User getUser(HttpExchange exchange) {
		String token = extractToken(exchange);
		return authService.getUserFromToken(token);
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
		try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
			String line;
			while ((line = reader.readLine()) != null) {
				body.append(line);
			}
		}
		return body.toString();
	}

	private void sendJsonResponse(HttpExchange exchange, int statusCode, Object response) throws IOException {
		String jsonResponse = objectMapper.writeValueAsString(response);
		byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);

		exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
		exchange.sendResponseHeaders(statusCode, responseBytes.length);

		try (OutputStream os = exchange.getResponseBody()) {
			os.write(responseBytes);
		}
	}

	/**
	 * Método principal para iniciar a aplicação
	 */
	public static void main(String[] args) {
		try {
			int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;

			ApiController.getInstance().start(port);

//			ApiController controller = new ApiController();
//			controller.start(port);

			System.out.println("Sistema de Pedidos API iniciado com sucesso!");
			System.out.println("Usuários padrão:");
			System.out.println("- admin / 123 (Administrador)");
			System.out.println("- atendente / 123 (Atendente)");
			System.out.println("- entregador / 123 (Entregador)");

			WebSocketServer wsServer = new NotificacaoWebSocketServer(new InetSocketAddress("0.0.0.0", 8081));
			wsServer.start();

		} catch (Exception e) {
			System.err.println("Erro ao iniciar servidor: " + e.getMessage());
			e.printStackTrace();
		}
	}
}
