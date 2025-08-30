package com.sistema.pedidos.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistema.pedidos.model.Profile;
import com.sistema.pedidos.util.Db; // sua classe de conexão

public class ProfileService {

	private final ObjectMapper objectMapper = new ObjectMapper();

	/** CREATE */
	public Profile create(Profile profile) throws Exception {
		validateProfile(profile);

		if (findByName(profile.getName()) != null) {
			throw new IllegalArgumentException("Já existe um perfil com este nome");
		}

		String sql = "INSERT INTO profiles (name, description, permissions, default_username) VALUES (?, ?, ?, ?)";
		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

			stmt.setString(1, profile.getName());
			stmt.setString(2, profile.getDescription());
			stmt.setString(3, objectMapper.writeValueAsString(profile.getPermissions()));
			stmt.setString(4, profile.getDefaultUsername());
			stmt.executeUpdate();

			try (ResultSet keys = stmt.getGeneratedKeys()) {
				if (keys.next()) {
					profile.setId(keys.getLong(1));
				}
			}
		}

		return profile;
	}

	/** READ */
	public Profile findById(Long id) throws Exception {
		String sql = "SELECT * FROM profiles WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setLong(1, id);
			try (ResultSet rs = stmt.executeQuery()) {
				if (rs.next()) {
					return mapResultSetToProfile(rs);
				}
			}
		}
		return null;
	}

	public Profile findByName(String name) throws Exception {
		String sql = "SELECT * FROM profiles WHERE name = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, name);
			try (ResultSet rs = stmt.executeQuery()) {
				if (rs.next()) {
					return mapResultSetToProfile(rs);
				}
			}
		}
		return null;
	}

	public List<Profile> findAll() throws Exception {
		String sql = "SELECT * FROM profiles";
		List<Profile> profiles = new ArrayList<>();
		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql);
				ResultSet rs = stmt.executeQuery()) {

			while (rs.next()) {
				profiles.add(mapResultSetToProfile(rs));
			}
		}
		return profiles;
	}

	/** UPDATE */
	public Profile update(Long id, Profile updatedProfile) throws Exception {
		Profile existingProfile = findById(id);
		if (existingProfile == null)
			throw new IllegalArgumentException("Perfil não encontrado");

		if (!existingProfile.getName().equals(updatedProfile.getName())
				&& findByName(updatedProfile.getName()) != null) {
			throw new IllegalArgumentException("Já existe um perfil com este nome");
		}

		String sql = "UPDATE profiles SET name = ?, description = ?, permissions = ?, default_username = ?, updated_at = NOW() WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, updatedProfile.getName());
			stmt.setString(2, updatedProfile.getDescription());
			stmt.setString(3, objectMapper.writeValueAsString(updatedProfile.getPermissions()));
			stmt.setString(4, updatedProfile.getDefaultUsername());
			stmt.setLong(5, id);
			stmt.executeUpdate();
		}

		return findById(id);
	}

	/** DELETE */
	public boolean delete(Long id) throws Exception {
		Profile profile = findById(id);
		if (profile == null)
			return false;
		if (id <= 3)
			throw new IllegalArgumentException("Não é possível excluir perfis padrão do sistema");

		String sql = "DELETE FROM profiles WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setLong(1, id);
			return stmt.executeUpdate() > 0;
		}
	}

	/** HELPER: converte ResultSet em Profile */
	private Profile mapResultSetToProfile(ResultSet rs) throws Exception {
		Profile profile = new Profile();
		profile.setId(rs.getLong("id"));
		profile.setName(rs.getString("name"));
		profile.setDescription(rs.getString("description"));
		profile.setDefaultUsername(rs.getString("default_username"));
		String permJson = rs.getString("permissions");
		Map<String, Boolean> permissions = objectMapper.readValue(permJson, new TypeReference<Map<String, Boolean>>() {
		});
		profile.setPermissions(permissions);
		profile.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
		profile.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
		return profile;
	}

	/** Validação do perfil */
	private void validateProfile(Profile profile) {
		if (profile == null)
			throw new IllegalArgumentException("Perfil não pode ser nulo");
		if (profile.getName() == null || profile.getName().trim().isEmpty())
			throw new IllegalArgumentException("Nome do perfil é obrigatório");
		if (profile.getPermissions() == null || profile.getPermissions().isEmpty())
			throw new IllegalArgumentException("Perfil deve ter pelo menos uma permissão");
	}
}
