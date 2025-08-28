/**
 * Gerenciador de Perfis
 * Responsável por gerenciamento de usuários e perfis de acesso
 */
class PerfisManager {
    constructor() {
        this.users = [];
        this.profiles = [];
        this.container = null;
        this.currentTab = 'users';
        this.init();
    }

    init() {
        this.container = document.getElementById('perfisSection');
        if (this.container) {
            this.render();
        }
    }

    // Renderizar estrutura da seção de perfis
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>Perfis e Usuários</h2>
                <div class="header-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.PerfisManager.refresh()">
                        <i class="fas fa-sync-alt"></i>
                        Atualizar
                    </button>
                </div>
            </div>

            <div class="perfis-tabs" id="perfisTabs">
                <button class="tab-btn active" onclick="window.PerfisManager.switchTab('users')" data-tab="users">
                    <i class="fas fa-users"></i>
                    Usuários
                </button>
                <button class="tab-btn" onclick="window.PerfisManager.switchTab('profiles')" data-tab="profiles">
                    <i class="fas fa-user-shield"></i>
                    Perfis de Acesso
                </button>
            </div>

            <div class="tab-content" id="tabContent">
                <!-- Conteúdo das abas será carregado aqui -->
            </div>
        `;
    }

    // Carregar dados
    async loadData() {
        try {
            debugLog('Carregando usuários e perfis...');
            
            // Buscar dados da API
            const [users, profiles] = await Promise.all([
                window.API.getUsers(),
                window.API.getProfiles()
            ]);
            
            this.users = users;
            this.profiles = profiles;
            
            // Renderizar aba atual
            this.renderCurrentTab();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.renderError();
        }
    }

    // Alternar aba
    switchTab(tab) {
        this.currentTab = tab;
        
        // Atualizar botões das abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Renderizar conteúdo da aba
        this.renderCurrentTab();
    }

    // Renderizar aba atual
    renderCurrentTab() {
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;

        if (this.currentTab === 'users') {
            this.renderUsersTab(tabContent);
        } else if (this.currentTab === 'profiles') {
            this.renderProfilesTab(tabContent);
        }
    }

    // Renderizar aba de usuários
    renderUsersTab(container) {
        container.innerHTML = `
            <div class="tab-header">
                <h3>Gerenciar Usuários</h3>
                <button class="btn btn-primary" onclick="window.PerfisManager.showCreateUserModal()">
                    <i class="fas fa-plus"></i>
                    Novo Usuário
                </button>
            </div>

