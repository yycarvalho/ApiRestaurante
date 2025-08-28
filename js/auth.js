/**
 * Gerenciador de Autenticação
 * Responsável por login, logout e gerenciamento de sessão
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.permissions = {};
        this.loginForm = null;
        this.isAuthenticated = false;
        
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.checkExistingSession();
    }

    // Configurar formulário de login
    setupLoginForm() {
        this.loginForm = document.getElementById('loginForm');
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Configurar botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Renderizar perfis de acesso rápido
        this.renderQuickAccessProfiles();
    }

    // Verificar sessão existente
    async checkExistingSession() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);

        if (token && userData) {
            try {
                // Validar token com o servidor
                await window.API.validateToken();
                
                // Restaurar dados do usuário
                const user = JSON.parse(userData);
                this.setUserData(user);
                this.showMainSystem();
                
            } catch (error) {
                debugLog('Token inválido, fazendo logout', error);
                this.logout();
            }
        }
    }

    // Renderizar perfis de acesso rápido
    async renderQuickAccessProfiles() {
        const container = document.querySelector('.profile-quick-access');
        if (!container) return;

        try {
            // Buscar perfis disponíveis da API
            const profiles = await window.API.getProfiles();
            
            container.innerHTML = '';
            
            profiles.forEach(profile => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = profile.name;
                btn.onclick = () => this.quickLogin(profile.defaultUsername);
                container.appendChild(btn);
            });
            
        } catch (error) {
            debugLog('Erro ao carregar perfis', error);
            // Fallback para perfis estáticos
            this.renderStaticProfiles(container);
        }
    }

    // Renderizar perfis estáticos (fallback)
    renderStaticProfiles(container) {
        const staticProfiles = [
            { name: 'Administrador', username: 'admin' },
            { name: 'Atendente', username: 'atendente' },
            { name: 'Entregador', username: 'entregador' }
        ];

        container.innerHTML = '';
        
        staticProfiles.forEach(profile => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-sm';
            btn.textContent = profile.name;
            btn.onclick = () => this.quickLogin(profile.username);
            container.appendChild(btn);
        });
    }

    // Login rápido
    async quickLogin(username) {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (usernameField && passwordField) {
            usernameField.value = username;
            passwordField.value = '123'; // Senha padrão para demo
            
            // Simular submit do formulário
            this.loginForm.dispatchEvent(new Event('submit'));
        }
    }

    // Manipular submit do login
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        // Validar campos
        if (!this.validateLoginForm(username, password)) {
            return;
        }

        try {
            this.setLoginLoading(true);
            this.clearLoginErrors();

            // Fazer login via API
            const response = await window.API.login(username, password);
            
            // Configurar dados do usuário
            this.setUserData(response.user);
            
            // Salvar dados no localStorage
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
            
            // Mostrar sistema principal
            this.showMainSystem();
            
            // Mostrar mensagem de sucesso
            window.UI.showToast('Login realizado com sucesso!', 'success');
            
        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.setLoginLoading(false);
        }
    }

    // Validar formulário de login
    validateLoginForm(username, password) {
        let isValid = true;

        // Validar username
        if (!username || username.trim().length === 0) {
            this.showFieldError('username', 'Usuário é obrigatório');
            isValid = false;
        } else if (username.length > CONFIG.VALIDATION.MAX_USERNAME_LENGTH) {
            this.showFieldError('username', `Usuário deve ter no máximo ${CONFIG.VALIDATION.MAX_USERNAME_LENGTH} caracteres`);
            isValid = false;
        }

        // Validar password
        if (!password || password.length === 0) {
            this.showFieldError('password', 'Senha é obrigatória');
            isValid = false;
        } else if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
            this.showFieldError('password', `Senha deve ter no mínimo ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} caracteres`);
            isValid = false;
        }

        return isValid;
    }

    // Mostrar erro em campo específico
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Limpar erros do formulário
    clearLoginErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });

        const statusElement = document.getElementById('login-status');
        if (statusElement) {
            statusElement.textContent = '';
        }
    }

    // Configurar estado de loading do login
    setLoginLoading(isLoading) {
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    // Tratar erro de login
    handleLoginError(error) {
        let message = 'Erro ao fazer login. Tente novamente.';
        
        if (error.status === 401) {
            message = 'Usuário ou senha inválidos.';
        } else if (error.type === 'NETWORK_ERROR') {
            message = 'Erro de conexão. Verifique sua internet.';
        } else if (error.message) {
            message = error.message;
        }

        const statusElement = document.getElementById('login-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'login-status text-danger';
        }

        window.UI.showToast(message, 'error');
    }

    // Configurar dados do usuário
    setUserData(userData) {
        this.currentUser = userData.username;
        this.currentProfile = userData.profile;
        this.permissions = userData.permissions || {};
        this.isAuthenticated = true;

        // Atualizar UI com dados do usuário
        this.updateUserInfo(userData);
    }

    // Atualizar informações do usuário na UI
    updateUserInfo(userData) {
        const userNameElement = document.getElementById('currentUser');
        const userProfileElement = document.getElementById('currentProfile');

        if (userNameElement) {
            userNameElement.textContent = userData.name || userData.username;
        }

        if (userProfileElement) {
            userProfileElement.textContent = userData.profileName || userData.profile;
        }
    }

    // Mostrar sistema principal
    showMainSystem() {
        const loginScreen = document.getElementById('loginScreen');
        const mainSystem = document.getElementById('mainSystem');

        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }

        if (mainSystem) {
            mainSystem.classList.remove('hidden');
        }

        // Configurar navegação baseada em permissões
        this.setupNavigation();
        
        // Navegar para primeira seção disponível
        this.navigateToFirstAvailableSection();
    }

    // Configurar navegação baseada em permissões
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const section = item.dataset.section;
            const hasPermission = this.hasPermissionForSection(section);
            
            if (hasPermission) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Verificar permissão para seção
    hasPermissionForSection(section) {
        switch(section) {
            case 'dashboard':
                return this.permissions.verDashboard;
            case 'pedidos':
                return this.permissions.verPedidos;
            case 'cardapio':
                return this.permissions.verCardapio;
            case 'relatorios':
                return this.permissions.gerarRelatorios;
            case 'perfis':
                return this.permissions.gerenciarPerfis;
            default:
                return false;
        }
    }

    // Navegar para primeira seção disponível
    navigateToFirstAvailableSection() {
        const visibleNavItems = document.querySelectorAll('.nav-item:not([style*="display: none"])');
        
        if (visibleNavItems.length > 0) {
            const firstSection = visibleNavItems[0].dataset.section;
            if (window.Navigation) {
                window.Navigation.navigateToSection(firstSection);
            }
        }
    }

    // Logout
    async logout() {
        try {
            // Fazer logout via API
            await window.API.logout();
        } catch (error) {
            debugLog('Erro no logout', error);
        } finally {
            // Limpar dados locais
            this.clearUserData();
            
            // Mostrar tela de login
            this.showLoginScreen();
            
            // Mostrar mensagem
            window.UI.showToast('Logout realizado com sucesso!', 'success');
        }
    }

    // Limpar dados do usuário
    clearUserData() {
        this.currentUser = null;
        this.currentProfile = null;
        this.permissions = {};
        this.isAuthenticated = false;

        // Limpar localStorage
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }

    // Mostrar tela de login
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainSystem = document.getElementById('mainSystem');

        if (mainSystem) {
            mainSystem.classList.add('hidden');
        }

        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }

        // Limpar formulário
        if (this.loginForm) {
            this.loginForm.reset();
        }

        this.clearLoginErrors();
    }

    // Verificar se usuário tem permissão específica
    hasPermission(permission) {
        return this.permissions[permission] === true;
    }

    // Obter dados do usuário atual
    getCurrentUser() {
        return {
            username: this.currentUser,
            profile: this.currentProfile,
            permissions: this.permissions,
            isAuthenticated: this.isAuthenticated
        };
    }
}

// Instância global do gerenciador de autenticação
window.AuthManager = new AuthManager();

