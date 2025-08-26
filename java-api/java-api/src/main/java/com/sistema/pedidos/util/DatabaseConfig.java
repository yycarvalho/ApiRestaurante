package com.sistema.pedidos.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

/**
 * Configuração de conexão com MySQL usando HikariCP
 */
public class DatabaseConfig {

    private static volatile HikariDataSource dataSource;

    public static DataSource getDataSource() {
        if (dataSource == null) {
            synchronized (DatabaseConfig.class) {
                if (dataSource == null) {
                    HikariConfig config = new HikariConfig();

                    String host = getEnvOrDefault("DB_HOST", "localhost");
                    String port = getEnvOrDefault("DB_PORT", "3306");
                    String db = getEnvOrDefault("DB_NAME", "pedidos");
                    String user = getEnvOrDefault("DB_USER", "root");
                    String pass = getEnvOrDefault("DB_PASS", "");

                    String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + db + "?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
                    config.setJdbcUrl(jdbcUrl);
                    config.setUsername(user);
                    config.setPassword(pass);

                    config.setMaximumPoolSize(10);
                    config.setMinimumIdle(2);
                    config.setIdleTimeout(60000);
                    config.setConnectionTimeout(10000);
                    config.setLeakDetectionThreshold(120000);
                    config.setPoolName("PedidosHikariCP");

                    // Segurança básica
                    config.addDataSourceProperty("cachePrepStmts", "true");
                    config.addDataSourceProperty("prepStmtCacheSize", "250");
                    config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

                    dataSource = new HikariDataSource(config);
                }
            }
        }
        return dataSource;
    }

    private static String getEnvOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        return value == null || value.isEmpty() ? defaultValue : value;
    }
}

