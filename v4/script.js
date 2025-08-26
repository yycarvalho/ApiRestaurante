/**
 * Sistema de Gestão de Pedidos
 * Autor: Manus AI
 * Versão: 3.0 (Sistema de Autenticação e Permissões Avançado)
 */
class SistemaPedidos {
    constructor() {
        // Estado da Aplicação
        this.currentUser = null;
        this.currentProfile = null;
        this.permissions = {};
        this.activeSection = 'dashboard';

        // Inicialização
        this.initializeData();
        this.initializeEventListeners();
        this.renderLoginScreen();
    }

    // =================================================================
    // 1. INICIALIZAÇÃO E DADOS
    // =================================================================

    initializeData() {
        // Usuários para o sistema de login (agora com mais campos)
        this.users = {
            'admin': { 
                password: '123', 
                profile: 'administrador',
                name: 'Administrador',
                email: 'admin@sistema.com',
                createdAt: new Date('2024-01-01'),
                canChangePassword: true
            },
            'atendente': { 
                password: '123', 
                profile: 'atendente',
                name: 'João Atendente',
                email: 'atendente@sistema.com',
                createdAt: new Date('2024-01-15'),
                canChangePassword: true
            },
            'entregador': { 
                password: '123', 
                profile: 'entregador',
                name: 'Carlos Entregador',
                email: 'entregador@sistema.com',
                createdAt: new Date('2024-02-01'),
                canChangePassword: true
            }
        };

        // Perfis e Permissões (expandido)
        this.profiles = {
            administrador: { 
                name: 'Administrador', 
                permissions: { 
                    verDashboard: true, 
                    verPedidos: true, 
                    verCardapio: true, 
                    criarEditarProduto: true, 
                    excluirProduto: true, 
                    desativarProduto: true, 
                    verChat: true, 
                    enviarChat: true, 
                    imprimirPedido: true, 
                    acessarEndereco: true, 
                    visualizarValorPedido: true, 
                    acompanharEntregas: true, 
                    gerarRelatorios: true, 
                    gerenciarPerfis: true,
                    alterarStatusPedido: true,
                    selecionarStatusEspecifico: true,
                    criarUsuarios: true,
                    editarUsuarios: true,
                    excluirUsuarios: true
                } 
            },
            atendente: { 
                name: 'Atendente', 
                permissions: { 
                    verDashboard: true, 
                    verPedidos: true, 
                    verCardapio: true, 
                    criarEditarProduto: false, 
                    excluirProduto: false, 
                    desativarProduto: true, 
                    verChat: true, 
                    enviarChat: true, 
                    imprimirPedido: true, 
                    acessarEndereco: false, 
                    visualizarValorPedido: true, 
                    acompanharEntregas: false, 
                    gerarRelatorios: false, 
                    gerenciarPerfis: false,
                    alterarStatusPedido: false,
                    selecionarStatusEspecifico: false,
                    criarUsuarios: false,
                    editarUsuarios: false,
                    excluirUsuarios: false
                } 
            },
            entregador: { 
                name: 'Entregador', 
                permissions: { 
                    verDashboard: false, 
                    verPedidos: true, 
                    verCardapio: false, 
                    criarEditarProduto: false, 
                    excluirProduto: false, 
                    desativarProduto: false, 
                    verChat: true, 
                    enviarChat: true, 
                    imprimirPedido: false, 
                    acessarEndereco: true, 
                    visualizarValorPedido: false, 
                    acompanharEntregas: true, 
                    gerarRelatorios: false, 
                    gerenciarPerfis: false,
                    alterarStatusPedido: false,
                    selecionarStatusEspecifico: false,
                    criarUsuarios: false,
                    editarUsuarios: false,
                    excluirUsuarios: false
                } 
            }
        };

        // Lista de todas as permissões disponíveis
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

        // Status dos Pedidos
        this.orderStatuses = [
            { id: 'atendimento', name: 'Em Atendimento' },
            { id: 'pagamento', name: 'Aguardando Pagamento' },
            { id: 'feito', name: 'Pedido Feito' },
            { id: 'preparo', name: 'Em Preparo' },
            { id: 'pronto', name: 'Pronto' },
            { id: 'coletado', name: 'Coletado' },
            { id: 'finalizado', name: 'Finalizado' }
        ];

        // Produtos do Cardápio
        this.products = [
            { id: 1, name: 'X-Burger Clássico', price: 25.90, description: 'Hambúrguer artesanal, queijo, alface, tomate e molho especial', category: 'lanches', active: true },
            { id: 2, name: 'X-Bacon', price: 29.90, description: 'Hambúrguer artesanal, bacon, queijo, alface, tomate e molho especial', category: 'lanches', active: true },
            { id: 3, name: 'Coca-Cola 350ml', price: 5.50, description: 'Refrigerante Coca-Cola lata 350ml', category: 'bebidas', active: true },
            { id: 4, name: 'Batata Frita', price: 12.90, description: 'Porção de batata frita crocante', category: 'acompanhamentos', active: true },
            { id: 5, name: 'Milkshake de Chocolate', price: 15.90, description: 'Milkshake cremoso de chocolate com chantilly', category: 'sobremesas', active: true }
        ];

        // Pedidos Simulados
        this.orders = [
            { 
                id: 'PED001', 
                customer: 'João Silva', 
                phone: '(11) 99999-1234',
                status: 'atendimento', 
                type: 'delivery', 
                address: 'Rua das Flores, 123', 
                items: [{ productId: 1, quantity: 2, price: 25.90 }, { productId: 3, quantity: 2, price: 5.50 }], 
                total: 62.80, 
                createdAt: new Date(Date.now() - 30 * 60000),
                chat: [
                    { sender: 'customer', message: 'Olá, gostaria de fazer um pedido', time: new Date(Date.now() - 25 * 60000) },
                    { sender: 'system', message: 'Olá João! Em que posso ajudá-lo?', time: new Date(Date.now() - 24 * 60000) },
                    { sender: 'customer', message: '2 X-Burger Clássico e 2 Coca-Cola', time: new Date(Date.now() - 23 * 60000) },
                    { sender: 'system', message: 'Perfeito! Total: R$ 62,80. Confirma o pedido?', time: new Date(Date.now() - 22 * 60000) },
                    { sender: 'customer', message: 'Confirmo! Entrega na Rua das Flores, 123', time: new Date(Date.now() - 21 * 60000) }
                ]
            },
            { 
                id: 'PED002', 
                customer: 'Maria Santos', 
                phone: '(11) 99999-5678',
                status: 'preparo', 
                type: 'pickup', 
                address: null, 
                items: [{ productId: 2, quantity: 1, price: 29.90 }, { productId: 4, quantity: 1, price: 12.90 }], 
                total: 42.80, 
                createdAt: new Date(Date.now() - 45 * 60000),
                chat: [
                    { sender: 'customer', message: 'Quero um X-Bacon com batata frita', time: new Date(Date.now() - 40 * 60000) },
                    { sender: 'system', message: 'Ótima escolha! Será retirada ou entrega?', time: new Date(Date.now() - 39 * 60000) },
                    { sender: 'customer', message: 'Retirada na loja', time: new Date(Date.now() - 38 * 60000) },
                    { sender: 'system', message: 'Pedido confirmado! Total: R$ 42,80', time: new Date(Date.now() - 37 * 60000) }
                ]
            },
            { 
                id: 'PED003', 
                customer: 'Carlos Oliveira', 
                phone: '(11) 99999-9012',
                status: 'pronto', 
                type: 'delivery', 
                address: 'Av. Paulista, 1000', 
                items: [{ productId: 1, quantity: 1, price: 25.90 }, { productId: 5, quantity: 1, price: 15.90 }], 
                total: 41.80, 
                createdAt: new Date(Date.now() - 60 * 60000),
                chat: [
                    { sender: 'customer', message: 'Um X-Burger e um milkshake, por favor', time: new Date(Date.now() - 55 * 60000) },
                    { sender: 'system', message: 'Perfeito! Endereço para entrega?', time: new Date(Date.now() - 54 * 60000) },
                    { sender: 'customer', message: 'Av. Paulista, 1000', time: new Date(Date.now() - 53 * 60000) },
                    { sender: 'system', message: 'Pedido em preparo! Tempo estimado: 30 min', time: new Date(Date.now() - 52 * 60000) }
                ]
            }
        ];

        // Métricas do Dashboard
        this.metrics = {
            totalPedidosHoje: 15,
            valorTotalArrecadado: 847.50,
            pedidosPorStatus: { atendimento: 2, pagamento: 1, feito: 3, preparo: 4, pronto: 2, coletado: 1, finalizado: 2 },
            faturamentoMensal: [12500, 13800, 15200, 14800, 17300, 16900] // Simulação para gráfico
        };
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
    }

