package com.sistema.pedidos.controller.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.service.ServiceContainer;
import com.sun.net.httpserver.HttpExchange;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Map;

/**
 * Handler para métricas e relatórios
 */
@Slf4j
public class MetricsHandler extends BaseHandler {
    
    public MetricsHandler(ServiceContainer services, ObjectMapper objectMapper) {
        super(services, objectMapper);
    }
    
    @Override
    protected void handleRequest(HttpExchange exchange) throws IOException {
        // Este método não é usado diretamente, pois usamos métodos específicos
        sendMethodNotAllowedResponse(exchange);
    }
    
    public void handleDashboard(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        
        if (isOptionsRequest(exchange)) {
            handleOptionsRequest(exchange);
            return;
        }
        
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendMethodNotAllowedResponse(exchange);
            return;
        }
        
        if (!isAuthenticated(exchange)) {
            sendUnauthorizedResponse(exchange);
            return;
        }
        
        User currentUser = getAuthenticatedUser(exchange);
        
        // Verificar se o usuário tem permissão para visualizar métricas
        if (!services.getMetricsService().isPermimissions(currentUser)) {
            sendForbiddenResponse(exchange);
            return;
        }
        
        try {
            Map<String, Object> metrics = services.getMetricsService().getDashboardMetrics();
            sendSuccessResponse(exchange, metrics);
            
        } catch (Exception e) {
            log.error("Error getting dashboard metrics", e);
            sendErrorResponse(exchange, 500, "Erro interno do servidor");
        }
    }
    
    public void handleReports(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        
        if (isOptionsRequest(exchange)) {
            handleOptionsRequest(exchange);
            return;
        }
        
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendMethodNotAllowedResponse(exchange);
            return;
        }
        
        if (!isAuthenticated(exchange)) {
            sendUnauthorizedResponse(exchange);
            return;
        }
        
        try {
            String period = extractPeriodFromQuery(exchange);
            Map<String, Object> reports = services.getMetricsService().getReports(period);
            sendSuccessResponse(exchange, reports);
            
        } catch (Exception e) {
            log.error("Error getting reports", e);
            sendErrorResponse(exchange, 500, "Erro interno do servidor");
        }
    }
    
    private String extractPeriodFromQuery(HttpExchange exchange) {
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
        
        return period;
    }
}