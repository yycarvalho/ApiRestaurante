/**
 * Sistema de Gestão de Pedidos
 * Autor: Manus AI
 * Versão: 4.0 (Integração com API Java)
 * 
 * ALTERAÇÕES NA V4.0:
 * - Integração completa com API REST Java
 * - Autenticação JWT com renovação automática
 * - Sistema de cache local para melhor performance
 * - Tratamento robusto de erros de rede e API
 * - Estados de loading para todas as operações
 * - Validação automática de sessão
 * - Todas as regras de negócio movidas para a API
 * 
 * CONFIGURAÇÃO:
 * - Altere API_CONFIG.BASE_URL para o endereço da sua API
 * - A API deve estar rodando e acessível
 * - Usuários padrão: admin/123, atendente/123, entregador/123
 */

// =================================================================
// CONFIGURAÇÕES DA API
// =================================================================
const API_CONFIG = {
    BASE_URL: './api', // API PHP local
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth.php',
            LOGOUT: '/auth.php',
            VALIDATE: '/auth.php'
        },
        USERS: {
            LIST: '/users.php',
            CREATE: '/users.php',
            UPDATE: '/users.php',
            DELETE: '/users.php'
        },
        PROFILES: {
            LIST: '/profiles.php',
            CREATE: '/profiles.php',
            UPDATE: '/profiles.php',
            DELETE: '/profiles.php'
        },
        PRODUCTS: {
            LIST: '/products.php',
            CREATE: '/products.php',
            UPDATE: '/products.php',
            DELETE: '/products.php'
        },
        ORDERS: {
            LIST: '/orders.php',
            CREATE: '/orders.php',
            UPDATE_STATUS: '/orders.php',
            DELETE: '/orders.php'
        },
        CUSTOMERS: {
            LIST: '/customers.php',
            CREATE: '/customers.php',
            GET: '/customers.php'
        },
        CUSTOMER_MESSAGES: {
            LIST: '/customer-messages.php',
            CREATE: '/customer-messages.php'
        },
        ORDER_MESSAGES: {
            LIST: '/order-messages.php',
            CREATE: '/order-messages.php'
        },
        ACCOUNT: {
            CHANGE_PASSWORD: '/users.php'
        },
        METRICS: {
            DASHBOARD: '/metrics.php',
            REPORTS: '/metrics.php'
        }
    }
};

