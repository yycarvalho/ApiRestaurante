package com.sistema.pedidos.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Configuração de banco de dados com HikariCP
 */
public class DatabaseConfig {
    
    private static HikariDataSource dataSource;
    
    /**
     * Inicializa o pool de conexões
     */
    public static void initialize() {
        HikariConfig config = new HikariConfig();
        
        // Configurações básicas
        config.setJdbcUrl(AppConfig.DB_URL);
        config.setUsername(AppConfig.DB_USER);
        config.setPassword(AppConfig.DB_PASSWORD);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Configurações do pool
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setIdleTimeout(300000); // 5 minutos
        config.setMaxLifetime(1800000); // 30 minutos
        config.setConnectionTimeout(30000); // 30 segundos
        
        dataSource = new HikariDataSource(config);
    }
    
    /**
     * Obtém o DataSource configurado
     */
    public static DataSource getDataSource() {
        if (dataSource == null) {
            initialize();
        }
        return dataSource;
    }
    
    /**
     * Obtém uma conexão do pool
     */
    public static Connection getConnection() throws SQLException {
        return getDataSource().getConnection();
    }
    
    /**
     * Testa a conexão com o banco
     */
    public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn.isValid(5);
        } catch (SQLException e) {
            System.err.println("Erro ao testar conexão com banco: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Fecha o pool de conexões
     */
    public static void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
