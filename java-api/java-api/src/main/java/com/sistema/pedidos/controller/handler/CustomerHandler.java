package com.sistema.pedidos.controller.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.model.Customer;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sistema.pedidos.util.ActionLogger;
import com.sun.net.httpserver.HttpExchange;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Handler para operações com clientes
 */
@Slf4j
public class CustomerHandler extends BaseHandler {
    
    public CustomerHandler(ServiceContainer services, ObjectMapper objectMapper) {
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
                    handleGetCustomers(exchange, path);
                    break;
                case "POST":
                    handleCreateOrUpdateCustomer(exchange);
                    break;
                default:
                    sendMethodNotAllowedResponse(exchange);
            }
        } catch (NumberFormatException e) {
            sendBadRequestResponse(exchange, "ID inválido");
        } catch (Exception e) {
            log.error("Error handling customer request", e);
            sendErrorResponse(exchange, 500, "Erro interno do servidor: " + e.getMessage());
        }
    }
    
    private void handleGetCustomers(HttpExchange exchange, String path) throws IOException {
        String[] pathParts = path.split("/");
        
        if (pathParts.length >= 4) {
            // GET /api/clientes/{id}
            handleGetCustomerById(exchange, pathParts[3]);
        } else {
            // GET /api/clientes
            handleGetAllCustomers(exchange);
        }
    }
    
    private void handleGetCustomerById(HttpExchange exchange, String customerIdStr) throws IOException {
        Long customerId = Long.parseLong(customerIdStr);
        Customer customer = services.getCustomerService().findById(customerId);
        
        if (customer == null) {
            sendNotFoundResponse(exchange, "Cliente");
        } else {
            sendSuccessResponse(exchange, customer);
        }
    }
    
    private void handleGetAllCustomers(HttpExchange exchange) throws IOException {
        List<Customer> customers = services.getCustomerService().findAll();
        sendSuccessResponse(exchange, customers);
    }
    
    private void handleCreateOrUpdateCustomer(HttpExchange exchange) throws IOException {
        Map<String, Object> data = parseRequestBodyAsMap(exchange);
        
        String name = (String) data.get("name");
        String phone = (String) data.get("phone");
        
        if (name == null || phone == null) {
            sendBadRequestResponse(exchange, "Nome e telefone são obrigatórios");
            return;
        }
        
        Customer savedCustomer = services.getCustomerService().upsertByPhone(name, phone);
        
        // Log da operação
        logCustomerOperation(exchange, data);
        
        sendCreatedResponse(exchange, savedCustomer);
    }
    
    private void logCustomerOperation(HttpExchange exchange, Map<String, Object> data) {
        try {
            User currentUser = getAuthenticatedUser(exchange);
            String clientIp = exchange.getRemoteAddress().getAddress().getHostAddress();
            String requestBody = objectMapper.writeValueAsString(data);
            
            ActionLogger.log("INFO", "cliente_upsert", "SAVE CLIENT", 
                           currentUser.getName(), currentUser.getId(), 
                           clientIp, requestBody);
                           
        } catch (Exception e) {
            log.warn("Failed to log customer operation", e);
        }
    }
}