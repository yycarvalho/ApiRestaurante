package com.sistema.pedidos.util;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Utilitário simples para acessar DataSource/Connections
 */
public class Db {
//    public static DataSource ds() {
//        return DatabaseConfig.getConnection();
//    }

    public static Connection getConnection() throws SQLException {
        return DatabaseConfig.getConnection();
    }

    public static void closeQuietly(AutoCloseable c) {
        if (c != null) {
            try { c.close(); } catch (Exception ignored) {}
        }
    }
}

