package com.sistema.pedidos.service;

import com.sistema.pedidos.dto.LoginRequest;
import com.sistema.pedidos.dto.LoginResponse;
import com.sistema.pedidos.model.User;
import com.sistema.pedidos.util.JwtUtil;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Serviço de autenticação
 */
public class AuthService {
    
    private final UserService userService;
    private final ProfileService profileService;
    
    // Cache de tokens ativos
    private final Map<String, String> activeTokens = new HashMap<>();

    public AuthService(UserService userService, ProfileService profileService) {
        this.userService = userService;
        this.profileService = profileService;
    }

    /**
     * Realiza o login do usuário
     */
    public LoginResponse login(LoginRequest request) {
        // Validar dados de entrada
        if (request == null || !request.isValid()) {
            throw new IllegalArgumentException("Dados de login inválidos");
        }

        // Buscar usuário
        User user = userService.findByUsername(request.getUsername());
        if (user == null) {
            throw new IllegalArgumentException("Usuário não encontrado");
        }

        // Verificar se usuário está ativo
        if (!user.isActive()) {
            throw new IllegalArgumentException("Usuário inativo");
        }

        // Verificar senha
        if (!verifyPassword(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Senha incorreta");
        }

        // Carregar permissões do perfil
        loadUserPermissions(user);

        // Atualizar último login
        user.updateLastLogin();
        userService.update(user.getId(), user);

        // Gerar token
        String token = JwtUtil.generateToken(user.getUsername());
        
        // Armazenar token ativo
        activeTokens.put(token, user.getUsername());

        return new LoginResponse(token, user);
    }

    /**
     * Realiza o logout do usuário
     */
    public void logout(String token) {
        if (token != null) {
            activeTokens.remove(token);
        }
    }

    /**
     * Valida um token JWT
     */
    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        // Verificar se token está na lista de ativos
        if (!activeTokens.containsKey(token)) {
            return false;
        }

        // Validar token JWT
        if (!JwtUtil.validateToken(token)) {
            activeTokens.remove(token);
            return false;
        }

        return true;
    }

    /**
     * Obtém o usuário a partir do token
     */
    public User getUserFromToken(String token) {
        if (!validateToken(token)) {
            return null;
        }

        String username = JwtUtil.getUsernameFromToken(token);
        if (username == null) {
            return null;
        }

        User user = userService.findByUsername(username);
        if (user != null) {
            loadUserPermissions(user);
        }

        return user;
    }

    /**
     * Verifica se a senha está correta
     */
    private boolean verifyPassword(String inputPassword, String storedPassword) {
        // Em um sistema real, aqui seria usado hash + salt
        // Para demonstração, comparação simples
        return inputPassword != null && inputPassword.equals(storedPassword);
    }

    /**
     * Carrega as permissões do usuário baseado no seu perfil
     */
    private void loadUserPermissions(User user) {
        if (user.getProfileId() != null) {
            var profile = profileService.findById(user.getProfileId());
            if (profile != null) {
                user.setProfileName(profile.getName());
                user.setPermissions(profile.getPermissions());
            }
        }
    }

    /**
     * Limpa tokens expirados
     */
    public void cleanExpiredTokens() {
        activeTokens.entrySet().removeIf(entry -> {
            String token = entry.getKey();
            return JwtUtil.isTokenExpired(token);
        });
    }

    /**
     * Obtém estatísticas de autenticação
     */
    public Map<String, Object> getAuthStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeTokens", activeTokens.size());
        stats.put("totalUsers", userService.findAll().size());
        stats.put("activeUsers", userService.findAll().stream()
                .mapToInt(user -> user.isActive() ? 1 : 0)
                .sum());
        return stats;
    }
}

