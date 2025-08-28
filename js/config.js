/**
 * Configurações da aplicação
 */
const CONFIG = {
    // URL base da API - Configuração para produção
    API_BASE_URL: window.location.hostname === 'localhost' ? 
        'http://localhost:8080/api' : 
        `http://localhost:8080/api`,
    
    // Endpoints da API
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
            UPDATE: '/orders',
            DELETE: '/orders',
            UPDATE_STATUS: '/orders/{id}/status',
            CHAT: '/orders/chat'
        },
        METRICS: {
            DASHBOARD: '/metrics/dashboard',
            REPORTS: '/metrics/reports'
        }
    },
    
    // Configurações de timeout
    TIMEOUTS: {
        REQUEST: 30000, // 30 segundos
        TOAST: 5000,    // 5 segundos
        RETRY: 3        // 3 tentativas
    },
    
    // Configurações de paginação
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    
    // Configurações de validação
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 3,
        MAX_USERNAME_LENGTH: 50,
        MAX_NAME_LENGTH: 100
    },
    
    // Status dos pedidos
    ORDER_STATUSES: [
        { id: 'atendimento', name: 'Em Atendimento', color: '#f59e0b' },
        { id: 'pagamento', name: 'Aguardando Pagamento', color: '#ef4444' },
        { id: 'feito', name: 'Pedido Feito', color: '#3b82f6' },
        { id: 'preparo', name: 'Em Preparo', color: '#f59e0b' },
        { id: 'pronto', name: 'Pronto', color: '#10b981' },
        { id: 'coletado', name: 'Coletado', color: '#6366f1' },
        { id: 'finalizado', name: 'Finalizado', color: '#059669' }
    ],
    
    // Tipos de pedido
    ORDER_TYPES: [
        { id: 'delivery', name: 'Entrega', icon: 'fas fa-truck' },
        { id: 'pickup', name: 'Retirada', icon: 'fas fa-store' }
    ],
    
    // Categorias de produtos
    PRODUCT_CATEGORIES: [
        { id: 'lanches', name: 'Lanches', icon: 'fas fa-hamburger' },
        { id: 'bebidas', name: 'Bebidas', icon: 'fas fa-glass-water' },
        { id: 'acompanhamentos', name: 'Acompanhamentos', icon: 'fas fa-utensils' },
        { id: 'sobremesas', name: 'Sobremesas', icon: 'fas fa-ice-cream' }
    ],
    
    // Configurações de localStorage
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_DATA: 'user_data',
        PREFERENCES: 'user_preferences'
    },
    
    // Configurações de debug
    DEBUG: {
        ENABLED: window.location.hostname === 'localhost',
        LOG_REQUESTS: window.location.hostname === 'localhost',
        LOG_RESPONSES: window.location.hostname === 'localhost'
    }
};

// Função para obter URL completa do endpoint
function getApiUrl(endpoint, params = {}) {
    let url = CONFIG.API_BASE_URL + endpoint;
    
    // Substituir parâmetros na URL (ex: {id} por valor real)
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });
    
    return url;
}

// Função para log de debug
function debugLog(message, data = null) {
    if (CONFIG.DEBUG.ENABLED) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// Função para obter status do pedido por ID
function getOrderStatus(statusId) {
    return CONFIG.ORDER_STATUSES.find(status => status.id === statusId) || 
           { id: statusId, name: 'Status Desconhecido', color: '#6b7280' };
}

// Função para obter tipo do pedido por ID
function getOrderType(typeId) {
    return CONFIG.ORDER_TYPES.find(type => type.id === typeId) || 
           { id: typeId, name: 'Tipo Desconhecido', icon: 'fas fa-question' };
}

// Função para obter categoria do produto por ID
function getProductCategory(categoryId) {
    return CONFIG.PRODUCT_CATEGORIES.find(category => category.id === categoryId) || 
           { id: categoryId, name: 'Categoria Desconhecida', icon: 'fas fa-question' };
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para formatar data
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(new Date(date));
}

// Função para formatar data relativa
function formatRelativeDate(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMinutes = Math.floor((now - targetDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para validar telefone brasileiro
function isValidPhone(phone) {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
}

// Função para gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Exportar configurações para uso global
window.CONFIG = CONFIG;
window.getApiUrl = getApiUrl;
window.debugLog = debugLog;
window.getOrderStatus = getOrderStatus;
window.getOrderType = getOrderType;
window.getProductCategory = getProductCategory;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatRelativeDate = formatRelativeDate;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.generateId = generateId;

