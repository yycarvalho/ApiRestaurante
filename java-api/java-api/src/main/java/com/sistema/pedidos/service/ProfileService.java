package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Profile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Serviço de gerenciamento de perfis
 */
public class ProfileService {
    
    private final Map<Long, Profile> profiles = new HashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public ProfileService() {
        initializeDefaultProfiles();
    }

    /**
     * Inicializa perfis padrão do sistema
     */
    private void initializeDefaultProfiles() {
        // Perfil Administrador
        Map<String, Boolean> adminPermissions = new HashMap<>();
        adminPermissions.put("verDashboard", true);
        adminPermissions.put("verPedidos", true);
        adminPermissions.put("verClientes", true);
        adminPermissions.put("verCardapio", true);
        adminPermissions.put("criarEditarProduto", true);
        adminPermissions.put("excluirProduto", true);
        adminPermissions.put("desativarProduto", true);
        adminPermissions.put("verChat", true);
        adminPermissions.put("enviarChat", true);
        adminPermissions.put("imprimirPedido", true);
        adminPermissions.put("acessarEndereco", true);
        adminPermissions.put("visualizarValorPedido", true);
        adminPermissions.put("acompanharEntregas", true);
        adminPermissions.put("gerarRelatorios", true);
        adminPermissions.put("gerenciarPerfis", true);
        adminPermissions.put("alterarStatusPedido", true);
        adminPermissions.put("selecionarStatusEspecifico", true);
        adminPermissions.put("criarUsuarios", true);
        adminPermissions.put("editarUsuarios", true);
        adminPermissions.put("excluirUsuarios", true);
        
        

        Profile admin = new Profile("Administrador", "Acesso completo ao sistema", adminPermissions);
        admin.setId(idGenerator.getAndIncrement());
        admin.setDefaultUsername("admin");
        profiles.put(admin.getId(), admin);

    }

    /**
     * Busca todos os perfis
     */
    public List<Profile> findAll() {
        return new ArrayList<>(profiles.values());
    }

    /**
     * Busca perfil por ID
     */
    public Profile findById(Long id) {
        return profiles.get(id);
    }

