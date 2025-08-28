package com.sistema.pedidos.service;

import com.sistema.pedidos.model.User;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de usuários
 */
public class UserService {
    
    private final Map<Long, User> users = new HashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public UserService() {
        initializeDefaultUsers();
    }

    /**
     * Inicializa usuários padrão do sistema
     */
    private void initializeDefaultUsers() {
        // Administrador
        User admin = new User("Administrador", "admin", "123", 1L);
        admin.setId(idGenerator.getAndIncrement());
        users.put(admin.getId(), admin);

        // Atendente
        User atendente = new User("Atendente", "atendente", "123", 2L);
        atendente.setId(idGenerator.getAndIncrement());
        users.put(atendente.getId(), atendente);

        // Entregador
        User entregador = new User("Entregador", "entregador", "123", 3L);
        entregador.setId(idGenerator.getAndIncrement());
        users.put(entregador.getId(), entregador);
    }

    /**
     * Busca todos os usuários
     */
    public List<User> findAll() {
        return new ArrayList<>(users.values());
    }

    /**
     * Busca usuário por ID
     */
    public User findById(Long id) {
        return users.get(id);
    }

    /**
     * Busca usuário por username
     */
    public User findByUsername(String username) {
        return users.values().stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst()
                .orElse(null);
    }

    /**
     * Cria um novo usuário
     */
    public User create(User user) {
        // Validar dados
        validateUser(user);

        // Verificar se username já existe
        if (findByUsername(user.getUsername()) != null) {
            throw new IllegalArgumentException("Username já existe");
        }

        // Gerar ID e salvar
        user.setId(idGenerator.getAndIncrement());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        users.put(user.getId(), user);
        return user;
    }

    /**
     * Atualiza um usuário existente
     */
    public User update(Long id, User updatedUser) {
        User existingUser = findById(id);
        if (existingUser == null) {
            throw new IllegalArgumentException("Usuário não encontrado");
        }

        // Verificar se novo username já existe (se foi alterado)
        if (!existingUser.getUsername().equals(updatedUser.getUsername())) {
            User userWithSameUsername = findByUsername(updatedUser.getUsername());
            if (userWithSameUsername != null && !userWithSameUsername.getId().equals(id)) {
                throw new IllegalArgumentException("Username já existe");
            }
        }

        // Atualizar campos
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }
        if (updatedUser.getUsername() != null) {
            existingUser.setUsername(updatedUser.getUsername());
        }
        if (updatedUser.getPassword() != null) {
            existingUser.setPassword(updatedUser.getPassword());
        }
        if (updatedUser.getProfileId() != null) {
            existingUser.setProfileId(updatedUser.getProfileId());
        }
        
        existingUser.setActive(updatedUser.isActive());
        existingUser.setUpdatedAt(LocalDateTime.now());

        return existingUser;
    }

    /**
     * Remove um usuário
     */
    public boolean delete(Long id) {
        User user = findById(id);
        if (user == null) {
            return false;
        }

        // Não permitir exclusão do admin principal
        if ("admin".equals(user.getUsername())) {
            throw new IllegalArgumentException("Não é possível excluir o usuário administrador principal");
        }

        users.remove(id);
        return true;
    }

    /**
     * Busca usuários por perfil
     */
    public List<User> findByProfileId(Long profileId) {
        return users.values().stream()
                .filter(user -> Objects.equals(user.getProfileId(), profileId))
                .collect(Collectors.toList());
    }

    /**
     * Busca usuários ativos
     */
    public List<User> findActiveUsers() {
        return users.values().stream()
                .filter(User::isActive)
                .collect(Collectors.toList());
    }

    /**
     * Altera status de um usuário
     */
    public User toggleUserStatus(Long id) {
        User user = findById(id);
        if (user == null) {
            throw new IllegalArgumentException("Usuário não encontrado");
        }

        // Não permitir desativar o admin principal
        if ("admin".equals(user.getUsername()) && user.isActive()) {
            throw new IllegalArgumentException("Não é possível desativar o usuário administrador principal");
        }

        user.setActive(!user.isActive());
        user.setUpdatedAt(LocalDateTime.now());
        
        return user;
    }

    /**
     * Reseta a senha de um usuário
     */
    public User resetPassword(Long id, String newPassword) {
        User user = findById(id);
        if (user == null) {
            throw new IllegalArgumentException("Usuário não encontrado");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            newPassword = "123"; // Senha padrão
        }

        user.setPassword(newPassword);
        user.setUpdatedAt(LocalDateTime.now());
        
        return user;
    }

    /**
     * Obtém estatísticas dos usuários
     */
    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<User> allUsers = findAll();
        long activeUsers = allUsers.stream().filter(User::isActive).count();
        long inactiveUsers = allUsers.size() - activeUsers;
        
        // Contagem por perfil
        Map<Long, Long> usersByProfile = allUsers.stream()
                .filter(user -> user.getProfileId() != null)
                .collect(Collectors.groupingBy(User::getProfileId, Collectors.counting()));
        
        stats.put("totalUsers", allUsers.size());
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("usersByProfile", usersByProfile);
        
        return stats;
    }

    /**
     * Valida os dados do usuário
     */
    private void validateUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("Usuário não pode ser nulo");
        }
        
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome é obrigatório");
        }
        
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username é obrigatório");
        }
        
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Senha é obrigatória");
        }
        
        if (user.getPassword().length() < 3) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 3 caracteres");
        }
        
        if (user.getProfileId() == null) {
            throw new IllegalArgumentException("Perfil é obrigatório");
        }
    }
}