            <div class="users-grid" id="usersGrid">
                ${this.renderUsersGrid()}
            </div>
        `;
    }

    // Renderizar grid de usuários
    renderUsersGrid() {
        if (!this.users || this.users.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Nenhum usuário encontrado</h3>
                    <p>Comece criando o primeiro usuário do sistema.</p>
                </div>
            `;
        }

        return this.users.map(user => `
            <div class="user-card ${!user.active ? 'inactive' : ''}">
                <div class="user-header">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-info">
                        <h4>${user.name}</h4>
                        <p class="username">@${user.username}</p>
                    </div>
                    <div class="user-status status-${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'Ativo' : 'Inativo'}
                    </div>
                </div>
                
                <div class="user-details">
                    <div class="detail-item">
                        <span class="label">Perfil:</span>
                        <span class="value">${this.getProfileName(user.profileId)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Último Acesso:</span>
                        <span class="value">${user.lastLogin ? formatRelativeDate(user.lastLogin) : 'Nunca'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Criado em:</span>
                        <span class="value">${formatDate(user.createdAt)}</span>
                    </div>
                </div>
                
                <div class="user-actions">
                    <button class="btn btn-sm btn-secondary" 
                            onclick="window.PerfisManager.showEditUserModal(${user.id})"
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${user.active ? 'btn-warning' : 'btn-success'}" 
                            onclick="window.PerfisManager.toggleUserStatus(${user.id})"
                            title="${user.active ? 'Desativar' : 'Ativar'}">
                        <i class="fas ${user.active ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-info" 
                            onclick="window.PerfisManager.resetUserPassword(${user.id})"
                            title="Resetar Senha">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="window.PerfisManager.deleteUser(${user.id})"
                            title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Renderizar aba de perfis
    renderProfilesTab(container) {
        container.innerHTML = `
            <div class="tab-header">
                <h3>Perfis de Acesso</h3>
                <button class="btn btn-primary" onclick="window.PerfisManager.showCreateProfileModal()">
                    <i class="fas fa-plus"></i>
                    Novo Perfil
                </button>
            </div>

            <div class="profiles-grid" id="profilesGrid">
                ${this.renderProfilesGrid()}
            </div>
        `;
    }

    // Renderizar grid de perfis
    renderProfilesGrid() {
        if (!this.profiles || this.profiles.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-user-shield"></i>
                    <h3>Nenhum perfil encontrado</h3>
                    <p>Comece criando o primeiro perfil de acesso.</p>
                </div>
            `;
        }

        return this.profiles.map(profile => `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-icon">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="profile-info">
                        <h4>${profile.name}</h4>
                        <p class="profile-description">${profile.description}</p>
                    </div>
                </div>
                
                <div class="profile-permissions">
                    <h5>Permissões:</h5>
                    <div class="permissions-list">
                        ${this.renderPermissionsList(profile.permissions)}
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${this.getUserCountByProfile(profile.id)}</span>
                        <span class="stat-label">Usuários</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-sm btn-secondary" 
                            onclick="window.PerfisManager.showEditProfileModal(${profile.id})"
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="window.PerfisManager.deleteProfile(${profile.id})"
                            title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Renderizar lista de permissões
    renderPermissionsList(permissions) {
        const permissionLabels = {
            verDashboard: 'Ver Dashboard',
            verPedidos: 'Ver Pedidos',
            alterarStatusPedido: 'Alterar Status',
            verChat: 'Ver Chat',
            imprimirPedido: 'Imprimir Pedidos',
            verCardapio: 'Ver Cardápio',
            criarEditarProduto: 'Criar/Editar Produtos',
            excluirProduto: 'Excluir Produtos',
            desativarProduto: 'Ativar/Desativar Produtos',
            gerarRelatorios: 'Gerar Relatórios',
            visualizarValorPedido: 'Ver Valores',
            acessarEndereco: 'Ver Endereços',
            gerenciarPerfis: 'Gerenciar Perfis'
        };

        const activePermissions = Object.keys(permissions)
            .filter(key => permissions[key])
            .map(key => permissionLabels[key] || key);

        if (activePermissions.length === 0) {
            return '<span class="no-permissions">Nenhuma permissão</span>';
        }

        return activePermissions.map(permission => 
            `<span class="permission-tag">${permission}</span>`
        ).join('');
    }

    // Obter nome do perfil por ID
    getProfileName(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        return profile ? profile.name : 'Perfil Desconhecido';
    }

    // Obter contagem de usuários por perfil
    getUserCountByProfile(profileId) {
        return this.users.filter(user => user.profileId === profileId).length;
    }

    // Mostrar modal de criação de usuário
    async showCreateUserModal() {
        const { form, footer } = window.UI.createForm([
            {
                type: 'text',
                name: 'name',
                label: 'Nome Completo',
                required: true,
                placeholder: 'Ex: João Silva'
            },
            {
                type: 'text',
                name: 'username',
                label: 'Nome de Usuário',
                required: true,
                placeholder: 'Ex: joao.silva'
            },
            {
                type: 'password',
                name: 'password',
                label: 'Senha',
                required: true,
                placeholder: 'Mínimo 3 caracteres'
            },
            {
                type: 'select',
                name: 'profileId',
                label: 'Perfil de Acesso',
                required: true,
                options: this.profiles.map(profile => ({
                    value: profile.id,
                    label: profile.name
                }))
            }
        ], {
            submitText: 'Criar Usuário',
            onSubmit: async (data) => {
                await this.createUser(data);
                window.UI.closeModal();
            },
            onCancel: () => window.UI.closeModal()
        });

        window.UI.showModal({
            title: 'Novo Usuário',
            content: form,
            footer: footer
        });
    }

    // Mostrar modal de edição de usuário
    async showEditUserModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const { form, footer } = window.UI.createForm([
            {
                type: 'text',
                name: 'name',
                label: 'Nome Completo',
                required: true,
                value: user.name
            },
            {
                type: 'text',
                name: 'username',
                label: 'Nome de Usuário',
                required: true,
                value: user.username
            },
            {
                type: 'select',
                name: 'profileId',
                label: 'Perfil de Acesso',
                required: true,
                value: user.profileId.toString(),
                options: this.profiles.map(profile => ({
                    value: profile.id,
                    label: profile.name
                }))
            }
        ], {
            submitText: 'Salvar Alterações',
            onSubmit: async (data) => {
                await this.updateUser(userId, data);
                window.UI.closeModal();
            },
            onCancel: () => window.UI.closeModal()
        });

        window.UI.showModal({
            title: `Editar Usuário - ${user.name}`,
            content: form,
            footer: footer
        });
    }

    // Mostrar modal de criação de perfil
    async showCreateProfileModal() {
        const content = this.createProfileFormContent();
        
        window.UI.showModal({
            title: 'Novo Perfil de Acesso',
            content: content,
            size: 'lg'
        });
    }

    // Mostrar modal de edição de perfil
    async showEditProfileModal(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;

        const content = this.createProfileFormContent(profile);
        
        window.UI.showModal({
            title: `Editar Perfil - ${profile.name}`,
            content: content,
            size: 'lg'
        });
    }

    // Criar conteúdo do formulário de perfil
    createProfileFormContent(profile = null) {
        const permissions = profile ? profile.permissions : {};
        
        const form = document.createElement('form');
        form.className = 'profile-form';
        form.innerHTML = `
            <div class="form-group">
                <label for="profileName">Nome do Perfil *</label>
                <input type="text" id="profileName" name="name" required 
                       value="${profile ? profile.name : ''}" 
                       placeholder="Ex: Administrador">
            </div>
            
            <div class="form-group">
                <label for="profileDescription">Descrição</label>
                <textarea id="profileDescription" name="description" 
                          placeholder="Descreva as responsabilidades deste perfil">${profile ? profile.description : ''}</textarea>
            </div>
            
            <div class="permissions-section">
                <h4>Permissões</h4>
                <div class="permissions-grid">
                    ${this.renderPermissionsCheckboxes(permissions)}
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.UI.closeModal()">
                    Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                    ${profile ? 'Salvar Alterações' : 'Criar Perfil'}
                </button>
            </div>
        `;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                permissions: {}
            };
            
            // Coletar permissões marcadas
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                data.permissions[checkbox.name] = checkbox.checked;
            });
            
            try {
                if (profile) {
                    await this.updateProfile(profile.id, data);
                } else {
                    await this.createProfile(data);
                }
                window.UI.closeModal();
            } catch (error) {
                console.error('Erro ao salvar perfil:', error);
            }
        });
        
        return form;
    }

    // Renderizar checkboxes de permissões
    renderPermissionsCheckboxes(permissions = {}) {
        const permissionGroups = {
            'Dashboard': ['verDashboard'],
            'Pedidos': ['verPedidos', 'alterarStatusPedido', 'verChat', 'imprimirPedido', 'visualizarValorPedido', 'acessarEndereco'],
            'Cardápio': ['verCardapio', 'criarEditarProduto', 'excluirProduto', 'desativarProduto'],
            'Relatórios': ['gerarRelatorios'],
            'Sistema': ['gerenciarPerfis']
        };
        
        const permissionLabels = {
            verDashboard: 'Ver Dashboard',
            verPedidos: 'Ver Pedidos',
            alterarStatusPedido: 'Alterar Status dos Pedidos',
            verChat: 'Ver Chat dos Pedidos',
            imprimirPedido: 'Imprimir Pedidos',
            visualizarValorPedido: 'Visualizar Valores dos Pedidos',
            acessarEndereco: 'Acessar Endereços',
            verCardapio: 'Ver Cardápio',
            criarEditarProduto: 'Criar/Editar Produtos',
            excluirProduto: 'Excluir Produtos',
            desativarProduto: 'Ativar/Desativar Produtos',
            gerarRelatorios: 'Gerar Relatórios',
            gerenciarPerfis: 'Gerenciar Perfis e Usuários'
        };
        
        return Object.keys(permissionGroups).map(group => `
            <div class="permission-group">
                <h5>${group}</h5>
                ${permissionGroups[group].map(permission => `
                    <div class="permission-item">
                        <label class="checkbox-label">
                            <input type="checkbox" name="${permission}" 
                                   ${permissions[permission] ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            ${permissionLabels[permission]}
                        </label>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    // Criar usuário
    async createUser(userData) {
        try {
            const newUser = await window.API.createUser(userData);
            this.users.push(newUser);
            this.renderCurrentTab();
            window.UI.showToast('Usuário criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            window.UI.showToast('Erro ao criar usuário', 'error');
        }
    }

    // Atualizar usuário
    async updateUser(userId, userData) {
        try {
            const updatedUser = await window.API.updateUser(userId, userData);
            const index = this.users.findIndex(u => u.id === userId);
            if (index !== -1) {
                this.users[index] = { ...this.users[index], ...updatedUser };
            }
            this.renderCurrentTab();
            window.UI.showToast('Usuário atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            window.UI.showToast('Erro ao atualizar usuário', 'error');
        }
    }

    // Alternar status do usuário
    async toggleUserStatus(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            const newStatus = !user.active;
            await window.API.updateUser(userId, { active: newStatus });
            
            user.active = newStatus;
            this.renderCurrentTab();
            
            window.UI.showToast(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            window.UI.showToast('Erro ao alterar status do usuário', 'error');
        }
    }

    // Resetar senha do usuário
    async resetUserPassword(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            const confirmed = await window.UI.showConfirmation(
                `Tem certeza que deseja resetar a senha do usuário "${user.name}"? A nova senha será "123".`,
                {
                    title: 'Resetar Senha',
                    confirmText: 'Resetar',
                    type: 'warning'
                }
            );

            if (!confirmed) return;

            await window.API.updateUser(userId, { password: '123' });
            window.UI.showToast('Senha resetada com sucesso! Nova senha: 123', 'success');
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            window.UI.showToast('Erro ao resetar senha', 'error');
        }
    }

    // Excluir usuário
    async deleteUser(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            const confirmed = await window.UI.showConfirmation(
                `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
                {
                    title: 'Confirmar Exclusão',
                    confirmText: 'Excluir',
                    type: 'danger'
                }
            );

            if (!confirmed) return;

            await window.API.deleteUser(userId);
            this.users = this.users.filter(u => u.id !== userId);
            this.renderCurrentTab();
            
            window.UI.showToast('Usuário excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            window.UI.showToast('Erro ao excluir usuário', 'error');
        }
    }

    // Criar perfil
    async createProfile(profileData) {
        try {
            const newProfile = await window.API.createProfile(profileData);
            this.profiles.push(newProfile);
            this.renderCurrentTab();
            window.UI.showToast('Perfil criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
            window.UI.showToast('Erro ao criar perfil', 'error');
        }
    }

    // Atualizar perfil
    async updateProfile(profileId, profileData) {
        try {
            const updatedProfile = await window.API.updateProfile(profileId, profileData);
            const index = this.profiles.findIndex(p => p.id === profileId);
            if (index !== -1) {
                this.profiles[index] = { ...this.profiles[index], ...updatedProfile };
            }
            this.renderCurrentTab();
            window.UI.showToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            window.UI.showToast('Erro ao atualizar perfil', 'error');
        }
    }

    // Excluir perfil
    async deleteProfile(profileId) {
        try {
            const profile = this.profiles.find(p => p.id === profileId);
            if (!profile) return;

            // Verificar se há usuários usando este perfil
            const usersWithProfile = this.getUserCountByProfile(profileId);
            if (usersWithProfile > 0) {
                window.UI.showToast(`Não é possível excluir o perfil "${profile.name}" pois há ${usersWithProfile} usuário(s) utilizando-o.`, 'error');
                return;
            }

            const confirmed = await window.UI.showConfirmation(
                `Tem certeza que deseja excluir o perfil "${profile.name}"? Esta ação não pode ser desfeita.`,
                {
                    title: 'Confirmar Exclusão',
                    confirmText: 'Excluir',
                    type: 'danger'
                }
            );

            if (!confirmed) return;

            await window.API.deleteProfile(profileId);
            this.profiles = this.profiles.filter(p => p.id !== profileId);
            this.renderCurrentTab();
            
            window.UI.showToast('Perfil excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir perfil:', error);
            window.UI.showToast('Erro ao excluir perfil', 'error');
        }
    }

    // Renderizar erro
    renderError() {
        const tabContent = document.getElementById('tabContent');
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar dados</h3>
                    <p>Não foi possível carregar os usuários e perfis.</p>
                    <button class="btn btn-primary" onclick="window.PerfisManager.refresh()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    // Atualizar dados
    async refresh() {
        try {
            window.UI.showToast('Atualizando dados...', 'info');
            await this.loadData();
            window.UI.showToast('Dados atualizados!', 'success');
        } catch (error) {
            window.UI.showToast('Erro ao atualizar dados', 'error');
        }
    }
}

// CSS adicional para perfis
const perfisCSS = `
.perfis-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border: none;
    background: transparent;
    color: var(--text-light);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all var(--transition-fast);
    font-weight: 500;
}

.tab-btn:hover {
    color: var(--text-color);
    background: var(--background-secondary);
}

.tab-btn.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

.tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.users-grid,
.profiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

.user-card,
.profile-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
    transition: all var(--transition-fast);
}

.user-card:hover,
.profile-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.user-card.inactive {
    opacity: 0.6;
    background: var(--background-secondary);
}

.user-header,
.profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.user-avatar,
.profile-icon {
    width: 50px;
    height: 50px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
}

.user-info h4,
.profile-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--text-color);
}

.username,
.profile-description {
    margin: 0;
    color: var(--text-light);
    font-size: 0.875rem;
}

.user-status {
    margin-left: auto;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-active {
    background: var(--success-light);
    color: var(--success);
}

.status-inactive {
    background: var(--danger-light);
    color: var(--danger);
}

.user-details {
    margin-bottom: 1.5rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.detail-item .label {
    color: var(--text-light);
}

.detail-item .value {
    color: var(--text-color);
    font-weight: 500;
}

.user-actions,
.profile-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.profile-permissions {
    margin-bottom: 1.5rem;
}

.profile-permissions h5 {
    margin-bottom: 0.75rem;
    color: var(--text-color);
    font-size: 0.875rem;
}

.permissions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.permission-tag {
    background: var(--primary-light);
    color: var(--primary-color);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
}

.no-permissions {
    color: var(--text-light);
    font-style: italic;
    font-size: 0.875rem;
}

.profile-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-light);
    text-transform: uppercase;
}

.profile-form {
    max-width: 100%;
}

.permissions-section {
    margin: 2rem 0;
}

.permissions-section h4 {
    margin-bottom: 1rem;
    color: var(--text-color);
}

.permissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.permission-group {
    background: var(--background-secondary);
    padding: 1rem;
    border-radius: var(--radius-md);
}

.permission-group h5 {
    margin-bottom: 0.75rem;
    color: var(--text-color);
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.permission-item {
    margin-bottom: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-color);
}

.checkbox-label input[type="checkbox"] {
    margin: 0;
}

@media (max-width: 768px) {
    .users-grid,
    .profiles-grid {
        grid-template-columns: 1fr;
    }
    
    .tab-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .permissions-grid {
        grid-template-columns: 1fr;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = perfisCSS;
document.head.appendChild(style);

// Instância global do gerenciador de perfis
window.PerfisManager = new PerfisManager();

