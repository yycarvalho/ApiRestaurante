package com.sistema.pedidos.dto;

import com.sistema.pedidos.model.User;

/**
 * DTO para resposta de login
 */
public class LoginResponse {
    private String token;
    private UserInfo user;

    // Construtores
    public LoginResponse() {}

    public LoginResponse(String token, User user) {
        this.token = token;
        this.user = new UserInfo(user);
    }

    // Getters e Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    // Classe interna para informações do usuário
    public static class UserInfo {
        private String username;
        private String name;
        private String profile;
        private String profileName;
        private java.util.Map<String, Boolean> permissions;

        public UserInfo() {}

        public UserInfo(User user) {
            this.username = user.getUsername();
            this.name = user.getName();
            this.profile = user.getProfileId() != null ? user.getProfileId().toString() : null;
            this.profileName = user.getProfileName();
            this.permissions = user.getPermissions();
        }

        // Getters e Setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getProfile() {
            return profile;
        }

        public void setProfile(String profile) {
            this.profile = profile;
        }

        public String getProfileName() {
            return profileName;
        }

        public void setProfileName(String profileName) {
            this.profileName = profileName;
        }

        public java.util.Map<String, Boolean> getPermissions() {
            return permissions;
        }

        public void setPermissions(java.util.Map<String, Boolean> permissions) {
            this.permissions = permissions;
        }
    }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "token='[PROTECTED]'" +
                ", user=" + user +
                '}';
    }
}

