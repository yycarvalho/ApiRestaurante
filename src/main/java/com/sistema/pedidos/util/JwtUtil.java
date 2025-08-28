package com.sistema.pedidos.util;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Utilitário para geração e validação de tokens JWT simplificado
 * Implementação básica sem dependências externas
 */
public class JwtUtil {
    
    private static final String SECRET_KEY = "sistema-pedidos-secret-key-2024";
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 horas em millisegundos

    /**
     * Gera um token JWT para o usuário
     */
    public static String generateToken(String username) {
        try {
            // Header
            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            
            // Payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", username);
            payload.put("iat", System.currentTimeMillis());
            payload.put("exp", System.currentTimeMillis() + EXPIRATION_TIME);
            
            // Converter para JSON simplificado e codificar em Base64
            String headerJson = mapToJson(header);
            String payloadJson = mapToJson(payload);
            
            String encodedHeader = base64UrlEncode(headerJson);
            String encodedPayload = base64UrlEncode(payloadJson);
            
            // Criar assinatura simplificada
            String signature = createSignature(encodedHeader + "." + encodedPayload);
            
            return encodedHeader + "." + encodedPayload + "." + signature;
            
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar token JWT", e);
        }
    }

    /**
     * Valida um token JWT
     */
    public static boolean validateToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return false;
            }
            
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            
            String encodedHeader = parts[0];
            String encodedPayload = parts[1];
            String signature = parts[2];
            
            // Verificar assinatura
            String expectedSignature = createSignature(encodedHeader + "." + encodedPayload);
            if (!signature.equals(expectedSignature)) {
                return false;
            }
            
            // Verificar expiração
            String payloadJson = base64UrlDecode(encodedPayload);
            Map<String, Object> payload = jsonToMap(payloadJson);
            
            Long exp = (Long) payload.get("exp");
            if (exp == null || exp < System.currentTimeMillis()) {
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrai o username do token
     */
    public static String getUsernameFromToken(String token) {
        try {
            if (!validateToken(token)) {
                return null;
            }
            
            String[] parts = token.split("\\.");
            String payloadJson = base64UrlDecode(parts[1]);
            Map<String, Object> payload = jsonToMap(payloadJson);
            
            return (String) payload.get("sub");
            
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Verifica se o token está expirado
     */
    public static boolean isTokenExpired(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return true;
            }
            
            String payloadJson = base64UrlDecode(parts[1]);
            Map<String, Object> payload = jsonToMap(payloadJson);
            
            Long exp = (Long) payload.get("exp");
            return exp == null || exp < System.currentTimeMillis();
            
        } catch (Exception e) {
            return true;
        }
    }

    // Métodos auxiliares
    private static String createSignature(String data) {
        try {
            // Assinatura simplificada usando hash do conteúdo + chave secreta
            String toSign = data + SECRET_KEY;
            return base64UrlEncode(String.valueOf(toSign.hashCode()));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao criar assinatura", e);
        }
    }

    private static String base64UrlEncode(String data) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(data.getBytes(StandardCharsets.UTF_8));
    }

    private static String base64UrlDecode(String data) {
        return new String(Base64.getUrlDecoder().decode(data), StandardCharsets.UTF_8);
    }

    private static String mapToJson(Map<String, Object> map) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":");
            
            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else {
                json.append(value);
            }
            
            first = false;
        }
        
        json.append("}");
        return json.toString();
    }

    private static Map<String, Object> jsonToMap(String json) {
        Map<String, Object> map = new HashMap<>();
        
        // Parser JSON simplificado
        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1);
            
            String[] pairs = json.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":");
                if (keyValue.length == 2) {
                    String key = keyValue[0].trim().replaceAll("\"", "");
                    String value = keyValue[1].trim();
                    
                    if (value.startsWith("\"") && value.endsWith("\"")) {
                        // String value
                        map.put(key, value.substring(1, value.length() - 1));
                    } else {
                        // Numeric value
                        try {
                            map.put(key, Long.parseLong(value));
                        } catch (NumberFormatException e) {
                            map.put(key, value);
                        }
                    }
                }
            }
        }
        
        return map;
    }
}

