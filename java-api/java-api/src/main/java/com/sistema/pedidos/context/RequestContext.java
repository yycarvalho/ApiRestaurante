package com.sistema.pedidos.context;

import com.sistema.pedidos.model.User;

/**
 * Context para armazenar informações da requisição atual
 * Utilizando ThreadLocal para isolamento entre threads
 */
public final class RequestContext {
    
    private static final ThreadLocal<RequestContextData> CONTEXT = new ThreadLocal<>();
    
    private RequestContext() {
        // Classe utilitária - construtor privado
    }
    
    /**
     * Inicializa o contexto da requisição
     */
    public static void initialize(String requestId, String clientIp, User authenticatedUser) {
        RequestContextData data = RequestContextData.builder()
                .requestId(requestId)
                .clientIp(clientIp)
                .authenticatedUser(authenticatedUser)
                .startTime(System.currentTimeMillis())
                .build();
        
        CONTEXT.set(data);
    }
    
    /**
     * Obtém o ID da requisição atual
     */
    public static String getRequestId() {
        RequestContextData data = CONTEXT.get();
        return data != null ? data.getRequestId() : null;
    }
    
    /**
     * Obtém o IP do cliente
     */
    public static String getClientIp() {
        RequestContextData data = CONTEXT.get();
        return data != null ? data.getClientIp() : null;
    }
    
    /**
     * Obtém o usuário autenticado
     */
    public static User getAuthenticatedUser() {
        RequestContextData data = CONTEXT.get();
        return data != null ? data.getAuthenticatedUser() : null;
    }
    
    /**
     * Obtém o tempo de início da requisição
     */
    public static Long getStartTime() {
        RequestContextData data = CONTEXT.get();
        return data != null ? data.getStartTime() : null;
    }
    
    /**
     * Calcula o tempo de processamento da requisição
     */
    public static long getProcessingTime() {
        Long startTime = getStartTime();
        return startTime != null ? System.currentTimeMillis() - startTime : 0;
    }
    
    /**
     * Limpa o contexto da thread atual
     */
    public static void clear() {
        CONTEXT.remove();
    }
    
    /**
     * Classe interna para dados do contexto
     */
    private static class RequestContextData {
        private final String requestId;
        private final String clientIp;
        private final User authenticatedUser;
        private final long startTime;
        
        private RequestContextData(Builder builder) {
            this.requestId = builder.requestId;
            this.clientIp = builder.clientIp;
            this.authenticatedUser = builder.authenticatedUser;
            this.startTime = builder.startTime;
        }
        
        public String getRequestId() { return requestId; }
        public String getClientIp() { return clientIp; }
        public User getAuthenticatedUser() { return authenticatedUser; }
        public long getStartTime() { return startTime; }
        
        public static Builder builder() {
            return new Builder();
        }
        
        private static class Builder {
            private String requestId;
            private String clientIp;
            private User authenticatedUser;
            private long startTime;
            
            public Builder requestId(String requestId) {
                this.requestId = requestId;
                return this;
            }
            
            public Builder clientIp(String clientIp) {
                this.clientIp = clientIp;
                return this;
            }
            
            public Builder authenticatedUser(User authenticatedUser) {
                this.authenticatedUser = authenticatedUser;
                return this;
            }
            
            public Builder startTime(long startTime) {
                this.startTime = startTime;
                return this;
            }
            
            public RequestContextData build() {
                return new RequestContextData(this);
            }
        }
    }
}