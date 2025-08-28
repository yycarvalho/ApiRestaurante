/**
 * Gerenciador de Relatórios
 * Responsável por geração e visualização de relatórios e análises
 */
class RelatoriosManager {
    constructor() {
        this.reports = {};
        this.charts = {};
        this.container = null;
        this.currentPeriod = 'month';
        this.init();
    }

    init() {
        this.container = document.getElementById('relatoriosSection');
        if (this.container) {
            this.render();
        }
    }

    // Renderizar estrutura da seção de relatórios
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>Relatórios</h2>
                <div class="header-actions">
                    <select id="periodSelect" class="period-select" onchange="window.RelatoriosManager.changePeriod(this.value)">
                        <option value="week">Última Semana</option>
                        <option value="month" selected>Último Mês</option>
                        <option value="quarter">Último Trimestre</option>
                        <option value="year">Último Ano</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="window.RelatoriosManager.refresh()">
                        <i class="fas fa-sync-alt"></i>
                        Atualizar
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.RelatoriosManager.exportReport()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </div>

            <div class="reports-summary" id="reportsSummary">
                <!-- Resumo dos relatórios será carregado aqui -->
            </div>

            <div class="reports-charts" id="reportsCharts">
                <!-- Gráficos dos relatórios serão carregados aqui -->
            </div>

