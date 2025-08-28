/**
 * Aplicação Principal
 * Ponto de entrada e coordenação de todos os módulos
 */
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.modules = {};
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            debugLog('Inicializando aplicação...');
            
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                this.start();
            }
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.handleInitError(error);
        }
    }

    async start() {
        try {
            // Inicializar módulos principais
            await this.initializeModules();
            
            // Configurar navegação
            this.setupNavigation();
            
            // Configurar busca
            this.setupSearch();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            debugLog('Aplicação inicializada com sucesso');
            
        } catch (error) {
            console.error('Erro ao iniciar aplicação:', error);
            this.handleInitError(error);
        }
    }

    async initializeModules() {
        debugLog('Inicializando módulos...');
        
        // Aguardar módulos essenciais estarem disponíveis
        await this.waitForModules(['UI', 'API', 'AuthManager']);
        
        // Aguardar um pouco para garantir que os módulos específicos sejam carregados
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Inicializar módulos específicos das seções se ainda não existirem
        if (typeof DashboardManager !== 'undefined') {
            window.DashboardManager = new DashboardManager();
            window.DashboardManager.init();
        }
        if (typeof PedidosManager !== 'undefined') {
            window.PedidosManager = new PedidosManager();
            window.PedidosManager.init();
        }
        if (typeof CardapioManager !== 'undefined') {
            window.CardapioManager = new CardapioManager();
            window.CardapioManager.init();
        }
        if (typeof RelatoriosManager !== 'undefined') {
            window.RelatoriosManager = new RelatoriosManager();
            window.RelatoriosManager.init();
        }
        if (typeof PerfisManager !== 'undefined') {
            window.PerfisManager = new PerfisManager();
            window.PerfisManager.init();
        }
        
        // Referenciar módulos
        this.modules = {
            dashboard: window.DashboardManager || null,
            pedidos: window.PedidosManager || null,
            cardapio: window.CardapioManager || null,
            relatorios: window.RelatoriosManager || null,
            perfis: window.PerfisManager || null
        };
        
        debugLog('Módulos inicializados:', Object.keys(this.modules).filter(key => this.modules[key] !== null));
    }

    async waitForModules(moduleNames, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const allLoaded = moduleNames.every(name => window[name] !== undefined);
            if (allLoaded) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const missingModules = moduleNames.filter(name => window[name] === undefined);
        throw new Error(`Módulos não carregados: ${missingModules.join(', ')}`);
    }

    setupNavigation() {
        debugLog('Configurando navegação...');
        
        // Event listeners para itens de navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });
        
        // Criar objeto de navegação global
        window.Navigation = {
            navigateToSection: (section) => this.navigateToSection(section),
            getCurrentSection: () => this.currentSection
        };
    }

    setupSearch() {
        debugLog('Configurando busca...');
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Debounce para evitar muitas requisições
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
    }

    async navigateToSection(section) {
        try {
            debugLog(`Navegando para seção: ${section}`);
            
            // Verificar permissão
            if (!this.hasPermissionForSection(section)) {
                window.UI.showToast('Você não tem permissão para acessar esta seção', 'error');
                return;
            }
            
            // Atualizar navegação visual
            this.updateNavigationUI(section);
            
            // Atualizar título da seção
            this.updateSectionTitle(section);
            
            // Mostrar seção correspondente
            this.showSection(section);
            
            // Carregar dados da seção
            await this.loadSectionData(section);
            
            // Atualizar seção atual
            this.currentSection = section;
            
        } catch (error) {
            console.error(`Erro ao navegar para seção ${section}:`, error);
            window.UI.showToast('Erro ao carregar seção', 'error');
        }
    }

    hasPermissionForSection(section) {
        if (!window.AuthManager || !window.AuthManager.isAuthenticated) {
            return false;
        }
        
        return window.AuthManager.hasPermissionForSection(section);
    }

    updateNavigationUI(section) {
        // Atualizar itens de navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.section === section) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
            } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            }
        });
    }

    updateSectionTitle(section) {
        const titleElement = document.getElementById('sectionTitle');
        if (titleElement) {
            const titles = {
                dashboard: 'Dashboard',
                pedidos: 'Pedidos',
                cardapio: 'Cardápio',
                relatorios: 'Relatórios',
                perfis: 'Perfis'
            };
            
            titleElement.textContent = titles[section] || 'Sistema';
        }
    }

    showSection(section) {
        // Esconder todas as seções
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Mostrar seção atual
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
    }

    async loadSectionData(section) {
        const module = this.modules[section];
        
        if (module && typeof module.loadData === 'function') {
            try {
                await module.loadData();
            } catch (error) {
                console.error(`Erro ao carregar dados da seção ${section}:`, error);
                // Não mostrar toast aqui para evitar spam de erros
            }
        }
    }

    async handleSearch(query) {
        try {
            debugLog(`Buscando: ${query}`);
            
            // Buscar apenas se houver query e estiver na seção de pedidos
            if (query.trim() && this.currentSection === 'pedidos') {
                const pedidosModule = this.modules.pedidos;
                if (pedidosModule && typeof pedidosModule.search === 'function') {
                    await pedidosModule.search(query);
                }
            } else if (!query.trim() && this.currentSection === 'pedidos') {
                // Limpar busca
                const pedidosModule = this.modules.pedidos;
                if (pedidosModule && typeof pedidosModule.clearSearch === 'function') {
                    await pedidosModule.clearSearch();
                }
            }
            
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }

    handleInitError(error) {
        // Mostrar erro de inicialização para o usuário
        const errorMessage = document.createElement('div');
        errorMessage.className = 'init-error';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h2>Erro ao carregar aplicação</h2>
                <p>Ocorreu um erro ao inicializar o sistema. Por favor, recarregue a página.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
        
        // Adicionar estilos de erro
        const errorStyles = `
            .init-error {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--background-color);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .error-content {
                text-align: center;
                padding: 2rem;
                background: var(--white);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg);
                max-width: 400px;
            }
            
            .error-content h2 {
                color: var(--danger);
                margin-bottom: 1rem;
            }
            
            .error-content p {
                color: var(--text-light);
                margin-bottom: 1.5rem;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = errorStyles;
        document.head.appendChild(style);
        
        document.body.appendChild(errorMessage);
    }

    // Métodos utilitários
    getModule(name) {
        return this.modules[name];
    }

    isReady() {
        return this.isInitialized;
    }

    getCurrentSection() {
        return this.currentSection;
    }

    // Método para recarregar dados da seção atual
    async refreshCurrentSection() {
        if (this.currentSection) {
            await this.loadSectionData(this.currentSection);
        }
    }

    // Método para registrar módulo dinamicamente
    registerModule(name, module) {
        this.modules[name] = module;
        debugLog(`Módulo ${name} registrado`);
    }
}

// Event listener para quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar aplicação
    window.App = new App();
});

// Exportar para uso global
window.App = window.App || null;