    // =================================================================
    // 2. LÓGICA DE AUTENTICAÇÃO E NAVEGAÇÃO
    // =================================================================

    renderLoginScreen() {
        const container = document.getElementById('loginProfiles');
        container.innerHTML = '<p>Ou acesse rapidamente como:</p>';
        const quickAccessContainer = document.createElement('div');
        quickAccessContainer.className = 'profile-quick-access';

        Object.keys(this.users).forEach(username => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = this.profiles[this.users[username].profile].name;
            btn.onclick = () => this.login(username, this.users[username].password);
            quickAccessContainer.appendChild(btn);
        });
        container.appendChild(quickAccessContainer);
    }

    login(username, password) {
        const user = this.users[username];
        if (user && user.password === password) {
            this.currentUser = username;
            this.currentProfile = user.profile;
            this.permissions = this.profiles[this.currentProfile].permissions;

            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainSystem').classList.remove('hidden');

            this.setupUI();
            this.navigateToSection('pedidos');
            this.showToast('Login realizado com sucesso!', 'success');
        } else {
            this.showToast('Usuário ou senha inválidos.', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        this.currentProfile = null;
        this.permissions = {};

        document.getElementById('mainSystem').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('loginForm').reset();
        
        // Selecionar primeiro item da navegação ao fazer logout
        this.selectFirstNavItem();
    }

    selectFirstNavItem() {
        const firstNavItem = document.querySelector('.nav-item[data-section="dashboard"]');
        if (firstNavItem) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            firstNavItem.classList.add('active');
        }
    }

    setupUI() {
        document.getElementById('currentUser').textContent = this.users[this.currentUser].name || this.currentUser;
        document.getElementById('currentProfile').textContent = this.profiles[this.currentProfile].name;

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

        this.renderSectionContent(section);
    }

    renderSectionContent(section) {
        const container = document.getElementById(`${section}Section`);
        container.innerHTML = ''; // Limpa conteúdo anterior

        switch (section) {
            case 'dashboard': this.renderDashboard(container); break;
            case 'pedidos': this.renderPedidos(container); break;
            case 'cardapio': this.renderCardapio(container); break;
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
                    <div class="value">${this.metrics.totalPedidosHoje}</div>
                </div>
                <div class="metric-card">
                    <h3>Faturamento</h3>
                    <div class="value">R$ ${this.metrics.valorTotalArrecadado.toFixed(2)}</div>
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
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(this.metrics.pedidosPorStatus).map(s => this.orderStatuses.find(os => os.id === s)?.name || s),
                datasets: [{
                    data: Object.values(this.metrics.pedidosPorStatus),
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1', '#6b7280'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Gráfico de Faturamento
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago','Set','Out','Nov','Dez'],
                datasets: [{
                    label: 'Faturamento',
                    data: this.metrics.faturamentoMensal,
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

        this.orderStatuses.forEach(status => {
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

    renderRelatorios(container) {
        container.innerHTML = `
            <div class="section-header">
                <h2>Relatórios</h2>
            </div>
            <div class="reports-grid">
                <div class="report-card">
                    <h3>Vendas por Período</h3>
                    <p>Relatório detalhado de vendas em um período específico</p>
                    <button class="btn btn-primary">Gerar Relatório</button>
                </div>
                <div class="report-card">
                    <h3>Produtos Mais Vendidos</h3>
                    <p>Ranking dos produtos com maior volume de vendas</p>
                    <button class="btn btn-primary">Gerar Relatório</button>
                </div>
                <div class="report-card">
                    <h3>Performance de Entregadores</h3>
                    <p>Análise de performance e tempo médio de entrega</p>
                    <button class="btn btn-primary">Gerar Relatório</button>
                </div>
            </div>
        `;
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
                    ${Object.entries(this.users).map(([username, user]) => `
                        <div class="user-card" data-username="${username}">
                            <div class="user-header">
                                <h4>${user.name}</h4>
                                <span class="user-profile">${this.profiles[user.profile].name}</span>
                            </div>
                            <div class="user-info">
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Criado em:</strong> ${user.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div class="user-actions">
                                ${this.permissions.editarUsuarios ? `
                                <button class="btn btn-secondary btn-sm" onclick="sistema.editUser('${username}')">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                ` : ''}
                                ${this.permissions.excluirUsuarios && username !== 'admin' ? `
                                <button class="btn btn-danger btn-sm" onclick="sistema.deleteUser('${username}')">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h3>Tipos de Perfil</h3>
                <div class="profiles-grid" id="profilesGrid">
                    ${Object.entries(this.profiles).map(([key, profile]) => `
                        <div class="profile-card" data-profile-id="${key}">
                            <div class="profile-header">
                                <h4>${profile.name}</h4>
                                <span class="permissions-count">${Object.values(profile.permissions).filter(p => p).length} permissões</span>
                            </div>
                            <div class="profile-actions">
                                <button class="btn btn-secondary btn-sm" onclick="sistema.editProfile('${key}')">
                                    <i class="fas fa-edit"></i> Editar Permissões
                                </button>
                                ${key !== 'administrador' ? `
                                <button class="btn btn-danger btn-sm" onclick="sistema.deleteProfile('${key}')">
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
                            ${order.chat ? order.chat.map(msg => `
                                <div class="chat-message ${msg.sender}">
                                    <div class="message-content">${msg.message}</div>
                                    <div class="message-time">${new Date(msg.time).toLocaleTimeString()}</div>
                                </div>
                            `).join('') : ''}
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
        
        this.renderModal(modalHTML, (modal) => {
            modal.querySelector('#closeModalBtn').onclick = () => this.closeModal();
            modal.querySelector('.modal-close').onclick = () => this.closeModal();
            
            if (modal.querySelector('#updateStatusBtn')) {
                modal.querySelector('#updateStatusBtn').onclick = () => this.showUpdateStatusModal(orderId);
            }
            
            if (modal.querySelector('#printOrderBtn')) {
                modal.querySelector('#printOrderBtn').onclick = () => this.printOrder(orderId);
            }
            
            if (modal.querySelector('#sendMessageBtn')) {
                const sendMessage = () => {
                    const messageInput = modal.querySelector('#newMessage');
                    const message = messageInput.value.trim();
                    if (message) {
                        this.addChatMessage(orderId, message);
                        messageInput.value = '';
                        // Recarregar o modal para mostrar a nova mensagem
                        this.showOrderModal(orderId);
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
    
	updateOrderStatus(orderId, newStatus) {
		const order = this.orders.find(o => o.id === orderId);
		if (!order) return;
	
		// aplica o status solicitado
		order.status = newStatus;
	
		// regra: se for retirada (pickup) e marcar "pronto", finaliza automaticamente
		let autoFinalizado = false;
		if (order.type === 'pickup' && newStatus === 'coletado') {
			order.status = 'finalizado';
			autoFinalizado = true;
		}
	
		this.closeModal();
		this.renderKanbanBoard();
		this.showToast(
			autoFinalizado
				? `Pedido ${orderId} finalizado automaticamente (retirada pronta).`
				: `Status do pedido ${orderId} atualizado!`,
			autoFinalizado ? 'info' : 'success'
		);
	}

    showNewOrderModal() {
        const productOptions = this.products
            .filter(p => p.active)
            .map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - R$ ${p.price.toFixed(2)}</option>`)
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

        const newOrder = {
            id: `PED${String(this.orders.length + 10).padStart(3, '0')}`,
            customer: customerName,
            phone: customerPhone,
            status: 'atendimento',
            type: orderType,
            address: orderType === 'delivery' ? customerAddress : null,
            items: items,
            total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            createdAt: new Date(),
            chat: []
        };

        this.orders.unshift(newOrder); // Adiciona no início da lista
        this.closeModal();
        this.renderKanbanBoard();
        this.showToast('Novo pedido criado com sucesso!', 'success');
    }

    // =================================================================
    // 5. GESTÃO DE USUÁRIOS E PERFIS
    // =================================================================

    showUserModal(username = null) {
        const user = username ? this.users[username] : null;
        const isEdit = !!user;

        const profileOptions = Object.entries(this.profiles)
            .map(([key, profile]) => `<option value="${key}" ${user && user.profile === key ? 'selected' : ''}>${profile.name}</option>`)
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
                        <input type="text" id="userLogin" value="${username || ''}" ${isEdit ? 'readonly' : ''} required>
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
            modal.querySelector('#saveUserBtn').onclick = () => this.saveUser(modal, username);
        });
    }

    saveUser(modal, existingUsername = null) {
        const name = modal.querySelector('#userName').value;
        const email = modal.querySelector('#userEmail').value;
        const login = modal.querySelector('#userLogin').value;
        const password = modal.querySelector('#userPassword')?.value;
        const passwordConfirm = modal.querySelector('#userPasswordConfirm')?.value;
        const profile = modal.querySelector('#userProfile').value;

        if (!name || !email || !login || !profile) {
            this.showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (!existingUsername) {
            if (!password || !passwordConfirm) {
                this.showToast('Senha e confirmação são obrigatórias.', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                this.showToast('As senhas não coincidem.', 'error');
                return;
            }

            if (this.users[login]) {
                this.showToast('Este login já existe.', 'error');
                return;
            }
        }

        const userData = {
            name: name,
            email: email,
            profile: profile,
            createdAt: existingUsername ? this.users[existingUsername].createdAt : new Date(),
            canChangePassword: true
        };

        if (!existingUsername) {
            userData.password = password;
            this.users[login] = userData;
        } else {
            userData.password = this.users[existingUsername].password;
            if (existingUsername !== login) {
                delete this.users[existingUsername];
            }
            this.users[login] = userData;
        }

        this.closeModal();
        this.renderPerfis(document.getElementById('perfisSection'));
        this.showToast(`Usuário ${existingUsername ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    }

    editUser(username) {
        this.showUserModal(username);
    }

    deleteUser(username) {
        if (username === 'admin') {
            this.showToast('O usuário administrador não pode ser excluído.', 'error');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o usuário ${this.users[username].name}?`)) {
            delete this.users[username];
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast('Usuário excluído com sucesso!', 'success');
        }
    }

    showProfileModal(profileKey = null) {
        const profile = profileKey ? this.profiles[profileKey] : null;
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
            modal.querySelector('#saveProfileBtn').onclick = () => this.saveProfile(modal, profileKey);
        });
    }

    saveProfile(modal, existingProfileKey = null) {
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

        const profileKey = existingProfileKey || name.toLowerCase().replace(/\s+/g, '_');
        
        if (!existingProfileKey && this.profiles[profileKey]) {
            this.showToast('Já existe um perfil com este nome.', 'error');
            return;
        }

        this.profiles[profileKey] = {
            name: name,
            permissions: permissions
        };

        this.closeModal();
        this.renderPerfis(document.getElementById('perfisSection'));
        this.showToast(`Perfil ${existingProfileKey ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    }

    editProfile(profileKey) {
        this.showProfileModal(profileKey);
    }

    deleteProfile(profileKey) {
        if (profileKey === 'administrador') {
            this.showToast('O perfil administrador não pode ser excluído.', 'error');
            return;
        }

        // Verificar se há usuários usando este perfil
        const usersWithProfile = Object.values(this.users).filter(user => user.profile === profileKey);
        if (usersWithProfile.length > 0) {
            this.showToast('Não é possível excluir um perfil que está sendo usado por usuários.', 'error');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o perfil ${this.profiles[profileKey].name}?`)) {
            delete this.profiles[profileKey];
            this.renderPerfis(document.getElementById('perfisSection'));
            this.showToast('Perfil excluído com sucesso!', 'success');
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

    changePassword(modal) {
        const currentPassword = modal.querySelector('#currentPassword').value;
        const newPassword = modal.querySelector('#newPassword').value;
        const confirmNewPassword = modal.querySelector('#confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            this.showToast('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (this.users[this.currentUser].password !== currentPassword) {
            this.showToast('Senha atual incorreta.', 'error');
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

        this.users[this.currentUser].password = newPassword;
        this.closeModal();
        this.showToast('Senha alterada com sucesso!', 'success');
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

    saveProduct(modal, productId = null) {
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

        if (productId) {
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                this.products[productIndex] = { ...this.products[productIndex], ...productData };
            }
        } else {
            const newId = Math.max(...this.products.map(p => p.id)) + 1;
            this.products.push({ id: newId, ...productData });
        }

        this.closeModal();
        this.renderCardapio(document.getElementById('cardapioSection'));
        this.showToast(`Produto ${productId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    toggleProductStatus(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.active = !product.active;
            this.renderCardapio(document.getElementById('cardapioSection'));
            this.showToast(`Produto ${product.active ? 'ativado' : 'desativado'} com sucesso!`, 'success');
        }
    }

    deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && confirm(`Tem certeza que deseja excluir o produto ${product.name}?`)) {
            this.products = this.products.filter(p => p.id !== productId);
            this.renderCardapio(document.getElementById('cardapioSection'));
            this.showToast('Produto excluído com sucesso!', 'success');
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
}

// Inicializar o sistema
const sistema = new SistemaPedidos();

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