            <div class="reports-tables" id="reportsTables">
                <!-- Tabelas dos relatórios serão carregadas aqui -->
            </div>
        `;
    }

    // Carregar dados dos relatórios
    async loadData() {
        try {
            debugLog('Carregando relatórios...');
            
            // Buscar dados dos relatórios da API
            const filters = { period: this.currentPeriod };
            this.reports = await window.API.getReports(filters);
            
            // Renderizar componentes
            this.renderSummary();
            this.renderCharts();
            this.renderTables();
            
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            this.renderError();
        }
    }

    // Renderizar resumo dos relatórios
    renderSummary() {
        const summaryContainer = document.getElementById('reportsSummary');
        if (!summaryContainer) return;

        const summaryData = [
            {
                title: 'Total de Pedidos',
                value: this.reports.totalPedidos || 0,
                change: this.reports.pedidosChange || 0,
                icon: 'fas fa-clipboard-list',
                color: 'var(--primary-color)'
            },
            {
                title: 'Faturamento Total',
                value: formatCurrency(this.reports.faturamentoTotal || 0),
                change: this.reports.faturamentoChange || 0,
                icon: 'fas fa-dollar-sign',
                color: 'var(--success)'
            },
            {
                title: 'Ticket Médio',
                value: formatCurrency(this.reports.ticketMedio || 0),
                change: this.reports.ticketMedioChange || 0,
                icon: 'fas fa-chart-line',
                color: 'var(--info)'
            },
            {
                title: 'Taxa de Conversão',
                value: `${(this.reports.taxaConversao || 0).toFixed(1)}%`,
                change: this.reports.conversaoChange || 0,
                icon: 'fas fa-percentage',
                color: 'var(--warning)'
            }
        ];

        summaryContainer.innerHTML = `
            <div class="summary-grid">
                ${summaryData.map(item => `
                    <div class="summary-card">
                        <div class="summary-header">
                            <i class="${item.icon}" style="color: ${item.color}"></i>
                            <h3>${item.title}</h3>
                        </div>
                        <div class="summary-value">${item.value}</div>
                        <div class="summary-change ${item.change >= 0 ? 'positive' : 'negative'}">
                            <i class="fas ${item.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                            ${Math.abs(item.change).toFixed(1)}% vs período anterior
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Renderizar gráficos
    renderCharts() {
        const chartsContainer = document.getElementById('reportsCharts');
        if (!chartsContainer) return;

        chartsContainer.innerHTML = `
            <div class="charts-row">
                <div class="chart-container">
                    <h3>Vendas por Período</h3>
                    <canvas id="salesChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Produtos Mais Vendidos</h3>
                    <canvas id="productsChart"></canvas>
                </div>
            </div>
            <div class="charts-row">
                <div class="chart-container">
                    <h3>Horários de Pico</h3>
                    <canvas id="hoursChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Tipos de Pedido</h3>
                    <canvas id="typesChart"></canvas>
                </div>
            </div>
        `;

        // Renderizar gráficos individuais
        this.renderSalesChart();
        this.renderProductsChart();
        this.renderHoursChart();
        this.renderTypesChart();
    }

    // Gráfico de vendas por período
    renderSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas || !this.reports.vendasPorPeriodo) return;

        const ctx = canvas.getContext('2d');
        
        if (this.charts.sales) {
            this.charts.sales.destroy();
        }

        const data = this.reports.vendasPorPeriodo;
        
        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Vendas',
                    data: data.values || [],
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(106, 90, 249, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de produtos mais vendidos
    renderProductsChart() {
        const canvas = document.getElementById('productsChart');
        if (!canvas || !this.reports.produtosMaisVendidos) return;

        const ctx = canvas.getContext('2d');
        
        if (this.charts.products) {
            this.charts.products.destroy();
        }

        const data = this.reports.produtosMaisVendidos;
        
        this.charts.products = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: data.values || [],
                    backgroundColor: [
                        'var(--primary-color)',
                        'var(--success)',
                        'var(--warning)',
                        'var(--info)',
                        'var(--danger)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Gráfico de horários de pico
    renderHoursChart() {
        const canvas = document.getElementById('hoursChart');
        if (!canvas || !this.reports.horariosPico) return;

        const ctx = canvas.getContext('2d');
        
        if (this.charts.hours) {
            this.charts.hours.destroy();
        }

        const data = this.reports.horariosPico;
        
        this.charts.hours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Pedidos por Hora',
                    data: data.values || [],
                    backgroundColor: 'var(--info)',
                    borderColor: 'var(--info)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Gráfico de tipos de pedido
    renderTypesChart() {
        const canvas = document.getElementById('typesChart');
        if (!canvas || !this.reports.tiposPedido) return;

        const ctx = canvas.getContext('2d');
        
        if (this.charts.types) {
            this.charts.types.destroy();
        }

        const data = this.reports.tiposPedido;
        
        this.charts.types = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        'var(--primary-color)',
                        'var(--success)',
                        'var(--warning)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Renderizar tabelas
    renderTables() {
        const tablesContainer = document.getElementById('reportsTables');
        if (!tablesContainer) return;

        tablesContainer.innerHTML = `
            <div class="tables-section">
                <div class="table-container">
                    <h3>Top 10 Produtos</h3>
                    <div class="table-wrapper">
                        <table class="reports-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Faturamento</th>
                                    <th>% do Total</th>
                                </tr>
                            </thead>
                            <tbody id="topProductsTable">
                                ${this.renderTopProductsTable()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="table-container">
                    <h3>Resumo por Categoria</h3>
                    <div class="table-wrapper">
                        <table class="reports-table">
                            <thead>
                                <tr>
                                    <th>Categoria</th>
                                    <th>Pedidos</th>
                                    <th>Faturamento</th>
                                    <th>Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody id="categoriesTable">
                                ${this.renderCategoriesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar tabela de top produtos
    renderTopProductsTable() {
        if (!this.reports.topProdutos) return '<tr><td colspan="4">Nenhum dado disponível</td></tr>';

        return this.reports.topProdutos.map(product => `
            <tr>
                <td>${product.nome}</td>
                <td>${product.quantidade}</td>
                <td>${formatCurrency(product.faturamento)}</td>
                <td>${product.percentual.toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    // Renderizar tabela de categorias
    renderCategoriesTable() {
        if (!this.reports.resumoPorCategoria) return '<tr><td colspan="4">Nenhum dado disponível</td></tr>';

        return this.reports.resumoPorCategoria.map(category => `
            <tr>
                <td>${category.categoria}</td>
                <td>${category.pedidos}</td>
                <td>${formatCurrency(category.faturamento)}</td>
                <td>${formatCurrency(category.ticketMedio)}</td>
            </tr>
        `).join('');
    }

    // Alterar período
    async changePeriod(period) {
        this.currentPeriod = period;
        await this.loadData();
    }

    // Exportar relatório
    async exportReport() {
        try {
            window.UI.showToast('Preparando relatório para exportação...', 'info');
            
            // Criar conteúdo do relatório
            const reportContent = this.generateReportContent();
            
            // Criar e baixar arquivo
            const blob = new Blob([reportContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-${this.currentPeriod}-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            window.UI.showToast('Relatório exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            window.UI.showToast('Erro ao exportar relatório', 'error');
        }
    }

    // Gerar conteúdo do relatório para exportação
    generateReportContent() {
        const periodNames = {
            week: 'Última Semana',
            month: 'Último Mês',
            quarter: 'Último Trimestre',
            year: 'Último Ano'
        };

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório - ${periodNames[this.currentPeriod]}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relatório de Vendas</h1>
                    <h2>${periodNames[this.currentPeriod]}</h2>
                    <p>Gerado em: ${formatDate(new Date())}</p>
                </div>
                
                <div class="summary">
                    <div class="summary-card">
                        <h3>Total de Pedidos</h3>
                        <p>${this.reports.totalPedidos || 0}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Faturamento Total</h3>
                        <p>${formatCurrency(this.reports.faturamentoTotal || 0)}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Ticket Médio</h3>
                        <p>${formatCurrency(this.reports.ticketMedio || 0)}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Taxa de Conversão</h3>
                        <p>${(this.reports.taxaConversao || 0).toFixed(1)}%</p>
                    </div>
                </div>
                
                <h3>Top 10 Produtos</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Faturamento</th>
                            <th>% do Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderTopProductsTable()}
                    </tbody>
                </table>
                
                <h3>Resumo por Categoria</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th>Pedidos</th>
                            <th>Faturamento</th>
                            <th>Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderCategoriesTable()}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    // Renderizar erro
    renderError() {
        const summaryContainer = document.getElementById('reportsSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar relatórios</h3>
                    <p>Não foi possível carregar os dados dos relatórios.</p>
                    <button class="btn btn-primary" onclick="window.RelatoriosManager.refresh()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    // Atualizar relatórios
    async refresh() {
        try {
            window.UI.showToast('Atualizando relatórios...', 'info');
            await this.loadData();
            window.UI.showToast('Relatórios atualizados!', 'success');
        } catch (error) {
            window.UI.showToast('Erro ao atualizar relatórios', 'error');
        }
    }

    // Destruir gráficos ao sair da seção
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// CSS adicional para relatórios
const relatoriosCSS = `
.period-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--white);
    color: var(--text-color);
    font-size: 0.875rem;
    cursor: pointer;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    border-left: 4px solid var(--primary-color);
}

.summary-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.summary-header i {
    font-size: 1.5rem;
}

.summary-header h3 {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.summary-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.summary-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.summary-change.positive {
    color: var(--success);
}

.summary-change.negative {
    color: var(--danger);
}

.charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.tables-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.table-container {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.table-container h3 {
    margin-bottom: 1rem;
    color: var(--text-color);
}

.table-wrapper {
    overflow-x: auto;
}

.reports-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.reports-table th {
    background: var(--background-secondary);
    color: var(--text-color);
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 2px solid var(--border-color);
}

.reports-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-light);
}

.reports-table tr:hover {
    background: var(--background-secondary);
}

@media (max-width: 768px) {
    .charts-row {
        grid-template-columns: 1fr;
    }
    
    .tables-section {
        grid-template-columns: 1fr;
    }
    
    .summary-grid {
        grid-template-columns: 1fr;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = relatoriosCSS;
document.head.appendChild(style);

// Instância global do gerenciador de relatórios
window.RelatoriosManager = new RelatoriosManager();

