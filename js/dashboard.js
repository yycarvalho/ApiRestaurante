/**
 * Gerenciador do Dashboard
 * Responsável por métricas, gráficos e visão geral do sistema
 */
class DashboardManager {
    constructor() {
        this.metrics = {};
        this.charts = {};
        this.container = null;
        this.isInitialized = false;
    }

    init() {
        this.container = document.getElementById('dashboardSection');
        if (this.container && !this.isInitialized) {
            this.render();
            this.isInitialized = true;
        }
    }

    // Renderizar estrutura do dashboard
    render() {
        this.container.innerHTML = `
            <div class="section-header">
                <h2>Dashboard</h2>
                <div class="header-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.DashboardManager.refresh()">
                        <i class="fas fa-sync-alt"></i>
                        Atualizar
                    </button>
                </div>
            </div>

            <div class="metrics-grid" id="metricsGrid">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Carregando métricas...
                </div>
            </div>

            <div class="charts-grid" id="chartsGrid">
                <!-- Gráficos serão carregados aqui -->
            </div>
        `;
        
        // Carregar dados automaticamente
        this.loadData();
    }

    // Carregar dados do dashboard
    async loadData() {
        try {
            debugLog('Carregando dados do dashboard...');
            
            // Buscar métricas da API
            const metrics = await window.API.getDashboardMetrics();
            this.metrics = metrics;
            
            // Renderizar métricas
            this.renderMetrics();
            
            // Renderizar gráficos
            this.renderCharts();
            
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            this.renderError();
        }
    }

    // Renderizar métricas
    renderMetrics() {
        const metricsGrid = document.getElementById('metricsGrid');
        if (!metricsGrid) return;

        const metricsData = [
            {
                title: 'Pedidos Hoje',
                value: this.metrics.totalPedidosHoje || 0,
                icon: 'fas fa-clipboard-list',
                color: 'var(--primary-color)'
            },
            {
                title: 'Faturamento Hoje',
                value: formatCurrency(this.metrics.valorTotalArrecadado || 0),
                icon: 'fas fa-dollar-sign',
                color: 'var(--success)'
            },
            {
                title: 'Pedidos em Preparo',
                value: this.metrics.pedidosPorStatus?.preparo || 0,
                icon: 'fas fa-fire',
                color: 'var(--warning)'
            },
            {
                title: 'Pedidos Finalizados',
                value: this.metrics.pedidosPorStatus?.finalizado || 0,
                icon: 'fas fa-check-circle',
                color: 'var(--success)'
            }
        ];

        metricsGrid.innerHTML = metricsData.map(metric => `
            <div class="metric-card">
                <div class="metric-header">
                    <i class="${metric.icon}" style="color: ${metric.color}"></i>
                    <h3>${metric.title}</h3>
                </div>
                <div class="value">${metric.value}</div>
                <div class="description">Atualizado agora</div>
            </div>
        `).join('');
    }

    // Renderizar gráficos
    renderCharts() {
        const chartsGrid = document.getElementById('chartsGrid');
        if (!chartsGrid) return;

        chartsGrid.innerHTML = `
            <div class="chart-container">
                <h3>Pedidos por Status</h3>
                <canvas id="statusChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Faturamento Mensal</h3>
                <canvas id="revenueChart"></canvas>
            </div>
        `;

        // Renderizar gráfico de status
        this.renderStatusChart();
        
        // Renderizar gráfico de faturamento
        this.renderRevenueChart();
    }

    // Gráfico de pedidos por status
    renderStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas || !this.metrics.pedidosPorStatus) return;

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const statusData = this.metrics.pedidosPorStatus;
        const labels = [];
        const data = [];
        const colors = [];

        CONFIG.ORDER_STATUSES.forEach(status => {
            if (statusData[status.id] > 0) {
                labels.push(status.name);
                data.push(statusData[status.id]);
                colors.push(status.color);
            }
        });

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de faturamento mensal
    renderRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas || !this.metrics.faturamentoMensal) return;

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const data = this.metrics.faturamentoMensal;

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data,
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(106, 90, 249, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'var(--primary-color)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Faturamento: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Renderizar erro
    renderError() {
        const metricsGrid = document.getElementById('metricsGrid');
        const chartsGrid = document.getElementById('chartsGrid');

        if (metricsGrid) {
            metricsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar métricas</h3>
                    <p>Não foi possível carregar os dados do dashboard.</p>
                    <button class="btn btn-primary" onclick="window.DashboardManager.refresh()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }

        if (chartsGrid) {
            chartsGrid.innerHTML = '';
        }
    }

    // Atualizar dashboard
    async refresh() {
        try {
            window.UI.showToast('Atualizando dashboard...', 'info');
            await this.loadData();
            window.UI.showToast('Dashboard atualizado!', 'success');
        } catch (error) {
            window.UI.showToast('Erro ao atualizar dashboard', 'error');
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

// CSS adicional para o dashboard
const dashboardCSS = `
.metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.metric-header i {
    font-size: 1.5rem;
}

.metric-header h3 {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.error-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 2rem;
    background: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

.error-state i {
    font-size: 3rem;
    color: var(--danger);
    margin-bottom: 1rem;
}

.error-state h3 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.error-state p {
    color: var(--text-light);
    margin-bottom: 1.5rem;
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = dashboardCSS;
document.head.appendChild(style);

// Instância global do gerenciador de dashboard
window.DashboardManager = null;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.DashboardManager = new DashboardManager();
});

// Se DOM já estiver carregado
if (document.readyState === 'loading') {
    // DOM ainda carregando
} else {
    // DOM já carregado
    window.DashboardManager = new DashboardManager();
}

