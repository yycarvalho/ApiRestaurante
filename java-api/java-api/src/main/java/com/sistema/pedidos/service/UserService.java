package com.sistema.pedidos.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.sistema.pedidos.model.User;
import com.sistema.pedidos.util.Db;

/**
 * Servi�o de gerenciamento de usu�rios (CRUD no banco de dados)
 */
public class UserService {

	public List<User> findAll() {
		List<User> users = new ArrayList<>();
		String sql = "SELECT id, username, password, full_name, phone, profile_id, created_at, updated_at FROM users";
		try (Connection conn = Db.getConnection();
				PreparedStatement ps = conn.prepareStatement(sql);
				ResultSet rs = ps.executeQuery()) {
			while (rs.next()) {
				users.add(mapRow(rs));
			}
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao buscar usu�rios", e);
		}
		users.forEach(x -> x.setPassword(""));
		return users;
	}

	public User findById(Long id) {
		String sql = "SELECT id, username, password, full_name, phone, profile_id, created_at, updated_at FROM users WHERE id=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setLong(1, id);
			try (ResultSet rs = ps.executeQuery()) {
				if (rs.next()) {
					return mapRow(rs);
				}
			}
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao buscar usu�rio por ID", e);
		}
		return null;
	}

	public User findByUsername(String username) {
		String sql = "SELECT id, username, password, full_name, phone, profile_id, created_at, updated_at FROM users WHERE username=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setString(1, username);
			try (ResultSet rs = ps.executeQuery()) {
				if (rs.next()) {
					return mapRow(rs);
				}
			}
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao buscar usu�rio por username", e);
		}
		return null;
	}

	public User create(User user) {
		validateUser(user);

		if (findByUsername(user.getUsername()) != null) {
			throw new IllegalArgumentException("Username já existe");
		}

		String sql = "INSERT INTO users (username, password, full_name, phone, profile_id, created_at, updated_at) VALUES (?,?,?,?,?,NOW(),NOW())";
		try (Connection conn = Db.getConnection();
				PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
			ps.setString(1, user.getUsername());
			ps.setString(2, user.getPassword());
			ps.setString(3, user.getName());
			ps.setString(4, "");
			if (user.getProfileId() != null) {
				ps.setLong(5, user.getProfileId());
			} else {
				ps.setNull(5, Types.BIGINT);
			}

			ps.executeUpdate();

			try (ResultSet keys = ps.getGeneratedKeys()) {
				if (keys.next()) {
					user.setId(keys.getLong(1));
				}
			}

			user.setCreatedAt(LocalDateTime.now());
			user.setUpdatedAt(LocalDateTime.now());

			return user;
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao criar usu�rio", e);
		}
	}

	public User update(Long id, User updatedUser) {
		User existing = findById(id);
		if (existing == null) {
			throw new IllegalArgumentException("Usu�rio n�o encontrado");
		}

		// Verificar username duplicado
		if (!existing.getUsername().equals(updatedUser.getUsername())) {
			if (findByUsername(updatedUser.getUsername()) != null) {
				throw new IllegalArgumentException("Username j� existe");
			}
		}

		String sql = "UPDATE users SET username=?, full_name=?, phone=?, profile_id=?, updated_at=NOW() WHERE id=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {

			ps.setString(1, updatedUser.getUsername());
			ps.setString(2, updatedUser.getName());
			ps.setString(3, "");
			if (updatedUser.getProfileId() != null) {
				ps.setLong(4, updatedUser.getProfileId());
			} else {
				ps.setNull(4, Types.BIGINT);
			}
			ps.setLong(5, id);

			ps.executeUpdate();

			return findById(id);
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao atualizar usu�rio", e);
		}
	}

	public boolean delete(Long id) {
		User user = findById(id);
		if (user == null)
			return false;

		if ("admin".equals(user.getUsername())) {
			throw new IllegalArgumentException("N�o � poss�vel excluir o admin principal");
		}

		String sql = "DELETE FROM users WHERE id=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setLong(1, id);
			return ps.executeUpdate() > 0;
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao excluir usu�rio", e);
		}
	}

	public User resetPassword(Long id, String newPassword) {
		if (newPassword == null || newPassword.trim().isEmpty()) {
			newPassword = "123"; // senha padr�o
		}
		String sql = "UPDATE users SET password=?, updated_at=NOW() WHERE id=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setString(1, newPassword);
			ps.setLong(2, id);
			ps.executeUpdate();
			return findById(id);
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao resetar senha", e);
		}
	}

	public List<User> findByProfileId(Long profileId) {
		List<User> users = new ArrayList<>();
		String sql = "SELECT id, username, password, full_name, phone, profile_id, created_at, updated_at FROM users WHERE profile_id=?";
		try (Connection conn = Db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setLong(1, profileId);
			try (ResultSet rs = ps.executeQuery()) {
				while (rs.next()) {
					users.add(mapRow(rs));
				}
			}
		} catch (SQLException e) {
			throw new RuntimeException("Erro ao buscar usu�rios por perfil", e);
		}
		return users;
	}

	private User mapRow(ResultSet rs) throws SQLException {
		User u = new User();
		u.setId(rs.getLong("id"));
		u.setUsername(rs.getString("username"));
		u.setPassword(rs.getString("password"));
		u.setName(rs.getString("full_name"));
		// u.setPhone(rs.getString("phone"));
		u.setProfileId(rs.getObject("profile_id") != null ? rs.getLong("profile_id") : null);
		u.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
		u.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
		return u;
	}

	private void validateUser(User user) {
		if (user == null)
			throw new IllegalArgumentException("Usu�rio n�o pode ser nulo");
		if (user.getName() == null || user.getName().trim().isEmpty())
			throw new IllegalArgumentException("Nome � obrigat�rio");
		if (user.getUsername() == null || user.getUsername().trim().isEmpty())
			throw new IllegalArgumentException("Username � obrigat�rio");
		if (user.getPassword() == null || user.getPassword().trim().isEmpty())
			throw new IllegalArgumentException("Senha � obrigat�ria");
		if (user.getPassword().length() < 3)
			throw new IllegalArgumentException("Senha deve ter pelo menos 3 caracteres");
	}
}
