package com.sistema.pedidos;

import com.sistema.pedidos.config.AppConfig;
import com.sistema.pedidos.config.DatabaseConfig;
import com.sistema.pedidos.controller.ApiController;

/**
 * Classe principal do servidor
 */
public class StartServer {
    
    public static void main(String[] args) {
        try {
            System.out.println("=== Iniciando Sistema de Pedidos ===");
            
            // Inicializar configurações
            AppConfig.initializeLogging();
            AppConfig.validateProductionConfig();
            
            // Inicializar banco de dados
            DatabaseConfig.initialize();
            
            if (!DatabaseConfig.testConnection()) {
                System.err.println("❌ Erro: Não foi possível conectar ao banco de dados!");
                System.err.println("Verifique se o MySQL está rodando e as configurações estão corretas.");
                System.exit(1);
            }
            
            System.out.println("✅ Conexão com banco de dados estabelecida");
            
            // Iniciar servidor HTTP
            ApiController apiController = new ApiController();
            int port = AppConfig.getPort();
            
            apiController.start(port);
            
            System.out.println("✅ Servidor iniciado com sucesso!");
            System.out.println("🌐 API disponível em: http://localhost:" + port + "/api");
            
            // Aguardar shutdown
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n🛑 Encerrando servidor...");
                DatabaseConfig.shutdown();
                System.out.println("✅ Servidor encerrado");
            }));
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao iniciar servidor: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
