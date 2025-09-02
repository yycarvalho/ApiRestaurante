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
    BASE_URL: 'http://localhost:8080/api', // Altere aqui para o endereço da sua API
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            VALIDATE: '/auth/validate'
        },
        USERS: {
            LIST: '/users',
            CREATE: '/users',
            UPDATE: '/users',
            DELETE: '/users'
        },
        PROFILES: {
            LIST: '/profiles',
            CREATE: '/profiles',
            UPDATE: '/profiles',
            DELETE: '/profiles'
        },
        PRODUCTS: {
            LIST: '/products',
            CREATE: '/products',
            UPDATE: '/products',
            DELETE: '/products'
        },
        ORDERS: {
            LIST: '/orders',
            CREATE: '/orders',
            UPDATE_STATUS: '/orders',
            DELETE: '/orders'
        },
        CUSTOMERS: {
            LIST: '/clientes',
            CREATE: '/clientes',
            GET: '/clientes'
        },
        ACCOUNT: {
            CHANGE_PASSWORD: '/users' // usar /users/{id}/password via PATCH
        },
        METRICS: {
            DASHBOARD: '/metrics/dashboard',
            REPORTS: '/metrics/reports'
        },
        CHAT: {
            SEND_MESSAGE: '/chat/send',
            GET_MESSAGES: '/chat/messages',
            GET_UNREAD_COUNT: '/chat/unread'
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
        // Estado da Aplicação
        this.currentUser = null;
        this.currentProfile = null;
        this.permissions = {};
        this.activeSection = 'dashboard';
        
        // Serviço de API
        this.apiService = new ApiService();
        
        // Cache de dados
        this.products = [];
        this.orders = [];
        this.profiles = [];
        this.users = [];
        this.metrics = {};

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
	
	connectWebSocket() {
		// Acessa o token armazenado na sua aplicação
		const token = this.apiService.token; 
	
		// Se não houver token, não tenta conectar
		if (!token) {
			console.error("Token de autenticação não encontrado. Conexão WebSocket não iniciada.");
			return;
		}
	
		// Adiciona o token como um parâmetro de consulta à URL do WebSocket
		this.socket = new WebSocket(`ws://localhost:8081/api/notificacoes?token=${token}`);
	
		this.socket.onopen = () => {
			console.log("Conectado ao servidor WebSocket com sucesso!");
		};
	
		this.socket.onmessage = async (event) => {
			console.log("Notificação recebida:", event.data);
			await this.handleWebSocketNotification(event.data);
		};
	
		this.socket.onclose = (event) => {
			// O evento de fechamento contém informações úteis, como o código.
			// O código 1008, por exemplo, indica que a conexão foi rejeitada por política (token inválido).
			if (event.code === 1008) {
				console.warn("Conexão WebSocket fechada: token inválido ou ausente.");
				// Você pode adicionar uma lógica para fazer logout ou pedir um novo login aqui
			} else {
				console.log("Conexão WebSocket encerrada.");
			}
		};
	
		this.socket.onerror = (error) => {
			console.error("Erro no WebSocket:", error);
		};
	}

	async handleWebSocketNotification(notificationUrl) {
		if (!this.apiService.token || !this.currentUser) return;
	
	    if (notificationUrl.startsWith('/chat/')) {
			const orderId = notificationUrl.replace('/chat/', '');
			await this.updateChatMessages(orderId);
			return; // Retorna para não processar outros casos
		}
	
		try {
			switch (notificationUrl) {
				case '/pedidos':
					const orders = await this.apiService.get(API_CONFIG.ENDPOINTS.ORDERS.LIST);
					if (JSON.stringify(orders) !== JSON.stringify(this.orders)) {
						this.orders = orders;
						this.renderSectionContent('pedidos');
					}
					break;
				case '/dashboard':
					const metrics = await this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD);
					if (JSON.stringify(metrics) !== JSON.stringify(this.metrics)) {
						this.metrics = metrics;
						this.renderSectionContent('dashboard');
					}
					break;
				case '/cardapio':
				case '/produto': // Adiciona alias, se o server enviar assim
					const products = await this.apiService.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST);
					if (JSON.stringify(products) !== JSON.stringify(this.products)) {
						this.products = products;
						this.renderSectionContent('cardapio');
					}
					break;
				case '/perfis':
					const profiles = await this.apiService.get(API_CONFIG.ENDPOINTS.PROFILES.LIST);
					const users = await this.apiService.get(API_CONFIG.ENDPOINTS.USERS.LIST);
	
					const profilesChanged = JSON.stringify(profiles) !== JSON.stringify(this.profiles);
					const usersChanged = JSON.stringify(users) !== JSON.stringify(this.users);
	
					if (profilesChanged) this.profiles = profiles;
					if (usersChanged) this.users = users;
	
					if (profilesChanged || usersChanged) {
						this.renderSectionContent('perfis');
					}
					break;
				case '/clientes':
					// Clientes podem ter uma lógica de carregamento sob demanda,
					// mas se necessário, a requisição seria aqui.
					break;
				case '/relatorios':
					// Normalmente relatórios não são atualizados em tempo real,
					// mas a lógica seria a mesma que para o dashboard.
					const reportMetrics = await this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD);
					if (JSON.stringify(reportMetrics) !== JSON.stringify(this.metrics)) {
						this.metrics = reportMetrics;
						this.renderSectionContent('relatorios');
					}
					break;
				default:
					console.warn(`Notificação WebSocket desconhecida: ${notificationUrl}`);
			}
		} catch (e) {
			console.error(`Falha ao atualizar dados para ${notificationUrl}:`, e);
		}
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

        // Polling em background para dados baseado na aba ativa
        //setInterval(async () => {
        //    if (!this.apiService.token || !this.currentUser || !this.activeSection) return;
        //    
        //    try {
        //        // Fazer requisições apenas para dados relevantes à aba ativa
        //        const requests = [];
        //        const requestTypes = [];
		//
        //        // Sempre buscar pedidos (usado em várias abas)
        //        requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.ORDERS.LIST));
        //        requestTypes.push('orders');
		//
        //        // Requisições específicas por aba
        //        switch (this.activeSection) {
        //            case 'dashboard':
        //                requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD));
        //                requestTypes.push('metrics');
        //                break;
        //            case 'cardapio':
        //                requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.PRODUCTS.LIST));
        //                requestTypes.push('products');
        //                break;
        //            case 'perfis':
        //                requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.PROFILES.LIST));
        //                requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.USERS.LIST));
        //                requestTypes.push('profiles', 'users');
        //                break;
        //            case 'pedidos':
        //                // Pedidos já incluído acima
        //                break;
        //            case 'clientes':
        //                // Clientes serão carregados sob demanda
        //                break;
        //            case 'relatorios':
        //                requests.push(this.apiService.get(API_CONFIG.ENDPOINTS.METRICS.DASHBOARD));
        //                requestTypes.push('metrics');
        //                break;
        //        }
		//
        //        const responses = await Promise.all(requests);
        //        let hasChanges = false;
		//
        //        // Processar respostas
        //        responses.forEach((data, index) => {
        //            const type = requestTypes[index];
        //            let changed = false;
		//
        //            switch (type) {
        //                case 'orders':
        //                    changed = JSON.stringify(data) !== JSON.stringify(this.orders);
        //                    if (changed) this.orders = data;
        //                    break;
        //                case 'metrics':
        //                    changed = JSON.stringify(data) !== JSON.stringify(this.metrics);
        //                    if (changed) this.metrics = data;
        //                    break;
        //                case 'products':
        //                    changed = JSON.stringify(data) !== JSON.stringify(this.products);
        //                    if (changed) this.products = data;
        //                    break;
        //                case 'profiles':
        //                    changed = JSON.stringify(data) !== JSON.stringify(this.profiles);
        //                    if (changed) this.profiles = data;
        //                    break;
        //                case 'users':
        //                    changed = JSON.stringify(data) !== JSON.stringify(this.users);
        //                    if (changed) this.users = data;
        //                    break;
        //            }
		//
        //            if (changed) hasChanges = true;
        //        });
		//
        //        // Re-renderizar apenas se houve mudanças
        //        if (hasChanges) {
        //            this.renderSectionContent(this.activeSection);
        //        }
        //    } catch (e) {
        //        // Silenciar erros de polling para não atrapalhar UX
        //        console.warn('Erro no polling da aba ativa:', e.message);
        //    }
        //}, 30 * 1000); // a cada 30s
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
                { id: 'atendimento', name: 'Em Atendimento' },
                { id: 'pagamento', name: 'Aguardando Pagamento' },
                { id: 'feito', name: 'Pedido Feito' },
                { id: 'preparo', name: 'Em Preparo' },
                { id: 'pronto', name: 'Pronto' },
                { id: 'coletado', name: 'Coletado' },
                { id: 'finalizado', name: 'Finalizado' }
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
				verPerfis: 'Ver Perfil',
                gerenciarPerfis: 'Gerenciar Perfis',
                alterarStatusPedido: 'Alterar Status do Pedido',
                selecionarStatusEspecifico: 'Selecionar Status Específico',
                criarUsuarios: 'Criar Usuários',
                editarUsuarios: 'Editar Usuários',
                excluirUsuarios: 'Excluir Usuários',
				verClientes: 'Ver Clientes',
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

        // Toggle do Sidebar
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Busca Global
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.globalSearch(e.target.value);
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
			this.connectWebSocket();

        } catch (error) {
            this.showToast(error.message || 'Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        try {
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

    toggleSidebar() {
        const mainSystem = document.querySelector('.main-system');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const icon = sidebarToggle.querySelector('i');
        
        mainSystem.classList.toggle('sidebar-collapsed');
        
        if (mainSystem.classList.contains('sidebar-collapsed')) {
            icon.className = 'fas fa-chevron-right';
            sidebarToggle.title = 'Expandir Menu';
        } else {
            icon.className = 'fas fa-bars';
            sidebarToggle.title = 'Recolher Menu';
        }
    }

    globalSearch(query) {
        if (!query) {
            // Se não há busca, renderizar a seção atual normalmente
            this.renderSectionContent(this.activeSection);
            return;
        }

        const searchTerm = query.toLowerCase();
        let results = [];

        // Buscar em pedidos
        const orderResults = this.orders.filter(order => 
            order.id.toLowerCase().includes(searchTerm) ||
            order.customer.toLowerCase().includes(searchTerm) ||
            (order.phone && order.phone.includes(searchTerm)) ||
            order.status.toLowerCase().includes(searchTerm)
        );

        // Buscar em produtos
        const productResults = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );

        // Buscar em clientes
        const customerResults = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.name.toLowerCase().includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
        );

        // Combinar resultados
        results = [...orderResults, ...productResults, ...customerResults];

        // Renderizar resultados baseado na seção atual
        this.renderSearchResults(this.activeSection, results, searchTerm);
    }

    renderSearchResults(section, results, searchTerm) {
        const container = document.getElementById(`${section}Section`);
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="section-header">
                    <h2>Resultados da Busca</h2>
                    <div class="search-info">
                        <span>Nenhum resultado encontrado para "${searchTerm}"</span>
                        <button class="btn btn-secondary" onclick="sistema.clearSearch()">
                            <i class="fas fa-times"></i> Limpar Busca
                        </button>
                    </div>
                </div>
                <div class="empty-state">
                    <p>Nenhum resultado encontrado para sua busca.</p>
                    <p>Tente usar termos diferentes ou verificar a ortografia.</p>
                </div>
            `;
            return;
        }

        // Renderizar resultados baseado na seção
        switch (section) {
            case 'pedidos':
                this.renderPedidosSearchResults(container, results, searchTerm);
                break;
            case 'cardapio':
                this.renderCardapioSearchResults(container, results, searchTerm);
                break;
            case 'clientes':
                this.renderClientesSearchResults(container, results, searchTerm);
                break;
            default:
                this.renderGenericSearchResults(container, results, searchTerm);
        }
    }

    renderPedidosSearchResults(container, results, searchTerm) {
        const orderResults = results.filter(item => item.hasOwnProperty('status'));
        
        container.innerHTML = `
            <div class="section-header">
                <h2>Resultados da Busca em Pedidos</h2>
                <div class="search-info">
                    <span>${orderResults.length} resultado(s) para "${searchTerm}"</span>
                    <button class="btn btn-secondary" onclick="sistema.clearSearch()">
                        <i class="fas fa-times"></i> Limpar Busca
                    </button>
                </div>
            </div>
            <div class="search-results">
                ${orderResults.map(order => this.createOrderCard(order)).join('')}
            </div>
        `;

        // Adicionar eventos aos cards
        document.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = card.dataset.orderId;
                this.showOrderModal(orderId);
            });
        });
    }

    renderCardapioSearchResults(container, results, searchTerm) {
        const productResults = results.filter(item => item.hasOwnProperty('category'));
        
        container.innerHTML = `
            <div class="section-header">
                <h2>Resultados da Busca no Cardápio</h2>
                <div class="search-info">
                    <span>${productResults.length} resultado(s) para "${searchTerm}"</span>
                    <button class="btn btn-secondary" onclick="sistema.clearSearch()">
                        <i class="fas fa-times"></i> Limpar Busca
                    </button>
                </div>
            </div>
            <div class="products-grid">
                ${productResults.map(product => this.createProductCard(product)).join('')}
            </div>
        `;
    }

    renderClientesSearchResults(container, results, searchTerm) {
        const customerResults = results.filter(item => item.hasOwnProperty('username'));
        
        container.innerHTML = `
            <div class="section-header">
                <h2>Resultados da Busca em Clientes</h2>
                <div class="search-info">
                    <span>${customerResults.length} resultado(s) para "${searchTerm}"</span>
                    <button class="btn btn-secondary" onclick="sistema.clearSearch()">
                        <i class="fas fa-times"></i> Limpar Busca
                    </button>
                </div>
            </div>
            <div class="users-grid">
                ${customerResults.map(user => this.createUserCard(user)).join('')}
            </div>
        `;
    }

    renderGenericSearchResults(container, results, searchTerm) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Resultados da Busca</h2>
                <div class="search-info">
                    <span>${results.length} resultado(s) para "${searchTerm}"</span>
                    <button class="btn btn-secondary" onclick="sistema.clearSearch()">
                        <i class="fas fa-times"></i> Limpar Busca
                    </button>
                </div>
            </div>
            <div class="search-results">
                <div class="search-categories">
                    <h3>Pedidos (${results.filter(item => item.hasOwnProperty('status')).length})</h3>
                    <div class="search-category-results">
                        ${results.filter(item => item.hasOwnProperty('status')).map(order => this.createOrderCard(order)).join('')}
                    </div>
                    
                    <h3>Produtos (${results.filter(item => item.hasOwnProperty('category')).length})</h3>
                    <div class="search-category-results">
                        ${results.filter(item => item.hasOwnProperty('category')).map(product => this.createProductCard(product)).join('')}
                    </div>
                    
                    <h3>Clientes (${results.filter(item => item.hasOwnProperty('username')).length})</h3>
                    <div class="search-category-results">
                        ${results.filter(item => item.hasOwnProperty('username')).map(user => this.createUserCard(user)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.renderSectionContent(this.activeSection);
    }

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
                    hasPermission = true;
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
        // Mostrar loading durante navegação
        this.showLoading();
        
        this.activeSection = section;

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

        // Renderizar conteúdo e esconder loading
        setTimeout(() => {
            this.renderSectionContent(section);
            this.hideLoading();
        }, 300); // Pequeno delay para mostrar o loading
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
                    <div class="value">${this.metrics?.totalPedidosHoje ?? 0}</div>
                </div>
                <div class="metric-card">
                    <h3>Faturamento</h3>
                    <div class="value">R$ ${Number(this.metrics?.valorTotalArrecadado ?? 0).toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <h3>Pedidos Ativos</h3>
                    <div class="value">${this.orders.filter(o => o.status !== 'finalizado').length}</div>
                </div>
            </div>
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Pedidos por Status</h3>
                    <canvas id="statusChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Faturamento Mensal</h3>
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

    createUserCard(user) {
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <h3 class="user-name">${user.name || user.username}</h3>
                    <span class="user-profile">${user.profileId || 'Sem perfil'}</span>
                </div>
                <p class="user-info">${user.username}</p>
                ${user.email ? `<p class="user-email">${user.email}</p>` : ''}
                <div class="user-actions">
                    <button class="btn btn-sm btn-secondary" onclick="sistema.editUser('${user.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="sistema.deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
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
                o.customer === customer.name || o.phone === customer.phone
            );
            
            // Buscar mensagens do cliente (se implementado na API)
            const customerMessages = this.getCustomerMessages(customer);
            
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
                <h3>Detalhes do Cliente</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="customer-details">
                    <div class="customer-profile">
                        <div class="customer-avatar large">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="customer-info">
                            <h3>${customer.name}</h3>
                            <p>${customer.phone}</p>
                            <p>Cliente desde: ${new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
                
                <div class="customer-tabs">
                    <button class="tab-btn active" data-tab="orders">Pedidos (${orders.length})</button>
                    <button class="tab-btn" data-tab="conversations">Conversas (${messages.length})</button>
                </div>
                
                <div class="tab-content">
                    <div class="tab-pane active" data-tab="orders">
                        <div class="scrollable-content" style="max-height: 300px; overflow-y: auto;">
                            ${this.renderCustomerOrders(orders)}
                        </div>
                    </div>
                    <div class="tab-pane" data-tab="conversations">
                        <div class="scrollable-content" style="max-height: 300px; overflow-y: auto;" id="customerChatMessages">
                            ${this.renderCustomerConversations(messages)}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeModalBtn">Fechar</button>
            </div>
        `;
        
        this.renderModal(modalHTML, (modal) => {
            // Ação do botão de fechar
            const closeModalButton = modal.querySelector('.modal-close') || modal.querySelector('#closeModalBtn');
            closeModalButton.onclick = () => this.closeModal();
            
            // Configurar a troca de abas
            this.setupCustomerTabs(modal);

            // Rolar para o final do chat ao abrir
            const chatContainer = modal.querySelector('#customerChatMessages');
            if (chatContainer) {
                this.scrollChatToBottom(chatContainer);
            }
        });
    }

    renderCustomerOrders(orders) {
        if (orders.length === 0) {
            return '<div class="empty-state">Nenhum pedido encontrado</div>';
        }
        
        // Ordena os pedidos do mais recente para o mais antigo
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return `
            <div class="customer-orders-list">
                ${sortedOrders.map(order => `
                    <div class="customer-order-item">
                        <div class="order-header">
                            <span class="order-id">Pedido #${order.id}</span>
                            <span class="order-status status-${order.status}">${this.getStatusName(order.status)}</span>
                        </div>
                        <div class="order-items">
                            ${order.items.map(item => {
                                const product = this.products.find(p => p.id === item.productId);
                                return `<span class="order-item">${item.quantity}x ${product ? product.name : 'Item'}</span>`;
                            }).join('')}
                        </div>
                        <div class="order-footer">
                            <span class="order-total">R$ ${order.total.toFixed(2)}</span>
                            <span class="order-date">${new Date(order.createdAt).toLocaleString('pt-BR')}</span>
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
        
        // Reutiliza a mesma lógica de renderização do chat do pedido para consistência
        return `
            <div class="chat-messages-customer">
                ${messages.map((msg, index) => {
                    const messageId = msg.id || `cust-msg-${msg.orderId}-${index}`;
                    
                    let messageType = 'user'; // padrão
                    if (msg.sender === 'system') {
                        messageType = 'system';
                    } else if (msg.sender === 'customer') {
                        messageType = 'customer';
                    } else if (msg.sender === 'user') {
                        messageType = 'system'; // Atendente
                    }

                    const messageTime = msg.timestamp ? new Date(msg.timestamp).toLocaleString('pt-BR') : '';
                    
                    const senderName = this.getSenderName(msg.sender) + (msg.clientId ? ` (${msg.clientId})` : '');

                    return `
                        <div class="chat-message ${messageType}" data-message-id="${messageId}">
                            <div class="message-header">
                                <span class="message-sender">${senderName}</span>
                                ${msg.orderId ? `<span class="message-order">Ref. Pedido #${msg.orderId}</span>` : ''}
                            </div>
                            <div class="message-content">${msg.message}</div>
                            <div class="message-time">${messageTime}</div>
                        </div>
                    `;
                }).join('')}
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
                <button class="btn btn-secondary" id="cancelCustomerBtn">Cancelar</button>
                <button class="btn btn-primary" id="saveCustomerBtn">Salvar</button>
            </div>
        `;
        
        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#cancelCustomerBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            modal.querySelector('#saveCustomerBtn').onclick = () => this.saveNewCustomer();
        });
    }

    async saveNewCustomer() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        
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
            
            // Fechar modal
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
					
					${this.permissions.criarUsuarios ? `
                    <button class="btn btn-secondary" id="manageProfilesBtn">
                        <i class="fas fa-cogs"></i> Gerenciar Perfis
                    </button>
                    ` : ''}

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
                      ${this.permissions.gerenciarPerfis ? this.profiles.map(profile => `
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
                         `).join(''): ""}
                </div>
            </div>
        `;
        
        if (this.permissions.criarUsuarios) {
            document.getElementById('newUserBtn').onclick = () => this.showUserModal();
        }
		if (this.permissions.gerenciarPerfis) {
            document.getElementById('manageProfilesBtn').onclick = () => this.showProfileModal();
        }
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
                <div class="order-details-container" data-order-id="${orderId}">
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
                        <div class="chat-container">
                            <div class="chat-header">
                                <button class="btn btn-sm btn-secondary" id="loadMoreMessages" style="display: none;">
                                    <i class="fas fa-arrow-up"></i> Carregar mensagens anteriores
                                </button>
                            </div>
                            <div class="chat-messages" id="chatMessages">
                                <div class="loading-messages">Carregando mensagens...</div>
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
            modal.querySelector('#closeModalBtn').onclick = () => {
                this.stopChatPolling();
                this.closeModal();
            };
            modal.querySelector('.modal-close').onclick = () => {
                this.stopChatPolling();
                this.closeModal();
            };
            
            if (modal.querySelector('#updateStatusBtn')) {
                modal.querySelector('#updateStatusBtn').onclick = () => this.showUpdateStatusModal(orderId);
            }
            
            if (modal.querySelector('#printOrderBtn')) {
                modal.querySelector('#printOrderBtn').onclick = () => this.printOrder(orderId);
            }
            
            // Configurar chat se disponível
            if (this.permissions.verChat) {
                await this.initializeChatInterface(orderId);
                
                if (modal.querySelector('#sendMessageBtn')) {
                    const sendMessage = async () => {
                        const messageInput = modal.querySelector('#newMessage');
                        const message = messageInput.value.trim();
                        if (message) {
                            try {
                                await this.sendChatMessage(orderId, message);
                                messageInput.value = '';
                                // A mensagem será atualizada automaticamente pelo polling
                            } catch (error) {
                                this.showToast('Erro ao enviar mensagem.', 'error');
                            }
                        }
                    };
                    
                    modal.querySelector('#sendMessageBtn').onclick = sendMessage;
                    modal.querySelector('#newMessage').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') sendMessage();
                    });
                }
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
			
			// Atualizar status na API
			await this.apiService.patch(`${API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS}/${orderId}/status`, {
				status: newStatus
			});

			// Atualizar localmente
			const order = this.orders.find(o => o.id === orderId);
			if (order) {
				order.status = newStatus;

				// regra: se for retirada (pickup) e marcar "pronto", finaliza automaticamente
				let autoFinalizado = false;
				if (order.type === 'pickup' && newStatus === 'coletado') {
					order.status = 'finalizado';
					autoFinalizado = true;
				}
			}

			this.closeModal();
			this.renderKanbanBoard();
			this.showToast(
				order && order.type === 'pickup' && newStatus === 'coletado'
					? `Pedido ${orderId} finalizado automaticamente (retirada pronta).`
					: `Status do pedido ${orderId} atualizado!`,
				order && order.type === 'pickup' && newStatus === 'coletado' ? 'info' : 'success'
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

        const modalHTML = `
            <div class="modal-header">
                <h3>Criar Novo Pedido</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="newOrderForm">
                    <div class="form-group">
                        <label for="customerName">Nome do Cliente</label>
                        <input type="text" id="customerName" required>
                    </div>
                    <div class="form-group">
                        <label for="customerPhone">Telefone do Cliente</label>
                        <input type="tel" id="customerPhone">
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
        const customerName = modal.querySelector('#customerName').value;
        const customerPhone = modal.querySelector('#customerPhone').value;
        const orderType = modal.querySelector('#orderType').value;
        const customerAddress = modal.querySelector('#customerAddress').value;
        
        if (!customerName) {
            this.showToast('O nome do cliente é obrigatório.', 'error');
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

	async initializeChatInterface(orderId) {
		try {
			// Carregar mensagens iniciais
			const chatData = await this.getChatMessages(orderId, 1, 10);
			const chatContainer = document.getElementById('chatMessages');
			const loadMoreBtn = document.getElementById('loadMoreMessages');
			
			if (chatContainer) {
				// Atualizar interface com mensagens
				this.updateChatInterface(orderId, chatData.messages);
				
				// Configurar botão de carregar mais mensagens
				if (loadMoreBtn) {
					if (chatData.hasMore) {
						loadMoreBtn.style.display = 'block';
						loadMoreBtn.onclick = async () => {
							try {
								const nextPage = chatData.currentPage + 1;
								const moreData = await this.getChatMessages(orderId, nextPage, 10);
								
								// Adicionar as novas mensagens às existentes
								const existingMessages = chatData.messages;
								chatData.messages = [...existingMessages, ...moreData.messages];
								chatData.currentPage = moreData.currentPage;
								chatData.hasMore = moreData.hasMore;
								
								// Atualizar interface
								this.updateChatInterface(orderId, chatData.messages);
								
								// Esconder botão se não há mais mensagens
								if (!moreData.hasMore) {
									loadMoreBtn.style.display = 'none';
								}
							} catch (error) {
								console.error('Erro ao carregar mais mensagens:', error);
							}
						};
					} else {
						loadMoreBtn.style.display = 'none';
					}
				}
				
				// Scroll para o final do chat
				setTimeout(() => {
					this.scrollChatToBottom(chatContainer);
				}, 100);
				
				// Iniciar polling para novas mensagens
				this.startChatPolling(orderId);
			}
		} catch (error) {
			console.error('Erro ao inicializar chat:', error);
			const chatContainer = document.getElementById('chatMessages');
			if (chatContainer) {
				chatContainer.innerHTML = '<div class="error-message">Erro ao carregar mensagens do chat.</div>';
			}
		}
	}

    // =================================================================
    // 8. SISTEMA DE CHAT DE PEDIDOS
    // =================================================================

    async sendChatMessage(orderId, message, senderId = null) {
        try {
            const messageData = {
                orderId: orderId,
                message: message.trim(),
                senderId: senderId || 'system',
                clientId: this.currentUser,
                timestamp: new Date().toISOString()
            };

            const response = await this.apiService.post(API_CONFIG.ENDPOINTS.CHAT.SEND_MESSAGE, messageData);
            
            // Atualizar cache local do pedido
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                if (!order.chat) order.chat = [];
                order.chat.push(response);
            }

            return response;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }


	async getChatMessages(orderId, page = 1, limit = 10) {
		try {
			// Corrigido: usar a variável 'customer' que foi definida
			const response = await this.apiService.get(`${API_CONFIG.ENDPOINTS.CHAT.GET_MESSAGES}/${orderId}/${page}/${limit}`);
			
			// Se a resposta for um array simples (como no seu exemplo)
			if (Array.isArray(response)) {
				return {
					messages: response,
					totalPages: Math.ceil(response.length / limit),
					currentPage: page,
					hasMore: response.length === limit
				};
			}
			
			// Se a resposta for um objeto com estrutura completa
			return {
				messages: response.messages || [],
				totalPages: response.totalPages || 1,
				currentPage: response.currentPage || page,
				hasMore: response.hasMore || false
			};
		} catch (error) {
			console.error('Erro ao carregar mensagens:', error);
			throw error;
		}
	}

    async getUnreadMessagesCount(orderId = null) {
        try {
            const params = orderId ? { orderId } : {};
            const response = await this.apiService.get(API_CONFIG.ENDPOINTS.CHAT.GET_UNREAD_COUNT, params);
            return response.count || 0;
        } catch (error) {
            console.error('Erro ao carregar contagem de mensagens não lidas:', error);
            return 0;
        }
    }

    // Sistema de auto-atualização de mensagens
    startChatPolling(orderId) {
        if (this.chatPollingInterval) {
            clearInterval(this.chatPollingInterval);
        }

        // Armazena o timestamp da última mensagem conhecida para este chat
        this.lastMessageTimestamp = null;
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.chat && order.chat.length > 0) {
            this.lastMessageTimestamp = order.chat[order.chat.length - 1].time;
        }


        //this.chatPollingInterval = setInterval(async () => {
        //    try {
        //        // Para o polling se o modal do pedido for fechado
        //        const activeModal = document.querySelector('.modal-backdrop');
        //        if (!activeModal || !activeModal.querySelector(`[data-order-id="${orderId}"]`)) {
        //            this.stopChatPolling();
        //            return;
        //        }
		//
        //        // Busca as 50 mensagens mais recentes
        //        const chatData = await this.getChatMessages(orderId, 1, 50);
        //        
        //        if (chatData.messages && chatData.messages.length > 0) {
        //            const latestMessage = chatData.messages[chatData.messages.length - 1];
        //            
        //            // Compara o timestamp da última mensagem. Se for mais nova, atualiza.
        //            if (!this.lastMessageTimestamp || new Date(latestMessage.time) > new Date(this.lastMessageTimestamp)) {
        //                // Atualiza o cache local
        //                const orderToUpdate = this.orders.find(o => o.id === orderId);
        //                if(orderToUpdate) {
        //                    orderToUpdate.chat = chatData.messages;
        //                }
        //                
        //                // Atualiza o timestamp da última mensagem conhecida
        //                this.lastMessageTimestamp = latestMessage.time;
        //                
        //                // Atualiza a interface do chat de forma inteligente
        //                this.updateChatInterface(orderId, chatData.messages);
        //            }
        //        }
        //    } catch (error) {
        //        console.warn('Erro no polling do chat:', error);
        //        // Opcional: parar o polling em caso de erro para não sobrecarregar
        //        // this.stopChatPolling();
        //    }
        //}, 5000); // Verificar a cada 5 segundos
    }
	
	async updateChatMessages(orderId) {
    try {
        const chatData = await this.getChatMessages(orderId, 1, 50);

        if (chatData.messages && chatData.messages.length > 0) {
            const latestMessage = chatData.messages[chatData.messages.length - 1];
            
            // Compara o timestamp da última mensagem. Se for mais nova, atualiza.
            if (!this.lastMessageTimestamp || new Date(latestMessage.time) > new Date(this.lastMessageTimestamp)) {
                const orderToUpdate = this.orders.find(o => o.id === orderId);
                if (orderToUpdate) {
                    orderToUpdate.chat = chatData.messages;
                    this.lastMessageTimestamp = latestMessage.time;
                    this.updateChatInterface(orderId, chatData.messages);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao buscar mensagens do chat via WebSocket:', error);
    }
}

    stopChatPolling() {
        if (this.chatPollingInterval) {
            clearInterval(this.chatPollingInterval);
            this.chatPollingInterval = null;
        }
    }

	updateChatInterface(orderId, messages) {
		const chatContainer = document.getElementById('chatMessages');
		if (!chatContainer) return;
		
		const wasAtBottom = this.isChatAtBottom(chatContainer);
		
        // Itera sobre as mensagens recebidas e adiciona apenas as que não existem no DOM
		messages.forEach((msg, index) => {
			const messageId = msg.id || `msg-${orderId}-${index}`;
            
            // Se a mensagem ainda não está na tela, adicione-a
            if (!chatContainer.querySelector(`[data-message-id="${messageId}"]`)) {
                let messageType = 'user'; // padrão
                if (msg.sender === 'system') {
                    messageType = 'system';
                } else if (msg.sender === 'customer') {
                    messageType = 'customer';
                } else if (msg.sender === 'user') {
                    messageType = 'system'; // Atendente é tratado como 'system' visualmente
                }
                
                const messageTime = msg.time ? new Date(msg.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                
                let senderName = 'Desconhecido';
                if (msg.sender === 'system') {
                    senderName = 'Sistema';
                } else if (msg.sender === 'customer') {
                    senderName = 'Cliente';
                } else if (msg.sender === 'user' || msg.clientId) {
                    senderName = msg.clientId || 'Atendente';
                }

                const messageElementHTML = `
                    <div class="chat-message ${messageType}" data-message-id="${messageId}">
                        <div class="message-content">${msg.message}</div>
                        <div class="message-time">${messageTime}</div>
                        <div class="message-sender">${senderName}</div>
                    </div>
                `;
                chatContainer.insertAdjacentHTML('beforeend', messageElementHTML);
            }
		});
		
		// Se o usuário estava no final do chat, role para a nova mensagem
		if (wasAtBottom) {
			this.scrollChatToBottom(chatContainer);
		}
	}

    isChatAtBottom(chatContainer) {
        const threshold = 50; // pixels de tolerância
        return chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - threshold;
    }

    scrollChatToBottom(chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async loadMoreChatMessages(orderId, currentPage) {
        try {
            this.showLoading();
            
            const chatData = await this.getChatMessages(orderId, currentPage + 1, 10);
            
            if (chatData.messages.length > 0) {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    // Adicionar mensagens antigas ao início
                    if (!order.chat) order.chat = [];
                    order.chat = [...chatData.messages, ...order.chat];
                    
                    // Atualizar interface
                    this.updateChatInterface(orderId, order.chat);
                }
                
                return chatData.hasMore;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao carregar mais mensagens:', error);
            this.showToast('Erro ao carregar mensagens antigas.', 'error');
            return false;
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
            'atendimento': 'Em Atendimento',
            'pagamento': 'Aguardando Pagamento',
            'feito': 'Pedido Feito',
            'preparo': 'Em Preparo',
            'pronto': 'Pronto',
            'coletado': 'Coletado',
            'finalizado': 'Finalizado'
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

