package com.sistema.pedidos.config;

import java.util.logging.Logger;
import java.util.logging.Level;
import java.util.logging.FileHandler;
import java.util.logging.SimpleFormatter;
import java.io.IOException;

/**
 * Configurações da aplicação para produção
 */
public class AppConfig {
    
    private static final Logger LOGGER = Logger.getLogger(AppConfig.class.getName());
    
    // Configurações de produção
    public static final int DEFAULT_PORT = 8080;
    public static final String DEFAULT_HOST = "0.0.0.0";
    public static final int MAX_CONNECTIONS = 100;
    public static final int REQUEST_TIMEOUT = 30; // segundos
    
    // Configurações de segurança
    public static final String JWT_SECRET = System.getenv("JWT_SECRET") != null ? 
        System.getenv("JWT_SECRET") : "sistema_pedidos_secret_key_2024_producao";
    public static final int JWT_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas em ms
    
    // Configurações de CORS
    public static final String[] ALLOWED_ORIGINS = {
        "http://localhost:3000",
        "http://localhost:8080",
        "https://seudominio.com",
        "https://www.seudominio.com"
    };
    
    // Configurações de logging
    public static final String LOG_FILE = "logs/sistema_pedidos.log";
    public static final int LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    public static final int LOG_FILE_COUNT = 5;
    
    // Configurações de banco de dados MySQL
    public static final String DB_URL = System.getenv("DB_URL") != null ? 
        System.getenv("DB_URL") : "jdbc:mysql://localhost:3306/sistema_pedidos?useSSL=false&serverTimezone=UTC";
    public static final String DB_USER = System.getenv("DB_USER") != null ? 
        System.getenv("DB_USER") : "root";
    public static final String DB_PASSWORD = System.getenv("DB_PASSWORD") != null ? 
        System.getenv("DB_PASSWORD") : "";
    
    /**
     * Inicializa o sistema de logging
     */
    public static void initializeLogging() {
        try {
            // Criar diretório de logs se não existir
            java.io.File logDir = new java.io.File("logs");
            if (!logDir.exists()) {
                logDir.mkdirs();
            }
            
            // Configurar FileHandler
            FileHandler fileHandler = new FileHandler(LOG_FILE, LOG_FILE_SIZE, LOG_FILE_COUNT, true);
            fileHandler.setFormatter(new SimpleFormatter());
            
            // Configurar Logger
            Logger rootLogger = Logger.getLogger("");
            rootLogger.addHandler(fileHandler);
            rootLogger.setLevel(Level.INFO);
            
            LOGGER.info("Sistema de logging inicializado com sucesso");
            
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Erro ao inicializar sistema de logging", e);
        }
    }
    
    /**
     * Verifica se a aplicação está rodando em produção
     */
    public static boolean isProduction() {
        String env = System.getenv("ENVIRONMENT");
        return "production".equals(env) || "prod".equals(env);
    }
    
    /**
     * Obtém configuração de porta da aplicação
     */
    public static int getPort() {
        String portEnv = System.getenv("PORT");
        if (portEnv != null) {
            try {
                return Integer.parseInt(portEnv);
            } catch (NumberFormatException e) {
                LOGGER.warning("Porta inválida no ambiente: " + portEnv + ". Usando porta padrão: " + DEFAULT_PORT);
            }
        }
        return DEFAULT_PORT;
    }
    
    /**
     * Obtém configuração de host da aplicação
     */
    public static String getHost() {
        String hostEnv = System.getenv("HOST");
        return hostEnv != null ? hostEnv : DEFAULT_HOST;
    }
    
    /**
     * Valida configurações de produção
     */
    public static void validateProductionConfig() {
        if (isProduction()) {
            LOGGER.info("Executando em modo PRODUÇÃO");
            
            // Verificar variáveis de ambiente críticas
            if (System.getenv("JWT_SECRET") == null) {
                LOGGER.warning("JWT_SECRET não definido em produção! Usando chave padrão.");
            }
            
            if (System.getenv("DB_URL") == null) {
                LOGGER.warning("DB_URL não definido em produção! Usando banco local.");
            }
        } else {
            LOGGER.info("Executando em modo DESENVOLVIMENTO");
        }
    }
}