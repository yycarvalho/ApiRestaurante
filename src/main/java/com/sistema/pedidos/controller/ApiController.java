package com.sistema.pedidos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.config.AppConfig;
import com.sistema.pedidos.dto.ApiResponse;
import com.sistema.pedidos.dto.LoginRequest;
import com.sistema.pedidos.dto.LoginResponse;
import com.sistema.pedidos.middleware.SecurityMiddleware;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.model.Profile;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.*;
import com.sistema.pedidos.util.JwtUtil;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

/**
 * Controlador principal da API REST
 * Implementa servidor HTTP simples usando apenas Java 11
 */
public class ApiController {
    
    private final ObjectMapper objectMapper;
    private final AuthService authService;
    private final UserService userService;
    private final ProfileService profileService;
    private final ProductService productService;
    private final OrderService orderService;
    private final MetricsService metricsService;
    private final ChatService chatService;
    private final long startTime;
    
    public ApiController() {
        this.startTime = System.currentTimeMillis();
        this.objectMapper = new ObjectMapper();
        // Configurar ObjectMapper para suportar LocalDateTime
        this.objectMapper.findAndRegisterModules();
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Inicializar serviços
        this.profileService = new ProfileService();
        this.userService = new UserService();
        this.productService = new ProductService();
        this.orderService = new OrderService(productService);
        this.metricsService = new MetricsService(orderService, productService);
        this.authService = new AuthService(userService, profileService);
        this.chatService = new ChatService();
    }

    /**
     * Inicia o servidor HTTP
     */
    public void start(int port) throws IOException {
        // Inicializar configurações de produção
        AppConfig.initializeLogging();
        AppConfig.validateProductionConfig();
        
        HttpServer server = HttpServer.create(new InetSocketAddress(AppConfig.getHost(), port), 0);
        
        // Configurar rotas com middleware de segurança
        server.createContext("/api/auth/login", SecurityMiddleware.publicEndpoint(new LoginHandler()));
        server.createContext("/api/auth/logout", SecurityMiddleware.requireAuth(new LogoutHandler()));
        server.createContext("/api/auth/validate", SecurityMiddleware.requireAuth(new ValidateTokenHandler()));
        
        server.createContext("/api/users", SecurityMiddleware.requireAuth(new UsersHandler()));
        server.createContext("/api/profiles", SecurityMiddleware.requireAuth(new ProfilesHandler()));
        server.createContext("/api/products", SecurityMiddleware.requireAuth(new ProductsHandler()));
        server.createContext("/api/orders", SecurityMiddleware.requireAuth(new OrdersHandler()));
        server.createContext("/api/orders/chat", SecurityMiddleware.requireAuth(new ChatHandler()));
        server.createContext("/api/metrics/dashboard", SecurityMiddleware.requireAuth(new DashboardMetricsHandler()));
        server.createContext("/api/metrics/reports", SecurityMiddleware.requireAuth(new ReportsHandler()));
        server.createContext("/api/health", SecurityMiddleware.publicEndpoint(new HealthCheckHandler()));
        
        // Configurar executor com pool de threads
        server.setExecutor(java.util.concurrent.Executors.newFixedThreadPool(AppConfig.MAX_CONNECTIONS));
        
        server.start();
        
        System.out.println("=== Sistema de Pedidos API ===");
        System.out.println("Servidor iniciado na porta " + port);
        System.out.println("Host: " + AppConfig.getHost());
        System.out.println("Modo: " + (AppConfig.isProduction() ? "PRODUÇÃO" : "DESENVOLVIMENTO"));
        System.out.println("API disponível em: http://" + AppConfig.getHost() + ":" + port + "/api");
        System.out.println("Logs: " + AppConfig.LOG_FILE);
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
            
            try {
                switch (method) {
                    case "GET":
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
                        Profile createdProfile = profileService.create(newProfile);
                        sendJsonResponse(exchange, 201, createdProfile);
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
                        List<Order> orders = orderService.findAll();
                        sendJsonResponse(exchange, 200, orders);
                        break;
                        
                    case "POST":
                        String requestBody = readRequestBody(exchange);
                        Order newOrder = objectMapper.readValue(requestBody, Order.class);
                        Order createdOrder = orderService.create(newOrder);
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
                            
                            Order updatedOrder = orderService.updateStatus(orderId, newStatus);
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
     * Handler para operações de chat
     */
    private class ChatHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                String method = exchange.getRequestMethod();
                
                switch (method) {
                    case "GET":
                        handleGetChat(exchange);
                        break;
                    case "POST":
                        handlePostChat(exchange);
                        break;
                    default:
                        sendJsonResponse(exchange, 405, ApiResponse.error("Método não permitido"));
                }
                
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, ApiResponse.error("Erro interno do servidor"));
            }
        }
        
        private void handleGetChat(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String orderId = null;
            
            if (query != null && query.contains("orderId=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("orderId=")) {
                        orderId = param.split("=")[1];
                        break;
                    }
                }
            }
            
            if (orderId == null) {
                sendJsonResponse(exchange, 400, ApiResponse.error("orderId é obrigatório"));
                return;
            }
            
            List<Order.ChatMessage> chatHistory = chatService.getChatHistory(orderId);
            sendJsonResponse(exchange, 200, chatHistory);
        }
        
        private void handlePostChat(HttpExchange exchange) throws IOException {
            String requestBody = readRequestBody(exchange);
            Map<String, Object> request = objectMapper.readValue(requestBody, Map.class);
            
            String orderId = (String) request.get("orderId");
            String message = (String) request.get("message");
            String sender = (String) request.get("sender");
            String senderName = (String) request.get("senderName");
            
            if (orderId == null || message == null || sender == null) {
                sendJsonResponse(exchange, 400, ApiResponse.error("orderId, message e sender são obrigatórios"));
                return;
            }
            
            Order.ChatMessage chatMessage = chatService.addMessage(orderId, message, sender, senderName);
            sendJsonResponse(exchange, 201, chatMessage);
        }
    }

    /**
     * Handler para health check
     */
    private class HealthCheckHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                Map<String, Object> healthStatus = new HashMap<>();
                healthStatus.put("status", "OK");
                healthStatus.put("timestamp", java.time.LocalDateTime.now().toString());
                healthStatus.put("version", "3.0");
                healthStatus.put("environment", AppConfig.isProduction() ? "production" : "development");
                healthStatus.put("uptime", System.currentTimeMillis() - startTime);
                
                sendJsonResponse(exchange, 200, healthStatus);
                
            } catch (Exception e) {
                Map<String, Object> errorStatus = new HashMap<>();
                errorStatus.put("status", "ERROR");
                errorStatus.put("timestamp", java.time.LocalDateTime.now().toString());
                errorStatus.put("error", e.getMessage());
                
                sendJsonResponse(exchange, 500, errorStatus);
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
            
            ApiController controller = new ApiController();
            controller.start(port);
            
            System.out.println("Sistema de Pedidos API iniciado com sucesso!");
            System.out.println("Usuários padrão:");
            System.out.println("- admin / 123 (Administrador)");
            System.out.println("- atendente / 123 (Atendente)");
            System.out.println("- entregador / 123 (Entregador)");
            
        } catch (Exception e) {
            System.err.println("Erro ao iniciar servidor: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

