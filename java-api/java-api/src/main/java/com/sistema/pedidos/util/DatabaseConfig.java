package com.sistema.pedidos.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Configuração de conexão com H2 (banco em memória) para desenvolvimento
 */
public class DatabaseConfig {

    private static final String JDBC_URL = "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
    private static final String USER = "sa";
    private static final String PASS = "";

    static {
        try {
            // Registra o driver H2
            Class.forName("org.h2.Driver");
            
            // Inicializar banco com tabelas
            initializeDatabase();
        } catch (ClassNotFoundException e) {
            System.err.println("Driver JDBC H2 não encontrado!");
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("Erro ao inicializar banco de dados!");
            e.printStackTrace();
        }
    }

    /**
     * Inicializa o banco de dados com as tabelas necessárias
     */
    private static void initializeDatabase() throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            
            // Criar tabelas
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    permissions VARCHAR(1000),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);
            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    profile_id BIGINT,
                    active BOOLEAN DEFAULT TRUE,
                    last_login TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);
            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);
            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);
            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id VARCHAR(20) PRIMARY KEY,
                    customer_id BIGINT NOT NULL,
                    customer_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    address TEXT,
                    status VARCHAR(50) DEFAULT 'em_atendimento',
                    total DECIMAL(10,2) DEFAULT 0.00,
                    items VARCHAR(1000),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);
            
            // Inserir dados iniciais
            stmt.execute("""
                INSERT INTO profiles (id, name, permissions) VALUES 
                (1, 'Administrador', '{"all": true}'),
                (2, 'Atendente', '{"orders": true, "customers": true, "products": true}'),
                (3, 'Entregador', '{"orders": true, "delivery": true}')
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """);
            
            stmt.execute("""
                INSERT INTO users (id, name, username, password, profile_id) VALUES 
                (1, 'Administrador', 'admin', '123', 1),
                (2, 'Atendente', 'atendente', '123', 2),
                (3, 'Entregador', 'entregador', '123', 3)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """);
            
            stmt.execute("""
                INSERT INTO products (id, name, description, price, category) VALUES 
                (1, 'X-Burger Clássico', 'Hambúrguer, queijo, alface, tomate e molho especial', 15.90, 'lanches'),
                (2, 'X-Bacon', 'Hambúrguer, bacon, queijo, alface, tomate e molho especial', 18.90, 'lanches'),
                (3, 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 4.50, 'bebidas'),
                (4, 'Batata Frita', 'Porção de batata frita crocante', 8.90, 'acompanhamentos')
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """);
            
            stmt.execute("""
                INSERT INTO customers (id, name, phone) VALUES 
                (1, 'João Silva', '(11) 99999-1111'),
                (2, 'Maria Santos', '(11) 99999-2222')
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """);
            
            System.out.println("Banco de dados H2 inicializado com sucesso!");
        }
    }

    /**
     * Retorna uma conexão ativa com o banco
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(JDBC_URL, USER, PASS);
    }
}
