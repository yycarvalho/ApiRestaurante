package com.sistema.pedidos.controller.handler;

import lombok.Builder;
import lombok.Getter;

/**
 * Container para todos os handlers da aplicação
 * Centraliza o acesso aos handlers HTTP
 */
@Builder
@Getter
public class HandlerContainer {
    
    private final CorsHandler corsHandler;
    private final AuthHandler authHandler;
    private final UserHandler userHandler;
    private final ProfileHandler profileHandler;
    private final ProductHandler productHandler;
    private final OrderHandler orderHandler;
    private final MetricsHandler metricsHandler;
    private final CustomerHandler customerHandler;
    private final ChatHandler chatHandler;
    
}