// =================================================================
// UTILITÁRIOS JWT E API
// =================================================================
class ApiService {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jwt_token', token);
        } else {
            localStorage.removeItem('jwt_token');
        }
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Se o token expirou, tentar renovar ou redirecionar para login
            if (response.status === 401) {
                if (endpoint !== API_CONFIG.ENDPOINTS.AUTH.LOGIN) {
                    this.handleTokenExpiration();
                    throw new Error('Sessão expirada. Faça login novamente.');
                }
            }

            if (!response.ok) {
                let errorMessage = `Erro ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Se não conseguir parsear o JSON, usar a mensagem padrão
                }

                // Tratamento específico para diferentes códigos de erro
                switch (response.status) {
                    case 400:
                        throw new Error(errorMessage || 'Dados inválidos enviados.');
                    case 403:
                        throw new Error('Você não tem permissão para realizar esta ação.');
                    case 404:
                        throw new Error('Recurso não encontrado.');
                    case 409:
                        throw new Error(errorMessage || 'Conflito de dados.');
                    case 500:
                        throw new Error('Erro interno do servidor. Tente novamente.');
                    default:
                        throw new Error(errorMessage);
                }
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            // Tratamento de erros de rede
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
            }
            
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    async handleTokenExpiration() {
        this.setToken(null);
        // Será implementado pela classe principal
        if (window.sistema) {
            await window.sistema.logout();
        }
    }

    // Método para verificar se o token está próximo do vencimento
    isTokenExpiringSoon() {
        if (!this.token) return false;
        
        try {
            // Decode JWT payload (simples, sem verificação de assinatura)
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const timeToExpiry = payload.exp - now;
            
            // Se expira em menos de 5 minutos (300 segundos)
            return timeToExpiry < 300;
        } catch (error) {
            console.error('Erro ao verificar expiração do token:', error);
            return false;
        }
    }

    // Métodos HTTP
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.makeRequest(url, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.makeRequest(endpoint, { method: 'DELETE' });
    }
}

class SistemaPedidos {
    constructor() {
        this.currentUser = null;
        this.permissions = {};
        this.products = [];
        this.orders = [];
        this.customers = [];
        this.profiles = [];
        this.users = [];
        this.apiService = new ApiService();
        this.currentSection = 'dashboard';
        this.orderStatuses = [
            { id: 'em_atendimento', name: 'Em Atendimento', color: '#ffc107' },
            { id: 'aguardando_pagamento', name: 'Aguardando Pagamento', color: '#17a2b8' },
            { id: 'pedido_feito', name: 'Pedido Feito', color: '#fd7e14' },
            { id: 'cancelado', name: 'Cancelado', color: '#dc3545' },
            { id: 'coletado', name: 'Coletado', color: '#6f42c1' },
            { id: 'pronto', name: 'Pronto', color: '#28a745' },
            { id: 'finalizado', name: 'Finalizado', color: '#20c997' }
        ];
        this.orderTypes = [
            { id: 'delivery', name: 'Entrega' },
            { id: 'pickup', name: 'Retirada' }
        ];
        this.init();
    }

    init() {
        // Inicialização
        this.initializeEventListeners();
        this.checkExistingSession();
        this.startTokenValidationTimer();
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Capturar erros não tratados
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Erro não tratado:', event.reason);
            this.showToast('Ocorreu um erro inesperado. Tente novamente.', 'error');
            event.preventDefault();
        });

        window.addEventListener('error', (event) => {
            console.error('Erro de JavaScript:', event.error);
            this.showToast('Erro na aplicação. Recarregue a página se necessário.', 'error');
        });
    }

    startTokenValidationTimer() {
        // Verificar token a cada 2 minutos
        setInterval(async () => {
            if (this.apiService.token && this.currentUser) {
                try {
                    // Tentar validar o token
                    await this.apiService.get(API_CONFIG.ENDPOINTS.AUTH.VALIDATE);
                } catch (error) {
                    console.warn('Token inválido detectado, fazendo logout...');
                    await this.logout();
                }
            }
        }, 2 * 60 * 1000); // 2 minutos

        // Polling em background para dados (pedidos, métricas, produtos, perfis, usuários)
        setInterval(async () => {
            if (!this.apiService.token || !this.currentUser) return;
            try {
                const [ordersData, metricsData, productsData, profilesData, usersData] = await Promise.all([
                    this.apiService.get(API_CONFIG.ENDPOINTS.ORDERS.LIST),
                    this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD),
                    this.apiService.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST),
                    this.apiService.get(API_CONFIG.ENDPOINTS.PROFILES.LIST),
                    this.apiService.get(API_CONFIG.ENDPOINTS.USERS.LIST)
                ]);

                const ordersChanged = JSON.stringify(ordersData) !== JSON.stringify(this.orders);
                const metricsChanged = JSON.stringify(metricsData) !== JSON.stringify(this.metrics);
                const productsChanged = JSON.stringify(productsData) !== JSON.stringify(this.products);
                const profilesChanged = JSON.stringify(profilesData) !== JSON.stringify(this.profiles);
                const usersChanged = JSON.stringify(usersData) !== JSON.stringify(this.users);

                if (ordersChanged) this.orders = ordersData;
                if (metricsChanged) this.metrics = metricsData;
                if (productsChanged) this.products = productsData;
                if (profilesChanged) this.profiles = profilesData;
                if (usersChanged) this.users = usersData;

                if (ordersChanged || metricsChanged || productsChanged || profilesChanged || usersChanged) {
                    // Re-renderizar seção ativa
                    if (this.currentSection) {
                        this.renderSectionContent(this.currentSection);
                    }
                }
            } catch (e) {
                // Silenciar erros de polling para não atrapalhar UX
            }
        }, 30 * 1000); // a cada 30s
    }

    // =================================================================
    // 1. INICIALIZAÇÃO E SESSÃO
    // =================================================================

    async checkExistingSession() {
        const token = this.apiService.token;
        if (token) {
            try {
                this.showLoading();
                const response = await this.apiService.get(API_CONFIG.ENDPOINTS.AUTH.VALIDATE);
                
                // Token válido, restaurar sessão
                const validatedUser = (response && (response.user || response.data?.user)) || response || {};
                this.currentUser = validatedUser.username || validatedUser.name || '';
                this.currentProfile = validatedUser.profileId ?? validatedUser.profile?.id ?? null;
                this.permissions = validatedUser.permissions || validatedUser.roles?.permissions || {};
                
                await this.loadInitialData();
                this.showMainSystem();
            } catch (error) {
                console.error('Token inválido:', error);
                this.apiService.setToken(null);
                this.showLoginScreen();
            } finally {
                this.hideLoading();
            }
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainSystem').classList.add('hidden');
        this.renderLoginProfiles();
    }

    showMainSystem() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainSystem').classList.remove('hidden');
        this.setupUI();
    }

    async renderLoginProfiles() {
        const container = document.getElementById('loginProfiles');
        container.innerHTML = '<p>Ou acesse rapidamente como:</p>';
        
        const quickAccessContainer = document.createElement('div');
        quickAccessContainer.className = 'profile-quick-access';

        // Perfis de acesso rápido baseados na API
        const quickProfiles = [
            { username: 'admin', password: '123', name: 'Administrador' },
            { username: 'atendente', password: '123', name: 'Atendente' },
            { username: 'entregador', password: '123', name: 'Entregador' }
        ];

        quickProfiles.forEach(profile => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = profile.name;
            btn.onclick = () => this.login(profile.username, profile.password);
            quickAccessContainer.appendChild(btn);
        });
        
        container.appendChild(quickAccessContainer);
    }

    async loadInitialData() {
        try {
            // Carregar dados em paralelo
            const [profilesData, productsData, ordersData, metricsData, usersData] = await Promise.all([
                this.apiService.get(API_CONFIG.ENDPOINTS.PROFILES.LIST),
                this.apiService.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST),
                this.apiService.get(API_CONFIG.ENDPOINTS.ORDERS.LIST),
                this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD),
                this.apiService.get(API_CONFIG.ENDPOINTS.USERS.LIST)
            ]);

            this.profiles = profilesData;
            this.products = productsData;
            this.orders = ordersData;
            this.metrics = metricsData;
            this.users = usersData;

            // Status dos Pedidos (mantido local por ser configuração)
            this.orderStatuses = [
                { id: 'pending', name: 'Pendente', color: '#ffc107' },
                { id: 'confirmed', name: 'Confirmado', color: '#17a2b8' },
                { id: 'preparing', name: 'Em Preparo', color: '#fd7e14' },
                { id: 'ready', name: 'Pronto', color: '#28a745' },
                { id: 'delivering', name: 'Em Entrega', color: '#6f42c1' },
                { id: 'delivered', name: 'Entregue', color: '#20c997' },
                { id: 'cancelled', name: 'Cancelado', color: '#dc3545' }
            ];

            // Lista de todas as permissões disponíveis (mantido local)
            this.availablePermissions = {
                verDashboard: 'Ver Dashboard',
                verPedidos: 'Ver Pedidos',
                verCardapio: 'Ver Cardápio',
                criarEditarProduto: 'Criar/Editar Produto',
                excluirProduto: 'Excluir Produto',
                desativarProduto: 'Desativar Produto',
                verChat: 'Ver Chat',
                enviarChat: 'Enviar Chat',
                imprimirPedido: 'Imprimir Pedido',
                acessarEndereco: 'Acessar Endereço',
                visualizarValorPedido: 'Visualizar Valor do Pedido',
                acompanharEntregas: 'Acompanhar Entregas',
                gerarRelatorios: 'Gerar Relatórios',
                gerenciarPerfis: 'Gerenciar Perfis',
                alterarStatusPedido: 'Alterar Status do Pedido',
                selecionarStatusEspecifico: 'Selecionar Status Específico',
                criarUsuarios: 'Criar Usuários',
                editarUsuarios: 'Editar Usuários',
                excluirUsuarios: 'Excluir Usuários',
            };

            this.navigateToSection('dashboard');
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showToast('Erro ao carregar dados do sistema.', 'error');
        }
    }

    initializeEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            this.login(username, password);
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Busca
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchOrders(e.target.value);
        });

        // Logout ao atualizar/fechar a página
        window.addEventListener('beforeunload', () => {
            this.apiService.setToken(null);
        });
        window.addEventListener('unload', () => {
            this.apiService.setToken(null);
        });
    }

    // =================================================================
    // 2. AUTENTICAÇÃO COM API
    // =================================================================

    async login(username, password) {
        try {
            this.showLoading();
            
            const response = await this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                username,
                password
            });

            // Armazenar token e dados do usuário
            const token = response.token || response.accessToken || response.jwt;
            this.apiService.setToken(token);
            const loggedUser = (response && (response.user || response.data?.user)) || response || {};
            this.currentUser = loggedUser.username || loggedUser.name || '';
            this.currentProfile = loggedUser.profileId ?? loggedUser.profile?.id ?? null;
            this.permissions = loggedUser.permissions || loggedUser.roles?.permissions || {};

            // Atualizar UI após dados carregados
            await this.loadInitialData();
            this.showMainSystem();
            this.showToast('Login realizado com sucesso!', 'success');

            // Log de login bem-sucedido
            this.logUserActivity('login_sucesso', `Usuário ${username} fez login no sistema`);
            this.logSystemAction('user_login', `Usuário ${username} autenticado com sucesso`, 'info', {
                username: username,
                profileId: this.currentProfile
            });

        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast(error.message || 'Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        try {
            // Log de logout
            if (this.currentUser) {
                this.logUserActivity('logout', `Usuário ${this.currentUser} fez logout do sistema`);
                this.logSystemAction('user_logout', `Usuário ${this.currentUser} desconectado`, 'info', {
                    username: this.currentUser
                });
            }

            // Tentar fazer logout na API
            if (this.apiService.token) {
                await this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            // Limpar dados locais independente do resultado da API
            this.apiService.setToken(null);
            this.currentUser = null;
            this.currentProfile = null;
            this.permissions = {};

            // Limpar cache de dados
            this.products = [];
            this.orders = [];
            this.customers = [];
            this.profiles = [];
            this.users = [];
            this.metrics = {};

            // Voltar para tela de login
            this.showLoginScreen();
            document.getElementById('loginForm').reset();
        }
    }

    // =================================================================
    // 3. HELPERS DE UI E NAVEGAÇÃO
    // =================================================================

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    selectFirstNavItem() {
        const firstNavItem = document.querySelector('.nav-item[data-section="dashboard"]');
        if (firstNavItem) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            firstNavItem.classList.add('active');
        }
    }

    setupUI() {
        // Atualizar informações do usuário no header
        document.getElementById('currentUser').textContent = this.currentUser;
        
        // Encontrar o perfil do usuário
        const userProfile = this.profiles.find(p => p.id == this.currentProfile);
        document.getElementById('currentProfile').textContent = userProfile ? userProfile.name : 'Perfil';

        // Configurar visibilidade dos itens de navegação baseado nas permissões
        document.querySelectorAll('.nav-item').forEach(item => {
            const section = item.dataset.section;
            let hasPermission = false;

            switch(section) {
                case 'dashboard':
                    hasPermission = this.permissions.verDashboard;
                    break;
                case 'pedidos':
                    hasPermission = this.permissions.verPedidos;
                    break;
                case 'cardapio':
                    hasPermission = this.permissions.verCardapio;
                    break;
                case 'clientes':
                    hasPermission = this.permissions.verClientes;
                    break;
                case 'relatorios':
                    hasPermission = this.permissions.gerarRelatorios;
                    break;
                case 'perfis':
                    hasPermission = this.permissions.gerenciarPerfis;
                    break;
                default:
                    hasPermission = false;
            }

            item.style.display = hasPermission ? 'flex' : 'none';
        });

        // Selecionar primeiro item visível
        this.selectFirstVisibleNavItem();
    }

    selectFirstVisibleNavItem() {
        const visibleNavItems = document.querySelectorAll('.nav-item:not([style*="display: none"])');
        if (visibleNavItems.length > 0) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            visibleNavItems[0].classList.add('active');
            this.navigateToSection(visibleNavItems[0].dataset.section);
        }
    }

    navigateToSection(section) {
        this.currentSection = section;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}Section`);
        });

        const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (navItem) {
            document.getElementById('sectionTitle').textContent = navItem.querySelector('span').textContent;
        }

        this.renderSectionContent(section);
    }

    renderSectionContent(section) {
        const container = document.getElementById(`${section}Section`);
        container.innerHTML = ''; // Limpa conteúdo anterior

        switch (section) {
            case 'dashboard': this.renderDashboard(container); break;
            case 'pedidos': this.renderPedidos(container); break;
            case 'cardapio': this.renderCardapio(container); break;
            case 'clientes': this.renderClientes(container); break;
            case 'relatorios': this.renderRelatorios(container); break;
            case 'perfis': this.renderPerfis(container); break;
        }
    }

    // =================================================================
    // 3. RENDERIZAÇÃO DAS SEÇÕES
    // =================================================================

    renderDashboard(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Visão Geral</h2>
            </div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Pedidos Hoje</h3>
                    <div class="value">${this.orders.filter(o => {
                        const today = new Date().toDateString();
                        const orderDate = new Date(o.createdAt).toDateString();
                        return orderDate === today && o.status !== 'cancelled';
                    }).length}</div>
                </div>
                <div class="metric-card">
                    <h3>Faturamento</h3>
                    <div class="value">R$ ${this.orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <h3>Pedidos Ativos</h3>
                    <div class="value">${this.orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</div>
                </div>
            </div>
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Pedidos por Status</h3>
                    <canvas id="statusChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Faturamento Mensal (Simulado)</h3>
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        `;
        this.renderCharts();
    }

    renderCharts() {
        // Gráfico de Status de Pedidos
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        const pedidosPorStatus = this.metrics?.pedidosPorStatus || {};
        const statusLabels = Object.keys(pedidosPorStatus).map(s => this.orderStatuses?.find(os => os.id === s)?.name || s);
        const statusData = Object.values(pedidosPorStatus);
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1', '#6b7280'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Gráfico de Faturamento
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        const faturamentoMensal = Array.isArray(this.metrics?.faturamentoMensal) ? this.metrics.faturamentoMensal : new Array(12).fill(0);
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago','Set','Out','Nov','Dez'],
                datasets: [{
                    label: 'Faturamento',
                    data: faturamentoMensal,
                    borderColor: '#6a5af9',
                    backgroundColor: 'rgba(106, 90, 249, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderPedidos(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Gerenciar Pedidos</h2>
                <button class="btn btn-primary" id="newOrderBtn">
                    <i class="fas fa-plus"></i> Novo Pedido
                </button>
            </div>
            <div class="kanban-board" id="kanbanBoard"></div>
        `;
        this.renderKanbanBoard();
        document.getElementById('newOrderBtn').onclick = () => this.showNewOrderModal();
    }

    renderKanbanBoard() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        kanbanBoard.innerHTML = '';

        const statuses = Array.isArray(this.orderStatuses) ? this.orderStatuses : [];
        statuses.forEach(status => {
            const column = document.createElement('div');
            column.className = 'kanban-column';
            column.dataset.statusId = status.id;

            const ordersInStatus = this.orders.filter(order => order.status === status.id);

            column.innerHTML = `
                <div class="column-header">
                    <span class="column-title">${status.name}</span>
                    <span class="column-count">${ordersInStatus.length}</span>
                </div>
                <div class="order-cards">
                    ${ordersInStatus.map(order => this.createOrderCard(order)).join('')}
                </div>
            `;
            kanbanBoard.appendChild(column);
        });

        document.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = card.dataset.orderId;
                this.showOrderModal(orderId);
            });
        });
    }

    createOrderCard(order) {
        const productNames = order.items.map(item => {
            const product = this.products.find(p => p.id === item.productId);
            return `${item.quantity}x ${product ? product.name : 'Produto desconhecido'}`;
        }).join(', ');

        const timeAgo = this.getTimeAgo(order.createdAt);

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-time">${timeAgo}</span>
                </div>
                <div class="order-customer">${order.customer}</div>
                <div class="order-items">${productNames}</div>
                <div class="order-footer">
                    ${this.permissions.visualizarValorPedido ? `<span class="order-total">R$ ${order.total.toFixed(2)}</span>` : '<span class="order-total">---</span>'}
                    <span class="order-type ${order.type === 'delivery' ? 'type-delivery' : 'type-pickup'}">
                        ${order.type === 'delivery' ? 'Entrega' : 'Retirada'}
                    </span>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}min`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
    }

    renderCardapio(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Gerenciar Cardápio</h2>
                ${this.permissions.criarEditarProduto ? `
                <button class="btn btn-primary" id="newProductBtn">
                    <i class="fas fa-plus"></i> Novo Produto
                </button>
                ` : ''}
            </div>
            <div class="products-grid" id="productsGrid">
                ${this.products.map(product => this.createProductCard(product)).join('')}
            </div>
        `;
        
        if (this.permissions.criarEditarProduto) {
            document.getElementById('newProductBtn').onclick = () => this.showProductModal();
        }
    }

    createProductCard(product) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <span class="product-price">R$ ${product.price.toFixed(2)}</span>
                </div>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-category">${product.category}</span>
                    <span class="product-status ${product.active ? 'status-active' : 'status-inactive'}">
                        ${product.active ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                <div class="product-actions">
                    ${this.permissions.criarEditarProduto ? `
                    <button class="btn btn-secondary btn-sm" onclick="sistema.editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ` : ''}
                    ${this.permissions.desativarProduto ? `
                    <button class="btn ${product.active ? 'btn-warning' : 'btn-success'} btn-sm" onclick="sistema.toggleProductStatus(${product.id})">
                        <i class="fas fa-${product.active ? 'eye-slash' : 'eye'}"></i> ${product.active ? 'Desativar' : 'Ativar'}
                    </button>
                    ` : ''}
                    ${this.permissions.excluirProduto ? `
                    <button class="btn btn-danger btn-sm" onclick="sistema.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderClientes(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Gerenciar Clientes</h2>
                <button class="btn btn-primary" id="newCustomerBtn">
                    <i class="fas fa-plus"></i> Novo Cliente
                </button>
            </div>
            <div class="customers-grid" id="customersGrid">
                <div class="loading-placeholder">Carregando clientes...</div>
            </div>
        `;
        
        document.getElementById('newCustomerBtn').onclick = () => this.showNewCustomerModal();
        this.loadCustomers();
    }

    async loadCustomers() {
        try {
            this.showLoading();
            const customers = await this.apiService.get(API_CONFIG.ENDPOINTS.CUSTOMERS.LIST);
            this.customers = customers;
            this.renderCustomersGrid();
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showToast('Erro ao carregar clientes.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderCustomersGrid() {
        const grid = document.getElementById('customersGrid');
        if (!this.customers || this.customers.length === 0) {
            grid.innerHTML = '<div class="empty-state">Nenhum cliente encontrado</div>';
            return;
        }

        grid.innerHTML = this.customers.map(customer => this.createCustomerCard(customer)).join('');
        
        // Adicionar event listeners para os cards
        document.querySelectorAll('.customer-card').forEach(card => {
            card.addEventListener('click', () => {
                const customerId = card.dataset.customerId;
                this.showCustomerDetails(customerId);
            });
        });
    }

    createCustomerCard(customer) {
        const orderCount = this.orders.filter(o => o.customer === customer.name || o.phone === customer.phone).length;
        const lastOrder = this.orders
            .filter(o => o.customer === customer.name || o.phone === customer.phone)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        const lastOrderText = lastOrder ? this.getTimeAgo(new Date(lastOrder.createdAt)) : 'Nunca';
        
        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-header">
                    <div class="customer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="customer-info">
                        <h3 class="customer-name">${customer.name}</h3>
                        <span class="customer-phone">${customer.phone}</span>
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="stat-item">
                        <span class="stat-label">Pedidos</span>
                        <span class="stat-value">${orderCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Último Pedido</span>
                        <span class="stat-value">${lastOrderText}</span>
                    </div>
                </div>
                <div class="customer-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); sistema.showCustomerDetails(${customer.id})">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    async showCustomerDetails(customerId) {
        try {
            this.showLoading();
            const customer = await this.apiService.get(`${API_CONFIG.ENDPOINTS.CUSTOMERS.GET}/${customerId}`);
            
            // Buscar pedidos do cliente
            const customerOrders = this.orders.filter(o => 
                o.customerId === customerId || o.customer === customer.name || o.phone === customer.phone
            );
            
            // Buscar mensagens do cliente do banco de dados
            const customerMessages = await this.loadCustomerMessages(customerId);
            
            this.showCustomerDetailsModal(customer, customerOrders, customerMessages);
        } catch (error) {
            console.error('Erro ao carregar detalhes do cliente:', error);
            this.showToast('Erro ao carregar detalhes do cliente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    getCustomerMessages(customer) {
        // Buscar mensagens de todos os pedidos do cliente
        const messages = [];
        this.orders
            .filter(o => o.customer === customer.name || o.phone === customer.phone)
            .forEach(order => {
                if (order.chat) {
                    order.chat.forEach(msg => {
                        messages.push({
                            ...msg,
                            orderId: order.id,
                            orderStatus: order.status,
                            timestamp: msg.time || new Date()
                        });
                    });
                }
            });
        
        // Ordenar por timestamp
        return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    showCustomerDetailsModal(customer, orders, messages) {
        const modalHTML = `
            <div class="modal-header">
                <h3>Cliente: ${customer.name}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="customer-details-container">
                    <div class="customer-info">
                        <h4>Informações do Cliente</h4>
                        <p><strong>Nome:</strong> ${customer.name}</p>
                        <p><strong>Telefone:</strong> ${customer.phone}</p>
                        <p><strong>Cliente desde:</strong> ${new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Total de Pedidos:</strong> ${orders.length}</p>
                        <p><strong>Valor Total:</strong> R$ ${orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</p>
                        
                        <h4>Histórico de Pedidos</h4>
                        <div class="customer-orders-list">
                            ${orders.length > 0 ? orders.map(order => `
                                <div class="customer-order-item">
                                    <div class="order-header">
                                        <span class="order-id">#${order.id}</span>
                                        <span class="order-status ${order.status}">${this.getStatusName(order.status)}</span>
                                        <span class="order-date">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div class="order-items">
                                        ${order.items.map(item => `
                                            <span class="order-item">${item.quantity}x ${item.productName}</span>
                                        `).join('')}
                                    </div>
                                    <div class="order-footer">
                                        <span class="order-total">R$ ${order.total.toFixed(2)}</span>
                                        <span class="order-type ${order.type}">${order.type === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                                    </div>
                                </div>
                            `).join('') : '<div class="empty-state">Nenhum pedido encontrado</div>'}
                        </div>
                    </div>
                    
                    ${this.permissions.verChat ? `
                    <div class="customer-chat">
                        <h4>Chat com o Cliente</h4>
                        <div class="chat-messages" id="customerChatMessages">
                            ${messages.length > 0 ? messages.map(msg => `
                                <div class="chat-message ${msg.sender}">
                                    <div class="message-content">${msg.message}</div>
                                    <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                                    ${msg.orderId ? `<div class="message-order">Pedido #${msg.orderId}</div>` : ''}
                                </div>
                            `).join('') : '<div class="empty-state">Nenhuma mensagem encontrada</div>'}
                        </div>
                        ${this.permissions.enviarChat ? `
                        <div class="chat-input">
                            <input type="text" id="newCustomerMessage" placeholder="Digite sua mensagem..." maxlength="500">
                            <button class="btn btn-primary" id="sendCustomerMessageBtn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeCustomerModalBtn">Fechar</button>
                ${this.permissions.verChat && this.permissions.enviarChat ? `<button class="btn btn-primary" id="refreshCustomerChatBtn"><i class="fas fa-sync"></i> Atualizar Chat</button>` : ''}
            </div>
        `;
        
        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#closeCustomerModalBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            
            if (modal.querySelector('#sendCustomerMessageBtn')) {
                const sendMessage = async () => {
                    const messageInput = modal.querySelector('#newCustomerMessage');
                    const message = messageInput.value.trim();
                    if (message) {
                        try {
                            await this.addCustomerMessage(customer.id, message);
                            messageInput.value = '';
                            // Recarregar o modal para mostrar a nova mensagem
                            this.showCustomerDetails(customer.id);
                        } catch (error) {
                            console.error('Erro ao enviar mensagem:', error);
                        }
                    }
                };
                
                modal.querySelector('#sendCustomerMessageBtn').onclick = sendMessage;
                modal.querySelector('#newCustomerMessage').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });
            }
            
            if (modal.querySelector('#refreshCustomerChatBtn')) {
                modal.querySelector('#refreshCustomerChatBtn').onclick = () => {
                    this.showCustomerDetails(customer.id);
                };
            }
        });
    }

    renderCustomerOrders(orders) {
        if (orders.length === 0) {
            return '<div class="empty-state">Nenhum pedido encontrado</div>';
        }
        
        return `
            <div class="customer-orders">
                ${orders.map(order => `
                    <div class="customer-order-item">
                        <div class="order-header">
                            <span class="order-id">#${order.id}</span>
                            <span class="order-status ${order.status}">${this.getStatusName(order.status)}</span>
                            <span class="order-date">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="order-items">
                            ${order.items.map(item => `
                                <span class="order-item">${item.quantity}x ${item.productName}</span>
                            `).join('')}
                        </div>
                        <div class="order-footer">
                            <span class="order-total">R$ ${order.total.toFixed(2)}</span>
                            <span class="order-type ${order.type}">${order.type === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCustomerConversations(messages) {
        if (messages.length === 0) {
            return '<div class="empty-state">Nenhuma conversa encontrada</div>';
        }
        
        return `
            <div class="customer-conversations">
                ${messages.map(msg => `
                    <div class="conversation-message ${msg.sender}">
                        <div class="message-header">
                            <span class="message-sender">${this.getSenderName(msg.sender)}</span>
                            <span class="message-time">${new Date(msg.timestamp).toLocaleString('pt-BR')}</span>
                            ${msg.orderId ? `<span class="message-order">Pedido #${msg.orderId}</span>` : ''}
                        </div>
                        <div class="message-content">${msg.message}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupCustomerTabs(modal) {
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabPanes = modal.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Atualizar botões ativos
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Atualizar painéis ativos
                tabPanes.forEach(pane => {
                    pane.classList.toggle('active', pane.dataset.tab === tabName);
                });
            });
        });
    }

    showNewCustomerModal() {
        const modalHTML = `
            <div class="modal-header">
                <h3>Novo Cliente</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="newCustomerForm">
                    <div class="form-group">
                        <label for="customerName">Nome</label>
                        <input type="text" id="customerName" required>
                    </div>
                    <div class="form-group">
                        <label for="customerPhone">Telefone</label>
                        <input type="tel" id="customerPhone" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelNewCustomerBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveNewCustomerBtn">Salvar</button>
            </div>
        `;
        
        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelNewCustomerBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveNewCustomerBtn').onclick = () => this.saveNewCustomer(modal);
        });
    }

    async saveNewCustomer(modal) {
        const name = modal.querySelector('#customerName').value.trim();
        const phone = modal.querySelector('#customerPhone').value.trim();
        
        if (!name || !phone) {
            this.showToast('Nome e telefone são obrigatórios.', 'error');
            return;
        }
        
        try {
            this.showLoading();
            const newCustomer = await this.apiService.post(API_CONFIG.ENDPOINTS.CUSTOMERS.CREATE, { name, phone });
            
            this.showToast('Cliente criado com sucesso!', 'success');
            this.customers.push(newCustomer);
            this.renderCustomersGrid();
            
            this.closeModal();
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            this.showToast('Erro ao criar cliente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderRelatorios(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Relatórios</h2>
                <div class="header-actions">
                    <select id="reportPeriod" class="form-control">
                        <option value="week">Última Semana</option>
                        <option value="month" selected>Último Mês</option>
                        <option value="quarter">Último Trimestre</option>
                        <option value="year">Último Ano</option>
                    </select>
                </div>
            </div>
            <div class="reports-grid">
                <div class="report-card">
                    <h3>Vendas por Período</h3>
                    <p>Relatório detalhado de vendas em um período específico</p>
                    <button class="btn btn-primary" onclick="sistema.generateSalesReport()">Gerar Relatório</button>
                </div>
                <div class="report-card">
                    <h3>Produtos Mais Vendidos</h3>
                    <p>Ranking dos produtos com maior volume de vendas</p>
                    <button class="btn btn-primary" onclick="sistema.generateProductsReport()">Gerar Relatório</button>
                </div>
                <div class="report-card">
                    <h3>Relatório Completo</h3>
                    <p>Análise completa de vendas, produtos e performance</p>
                    <button class="btn btn-primary" onclick="sistema.generateCompleteReport()">Gerar Relatório</button>
                </div>
            </div>
            <div id="reportResults" class="report-results"></div>
        `;
    }

    async generateSalesReport() {
        try {
            this.showLoading();
            const period = document.getElementById('reportPeriod').value;
            const reportData = await this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.REPORTS, { period });
            
            this.displayReportResults('Relatório de Vendas', reportData.salesReport);
        } catch (error) {
            console.error('Erro ao gerar relatório de vendas:', error);
            this.showToast('Erro ao gerar relatório de vendas.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateProductsReport() {
        try {
            this.showLoading();
            const period = document.getElementById('reportPeriod').value;
            const reportData = await this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.REPORTS, { period });
            
            this.displayReportResults('Produtos Mais Vendidos', reportData.productsReport);
        } catch (error) {
            console.error('Erro ao gerar relatório de produtos:', error);
            this.showToast('Erro ao gerar relatório de produtos.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateCompleteReport() {
        try {
            this.showLoading();
            const period = document.getElementById('reportPeriod').value;
            const reportData = await this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.REPORTS, { period });
            
            this.displayReportResults('Relatório Completo', reportData);
        } catch (error) {
            console.error('Erro ao gerar relatório completo:', error);
            this.showToast('Erro ao gerar relatório completo.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayReportResults(title, data) {
        const resultsContainer = document.getElementById('reportResults');
        resultsContainer.innerHTML = `
            <div class="report-section">
                <h3>${title}</h3>
                <div class="report-content">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
                <button class="btn btn-secondary" onclick="sistema.exportReport('${title}', ${JSON.stringify(data).replace(/'/g, "\\'")})">
                    <i class="fas fa-download"></i> Exportar
                </button>
            </div>
        `;
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    exportReport(title, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderPerfis(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Gerenciar Perfis e Usuários</h2>
                <div class="header-actions">
                    ${this.permissions.criarUsuarios ? `
                    <button class="btn btn-primary" id="newUserBtn">
                        <i class="fas fa-user-plus"></i> Novo Usuário
                    </button>
                    ` : ''}
                    <button class="btn btn-secondary" id="manageProfilesBtn">
                        <i class="fas fa-cogs"></i> Gerenciar Perfis
                    </button>
                    <button class="btn btn-secondary" id="changePasswordBtn">
                        <i class="fas fa-key"></i> Alterar Minha Senha
                    </button>
                </div>
            </div>
            
            <div class="profiles-section">
                <h3>Usuários do Sistema</h3>
                <div class="users-grid" id="usersGrid">
                    ${this.users.map(user => {
                        const userProfile = this.profiles.find(p => p.id == user.profileId);
                        return `
                        <div class="user-card" data-user-id="${user.id}">
                            <div class="user-header">
                                <h4>${user.name}</h4>
                                <span class="user-profile">${userProfile ? userProfile.name : 'Perfil não encontrado'}</span>
                            </div>
                            <div class="user-info">
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Username:</strong> ${user.username}</p>
                                <p><strong>Criado em:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
                            </div>
                            <div class="user-actions">
                                ${this.permissions.editarUsuarios ? `
                                <button class="btn btn-secondary btn-sm" onclick="sistema.editUser(${user.id})">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                ` : ''}
                                ${this.permissions.excluirUsuarios && user.username !== 'admin' ? `
                                <button class="btn btn-danger btn-sm" onclick="sistema.deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        `;
                                         }).join('')}
                </div>
                
                <h3>Tipos de Perfil</h3>
                <div class="profiles-grid" id="profilesGrid">
                    ${this.profiles.map(profile => `
                        <div class="profile-card" data-profile-id="${profile.id}">
                             <div class="profile-header">
                                 <h4>${profile.name}</h4>
                                 <span class="permissions-count">${Object.values(profile.permissions).filter(p => p).length} permissões</span>
                             </div>
                             <div class="profile-actions">
                                 <button class="btn btn-secondary btn-sm" onclick="sistema.editProfile(${profile.id})">
                                     <i class="fas fa-edit"></i> Editar Permissões
                                 </button>
                                 ${profile.name !== 'Administrador' ? `
                                 <button class="btn btn-danger btn-sm" onclick="sistema.deleteProfile(${profile.id})">
                                     <i class="fas fa-trash"></i> Excluir
                                 </button>
                                 ` : ''}
                             </div>
                         </div>
                         `).join('')}
                </div>
            </div>
        `;
        
        if (this.permissions.criarUsuarios) {
            document.getElementById('newUserBtn').onclick = () => this.showUserModal();
        }
        document.getElementById('manageProfilesBtn').onclick = () => this.showProfileModal();
        document.getElementById('changePasswordBtn').onclick = () => this.showChangePasswordModal();
    }

    // =================================================================
    // 4. MODAIS E AÇÕES
    // =================================================================

    showOrderModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modalHTML = `
            <div class="modal-header">
                <h3>Pedido ${order.id}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details-container">
                    <div class="order-info">
                        <h4>Informações do Pedido</h4>
                        <p><strong>Cliente:</strong> ${order.customer}</p>
                        ${order.phone ? `<p><strong>Telefone:</strong> ${order.phone}</p>` : ''}
                        <p><strong>Status:</strong> ${this.orderStatuses.find(s => s.id === order.status).name}</p>
                        <p><strong>Tipo:</strong> ${order.type === 'delivery' ? 'Entrega' : 'Retirada'}</p>
                        ${order.address && this.permissions.acessarEndereco ? `<p><strong>Endereço:</strong> ${order.address}</p>` : ''}
                        ${this.permissions.visualizarValorPedido ? `<p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>` : ''}
                        <p><strong>Criado:</strong> ${order.createdAt.toLocaleString()}</p>
                        
                        <h4>Itens do Pedido</h4>
                        <ul class="order-items-list">
                            ${order.items.map(item => {
                                const product = this.products.find(p => p.id === item.productId);
                                return `<li>${item.quantity}x ${product ? product.name : 'Produto desconhecido'}${this.permissions.visualizarValorPedido ? ` - R$ ${(item.price * item.quantity).toFixed(2)}` : ''}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                    
                    ${this.permissions.verChat ? `
                    <div class="order-chat">
                        <h4>Chat do Pedido</h4>
                        <div class="chat-messages" id="chatMessages">
                            <div class="loading-placeholder">Carregando mensagens...</div>
                        </div>
                        ${this.permissions.enviarChat ? `
                        <div class="chat-input">
                            <input type="text" id="newMessage" placeholder="Digite sua mensagem..." maxlength="500">
                            <button class="btn btn-primary" id="sendMessageBtn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeModalBtn">Fechar</button>
                ${this.permissions.imprimirPedido ? `<button class="btn btn-secondary" id="printOrderBtn"><i class="fas fa-print"></i> Imprimir</button>` : ''}
                ${this.permissions.alterarStatusPedido ? `
                <button class="btn btn-primary" id="updateStatusBtn">
                    <i class="fas fa-edit"></i> Atualizar Status
                </button>
                ` : ''}
            </div>
        `;
        
        this.renderModal(modalHTML, async (modal) => {
            modal.querySelector('#closeModalBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            
            if (modal.querySelector('#updateStatusBtn')) {
                modal.querySelector('#updateStatusBtn').onclick = () => this.showUpdateStatusModal(orderId);
            }
            
            if (modal.querySelector('#printOrderBtn')) {
                modal.querySelector('#printOrderBtn').onclick = () => this.printOrder(orderId);
            }
            
            // Carregar mensagens do chat se existir
            if (modal.querySelector('#chatMessages')) {
                try {
                    const messages = await this.loadOrderMessages(orderId);
                    const chatMessagesContainer = modal.querySelector('#chatMessages');
                    
                    if (messages && messages.length > 0) {
                        chatMessagesContainer.innerHTML = messages.map(msg => `
                            <div class="chat-message ${msg.sender}">
                                <div class="message-content">${msg.message}</div>
                                <div class="message-time">${new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}</div>
                            </div>
                        `).join('');
                    } else {
                        chatMessagesContainer.innerHTML = '<div class="empty-state">Nenhuma mensagem encontrada</div>';
                    }
                } catch (error) {
                    console.error('Erro ao carregar mensagens:', error);
                    modal.querySelector('#chatMessages').innerHTML = '<div class="empty-state">Erro ao carregar mensagens</div>';
                }
            }
            
            if (modal.querySelector('#sendMessageBtn')) {
                const sendMessage = async () => {
                    const messageInput = modal.querySelector('#newMessage');
                    const message = messageInput.value.trim();
                    if (message) {
                        try {
                            await this.addOrderMessage(orderId, message);
                            messageInput.value = '';
                            // Recarregar o modal para mostrar a nova mensagem
                            this.showOrderModal(orderId);
                        } catch (error) {
                            console.error('Erro ao enviar mensagem:', error);
                        }
                    }
                };
                
                modal.querySelector('#sendMessageBtn').onclick = sendMessage;
                modal.querySelector('#newMessage').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });
            }
        });
    }

    showUpdateStatusModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        
        // Se o usuário tem permissão para selecionar status específico (administrador)
        if (this.permissions.selecionarStatusEspecifico) {
            const statusOptions = this.orderStatuses
                .map(s => `<option value="${s.id}" ${s.id === order.status ? 'selected' : ''}>${s.name}</option>`)
                .join('');

            const modalHTML = `
                <div class="modal-header">
                    <h3>Atualizar Status do Pedido ${order.id}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="newStatus">Selecione o novo status:</label>
                        <select id="newStatus" class="form-control">${statusOptions}</select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelUpdateBtn">Cancelar</button>
                    <button class="btn btn-primary" id="saveStatusBtn">Salvar</button>
                </div>
            `;
            this.renderModal(modalHTML, (modal) => {
                modal.querySelector('#cancelUpdateBtn').onclick = () => this.showOrderModal(orderId);
                modal.querySelector('.modal-close').onclick = () => this.showOrderModal(orderId);
                modal.querySelector('#saveStatusBtn').onclick = () => {
                    const newStatus = modal.querySelector('#newStatus').value;
                    this.updateOrderStatus(orderId, newStatus);
                };
            });
        } else {
            // Para outros usuários, avança automaticamente para o próximo status
            this.advanceToNextStatus(orderId);
        }
    }

    advanceToNextStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

		if (!order) return;

		
        const currentStatusIndex = this.orderStatuses.findIndex(s => s.id === order.status);
        const nextStatusIndex = currentStatusIndex + 1;
        if (nextStatusIndex < this.orderStatuses.length) {
            const nextStatus = this.orderStatuses[nextStatusIndex];
            this.updateOrderStatus(orderId, nextStatus.id);
        } else {
            this.showToast('Pedido já está no status final.', 'warning');
        }
    }
    
	async updateOrderStatus(orderId, newStatus) {
		try {
			this.showLoading();
			
			// Buscar pedido atual para auditoria
			const order = this.orders.find(o => o.id === orderId);
			const oldStatus = order ? order.status : null;
			
			// Atualizar status na API
			await this.apiService.patch(`${API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS}/${orderId}/status`, {
				status: newStatus
			});

			// Atualizar localmente
			if (order) {
				order.status = newStatus;

				// regra: se for retirada (pickup) e marcar "pronto", finaliza automaticamente
				let autoFinalizado = false;
				if (order.type === 'pickup' && newStatus === 'ready') {
					order.status = 'delivered';
					autoFinalizado = true;
				}
			}

			// Log de auditoria
			this.auditTrail('orders', orderId, 'UPDATE', 
				{ status: oldStatus }, 
				{ status: newStatus }
			);

			// Log de atividade do usuário
			this.logUserActivity('alterar_status_pedido', `Status do pedido ${orderId} alterado de ${this.getStatusName(oldStatus)} para ${this.getStatusName(newStatus)}`, {
				orderId: orderId,
				oldStatus: oldStatus,
				newStatus: newStatus,
				customerName: order?.customer
			});

			this.closeModal();
			this.renderKanbanBoard();
			this.showToast(
				order && order.type === 'pickup' && newStatus === 'ready'
					? `Pedido ${orderId} finalizado automaticamente (retirada pronta).`
					: `Status do pedido ${orderId} atualizado!`,
				order && order.type === 'pickup' && newStatus === 'ready' ? 'info' : 'success'
			);
		} catch (error) {
			console.error('Erro ao atualizar status do pedido:', error);
			this.showToast('Erro ao atualizar status do pedido.', 'error');
		} finally {
			this.hideLoading();
		}
	}

    showNewOrderModal() {
        const productOptions = this.products
            .filter(p => p.active)
            .map(p => `<option value="${p.id}" data-price="${Number(p.price ?? 0)}">${p.name} - R$ ${Number(p.price ?? 0).toFixed(2)}</option>`)
            .join('');

        const customerOptions = this.customers
            .map(c => `<option value="${c.id}" data-name="${c.name}" data-phone="${c.phone}">${c.name} - ${c.phone}</option>`)
            .join('');

        const modalHTML = `
            <div class="modal-header">
                <h3>Criar Novo Pedido</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="newOrderForm">
                    <div class="form-group">
                        <label for="customerSelect">Selecionar Cliente</label>
                        <select id="customerSelect" required>
                            <option value="">Selecione um cliente...</option>
                            ${customerOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="customerName">Nome do Cliente</label>
                        <input type="text" id="customerName" required readonly>
                    </div>
                    <div class="form-group">
                        <label for="customerPhone">Telefone do Cliente</label>
                        <input type="tel" id="customerPhone" readonly>
                    </div>
                    <div class="form-group">
                        <label for="orderType">Tipo de Pedido</label>
                        <select id="orderType">
                            <option value="delivery">Entrega</option>
                            <option value="pickup">Retirada</option>
                        </select>
                    </div>
                    <div class="form-group" id="addressGroup">
                        <label for="customerAddress">Endereço de Entrega</label>
                        <input type="text" id="customerAddress">
                    </div>
                    <hr>
                    <h4>Itens do Pedido</h4>
                    <div id="orderItemsContainer"></div>
                    <button type="button" class="btn btn-secondary" id="addItemBtn">
                        <i class="fas fa-plus"></i> Adicionar Item
                    </button>
                    <hr>
                    <h3 class="text-right" id="totalPrice">Total: R$ 0.00</h3>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelNewOrderBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveNewOrderBtn">Criar Pedido</button>
            </div>
        `;

        this.renderModal(modalHTML, (modal) => {
            const itemsContainer = modal.querySelector('#orderItemsContainer');
            const orderTypeSelect = modal.querySelector('#orderType');
            const addressGroup = modal.querySelector('#addressGroup');
            const customerSelect = modal.querySelector('#customerSelect');
            const customerNameInput = modal.querySelector('#customerName');
            const customerPhoneInput = modal.querySelector('#customerPhone');
            
            // Preencher dados do cliente quando selecionado
            customerSelect.addEventListener('change', () => {
                const selectedOption = customerSelect.options[customerSelect.selectedIndex];
                if (selectedOption.value) {
                    customerNameInput.value = selectedOption.dataset.name;
                    customerPhoneInput.value = selectedOption.dataset.phone;
                } else {
                    customerNameInput.value = '';
                    customerPhoneInput.value = '';
                }
            });
            
            // Controlar visibilidade do endereço
            orderTypeSelect.addEventListener('change', () => {
                addressGroup.style.display = orderTypeSelect.value === 'delivery' ? 'block' : 'none';
            });
            
            const addItem = () => {
                const itemHTML = `
                    <div class="order-item-row">
                        <select class="product-select">${productOptions}</select>
                        <input type="number" class="product-quantity" value="1" min="1">
                        <button type="button" class="btn-remove-item">&times;</button>
                    </div>`;
                itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
                this.updateNewOrderTotal(modal);
            };
            
            addItem(); // Adiciona o primeiro item por padrão
            modal.querySelector('#addItemBtn').onclick = addItem;
            
            itemsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-remove-item')) {
                    e.target.closest('.order-item-row').remove();
                    this.updateNewOrderTotal(modal);
                }
            });
            
            itemsContainer.addEventListener('change', () => this.updateNewOrderTotal(modal));

            modal.querySelector('#cancelNewOrderBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveNewOrderBtn').onclick = () => this.saveNewOrder(modal);
        });
    }
    
    updateNewOrderTotal(modal) {
        let total = 0;
        modal.querySelectorAll('.order-item-row').forEach(row => {
            const select = row.querySelector('.product-select');
            const quantity = row.querySelector('.product-quantity').value;
            const price = select.options[select.selectedIndex].dataset.price;
            total += parseFloat(price) * parseInt(quantity);
        });
        modal.querySelector('#totalPrice').textContent = `Total: R$ ${total.toFixed(2)}`;
    }

    saveNewOrder(modal) {
        const customerId = modal.querySelector('#customerSelect').value;
        const customerName = modal.querySelector('#customerName').value;
        const customerPhone = modal.querySelector('#customerPhone').value;
        const orderType = modal.querySelector('#orderType').value;
        const customerAddress = modal.querySelector('#customerAddress').value;
        
        if (!customerId) {
            this.showToast('Selecione um cliente para o pedido.', 'error');
            return;
        }

        if (orderType === 'delivery' && !customerAddress) {
            this.showToast('O endereço é obrigatório para entregas.', 'error');
            return;
        }

        const items = [];
        modal.querySelectorAll('.order-item-row').forEach(row => {
            const select = row.querySelector('.product-select');
            items.push({
                productId: parseInt(select.value),
                quantity: parseInt(row.querySelector('.product-quantity').value),
                price: parseFloat(select.options[select.selectedIndex].dataset.price)
            });
        });

        if (items.length === 0) {
            this.showToast('O pedido deve ter pelo menos um item.', 'error');
            return;
        }

        this.createNewOrder({
            customerId: parseInt(customerId),
            customer: customerName,
            phone: customerPhone,
            type: orderType,
            address: orderType === 'delivery' ? customerAddress : null,
            items: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        });
    }

    async createNewOrder(orderData) {
        try {
            this.showLoading();
            
            const newOrder = await this.apiService.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, orderData);
            
            // Adicionar o novo pedido ao cache local
            this.orders.unshift(newOrder);
            
            this.closeModal();
            this.renderKanbanBoard();
            this.showToast('Novo pedido criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            this.showToast('Erro ao criar o pedido. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // =================================================================
    // 5. GESTÃO DE USUÁRIOS E PERFIS
    // =================================================================

    showUserModal(userId = null) {
        const user = userId ? this.users.find(u => u.id === userId) : null;
        const isEdit = !!user;

        const profileOptions = this.profiles
            .map(profile => `<option value="${profile.id}" ${user && user.profileId === profile.id ? 'selected' : ''}>${profile.name}</option>`)
            .join('');

        const modalHTML = `
            <div class="modal-header">
                <h3>${isEdit ? 'Editar' : 'Novo'} Usuário</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="userForm">
                    <div class="form-group">
                        <label for="userName">Nome Completo</label>
                        <input type="text" id="userName" value="${user?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="userEmail">Email</label>
                        <input type="email" id="userEmail" value="${user?.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="userLogin">Login</label>
                        <input type="text" id="userLogin" value="${user?.username || ''}" ${isEdit ? 'readonly' : ''} required>
                    </div>
                    ${!isEdit ? `
                    <div class="form-group">
                        <label for="userPassword">Senha</label>
                        <input type="password" id="userPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="userPasswordConfirm">Confirmar Senha</label>
                        <input type="password" id="userPasswordConfirm" required>
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="userProfile">Perfil</label>
                        <select id="userProfile" required>${profileOptions}</select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelUserBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveUserBtn">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
        `;

        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelUserBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveUserBtn').onclick = () => this.saveUser(modal, userId);
        });
    }

    async saveUser(modal, existingUserId = null) {
        const name = modal.querySelector('#userName').value;
        const email = modal.querySelector('#userEmail').value;
        const username = modal.querySelector('#userLogin').value;
        const password = modal.querySelector('#userPassword')?.value;
        const passwordConfirm = modal.querySelector('#userPasswordConfirm')?.value;
        const profileId = parseInt(modal.querySelector('#userProfile').value);

        if (!name || !email || !username || !profileId) {
            this.showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (!existingUserId) {
            if (!password || !passwordConfirm) {
                this.showToast('Senha e confirmação são obrigatórias.', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                this.showToast('As senhas não coincidem.', 'error');
                return;
            }
        }

        const userData = {
            name: name,
            email: email,
            username: username,
            profileId: profileId
        };

        if (!existingUserId) {
            userData.password = password;
        }

        try {
            this.showLoading();
            
            let savedUser;
            if (existingUserId) {
                // Atualizar usuário existente
                savedUser = await this.apiService.put(`${API_CONFIG.ENDPOINTS.USERS.UPDATE}/${existingUserId}`, userData);
                const userIndex = this.users.findIndex(u => u.id === existingUserId);
                if (userIndex !== -1) {
                    this.users[userIndex] = savedUser;
                }
            } else {
                // Criar novo usuário
                savedUser = await this.apiService.post(API_CONFIG.ENDPOINTS.USERS.CREATE, userData);
                this.users.push(savedUser);
            }

            this.closeModal();
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast(`Usuário ${existingUserId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            this.showToast('Erro ao salvar o usuário. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    editUser(userId) {
        this.showUserModal(userId);
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (user.username === 'admin') {
            this.showToast('O usuário administrador não pode ser excluído.', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
            return;
        }

        try {
            this.showLoading();
            
            await this.apiService.delete(`${API_CONFIG.ENDPOINTS.USERS.DELETE}/${userId}`);
            
            // Remover do cache local
            this.users = this.users.filter(u => u.id !== userId);
            
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast('Usuário excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            this.showToast('Erro ao excluir o usuário.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showProfileModal(profileId = null) {
        const profile = profileId ? this.profiles.find(p => p.id === profileId) : null;
        const isEdit = !!profile;

        const permissionsHTML = Object.entries(this.availablePermissions).map(([key, label]) => `
            <div class="permission-item">
                <label>
                    <input type="checkbox" name="permissions" value="${key}" ${profile && profile.permissions[key] ? 'checked' : ''}>
                    ${label}
                </label>
            </div>
        `).join('');

        const modalHTML = `
            <div class="modal-header">
                <h3>${isEdit ? 'Editar' : 'Novo'} Perfil</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="profileForm">
                    <div class="form-group">
                        <label for="profileName">Nome do Perfil</label>
                        <input type="text" id="profileName" value="${profile?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Permissões</label>
                        <div class="permissions-grid">
                            ${permissionsHTML}
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelProfileBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveProfileBtn">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
        `;

        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelProfileBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveProfileBtn').onclick = () => this.saveProfile(modal, profileId);
        });
    }

    async saveProfile(modal, existingProfileId = null) {
        const name = modal.querySelector('#profileName').value;
        const permissionCheckboxes = modal.querySelectorAll('input[name="permissions"]:checked');
        
        if (!name) {
            this.showToast('O nome do perfil é obrigatório.', 'error');
            return;
        }

        const permissions = {};
        Object.keys(this.availablePermissions).forEach(key => {
            permissions[key] = false;
        });

        permissionCheckboxes.forEach(checkbox => {
            permissions[checkbox.value] = true;
        });

        const profileData = {
            name: name,
            permissions: permissions
        };

        try {
            this.showLoading();
            
            let savedProfile;
            if (existingProfileId) {
                // Atualizar perfil existente
                savedProfile = await this.apiService.put(`${API_CONFIG.ENDPOINTS.PROFILES.UPDATE}/${existingProfileId}`, profileData);
                const profileIndex = this.profiles.findIndex(p => p.id === existingProfileId);
                if (profileIndex !== -1) {
                    this.profiles[profileIndex] = savedProfile;
                }
            } else {
                // Criar novo perfil
                savedProfile = await this.apiService.post(API_CONFIG.ENDPOINTS.PROFILES.CREATE, profileData);
                this.profiles.push(savedProfile);
            }

            this.closeModal();
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast(`Perfil ${existingProfileId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showToast('Erro ao salvar o perfil. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    editProfile(profileId) {
        this.showProfileModal(profileId);
    }

    async deleteProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;

        if (profile.name === 'Administrador') {
            this.showToast('O perfil administrador não pode ser excluído.', 'error');
            return;
        }

        // Verificar se há usuários usando este perfil
        const usersWithProfile = this.users.filter(user => user.profileId === profileId);
        if (usersWithProfile.length > 0) {
            this.showToast('Não é possível excluir um perfil que está sendo usado por usuários.', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o perfil ${profile.name}?`)) {
            return;
        }

        try {
            this.showLoading();
            
            await this.apiService.delete(`${API_CONFIG.ENDPOINTS.PROFILES.DELETE}/${profileId}`);
            
            // Remover do cache local
            this.profiles = this.profiles.filter(p => p.id !== profileId);
            
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast('Perfil excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir perfil:', error);
            this.showToast('Erro ao excluir o perfil.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showChangePasswordModal() {
        const modalHTML = `
            <div class="modal-header">
                <h3>Alterar Minha Senha</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Senha Atual</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nova Senha</label>
                        <input type="password" id="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirmar Nova Senha</label>
                        <input type="password" id="confirmNewPassword" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelPasswordBtn">Cancelar</button>
                <button class="btn btn-primary" id="savePasswordBtn">Alterar Senha</button>
            </div>
        `;

        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelPasswordBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#savePasswordBtn').onclick = () => this.changePassword(modal);
        });
    }

    async changePassword(modal) {
        const currentPassword = modal.querySelector('#currentPassword').value;
        const newPassword = modal.querySelector('#newPassword').value;
        const confirmNewPassword = modal.querySelector('#confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            this.showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            this.showToast('A nova senha e a confirmação não coincidem.', 'error');
            return;
        }

        if (newPassword.length < 3) {
            this.showToast('A nova senha deve ter pelo menos 3 caracteres.', 'error');
            return;
        }

        try {
            this.showLoading();
            const me = this.users.find(u => u.username === this.currentUser) || {};
            if (!me.id) {
                this.showToast('Usuário atual não encontrado.', 'error');
                return;
            }
            await this.apiService.patch(`${API_CONFIG.ENDPOINTS.ACCOUNT.CHANGE_PASSWORD}/${me.id}/password`, {
                currentPassword,
                newPassword
            });

            this.closeModal();
            this.showToast('Senha alterada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            this.showToast(error.message || 'Erro ao alterar senha.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // =================================================================
    // 6. GESTÃO DE PRODUTOS
    // =================================================================

    showProductModal(productId = null) {
        const product = productId ? this.products.find(p => p.id === productId) : null;
        const isEdit = !!product;

        const modalHTML = `
            <div class="modal-header">
                <h3>${isEdit ? 'Editar' : 'Novo'} Produto</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="productForm">
                    <div class="form-group">
                        <label for="productName">Nome do Produto</label>
                        <input type="text" id="productName" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Preço</label>
                        <input type="number" id="productPrice" step="0.01" value="${product?.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="productDescription">Descrição</label>
                        <textarea id="productDescription" required>${product?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Categoria</label>
                        <select id="productCategory" required>
                            <option value="lanches" ${product?.category === 'lanches' ? 'selected' : ''}>Lanches</option>
                            <option value="bebidas" ${product?.category === 'bebidas' ? 'selected' : ''}>Bebidas</option>
                            <option value="acompanhamentos" ${product?.category === 'acompanhamentos' ? 'selected' : ''}>Acompanhamentos</option>
                            <option value="sobremesas" ${product?.category === 'sobremesas' ? 'selected' : ''}>Sobremesas</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="productActive" ${product?.active !== false ? 'checked' : ''}>
                            Produto Ativo
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelProductBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveProductBtn">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
        `;

        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelProductBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveProductBtn').onclick = () => this.saveProduct(modal, productId);
        });
    }

    async saveProduct(modal, productId = null) {
        const name = modal.querySelector('#productName').value;
        const price = parseFloat(modal.querySelector('#productPrice').value);
        const description = modal.querySelector('#productDescription').value;
        const category = modal.querySelector('#productCategory').value;
        const active = modal.querySelector('#productActive').checked;

        if (!name || !price || !description || !category) {
            this.showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (price <= 0) {
            this.showToast('O preço deve ser maior que zero.', 'error');
            return;
        }

        const productData = {
            name: name,
            price: price,
            description: description,
            category: category,
            active: active
        };

        try {
            this.showLoading();
            
            let updatedProduct;
            if (productId) {
                // Atualizar produto existente
                updatedProduct = await this.apiService.put(`${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE}/${productId}`, productData);
                const productIndex = this.products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    this.products[productIndex] = updatedProduct;
                }
            } else {
                // Criar novo produto
                updatedProduct = await this.apiService.post(API_CONFIG.ENDPOINTS.PRODUCTS.CREATE, productData);
                this.products.push(updatedProduct);
            }

            this.closeModal();
            this.renderCardapio(document.getElementById('cardapioSection'));
            this.showToast(`Produto ${productId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            this.showToast('Erro ao salvar o produto. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    async toggleProductStatus(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            this.showLoading();
            
            const updatedProduct = await this.apiService.put(`${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE}/${productId}`, {
                ...product,
                active: !product.active
            });

            // Atualizar no cache local
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                this.products[productIndex] = updatedProduct;
            }

            this.renderCardapio(document.getElementById('cardapioSection'));
            this.showToast(`Produto ${updatedProduct.active ? 'ativado' : 'desativado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao alterar status do produto:', error);
            this.showToast('Erro ao alterar status do produto.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !confirm(`Tem certeza que deseja excluir o produto ${product.name}?`)) {
            return;
        }

        try {
            this.showLoading();
            
            await this.apiService.delete(`${API_CONFIG.ENDPOINTS.PRODUCTS.DELETE}/${productId}`);
            
            // Remover do cache local
            this.products = this.products.filter(p => p.id !== productId);
            
            this.renderCardapio(document.getElementById('cardapioSection'));
            this.showToast('Produto excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            this.showToast('Erro ao excluir o produto.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // =================================================================
    // 7. UTILITÁRIOS
    // =================================================================

    addChatMessage(orderId, message) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            if (!order.chat) order.chat = [];
            order.chat.push({
                sender: 'system',
                message: message,
                time: new Date()
            });
        }
    }

    async addCustomerMessage(customerId, message) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        try {
            const response = await this.apiService.post(`${API_CONFIG.ENDPOINTS.CUSTOMER_MESSAGES.CREATE}?customer_id=${customerId}`, {
                message: message,
                direction: 'outbound',
                channel: 'chat',
                user_id: this.currentUser?.id
            });
            
            this.showToast('Mensagem enviada com sucesso!', 'success');
            
            // Log da atividade
            this.logUserActivity('enviar_mensagem_cliente', `Mensagem enviada para cliente ${customer.name}`, {
                customerId: customerId,
                message: message
            });
            
            return response;
        } catch (error) {
            console.error('Erro ao enviar mensagem para cliente:', error);
            this.showToast('Erro ao enviar mensagem para cliente.', 'error');
            throw error;
        }
    }

    async addOrderMessage(orderId, message) {
        try {
            const response = await this.apiService.post(`${API_CONFIG.ENDPOINTS.ORDER_MESSAGES.CREATE}?order_id=${orderId}`, {
                message: message,
                sender: 'user',
                user_id: this.currentUser?.id
            });
            
            this.showToast('Mensagem enviada com sucesso!', 'success');
            return response;
        } catch (error) {
            console.error('Erro ao enviar mensagem do pedido:', error);
            this.showToast('Erro ao enviar mensagem.', 'error');
            throw error;
        }
    }

    async loadOrderMessages(orderId) {
        try {
            const messages = await this.apiService.get(`${API_CONFIG.ENDPOINTS.ORDER_MESSAGES.LIST}?order_id=${orderId}`);
            return messages;
        } catch (error) {
            console.error('Erro ao carregar mensagens do pedido:', error);
            return [];
        }
    }

    async loadCustomerMessages(customerId) {
        try {
            const messages = await this.apiService.get(`${API_CONFIG.ENDPOINTS.CUSTOMER_MESSAGES.LIST}?customer_id=${customerId}`);
            return messages;
        } catch (error) {
            console.error('Erro ao carregar mensagens do cliente:', error);
            return [];
        }
    }

    printOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const printContent = `
            <h2>Pedido ${order.id}</h2>
            <p><strong>Cliente:</strong> ${order.customer}</p>
            <p><strong>Telefone:</strong> ${order.phone || 'Não informado'}</p>
            <p><strong>Tipo:</strong> ${order.type === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            ${order.address ? `<p><strong>Endereço:</strong> ${order.address}</p>` : ''}
            <p><strong>Status:</strong> ${this.orderStatuses.find(s => s.id === order.status).name}</p>
            <hr>
            <h3>Itens:</h3>
            <ul>
                ${order.items.map(item => {
                    const product = this.products.find(p => p.id === item.productId);
                    return `<li>${item.quantity}x ${product ? product.name : 'Produto desconhecido'} - R$ ${(item.price * item.quantity).toFixed(2)}</li>`;
                }).join('')}
            </ul>
            <hr>
            <p><strong>Total: R$ ${order.total.toFixed(2)}</strong></p>
            <p><strong>Data:</strong> ${order.createdAt.toLocaleString()}</p>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>Pedido ${order.id}</title></head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    searchOrders(query) {
        if (!query) {
            this.renderKanbanBoard();
            return;
        }

        const filteredOrders = this.orders.filter(order => 
            order.id.toLowerCase().includes(query.toLowerCase()) ||
            order.customer.toLowerCase().includes(query.toLowerCase()) ||
            (order.phone && order.phone.includes(query))
        );

        // Renderizar apenas os pedidos filtrados
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (kanbanBoard) {
            kanbanBoard.innerHTML = '';

            this.orderStatuses.forEach(status => {
                const column = document.createElement('div');
                column.className = 'kanban-column';
                column.dataset.statusId = status.id;

                const ordersInStatus = filteredOrders.filter(order => order.status === status.id);

                column.innerHTML = `
                    <div class="column-header">
                        <span class="column-title">${status.name}</span>
                        <span class="column-count">${ordersInStatus.length}</span>
                    </div>
                    <div class="order-cards">
                        ${ordersInStatus.map(order => this.createOrderCard(order)).join('')}
                    </div>
                `;
                kanbanBoard.appendChild(column);
            });

            document.querySelectorAll('.order-card').forEach(card => {
                card.addEventListener('click', () => {
                    const orderId = card.dataset.orderId;
                    this.showOrderModal(orderId);
                });
            });
        }
    }

    renderModal(html, onRender = null) {
        const modalContainer = document.getElementById('modalContainer');
        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    ${html}
                </div>
            </div>
        `;
        
        const modal = modalContainer.querySelector('.modal-content');
        if (onRender) onRender(modal);
        
        // Fechar modal clicando no backdrop
        modalContainer.querySelector('.modal-backdrop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    // Funções auxiliares para clientes
    getStatusName(status) {
        const statusMap = {
            'pending': 'Pendente',
            'confirmed': 'Confirmado',
            'preparing': 'Em Preparo',
            'ready': 'Pronto',
            'delivering': 'Em Entrega',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    getSenderName(sender) {
        const senderMap = {
            'customer': 'Cliente',
            'system': 'Sistema',
            'user': 'Atendente'
        };
        return senderMap[sender] || sender;
    }

    // =================================================================
    // FUNÇÕES DE AUDITORIA E LOGGING
    // =================================================================

    logUserActivity(action, details, metadata = {}) {
        const logData = {
            action: action,
            details: details,
            userId: this.currentUser?.id,
            username: this.currentUser?.username,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            timestamp: new Date().toISOString(),
            metadata: metadata
        };

        // Enviar para a API
        this.apiService.post('/logs/user-activity', logData).catch(error => {
            console.error('Erro ao registrar atividade do usuário:', error);
        });

        // Log local para debug
        console.log('User Activity Log:', logData);
    }

    logSystemAction(action, message, level = 'info', metadata = {}) {
        const logData = {
            level: level,
            action: action,
            message: message,
            actorUserId: this.currentUser?.id,
            actorUsername: this.currentUser?.username,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            metadata: metadata,
            timestamp: new Date().toISOString()
        };

        // Enviar para a API
        this.apiService.post('/logs/system', logData).catch(error => {
            console.error('Erro ao registrar ação do sistema:', error);
        });

        // Log local para debug
        console.log('System Action Log:', logData);
    }

    auditTrail(tableName, recordId, action, oldValues = null, newValues = null) {
        const auditData = {
            tableName: tableName,
            recordId: recordId,
            action: action,
            oldValues: oldValues,
            newValues: newValues,
            actorUserId: this.currentUser?.id,
            actorUsername: this.currentUser?.username,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Enviar para a API
        this.apiService.post('/logs/audit', auditData).catch(error => {
            console.error('Erro ao registrar auditoria:', error);
        });

        // Log local para debug
        console.log('Audit Trail:', auditData);
    }

    logPasswordChange(userId, username, changedByUserId = null, changedByUsername = null) {
        const logData = {
            userId: userId,
            username: username,
            changedByUserId: changedByUserId,
            changedByUsername: changedByUsername,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Enviar para a API
        this.apiService.post('/logs/password-change', logData).catch(error => {
            console.error('Erro ao registrar mudança de senha:', error);
        });

        // Log local para debug
        console.log('Password Change Log:', logData);
    }

    logProfilePermissionChange(profileId, profileName, oldPermissions, newPermissions, changedByUserId = null, changedByUsername = null) {
        const logData = {
            profileId: profileId,
            profileName: profileName,
            oldPermissions: oldPermissions,
            newPermissions: newPermissions,
            changedByUserId: changedByUserId,
            changedByUsername: changedByUsername,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Enviar para a API
        this.apiService.post('/logs/profile-permission-change', logData).catch(error => {
            console.error('Erro ao registrar mudança de permissões:', error);
        });

        // Log local para debug
        console.log('Profile Permission Change Log:', logData);
    }

    // Funções auxiliares para auditoria
    getClientIP() {
        // Em um ambiente real, isso viria do servidor
        // Por enquanto, retornamos um valor padrão
        return '127.0.0.1';
    }

    getSessionId() {
        // Gerar um ID de sessão único
        if (!this._sessionId) {
            this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this._sessionId;
    }

    // Função para criptografar dados sensíveis antes de salvar
    encryptSensitiveData(data) {
        // Em um ambiente real, isso seria feito no servidor
        // Por enquanto, retornamos os dados como estão
        return btoa(JSON.stringify(data));
    }

    // Função para descriptografar dados sensíveis
    decryptSensitiveData(encryptedData) {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('Erro ao descriptografar dados:', error);
            return null;
        }
    }
}

// Inicializar o sistema
const sistema = new SistemaPedidos();

// Tornar o sistema disponível globalmente para debug e acesso via console
window.sistema = sistema;

// Adicionar responsividade para mobile
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (isMobile) {
        sidebar.style.display = 'none';
        bottomNav.style.display = 'flex';
        
        // Configurar navegação mobile
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                sistema.navigateToSection(section);
                
                // Atualizar estado ativo no bottom nav
                document.querySelectorAll('.bottom-nav .nav-item').forEach(navItem => {
                    navItem.classList.toggle('active', navItem.dataset.section === section);
                });
            });
        });
    } else {
        sidebar.style.display = 'flex';
        bottomNav.style.display = 'none';
    }
});

// Disparar evento de resize na inicialização
window.dispatchEvent(new Event('resize'));

