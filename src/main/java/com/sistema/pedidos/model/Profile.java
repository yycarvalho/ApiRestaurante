package com.sistema.pedidos.model;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Modelo de dados para Perfil de Acesso
 */
public class Profile {
    private Long id;
    private String name;
    private String description;
    private Map<String, Boolean> permissions;
    private String defaultUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Construtores
    public Profile() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Profile(String name, String description, Map<String, Boolean> permissions) {
        this();
        this.name = name;
        this.description = description;
        this.permissions = permissions;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
        this.updatedAt = LocalDateTime.now();
    }

    public Map<String, Boolean> getPermissions() {
        return permissions;
    }

    public void setPermissions(Map<String, Boolean> permissions) {
        this.permissions = permissions;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDefaultUsername() {
        return defaultUsername;
    }

    public void setDefaultUsername(String defaultUsername) {
        this.defaultUsername = defaultUsername;
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

    @Override
    public String toString() {
        return "Profile{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

