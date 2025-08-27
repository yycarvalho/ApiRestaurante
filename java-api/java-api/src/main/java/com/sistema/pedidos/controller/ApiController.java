package com.sistema.pedidos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.dto.ApiResponse;
import com.sistema.pedidos.dto.LoginRequest;
import com.sistema.pedidos.dto.LoginResponse;
import com.sistema.pedidos.model.Order;
import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.model.Profile;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.*;
import com.sistema.pedidos.util.JwtUtil;
import com.sistema.pedidos.model.Customer;
import com.sistema.pedidos.util.ActionLogger;
import com.sistema.pedidos.util.Db;

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
    private final CustomerService customerService;
    
    public ApiController() {
        this.objectMapper = new ObjectMapper();
        // Configurar ObjectMapper para suportar LocalDateTime
        this.objectMapper.findAndRegisterModules();
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Não falhar em propriedades desconhecidas vindas do frontend
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // Inicializar serviços
        this.profileService = new ProfileService();
        this.userService = new UserService();
        this.productService = new ProductService();
        this.orderService = new OrderService(productService);
        this.metricsService = new MetricsService(orderService, productService);
        this.authService = new AuthService(userService, profileService);
        this.customerService = new CustomerService();
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
        
        // Handler para CORS
        server.createContext("/", new CorsHandler());
        
        server.setExecutor(null);
        server.start();
        
        System.out.println("Servidor iniciado na porta " + port);
        System.out.println("API disponível em: http://localhost:" + port + "/api");
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                System.out.println("Payload (Login): " + requestBody);
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                        System.out.println("Payload (Users POST): " + requestBody);
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
                            System.out.println("Payload (Users PUT): " + updateBody);
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
                            sendJsonResponse(exchange, 200, ApiResponse.success("Senha alterada com sucesso", userService.findById(userIdForPassword)));
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                        List<Profile> profiles = profileService.findAll();
                        sendJsonResponse(exchange, 200, profiles);
                        break;
                        
                    case "POST":
                        if (!isAuthenticated(exchange)) {
                            sendJsonResponse(exchange, 401, ApiResponse.error("Token inválido"));
                            return;
                        }
                        String requestBody = readRequestBody(exchange);
                        System.out.println("Payload (Profiles POST): " + requestBody);
                        Profile newProfile = objectMapper.readValue(requestBody, Profile.class);
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
                            System.out.println("Payload (Profiles PUT): " + updateBody);
                            Profile updateProfile = objectMapper.readValue(updateBody, Profile.class);
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                        System.out.println("Payload (Products POST): " + requestBody);
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
                            System.out.println("Payload (Products PUT): " + updateBody);
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                        System.out.println("Payload (Orders POST): " + requestBody);
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
                            System.out.println("Payload (Orders PATCH): " + statusBody);
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
            System.out.println("\n--- Nova Requisição ---");
            System.out.println("URI: " + exchange.getRequestURI());
            System.out.println("Método: " + exchange.getRequestMethod());
            System.out.println("Headers: " + exchange.getRequestHeaders());
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
                        System.out.println("Payload (Customers POST): " + body);
                        Map data = objectMapper.readValue(body, Map.class);
                        String name = (String) data.get("name");
                        String phone = (String) data.get("phone");
                        if (name == null || phone == null) {
                            sendJsonResponse(exchange, 400, ApiResponse.error("Nome e telefone são obrigatórios"));
                            return;
                        }
                        Customer saved = customerService.upsertByPhone(name, phone);
                        ActionLogger.log("INFO", "cliente_upsert", "Cliente salvo", null, null, null, null);
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