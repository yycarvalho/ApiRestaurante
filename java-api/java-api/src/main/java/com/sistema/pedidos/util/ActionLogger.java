package com.sistema.pedidos.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Logger que persiste logs em banco (system_logs)
 */
public class ActionLogger {

    public static void log(String level, String action, String message, String actorUsername, Long actorUserId, String ip, String metadataJson) {
        String sql = "INSERT INTO system_logs (level, action, message, actor_username, actor_user_id, ip, metadata) VALUES (?,?,?,?,?,?,CAST(? AS JSON))";
        try (Connection conn = Db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, level);
            ps.setString(2, action);
            ps.setString(3, message);
            ps.setString(4, actorUsername);
            if (actorUserId == null) ps.setNull(5, java.sql.Types.BIGINT); else ps.setLong(5, actorUserId);
            ps.setString(6, ip);
            ps.setString(7, metadataJson);
            ps.executeUpdate();
        } catch (SQLException e) {
            // fallback: imprimir no console
            System.err.println("[LOG ERROR] " + action + ": " + e.getMessage());
        }
    }
}

