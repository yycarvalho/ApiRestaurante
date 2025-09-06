package com.sistema.pedidos.controller;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

import org.java_websocket.server.WebSocketServer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sistema.pedidos.config.ServerConfig;
import com.sistema.pedidos.controller.handler.AuthHandler;
import com.sistema.pedidos.controller.handler.ChatHandler;
import com.sistema.pedidos.controller.handler.CorsHandler;
import com.sistema.pedidos.controller.handler.CustomerHandler;
import com.sistema.pedidos.controller.handler.HandlerContainer;
import com.sistema.pedidos.controller.handler.MetricsHandler;
import com.sistema.pedidos.controller.handler.OrderHandler;
import com.sistema.pedidos.controller.handler.ProductHandler;
import com.sistema.pedidos.controller.handler.ProfileHandler;
import com.sistema.pedidos.controller.handler.UserHandler;
import com.sistema.pedidos.exception.ApiException;
import com.sistema.pedidos.service.AuthService;
import com.sistema.pedidos.service.CustomerService;
import com.sistema.pedidos.service.MetricsService;
import com.sistema.pedidos.service.OrderService;
import com.sistema.pedidos.service.ProductService;
import com.sistema.pedidos.service.ProfileService;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.pedidos.service.UserService;
import com.sistema.websocket.NotificacaoWebSocketServer;
import com.sun.net.httpserver.HttpServer;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * Controlador principal da API REST Implementa servidor HTTP usando Java 11 com
 * arquitetura moderna
 */
@Slf4j
@Getter
public class ApiController {

	private final ObjectMapper objectMapper;
	private final ServiceContainer services;
	private final HandlerContainer handlers;
	private final ServerConfig config;

	public ApiController() {
		this.config = ServerConfig.getInstance();
		this.objectMapper = configureObjectMapper();
		this.services = initializeServices();
		this.handlers = initializeHandlers();
	}

	/**
	 * Configuração do ObjectMapper com módulos necessários
	 */
	private ObjectMapper configureObjectMapper() {
		return new ObjectMapper().registerModule(new JavaTimeModule())
				.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
				.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
	}

	/**
	 * Inicialização de todos os serviços da aplicação
	 */
	private ServiceContainer initializeServices() {
		ProfileService profileService = new ProfileService();
		UserService userService = new UserService();
		ProductService productService = new ProductService();
		OrderService orderService = new OrderService(productService);
		MetricsService metricsService = new MetricsService(orderService, productService);
		AuthService authService = new AuthService(userService, profileService);
		CustomerService customerService = new CustomerService();

		return ServiceContainer.builder().authService(authService).userService(userService)
				.profileService(profileService).productService(productService).orderService(orderService)
				.metricsService(metricsService).customerService(customerService).build();
	}

	/**
	 * Inicialização de todos os handlers da API
	 */
	private HandlerContainer initializeHandlers() {
		return HandlerContainer.builder().corsHandler(new CorsHandler())
				.authHandler(new AuthHandler(services.getAuthService(), objectMapper))
				.userHandler(new UserHandler(services, objectMapper))
				.profileHandler(new ProfileHandler(services, objectMapper))
				.productHandler(new ProductHandler(services, objectMapper))
				.orderHandler(new OrderHandler(services, objectMapper))
				.metricsHandler(new MetricsHandler(services, objectMapper))
				.customerHandler(new CustomerHandler(services, objectMapper))
				.chatHandler(new ChatHandler(services, objectMapper)).build();
	}

	/**
	 * Inicia o servidor HTTP
	 */
	public void start(int port) throws IOException {
		HttpServer server = createHttpServer(port);
		configureRoutes(server);
		configureServerSettings(server);

		server.start();
		startWebSocketServer();
		logServerStartup(port);
	}

	private HttpServer createHttpServer(int port) throws IOException {
		return HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
	}

	private void configureRoutes(HttpServer server) {
		// Rotas de autenticação

		server.createContext("/api/auth/login", handlers.getAuthHandler()::handleLogin);
		server.createContext("/api/auth/logout", handlers.getAuthHandler()::handleLogout);
		server.createContext("/api/auth/validate", handlers.getAuthHandler()::handleValidateToken);

		// Rotas de recursos
		server.createContext("/api/users", handlers.getUserHandler());
		server.createContext("/api/profiles", handlers.getProfileHandler());
		server.createContext("/api/products", handlers.getProductHandler());
		server.createContext("/api/orders", handlers.getOrderHandler());
		server.createContext("/api/clientes", handlers.getCustomerHandler());

		// Rotas de métricas
		server.createContext("/api/metrics/dashboard", handlers.getMetricsHandler()::handleDashboard);
		server.createContext("/api/metrics/reports", handlers.getMetricsHandler()::handleReports);

		// Rotas de chat
		server.createContext("/api/chat/send", handlers.getChatHandler()::handleSendMessage);
		server.createContext("/api/chat/messages", handlers.getChatHandler()::handleGetMessages);

		// Handler padrão para CORS
		server.createContext("/", handlers.getCorsHandler());
	}

	private void configureServerSettings(HttpServer server) {
		server.setExecutor(Executors.newFixedThreadPool(config.getThreadPoolSize()));
	}

	private void startWebSocketServer() {
		try {
			WebSocketServer wsServer = new NotificacaoWebSocketServer(
					new InetSocketAddress("0.0.0.0", config.getWebSocketPort()));
			wsServer.start();
			log.info("WebSocket server started on port {}", config.getWebSocketPort());
		} catch (Exception e) {
			log.error("Failed to start WebSocket server", e);
			throw new ApiException("Failed to start WebSocket server", e);
		}
	}

	private void logServerStartup(int port) {
		log.info("Servidor iniciado na porta {}", port);
		log.info("API disponível em: http://localhost:{}/api", port);
		log.info("Sistema de Pedidos API iniciado com sucesso!");
		logDefaultUsers();
	}

	private void logDefaultUsers() {
		log.info("Usuários padrão:");
		log.info("- admin / 123 (Administrador)");
		log.info("- atendente / 123 (Atendente)");
		log.info("- entregador / 123 (Entregador)");
	}

	// Singleton pattern with thread safety
	public static ApiController getInstance() {
		return SingletonHolder.INSTANCE;
	}

	private static class SingletonHolder {
		private static final ApiController INSTANCE = new ApiController();
	}

	/**
	 * Método principal para iniciar a aplicação
	 */
	public static void main(String[] args) {
		try {
			int port = parsePort(args);
			ApiController.getInstance().start(port);
		} catch (Exception e) {
			log.error("Erro ao iniciar servidor", e);
			System.exit(1);
		}
	}

	private static int parsePort(String[] args) {
		if (args.length > 0) {
			try {
				return Integer.parseInt(args[0]);
			} catch (NumberFormatException e) {
				log.warn("Porta inválida '{}', usando porta padrão 8080", args[0]);
			}
		}
		return 8080;
	}
}