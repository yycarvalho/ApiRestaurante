/**
 * Gerenciador do Cardápio
 * Responsável por listagem, criação, edição e gerenciamento de produtos
 */
class CardapioManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.container = null;
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.container = document.getElementById('cardapioSection');
        if (this.container) {
            this.render();
        }
    }

    // Renderizar estrutura da seção de cardápio
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>Cardápio</h2>
                <div class="header-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.CardapioManager.refresh()">
                        <i class="fas fa-sync-alt"></i>
                        Atualizar
                    </button>
                    ${window.AuthManager.hasPermission('criarEditarProduto') ? `
                        <button class="btn btn-primary" onclick="window.CardapioManager.showCreateModal()">
                            <i class="fas fa-plus"></i>
                            Novo Produto
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="cardapio-filters" id="cardapioFilters">
                <!-- Filtros serão carregados aqui -->
            </div>

            <div class="products-grid" id="productsGrid">
                <!-- Produtos serão carregados aqui -->
            </div>
        `;
    }

    // Carregar dados dos produtos
    async loadData() {
        try {
            debugLog('Carregando produtos...');
            
            // Buscar produtos da API
            this.products = await window.API.getProducts();
            this.filteredProducts = [...this.products];
            
            // Renderizar filtros
            this.renderFilters();
            
            // Renderizar produtos
            this.renderProducts();
            
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.renderError();
        }
    }

    // Renderizar filtros de categoria
    renderFilters() {
        const filtersContainer = document.getElementById('cardapioFilters');
        if (!filtersContainer) return;

        const categoryCounts = this.getCategoryCounts();

        filtersContainer.innerHTML = `
            <div class="category-filters">
                <button class="category-btn ${this.currentCategory === 'all' ? 'active' : ''}" 
                        onclick="window.CardapioManager.setCategory('all')">
                    <i class="fas fa-th-large"></i>
                    Todos (${this.products.length})
                </button>
                ${CONFIG.PRODUCT_CATEGORIES.map(category => `
                    <button class="category-btn ${this.currentCategory === category.id ? 'active' : ''}" 
                            onclick="window.CardapioManager.setCategory('${category.id}')">
                        <i class="${category.icon}"></i>
                        ${category.name} (${categoryCounts[category.id] || 0})
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Obter contagem por categoria
    getCategoryCounts() {
        const counts = {};
        this.products.forEach(product => {
            counts[product.category] = (counts[product.category] || 0) + 1;
        });
        return counts;
    }

    // Renderizar grid de produtos
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Não há produtos nesta categoria.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => 
            this.renderProductCard(product)
        ).join('');
    }

    // Renderizar card do produto
    renderProductCard(product) {
        const category = getProductCategory(product.category);
        const canEdit = window.AuthManager.hasPermission('criarEditarProduto');
        const canDelete = window.AuthManager.hasPermission('excluirProduto');
        const canToggleStatus = window.AuthManager.hasPermission('desativarProduto');

        return `
            <div class="product-card ${!product.active ? 'inactive' : ''}">
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                </div>
                
                <div class="product-description">${product.description}</div>
                
                <div class="product-footer">
                    <div class="product-category">
                        <i class="${category.icon}"></i>
                        ${category.name}
                    </div>
                    <div class="product-status status-${product.active ? 'active' : 'inactive'}">
                        ${product.active ? 'Ativo' : 'Inativo'}
                    </div>
                </div>
                
                <div class="product-actions">
                    ${canEdit ? `
                        <button class="btn btn-sm btn-secondary" 
                                onclick="window.CardapioManager.showEditModal(${product.id})"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    
                    ${canToggleStatus ? `
                        <button class="btn btn-sm ${product.active ? 'btn-warning' : 'btn-success'}" 
                                onclick="window.CardapioManager.toggleProductStatus(${product.id})"
                                title="${product.active ? 'Desativar' : 'Ativar'}">
                            <i class="fas ${product.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    ` : ''}
                    
                    ${canDelete ? `
                        <button class="btn btn-sm btn-danger" 
                                onclick="window.CardapioManager.deleteProduct(${product.id})"
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Definir categoria
    setCategory(category) {
        this.currentCategory = category;
        this.applyFilters();
        this.renderFilters();
        this.renderProducts();
    }

    // Aplicar filtros
    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            if (this.currentCategory !== 'all' && product.category !== this.currentCategory) {
                return false;
            }
            return true;
        });
    }

    // Mostrar modal de criação de produto
    async showCreateModal() {
        const { form, footer } = window.UI.createForm([
            {
                type: 'text',
                name: 'name',
                label: 'Nome do Produto',
                required: true,
                placeholder: 'Ex: X-Burger Especial'
            },
            {
                type: 'textarea',
                name: 'description',
                label: 'Descrição',
                required: true,
                placeholder: 'Descreva os ingredientes e características do produto'
            },
            {
                type: 'number',
                name: 'price',
                label: 'Preço (R$)',
                required: true,
                placeholder: '0.00'
            },
            {
                type: 'select',
                name: 'category',
                label: 'Categoria',
                required: true,
                options: CONFIG.PRODUCT_CATEGORIES.map(cat => ({
                    value: cat.id,
                    label: cat.name
                }))
            }
        ], {
            submitText: 'Criar Produto',
            onSubmit: async (data) => {
                await this.createProduct(data);
                window.UI.closeModal();
            },
            onCancel: () => window.UI.closeModal()
        });

        window.UI.showModal({
            title: 'Novo Produto',
            content: form,
            footer: footer
        });
    }

    // Mostrar modal de edição de produto
    async showEditModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const { form, footer } = window.UI.createForm([
            {
                type: 'text',
                name: 'name',
                label: 'Nome do Produto',
                required: true,
                value: product.name
            },
            {
                type: 'textarea',
                name: 'description',
                label: 'Descrição',
                required: true,
                value: product.description
            },
            {
                type: 'number',
                name: 'price',
                label: 'Preço (R$)',
                required: true,
                value: product.price.toString()
            },
            {
                type: 'select',
                name: 'category',
                label: 'Categoria',
                required: true,
                value: product.category,
                options: CONFIG.PRODUCT_CATEGORIES.map(cat => ({
                    value: cat.id,
                    label: cat.name
                }))
            }
        ], {
            submitText: 'Salvar Alterações',
            onSubmit: async (data) => {
                await this.updateProduct(productId, data);
                window.UI.closeModal();
            },
            onCancel: () => window.UI.closeModal()
        });

        window.UI.showModal({
            title: `Editar Produto - ${product.name}`,
            content: form,
            footer: footer
        });
    }

    // Criar produto
    async createProduct(productData) {
        try {
            // Validar dados
            if (!this.validateProductData(productData)) {
                return;
            }

            // Converter preço para número
            productData.price = parseFloat(productData.price);
            productData.active = true;

            // Criar via API
            const newProduct = await window.API.createProduct(productData);
            
            // Adicionar à lista local
            this.products.push(newProduct);
            
            // Re-renderizar
            this.applyFilters();
            this.renderFilters();
            this.renderProducts();
            
            window.UI.showToast('Produto criado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            window.UI.showToast('Erro ao criar produto', 'error');
        }
    }

    // Atualizar produto
    async updateProduct(productId, productData) {
        try {
            // Validar dados
            if (!this.validateProductData(productData)) {
                return;
            }

            // Converter preço para número
            productData.price = parseFloat(productData.price);

            // Atualizar via API
            const updatedProduct = await window.API.updateProduct(productId, productData);
            
            // Atualizar na lista local
            const index = this.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...updatedProduct };
            }
            
            // Re-renderizar
            this.applyFilters();
            this.renderProducts();
            
            window.UI.showToast('Produto atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            window.UI.showToast('Erro ao atualizar produto', 'error');
        }
    }

    // Alternar status do produto
    async toggleProductStatus(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            const newStatus = !product.active;
            const action = newStatus ? 'ativar' : 'desativar';
            
            const confirmed = await window.UI.showConfirmation(
                `Tem certeza que deseja ${action} o produto "${product.name}"?`,
                {
                    title: 'Confirmar Ação',
                    confirmText: newStatus ? 'Ativar' : 'Desativar',
                    type: newStatus ? 'success' : 'warning'
                }
            );

            if (!confirmed) return;

            // Atualizar via API
            await window.API.updateProduct(productId, { active: newStatus });
            
            // Atualizar localmente
            product.active = newStatus;
            
            // Re-renderizar
            this.renderProducts();
            
            window.UI.showToast(`Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao alterar status do produto:', error);
            window.UI.showToast('Erro ao alterar status do produto', 'error');
        }
    }

    // Excluir produto
    async deleteProduct(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            const confirmed = await window.UI.showConfirmation(
                `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
                {
                    title: 'Confirmar Exclusão',
                    confirmText: 'Excluir',
                    type: 'danger'
                }
            );

            if (!confirmed) return;

            // Excluir via API
            await window.API.deleteProduct(productId);
            
            // Remover da lista local
            this.products = this.products.filter(p => p.id !== productId);
            
            // Re-renderizar
            this.applyFilters();
            this.renderFilters();
            this.renderProducts();
            
            window.UI.showToast('Produto excluído com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            window.UI.showToast('Erro ao excluir produto', 'error');
        }
    }

    // Validar dados do produto
    validateProductData(data) {
        // Validar nome
        if (!data.name || data.name.trim().length === 0) {
            window.UI.showFieldError('name', 'Nome é obrigatório');
            return false;
        }

        // Validar descrição
        if (!data.description || data.description.trim().length === 0) {
            window.UI.showFieldError('description', 'Descrição é obrigatória');
            return false;
        }

        // Validar preço
        const price = parseFloat(data.price);
        if (isNaN(price) || price <= 0) {
            window.UI.showFieldError('price', 'Preço deve ser um valor válido maior que zero');
            return false;
        }

        // Validar categoria
        if (!data.category) {
            window.UI.showFieldError('category', 'Categoria é obrigatória');
            return false;
        }

        return true;
    }

    // Renderizar erro
    renderError() {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar produtos</h3>
                    <p>Não foi possível carregar o cardápio.</p>
                    <button class="btn btn-primary" onclick="window.CardapioManager.refresh()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    // Atualizar lista de produtos
    async refresh() {
        try {
            window.UI.showToast('Atualizando cardápio...', 'info');
            await this.loadData();
            window.UI.showToast('Cardápio atualizado!', 'success');
        } catch (error) {
            window.UI.showToast('Erro ao atualizar cardápio', 'error');
        }
    }
}

// CSS adicional para cardápio
const cardapioCSS = `
.cardapio-filters {
    margin-bottom: 2rem;
}

.category-filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.category-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--border-color);
    background: var(--white);
    color: var(--text-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.875rem;
    font-weight: 500;
}

.category-btn:hover {
    background: var(--background-secondary);
    transform: translateY(-1px);
}

.category-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
}

.product-card.inactive {
    opacity: 0.6;
    background: var(--background-secondary);
}

.product-card.inactive .product-name {
    text-decoration: line-through;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    background: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

.empty-state i {
    font-size: 4rem;
    color: var(--text-light);
    margin-bottom: 1.5rem;
}

.empty-state h3 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
}

.empty-state p {
    color: var(--text-light);
    font-size: 1rem;
}

@media (max-width: 768px) {
    .category-filters {
        justify-content: center;
    }
    
    .category-btn {
        flex: 1;
        min-width: 120px;
        justify-content: center;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = cardapioCSS;
document.head.appendChild(style);

// Instância global do gerenciador de cardápio
window.CardapioManager = new CardapioManager();

