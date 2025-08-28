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
            document.getElementById('sectionTitle').textCo
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)