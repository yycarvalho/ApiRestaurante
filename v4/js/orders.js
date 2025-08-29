/**
 * Módulo de Pedidos - Gerencia UI e paginação de pedidos
 */
const Orders = (function() {
    'use strict';
    
    // Estado atual
    let currentPage = 1;
    let pageSize = 20;
    let currentStartDate = null;
    let currentEndDate = null;
    let currentStatus = null;
    let totalPages = 1;
    
    /**
     * Inicializa o módulo de pedidos
     */
    function init() {
        setupEventListeners();
        setDefaultDates();
        loadOrdersPage(1);
    }
    
    /**
     * Configura listeners de eventos
     */
    function setupEventListeners() {
        // Menu de pedidos
        const menuPedidos = document.querySelector('#menu-pedidos');
        if (menuPedidos) {
            menuPedidos.addEventListener('click', (e) => {
                e.preventDefault();
                loadOrdersPage(1);
            });
        }
        
        // Botões de paginação (serão criados dinamicamente)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) {
                    loadOrdersPage(page);
                }
            }
        });
        
        // Filtros de período
        const startDateInput = document.querySelector('#start-date');
        const endDateInput = document.querySelector('#end-date');
        const statusFilter = document.querySelector('#status-filter');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                currentStartDate = startDateInput.value;
                loadOrdersPage(1);
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                currentEndDate = endDateInput.value;
                loadOrdersPage(1);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                currentStatus = statusFilter.value || null;
                loadOrdersPage(1);
            });
        }
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (currentPage > 1) {
                        e.preventDefault();
                        loadOrdersPage(currentPage - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentPage < totalPages) {
                        e.preventDefault();
                        loadOrdersPage(currentPage + 1);
                    }
                    break;
            }
        });
        
        // Touch/swipe para mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && currentPage < totalPages) {
                    // Swipe left - próxima página
                    loadOrdersPage(currentPage + 1);
                } else if (diff < 0 && currentPage > 1) {
                    // Swipe right - página anterior
                    loadOrdersPage(currentPage - 1);
                }
            }
        }
    }
    
    /**
     * Define datas padrão (últimos 30 dias)
     */
    function setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        currentStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        currentEndDate = today.toISOString().split('T')[0];
        
        // Atualizar inputs se existirem
        const startInput = document.querySelector('#start-date');
        const endInput = document.querySelector('#end-date');
        
        if (startInput) startInput.value = currentStartDate;
        if (endInput) endInput.value = currentEndDate;
    }
    
    /**
     * Carrega página de pedidos
     */
    async function loadOrdersPage(page) {
        try {
            showLoading();
            
            const response = await API.fetchOrders({
                page: page,
                size: pageSize,
                start: currentStartDate,
                end: currentEndDate,
                status: currentStatus
            });
            
            currentPage = page;
            totalPages = response.meta.totalPages;
            
            renderOrders(response.data, response.meta);
            renderPagination(response.meta);
            
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            showError('Erro ao carregar pedidos. Tente novamente.');
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Renderiza lista de pedidos
     */
    function renderOrders(orders, meta) {
        const container = document.querySelector('#orders-container');
        if (!container) return;
        
        // Limpar container
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Não há pedidos no período selecionado.</p>
                </div>
            `;
            return;
        }
        
        // Renderizar pedidos
        orders.forEach(order => {
            const orderElement = createOrderElement(order);
            container.appendChild(orderElement);
        });
        
        // Atualizar informações de página
        updatePageInfo(meta);
    }
    
    /**
     * Cria elemento de pedido
     */
    function createOrderElement(order) {
        const div = document.createElement('div');
        div.className = 'order-card';
        div.dataset.orderId = order.id;
        
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        
        div.innerHTML = `
            <div class="order-header">
                <div class="order-id">#${order.id}</div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            <div class="order-body">
                <div class="order-customer">
                    <i class="fas fa-user"></i>
                    ${order.customer || 'Cliente não informado'}
                </div>
                <div class="order-total">
                    <i class="fas fa-dollar-sign"></i>
                    R$ ${order.total.toFixed(2)}
                </div>
                <div class="order-date">
                    <i class="fas fa-clock"></i>
                    ${formatDate(order.createdAt)}
                </div>
            </div>
            <div class="order-actions">
                <button class="btn btn-sm btn-primary" onclick="Orders.viewOrder('${order.id}')">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
                <button class="btn btn-sm btn-secondary" onclick="Orders.editOrder('${order.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Renderiza controles de paginação
     */
    function renderPagination(meta) {
        const container = document.querySelector('#pagination-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (meta.totalPages <= 1) return;
        
        const nav = document.createElement('nav');
        nav.className = 'pagination-nav';
        nav.setAttribute('aria-label', 'Navegação de páginas');
        
        // Botão anterior
        if (meta.page > 1) {
            nav.appendChild(createPaginationButton(meta.page - 1, '<i class="fas fa-chevron-left"></i>', 'Página anterior'));
        }
        
        // Números de página
        const startPage = Math.max(1, meta.page - 2);
        const endPage = Math.min(meta.totalPages, meta.page + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            nav.appendChild(createPaginationButton(i, i.toString(), `Página ${i}`, i === meta.page));
        }
        
        // Botão próximo
        if (meta.page < meta.totalPages) {
            nav.appendChild(createPaginationButton(meta.page + 1, '<i class="fas fa-chevron-right"></i>', 'Próxima página'));
        }
        
        container.appendChild(nav);
    }
    
    /**
     * Cria botão de paginação
     */
    function createPaginationButton(page, text, title, isActive = false) {
        const button = document.createElement('button');
        button.className = `pagination-btn ${isActive ? 'active' : ''}`;
        button.dataset.page = page;
        button.innerHTML = text;
        button.title = title;
        button.setAttribute('aria-label', title);
        
        if (isActive) {
            button.setAttribute('aria-current', 'page');
        }
        
        return button;
    }
    
    /**
     * Atualiza informações da página
     */
    function updatePageInfo(meta) {
        const info = document.querySelector('#page-info');
        if (info) {
            const start = ((meta.page - 1) * meta.size) + 1;
            const end = Math.min(meta.page * meta.size, meta.totalItems);
            
            info.textContent = `Mostrando ${start}-${end} de ${meta.totalItems} pedidos`;
        }
    }
    
    /**
     * Utilitários
     */
    function getStatusClass(status) {
        const statusMap = {
            'em_atendimento': 'status-em-atendimento',
            'aguardando_pagamento': 'status-aguardando-pagamento',
            'pedido_feito': 'status-pedido-feito',
            'cancelado': 'status-cancelado',
            'coletado': 'status-coletado',
            'pronto': 'status-pronto',
            'finalizado': 'status-finalizado'
        };
        
        return statusMap[status] || 'status-default';
    }
    
    function getStatusText(status) {
        const statusMap = {
            'em_atendimento': 'Em Atendimento',
            'aguardando_pagamento': 'Aguardando Pagamento',
            'pedido_feito': 'Pedido Feito',
            'cancelado': 'Cancelado',
            'coletado': 'Coletado',
            'pronto': 'Pronto',
            'finalizado': 'Finalizado'
        };
        
        return statusMap[status] || status;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }
    
    function showLoading() {
        const container = document.querySelector('#orders-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando pedidos...</p>
                </div>
            `;
        }
    }
    
    function hideLoading() {
        // O loading é removido quando renderOrders é chamado
    }
    
    function showError(message) {
        const container = document.querySelector('#orders-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="Orders.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    }
    
    /**
     * Ver detalhes do pedido
     */
    function viewOrder(orderId) {
        console.log('Ver pedido:', orderId);
        // TODO: Implementar modal de detalhes
    }
    
    /**
     * Editar pedido
     */
    function editOrder(orderId) {
        console.log('Editar pedido:', orderId);
        // TODO: Implementar modal de edição
    }
    
    /**
     * Recarregar página atual
     */
    function reload() {
        loadOrdersPage(currentPage);
    }
    
    // API pública
    return {
        init,
        loadOrdersPage,
        viewOrder,
        editOrder,
        reload
    };
})();