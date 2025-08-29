package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Customer;
import com.sistema.pedidos.util.Db;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CustomerService {

    public List<Customer> findAll() {
        List<Customer> list = new ArrayList<>();
        String sql = "SELECT id, name, phone, created_at, updated_at FROM customers ORDER BY name";
        try (Connection c = Db.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Customer cu = map(rs);
                    list.add(cu);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return list;
    }

    public Customer upsertByPhone(String name, String phone) {
        String sql = "INSERT INTO customers (name, phone) VALUES (?,?) ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP";
        try (Connection c = Db.getConnection(); PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.setString(2, phone);
            ps.executeUpdate();
            Long id = null;
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) { id = keys.getLong(1); }
            }
            if (id == null) {
                // fetch existing
                try (PreparedStatement sel = c.prepareStatement("SELECT id FROM customers WHERE phone=?")) {
                    sel.setString(1, phone);
                    try (ResultSet rs = sel.executeQuery()) { if (rs.next()) id = rs.getLong(1); }
                }
            }
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Customer findById(Long id) {
        String sql = "SELECT id, name, phone, created_at, updated_at FROM customers WHERE id=?";
        try (Connection c = Db.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    public Customer findByPhone(String phone) {
        String sql = "SELECT id, name, phone, created_at, updated_at FROM customers WHERE phone=?";
        try (Connection c = Db.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, phone);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    private Customer map(ResultSet rs) throws SQLException {
        Customer cu = new Customer();
        cu.setId(rs.getLong("id"));
        cu.setName(rs.getString("name"));
        cu.setPhone(rs.getString("phone"));
        Timestamp ca = rs.getTimestamp("created_at");
        Timestamp ua = rs.getTimestamp("updated_at");
        cu.setCreatedAt(ca == null ? null : ca.toLocalDateTime());
        cu.setUpdatedAt(ua == null ? null : ua.toLocalDateTime());
        return cu;
    }
}

