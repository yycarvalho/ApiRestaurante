package com.sistema.pedidos.service;

import lombok.Builder;
import lombok.Getter;

/**
 * Container para todos os serviços da aplicação
 * Centraliza o acesso aos serviços e facilita injeção de dependência
 */
@Builder
@Getter
public class ServiceContainer {
    
    private final AuthService authService;
    private final UserService userService;
    private final ProfileService profileService;
    private final ProductService productService;
    private final OrderService orderService;
    private final MetricsService metricsService;
    private final CustomerService customerService;
    
}