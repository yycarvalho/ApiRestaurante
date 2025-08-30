package com.sistema.pedidos.model;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Modelo de dados para Usuário
 */
public class User {
	private Long id;
	private String name;
	private String username;
	private String password;
	private Long profileId;
	private String profileName;
	private Map<String, Boolean> permissions;
	private boolean active;
	private LocalDateTime lastLogin;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	// Construtores
	public User() {
		this.active = true;
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
	}

	public User(String name, String username, String password, Long profileId) {
		this();
		this.name = name;
		this.username = username;
		this.password = password;
		this.profileId = profileId;
	}

	// Getters e Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
		this.updatedAt = LocalDateTime.now();
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
		this.updatedAt = LocalDateTime.now();
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
		this.updatedAt = LocalDateTime.now();
	}

	public Long getProfileId() {
		return profileId;
	}

	public void setProfileId(Long profileId) {
		this.profileId = profileId;
		this.updatedAt = LocalDateTime.now();
	}

	public String getProfileName() {
		return profileName;
	}

	public void setProfileName(String profileName) {
		this.profileName = profileName;
	}

	public Map<String, Boolean> getPermissions() {
		return permissions;
	}

	public void setPermissions(Map<String, Boolean> permissions) {
		this.permissions = permissions;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
		this.updatedAt = LocalDateTime.now();
	}

	public LocalDateTime getLastLogin() {
		return lastLogin;
	}

	public void setLastLogin(LocalDateTime lastLogin) {
		this.lastLogin = lastLogin;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	// Métodos utilitários
	public boolean hasPermission(String permission) {
		return permissions != null && permissions.getOrDefault(permission, false);
	}

	public void updateLastLogin() {
		this.lastLogin = LocalDateTime.now();
	}

	@Override
	public String toString() {
		return "User{" + "id=" + id + ", name='" + name + '\'' + ", username='" + username + '\'' + ", profileId="
				+ profileId + ", active=" + active + ", createdAt=" + createdAt + '}';
	}
}
