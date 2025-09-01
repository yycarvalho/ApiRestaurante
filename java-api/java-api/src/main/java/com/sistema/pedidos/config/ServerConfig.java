package com.sistema.pedidos.config;

import lombok.Getter;

/**
 * Configurações do servidor
 */
@Getter
public class ServerConfig {
    
    private final int threadPoolSize;
    private final int webSocketPort;
    private final String corsAllowOrigin;
    private final String corsAllowMethods;
    private final String corsAllowHeaders;
    
    private ServerConfig() {
        this.threadPoolSize = Integer.parseInt(getEnvOrDefault("THREAD_POOL_SIZE", "10"));
        this.webSocketPort = Integer.parseInt(getEnvOrDefault("WEBSOCKET_PORT", "8081"));
        this.corsAllowOrigin = getEnvOrDefault("CORS_ALLOW_ORIGIN", "*");
        this.corsAllowMethods = getEnvOrDefault("CORS_ALLOW_METHODS", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        this.corsAllowHeaders = getEnvOrDefault("CORS_ALLOW_HEADERS", "Content-Type, Authorization");
    }
    
    private String getEnvOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        return value != null ? value : defaultValue;
    }
    
    public static ServerConfig getInstance() {
        return SingletonHolder.INSTANCE;
    }
    
    private static class SingletonHolder {
        private static final ServerConfig INSTANCE = new ServerConfig();
    }
    
}