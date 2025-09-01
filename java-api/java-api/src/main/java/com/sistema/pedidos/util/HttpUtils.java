package com.sistema.pedidos.util;

import com.sun.net.httpserver.HttpExchange;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Utilitários para operações HTTP
 */
public final class HttpUtils {
    
    private HttpUtils() {
        // Classe utilitária - construtor privado
    }
    
    /**
     * Extrai parâmetros de query string
     */
    public static Map<String, String> parseQueryParameters(HttpExchange exchange) {
        return parseQueryParameters(exchange.getRequestURI().getQuery());
    }
    
    /**
     * Extrai parâmetros de uma query string
     */
    public static Map<String, String> parseQueryParameters(String query) {
        Map<String, String> params = new HashMap<>();
        
        if (query != null && !query.isEmpty()) {
            String[] pairs = query.split("&");
            for (String pair : pairs) {
                String[] keyValue = pair.split("=", 2);
                if (keyValue.length == 2) {
                    try {
                        String key = URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8.name());
                        String value = URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8.name());
                        params.put(key, value);
                    } catch (Exception e) {
                        // Ignora parâmetros malformados
                    }
                }
            }
        }
        
        return params;
    }
    
    /**
     * Obtém um parâmetro específico da query string
     */
    public static String getQueryParameter(HttpExchange exchange, String paramName) {
        return getQueryParameter(exchange.getRequestURI().getQuery(), paramName);
    }
    
    /**
     * Obtém um parâmetro específico da query string com valor padrão
     */
    public static String getQueryParameter(HttpExchange exchange, String paramName, String defaultValue) {
        String value = getQueryParameter(exchange.getRequestURI().getQuery(), paramName);
        return value != null ? value : defaultValue;
    }
    
    /**
     * Obtém um parâmetro específico de uma query string
     */
    public static String getQueryParameter(String query, String paramName) {
        Map<String, String> params = parseQueryParameters(query);
        return params.get(paramName);
    }
    
    /**
     * Obtém o IP do cliente da requisição
     */
    public static String getClientIp(HttpExchange exchange) {
        // Verificar headers de proxy primeiro
        String xForwardedFor = exchange.getRequestHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Pega o primeiro IP da lista (cliente original)
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = exchange.getRequestHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp.trim();
        }
        
        // Fallback para o endereço da conexão
        return exchange.getRemoteAddress().getAddress().getHostAddress();
    }
    
    /**
     * Obtém o User-Agent da requisição
     */
    public static String getUserAgent(HttpExchange exchange) {
        return exchange.getRequestHeaders().getFirst("User-Agent");
    }
    
    /**
     * Gera um ID único para a requisição
     */
    public static String generateRequestId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
    
    /**
     * Verifica se a requisição é de um navegador
     */
    public static boolean isBrowserRequest(HttpExchange exchange) {
        String userAgent = getUserAgent(exchange);
        return userAgent != null && 
               (userAgent.contains("Mozilla") || 
                userAgent.contains("Chrome") || 
                userAgent.contains("Safari") || 
                userAgent.contains("Firefox") || 
                userAgent.contains("Edge"));
    }
    
    /**
     * Obtém o tipo de conteúdo da requisição
     */
    public static String getContentType(HttpExchange exchange) {
        return exchange.getRequestHeaders().getFirst("Content-Type");
    }
    
    /**
     * Verifica se a requisição contém JSON
     */
    public static boolean isJsonRequest(HttpExchange exchange) {
        String contentType = getContentType(exchange);
        return contentType != null && contentType.toLowerCase().contains("application/json");
    }
    
    /**
     * Extrai o nome do endpoint da URI
     */
    public static String getEndpointName(HttpExchange exchange) {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        
        if (parts.length >= 3) {
            return parts[2]; // /api/{endpoint}
        }
        
        return "unknown";
    }
}