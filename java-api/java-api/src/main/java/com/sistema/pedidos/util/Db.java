package com.sistema.pedidos.util;

import java.sql.Connection;
import java.sql.SQLException;

public class Db {

	public static Connection getConnection() throws SQLException {
		return DatabaseConfig.getConnection();
	}

	public static void closeQuietly(AutoCloseable c) {
		if (c != null) {
			try {
				c.close();
			} catch (Exception ignored) {
			}
		}
	}
}
