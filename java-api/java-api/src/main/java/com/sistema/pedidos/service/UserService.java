package com.sistema.pedidos.service;

import com.sistema.pedidos.model.User;
import com.sistema.pedidos.util.Db;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de usuários
 */
public class UserService {
    
    public UserService() {
        initializeDefaultUsers();
    }

    /**
     * Inicializa usuários padrão do sistema
     */
    private void initializeDefaultUsers() {
        // Verificar se já existem usuários
        if (findAll().isEmpty()) {
            // Administrador
            User admin = new User("Administrador", "admin", "123", 1L);
            create(admin);

            // Atendente
            User atendente = new User("Atendente", "atendente", "123", 2L);
            create(atendente);

            // Entregador
            User entregador = new User("Entregador", "entregador", "123", 3L);
            create(entregador);
        }
    }

    /**
     * Busca todos os usuários
     */
    public List<User> findAll() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT u.id, u.name, u.username, u.password, u.profile_id, u.active, u.last_login, u.created_at, u.updated_at, " +
                     "p.name as profile_name, p.permissions " +
                     "FROM users u " +
                     "LEFT JOIN profiles p ON u.profile_id = p.id " +
                     "ORDER BY u.name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                users.add(map(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuários", e);
        }
        return users;
    }

    /**
     * Busca usuário por ID
     */
    public User findById(Long id) {
        String sql = "SELECT u.id, u.name, u.username, u.password, u.profile_id, u.active, u.last_login, u.created_at, u.updated_at, " +
                     "p.name as profile_name, p.permissions " +
                     "FROM users u " +
                     "LEFT JOIN profiles p ON u.profile_id = p.id " +
                     "WHERE u.id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuário por ID", e);
        }
        return null;
    }

    /**
     * Busca usuário por username
     */
    public User findByUsername(String username) {
        String sql = "SELECT u.id, u.name, u.username, u.password, u.profile_id, u.active, u.last_login, u.created_at, u.updated_at, " +
                     "p.name as profile_name, p.permissions " +
                     "FROM users u " +
                     "LEFT JOIN profiles p ON u.profile_id = p.id " +
                     "WHERE u.username = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuário por username", e);
        }
        return null;
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

        String sql = "INSERT INTO users (name, username, password, profile_id, active, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            ps.setString(1, user.getName());
            ps.setString(2, user.getUsername());
            ps.setString(3, user.getPassword());
            ps.setLong(4, user.getProfileId());
            ps.setBoolean(5, user.isActive());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            ps.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
            
            ps.executeUpdate();
            
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    user.setId(rs.getLong(1));
                }
            }
            
            return user;
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao criar usuário", e);
        }
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

        String sql = "UPDATE users SET name = ?, username = ?, password = ?, profile_id = ?, active = ?, updated_at = ? " +
                     "WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, updatedUser.getName());
            ps.setString(2, updatedUser.getUsername());
            ps.setString(3, updatedUser.getPassword());
            ps.setLong(4, updatedUser.getProfileId());
            ps.setBoolean(5, updatedUser.isActive());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(7, id);
            
            ps.executeUpdate();
            
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar usuário", e);
        }
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

        String sql = "DELETE FROM users WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir usuário", e);
        }
    }

    /**
     * Busca usuários por perfil
     */
    public List<User> findByProfileId(Long profileId) {
        List<User> users = new ArrayList<>();
        String sql = "SELECT u.id, u.name, u.username, u.password, u.profile_id, u.active, u.last_login, u.created_at, u.updated_at, " +
                     "p.name as profile_name, p.permissions " +
                     "FROM users u " +
                     "LEFT JOIN profiles p ON u.profile_id = p.id " +
                     "WHERE u.profile_id = ? " +
                     "ORDER BY u.name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setLong(1, profileId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    users.add(map(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuários por perfil", e);
        }
        return users;
    }

    /**
     * Busca usuários ativos
     */
    public List<User> findActiveUsers() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT u.id, u.name, u.username, u.password, u.profile_id, u.active, u.last_login, u.created_at, u.updated_at, " +
                     "p.name as profile_name, p.permissions " +
                     "FROM users u " +
                     "LEFT JOIN profiles p ON u.profile_id = p.id " +
                     "WHERE u.active = true " +
                     "ORDER BY u.name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                users.add(map(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuários ativos", e);
        }
        return users;
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

        String sql = "UPDATE users SET active = ?, updated_at = ? WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setBoolean(1, !user.isActive());
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(3, id);
            
            ps.executeUpdate();
            
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao alterar status do usuário", e);
        }
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

        String sql = "UPDATE users SET password = ?, updated_at = ? WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, newPassword);
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(3, id);
            
            ps.executeUpdate();
            
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao resetar senha", e);
        }
    }

    /**
     * Atualiza último login
     */
    public void updateLastLogin(Long userId) {
        String sql = "UPDATE users SET last_login = ? WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(2, userId);
            
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar último login", e);
        }
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
     * Mapeia ResultSet para User
     */
    private User map(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setName(rs.getString("name"));
        user.setUsername(rs.getString("username"));
        user.setPassword(rs.getString("password"));
        user.setProfileId(rs.getLong("profile_id"));
        user.setActive(rs.getBoolean("active"));
        user.setProfileName(rs.getString("profile_name"));
        
        // Timestamps
        Timestamp lastLogin = rs.getTimestamp("last_login");
        Timestamp createdAt = rs.getTimestamp("created_at");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        
        user.setLastLogin(lastLogin != null ? lastLogin.toLocalDateTime() : null);
        user.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : LocalDateTime.now());
        user.setUpdatedAt(updatedAt != null ? updatedAt.toLocalDateTime() : LocalDateTime.now());
        
        // Permissões (se disponível)
        String permissionsJson = rs.getString("permissions");
        if (permissionsJson != null && !permissionsJson.isEmpty()) {
            // Aqui você pode implementar a lógica para parsear o JSON das permissões
            // Por enquanto, vamos deixar como null
            user.setPermissions(new HashMap<>());
        }
        
        return user;
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

