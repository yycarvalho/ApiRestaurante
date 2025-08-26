package com.sistema.pedidos.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Configuração de conexão com MySQL usando MySQL Connector/J
 */
public class DatabaseConfig {

    private static final String HOST = "localhost";
    private static final String PORT = "3306";
    private static final String DB = "db";
    private static final String USER = "root";
    private static final String PASS = "root";
    private static final String JDBC_URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DB
            + "?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";

    static {
        try {
            // Registra o driver MySQL
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("Driver JDBC MySQL não encontrado!");
            e.printStackTrace();
        }
    }

    /**
     * Retorna uma conexão ativa com o banco
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(JDBC_URL, USER, PASS);
    }
}
