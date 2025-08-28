/**
 * Gerenciador de Pedidos
 * Responsável por listagem, criação, edição e gerenciamento de pedidos
 */
class PedidosManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.container = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.isInitialized = false;
    }

    init() {
        this.container = document.getElementById('pedidosSection');
        if (this.container && !this.isInitialized) {
            this.render();
            this.isInitialized = true;
        }
    }

    // Renderizar estrutura da seção de pedidos
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>Pedidos</h2>
                <div class="header-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.PedidosManager.refresh()">
                        <i class="fas fa-sync-alt"></i>
                        Atualizar
                    </button>
                    <button class="btn btn-primary" onclick="window.PedidosManager.showCreateModal()">
                        <i class="fas fa-plus"></i>
                        Novo Pedido
                    </button>
                </div>
            </div>

            <div class="orders-filters" id="ordersFilters">
                <!-- Filtros serão carregados aqui -->
            </div>

            <div class="orders-list" id="ordersList">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Carregando pedidos...
                </div>
            </div>
        `;
        
        // Carregar dados automaticamente
        this.loadData();
    }

    // Carregar dados dos pedidos
    async loadData() {
        try {
            debugLog('Carregando pedidos...');
            
            // Buscar pedidos da API
            this.orders = await window.API.getOrders();
            this.filteredOrders = [...this.orders];
            
            // Renderizar lista de pedidos
            this.renderOrdersList();
            
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            this.renderError();
        }
    }

    // Renderizar lista de pedidos
    renderOrdersList() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (this.orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Não há pedidos para exibir no momento.</p>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-status status-${order.status}">${order.status}</div>
                </div>
                <div class="order-details">
                    <div><strong>Cliente:</strong> ${order.customer}</div>
                    <div><strong>Telefone:</strong> ${order.phone}</div>
                    <div><strong>Tipo:</strong> ${order.type}</div>
                    <div><strong>Total:</strong> R$ ${order.total.toFixed(2)}</div>
                    <div><strong>Criado:</strong> ${formatDate(order.createdAt)}</div>
                </div>
                <div class="order-items">
                    <strong>Itens:</strong>
                    ${order.items.map(item => `
                        <div class="order-item">
                            ${item.quantity}x ${item.productName} - R$ ${item.price.toFixed(2)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Renderizar filtros
    renderFilters() {
        const filtersContainer = document.getElementById('ordersFilters');
        if (!filtersContainer) return;

        const statusCounts = this.getStatusCounts();

        filtersContainer.innerHTML = `
            <div class="filters-row">
                <div class="filter-buttons">
                    <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" 
                            onclick="window.PedidosManager.setFilter('all')">
                        Todos (${this.orders.length})
                    </button>
                    ${CONFIG.ORDER_STATUSES.map(status => `
                        <button class="filter-btn ${this.currentFilter === status.id ? 'active' : ''}" 
                                onclick="window.PedidosManager.setFilter('${status.id}')"
                                style="--status-color: ${status.color}">
                            ${status.name} (${statusCounts[status.id] || 0})
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Obter contagem por status
    getStatusCounts() {
        const counts = {};
        this.orders.forEach(order => {
            counts[order.status] = (counts[order.status] || 0) + 1;
        });
        return counts;
    }

    // Renderizar kanban board
    renderKanban() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (!kanbanBoard) return;

        // Agrupar pedidos por status
        const ordersByStatus = this.groupOrdersByStatus();

        kanbanBoard.innerHTML = CONFIG.ORDER_STATUSES.map(status => {
            const orders = ordersByStatus[status.id] || [];
            
            return `
                <div class="kanban-column" data-status="${status.id}">
                    <div class="column-header">
                        <div class="column-title" style="color: ${status.color}">
                            <i class="fas fa-circle"></i>
                            ${status.name}
                        </div>
                        <div class="column-count">${orders.length}</div>
                    </div>
                    <div class="order-cards" id="orders-${status.id}">
                        ${orders.map(order => this.renderOrderCard(order)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Agrupar pedidos por status
    groupOrdersByStatus() {
        const grouped = {};
        
        this.filteredOrders.forEach(order => {
            if (!grouped[order.status]) {
                grouped[order.status] = [];
            }
            grouped[order.status].push(order);
        });

        return grouped;
    }

    // Renderizar card do pedido
    renderOrderCard(order) {
        const orderType = getOrderType(order.type);
        const canViewValue = window.AuthManager.hasPermission('visualizarValorPedido');
        const canViewAddress = window.AuthManager.hasPermission('acessarEndereco');
        
        return `
            <div class="order-card" onclick="window.PedidosManager.showOrderDetails('${order.id}')">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-time">${formatRelativeDate(order.createdAt)}</div>
                </div>
                
                <div class="order-customer">${order.customer}</div>
                
                <div class="order-items">
                    ${this.getOrderItemsText(order.items)}
                </div>
                
                <div class="order-footer">
                    <div class="order-info">
                        ${canViewValue ? `<div class="order-total">${formatCurrency(order.total)}</div>` : ''}
                        <div class="order-type type-${order.type}">
                            <i class="${orderType.icon}"></i>
                            ${orderType.name}
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        ${this.renderOrderActions(order)}
                    </div>
                </div>
                
                ${canViewAddress && order.address ? `
                    <div class="order-address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${order.address}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Obter texto dos itens do pedido
    getOrderItemsText(items) {
        if (!items || items.length === 0) return 'Nenhum item';
        
        return items.map(item => {
            const product = this.getProductById(item.productId);
            const productName = product ? product.name : `Produto ${item.productId}`;
            return `${item.quantity}x ${productName}`;
        }).join(', ');
    }

    // Obter produto por ID (simulado)
    getProductById(productId) {
        // Em uma implementação real, isso viria da API ou cache
        const products = {
            1: { name: 'X-Burger Clássico' },
            2: { name: 'X-Bacon' },
            3: { name: 'Coca-Cola 350ml' },
            4: { name: 'Batata Frita' },
            5: { name: 'Milkshake de Chocolate' }
        };
        return products[productId];
    }

    // Renderizar ações do pedido
    renderOrderActions(order) {
        const canAlterStatus = window.AuthManager.hasPermission('alterarStatusPedido');
        const canPrint = window.AuthManager.hasPermission('imprimirPedido');
        
        let actions = '';
        
        if (canAlterStatus) {
            actions += `
                <button class="btn btn-sm btn-secondary" 
                        onclick="event.stopPropagation(); window.PedidosManager.showStatusModal('${order.id}')"
                        title="Alterar Status">
                    <i class="fas fa-edit"></i>
                </button>
            `;
        }
        
        if (canPrint) {
            actions += `
                <button class="btn btn-sm btn-secondary" 
                        onclick="event.stopPropagation(); window.PedidosManager.printOrder('${order.id}')"
                        title="Imprimir">
                    <i class="fas fa-print"></i>
                </button>
            `;
        }
        
        return actions;
    }

    // Definir filtro
    setFilter(filter) {
        this.currentFilter = filter;
        this.applyFilters();
        this.renderFilters();
        this.renderKanban();
    }

    // Aplicar filtros
    applyFilters() {
        this.filteredOrders = this.orders.filter(order => {
            // Filtro por status
            if (this.currentFilter !== 'all' && order.status !== this.currentFilter) {
                return false;
            }
            
            // Filtro por busca
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                return (
                    order.id.toLowerCase().includes(query) ||
                    order.customer.toLowerCase().includes(query) ||
                    (order.phone && order.phone.includes(query))
                );
            }
            
            return true;
        });
    }

    // Buscar pedidos
    async search(query) {
        this.searchQuery = query;
        this.applyFilters();
        this.renderKanban();
    }

    // Limpar busca
    async clearSearch() {
        this.searchQuery = '';
        this.applyFilters();
        this.renderKanban();
    }

    // Mostrar detalhes do pedido
    async showOrderDetails(orderId) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            const content = this.createOrderDetailsContent(order);
            
            window.UI.showModal({
                title: `Pedido #${order.id}`,
                content: content,
                size: 'lg'
            });
            
        } catch (error) {
            console.error('Erro ao mostrar detalhes do pedido:', error);
            window.UI.showToast('Erro ao carregar detalhes do pedido', 'error');
        }
    }

    // Criar conteúdo dos detalhes do pedido
    createOrderDetailsContent(order) {
        const orderType = getOrderType(order.type);
        const orderStatus = getOrderStatus(order.status);
        const canViewValue = window.AuthManager.hasPermission('visualizarValorPedido');
        const canViewAddress = window.AuthManager.hasPermission('acessarEndereco');
        const canViewChat = window.AuthManager.hasPermission('verChat');

        return `
            <div class="order-details">
                <div class="order-info-grid">
                    <div class="info-card">
                        <h4>Informações do Cliente</h4>
                        <p><strong>Nome:</strong> ${order.customer}</p>
                        <p><strong>Telefone:</strong> ${order.phone || 'Não informado'}</p>
                        <p><strong>Tipo:</strong> ${orderType.name}</p>
                        ${canViewAddress && order.address ? `<p><strong>Endereço:</strong> ${order.address}</p>` : ''}
                    </div>
                    
                    <div class="info-card">
                        <h4>Status do Pedido</h4>
                        <div class="status-badge" style="background-color: ${orderStatus.color}">
                            ${orderStatus.name}
                        </div>
                        <p><strong>Criado em:</strong> ${formatDate(order.createdAt)}</p>
                    </div>
                </div>
                
                <div class="order-items-detail">
                    <h4>Itens do Pedido</h4>
                    <div class="items-list">
                        ${order.items.map(item => {
                            const product = this.getProductById(item.productId);
                            return `
                                <div class="item-row">
                                    <span class="item-name">${product ? product.name : `Produto ${item.productId}`}</span>
                                    <span class="item-quantity">Qtd: ${item.quantity}</span>
                                    ${canViewValue ? `<span class="item-price">${formatCurrency(item.price * item.quantity)}</span>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${canViewValue ? `
                        <div class="order-total-detail">
                            <strong>Total: ${formatCurrency(order.total)}</strong>
                        </div>
                    ` : ''}
                </div>
                
                ${canViewChat && order.chat ? `
                    <div class="order-chat">
                        <h4>Histórico de Conversa</h4>
                        <div class="chat-messages">
                            ${order.chat.map(message => `
                                <div class="chat-message ${message.sender}">
                                    <div class="message-content">${message.message}</div>
                                    <div class="message-time">${formatDate(message.time)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Mostrar modal de alteração de status
    async showStatusModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const { form, footer } = window.UI.createForm([
            {
                type: 'select',
                name: 'status',
                label: 'Novo Status',
                required: true,
                value: order.status,
                options: CONFIG.ORDER_STATUSES.map(status => ({
                    value: status.id,
                    label: status.name
                }))
            }
        ], {
            submitText: 'Alterar Status',
            onSubmit: async (data) => {
                await this.updateOrderStatus(orderId, data.status);
                window.UI.closeModal();
            },
            onCancel: () => window.UI.closeModal()
        });

        window.UI.showModal({
            title: `Alterar Status - Pedido #${orderId}`,
            content: form,
            footer: footer
        });
    }

    // Atualizar status do pedido
    async updateOrderStatus(orderId, newStatus) {
        try {
            await window.API.updateOrderStatus(orderId, newStatus);
            
            // Atualizar localmente
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
            }
            
            // Re-renderizar
            this.applyFilters();
            this.renderFilters();
            this.renderKanban();
            
            window.UI.showToast('Status atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            window.UI.showToast('Erro ao atualizar status', 'error');
        }
    }

    // Mostrar modal de criação de pedido
    async showCreateModal() {
        // Implementação simplificada - em um sistema real seria mais complexo
        window.UI.showToast('Funcionalidade em desenvolvimento', 'info');
    }

    // Imprimir pedido
    async printOrder(orderId) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            // Criar conteúdo para impressão
            const printContent = this.createPrintContent(order);
            
            // Abrir janela de impressão
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Erro ao imprimir pedido:', error);
            window.UI.showToast('Erro ao imprimir pedido', 'error');
        }
    }

    // Criar conteúdo para impressão
    createPrintContent(order) {
        const orderType = getOrderType(order.type);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pedido #${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .order-info { margin-bottom: 20px; }
                    .items-table { width: 100%; border-collapse: collapse; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .total { text-align: right; font-weight: bold; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Sistema de Pedidos</h1>
                    <h2>Pedido #${order.id}</h2>
                </div>
                
                <div class="order-info">
                    <p><strong>Cliente:</strong> ${order.customer}</p>
                    <p><strong>Telefone:</strong> ${order.phone || 'Não informado'}</p>
                    <p><strong>Tipo:</strong> ${orderType.name}</p>
                    ${order.address ? `<p><strong>Endereço:</strong> ${order.address}</p>` : ''}
                    <p><strong>Data:</strong> ${formatDate(order.createdAt)}</p>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantidade</th>
                            <th>Preço Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => {
                            const product = this.getProductById(item.productId);
                            return `
                                <tr>
                                    <td>${product ? product.name : `Produto ${item.productId}`}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>Total: ${formatCurrency(order.total)}</p>
                </div>
            </body>
            </html>
        `;
    }

    // Renderizar erro
    renderError() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (kanbanBoard) {
            kanbanBoard.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar pedidos</h3>
                    <p>Não foi possível carregar a lista de pedidos.</p>
                    <button class="btn btn-primary" onclick="window.PedidosManager.refresh()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    // Atualizar lista de pedidos
    async refresh() {
        try {
            window.UI.showToast('Atualizando pedidos...', 'info');
            await this.loadData();
            window.UI.showToast('Pedidos atualizados!', 'success');
        } catch (error) {
            window.UI.showToast('Erro ao atualizar pedidos', 'error');
        }
    }
}

// CSS adicional para pedidos
const pedidosCSS = `
.orders-filters {
    margin-bottom: 2rem;
}

.filters-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.filter-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    background: var(--white);
    color: var(--text-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.875rem;
}

.filter-btn:hover {
    background: var(--background-secondary);
}

.filter-btn.active {
    background: var(--status-color, var(--primary-color));
    color: white;
    border-color: var(--status-color, var(--primary-color));
}

.order-address {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-light);
    font-size: 0.875rem;
    color: var(--text-light);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.order-details {
    max-width: 100%;
}

.order-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.info-card {
    background: var(--background-secondary);
    padding: 1.5rem;
    border-radius: var(--radius-md);
}

.info-card h4 {
    margin-bottom: 1rem;
    color: var(--text-color);
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    color: white;
    font-weight: 600;
    margin-bottom: 1rem;
}

.order-items-detail {
    margin-bottom: 2rem;
}

.items-list {
    background: var(--background-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.item-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.item-row:last-child {
    border-bottom: none;
}

.order-total-detail {
    text-align: right;
    padding: 1rem;
    background: var(--background-secondary);
    border-radius: var(--radius-md);
    margin-top: 1rem;
}

.order-chat {
    background: var(--background-secondary);
    border-radius: var(--radius-md);
    padding: 1.5rem;
}

.chat-messages {
    max-height: 300px;
    overflow-y: auto;
}

.chat-message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: var(--radius-md);
}

.chat-message.customer {
    background: var(--primary-color);
    color: white;
    margin-left: 2rem;
}

.chat-message.system {
    background: var(--white);
    border: 1px solid var(--border-color);
    margin-right: 2rem;
}

.message-time {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
}

@media (max-width: 768px) {
    .order-info-grid {
        grid-template-columns: 1fr;
    }
    
    .item-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
    
    .chat-message.customer {
        margin-left: 1rem;
    }
    
    .chat-message.system {
        margin-right: 1rem;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = pedidosCSS;
document.head.appendChild(style);

// Instância global do gerenciador de pedidos
window.PedidosManager = null;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.PedidosManager = new PedidosManager();
});

// Se DOM já estiver carregado
if (document.readyState === 'loading') {
    // DOM ainda carregando
} else {
    // DOM já carregado
    window.PedidosManager = new PedidosManager();
}