    /**
     * Busca perfil por nome
     */
    public Profile findByName(String name) {
        return profiles.values().stream()
                .filter(profile -> profile.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    /**
     * Cria um novo perfil
     */
    public Profile create(Profile profile) {
        // Validar dados
        validateProfile(profile);

        // Verificar se nome já existe
        if (findByName(profile.getName()) != null) {
            throw new IllegalArgumentException("Já existe um perfil com este nome");
        }

        // Gerar ID e salvar
        profile.setId(idGenerator.getAndIncrement());
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());
        
        profiles.put(profile.getId(), profile);
        return profile;
    }

    /**
     * Atualiza um perfil existente
     */
    public Profile update(Long id, Profile updatedProfile) {
        Profile existingProfile = findById(id);
        if (existingProfile == null) {
            throw new IllegalArgumentException("Perfil não encontrado");
        }

        // Verificar se novo nome já existe (se foi alterado)
        if (!existingProfile.getName().equals(updatedProfile.getName())) {
            Profile profileWithSameName = findByName(updatedProfile.getName());
            if (profileWithSameName != null && !profileWithSameName.getId().equals(id)) {
                throw new IllegalArgumentException("Já existe um perfil com este nome");
            }
        }

        // Atualizar campos
        if (updatedProfile.getName() != null) {
            existingProfile.setName(updatedProfile.getName());
        }
        if (updatedProfile.getDescription() != null) {
            existingProfile.setDescription(updatedProfile.getDescription());
        }
        if (updatedProfile.getPermissions() != null) {
            existingProfile.setPermissions(updatedProfile.getPermissions());
        }
        
        existingProfile.setUpdatedAt(LocalDateTime.now());

        return existingProfile;
    }

    /**
     * Remove um perfil
     */
    public boolean delete(Long id) {
        Profile profile = findById(id);
        if (profile == null) {
            return false;
        }

        // Não permitir exclusão de perfis padrão
        if (id <= 3) { // IDs 1, 2, 3 são perfis padrão
            throw new IllegalArgumentException("Não é possível excluir perfis padrão do sistema");
        }

        profiles.remove(id);
        return true;
    }

    /**
     * Obtém perfis disponíveis para acesso rápido
     */
    public List<Profile> getQuickAccessProfiles() {
        return profiles.values().stream()
                .filter(profile -> profile.getDefaultUsername() != null)
                .sorted((p1, p2) -> p1.getName().compareTo(p2.getName()))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    /**
     * Verifica se um perfil tem uma permissão específica
     */
    public boolean hasPermission(Long profileId, String permission) {
        Profile profile = findById(profileId);
        return profile != null && profile.hasPermission(permission);
    }

    /**
     * Obtém todas as permissões disponíveis no sistema
     */
    public Map<String, String> getAvailablePermissions() {
        Map<String, String> permissions = new LinkedHashMap<>();
        
        // Dashboard
        permissions.put("verDashboard", "Ver Dashboard");
        
        // Pedidos
        permissions.put("verPedidos", "Ver Pedidos");
        permissions.put("verClientes", "Ver Clientes");
        permissions.put("alterarStatusPedido", "Alterar Status dos Pedidos");
        permissions.put("verChat", "Ver Chat dos Pedidos");
        permissions.put("imprimirPedido", "Imprimir Pedidos");
        permissions.put("visualizarValorPedido", "Visualizar Valores dos Pedidos");
        permissions.put("acessarEndereco", "Acessar Endereços");
        
        // Cardápio
        permissions.put("verCardapio", "Ver Cardápio");
        permissions.put("criarEditarProduto", "Criar/Editar Produtos");
        permissions.put("excluirProduto", "Excluir Produtos");
        permissions.put("desativarProduto", "Ativar/Desativar Produtos");
        
        // Relatórios
        permissions.put("gerarRelatorios", "Gerar Relatórios");
        
        // Sistema
        permissions.put("gerenciarPerfis", "Gerenciar Perfis e Usuários");
        
        return permissions;
    }

    /**
     * Cria um perfil com permissões padrão
     */
    public Profile createWithDefaultPermissions(String name, String description, String level) {
        Map<String, Boolean> permissions = new HashMap<>();
        
        switch (level.toLowerCase()) {
            case "admin":
                getAvailablePermissions().keySet().forEach(perm -> permissions.put(perm, true));
                break;
            case "manager":
                permissions.put("verDashboard", true);
                permissions.put("verPedidos", true);
                permissions.put("alterarStatusPedido", true);
                permissions.put("verChat", true);
                permissions.put("imprimirPedido", true);
                permissions.put("visualizarValorPedido", true);
                permissions.put("acessarEndereco", true);
                permissions.put("verCardapio", true);
                permissions.put("gerarRelatorios", true);
                break;
            case "operator":
                permissions.put("verPedidos", true);
                permissions.put("alterarStatusPedido", true);
                permissions.put("verChat", true);
                permissions.put("imprimirPedido", true);
                permissions.put("verCardapio", true);
                break;
            default:
                // Perfil básico - apenas visualização
                permissions.put("verPedidos", true);
                permissions.put("verCardapio", true);
                break;
        }
        
        Profile profile = new Profile(name, description, permissions);
        return create(profile);
    }

    /**
     * Obtém estatísticas dos perfis
     */
    public Map<String, Object> getProfileStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Profile> allProfiles = findAll();
        
        stats.put("totalProfiles", allProfiles.size());
        stats.put("defaultProfiles", 3); // Admin, Atendente, Entregador
        stats.put("customProfiles", allProfiles.size() - 3);
        
        return stats;
    }

    /**
     * Valida os dados do perfil
     */
    private void validateProfile(Profile profile) {
        if (profile == null) {
            throw new IllegalArgumentException("Perfil não pode ser nulo");
        }
        
        if (profile.getName() == null || profile.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do perfil é obrigatório");
        }
        
        if (profile.getPermissions() == null || profile.getPermissions().isEmpty()) {
            throw new IllegalArgumentException("Perfil deve ter pelo menos uma permissão");
        }
    }
}

