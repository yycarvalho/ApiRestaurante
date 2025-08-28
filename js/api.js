/**
 * Módulo de comunicação com a API
 * Gerencia todas as requisições HTTP para o backend
 */
class ApiClient {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }

    // Configurar token de autenticação
    setAuthToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        }
    }

    // Obter headers padrão
    getDefaultHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Método genérico para fazer requisições
    async request(method, endpoint, data = null, options = {}) {
        const url = getApiUrl(endpoint, options.params || {});
        
        const config = {
            method: method.toUpperCase(),
            headers: {
                ...this.getDefaultHeaders(),
                ...options.headers
            },
            ...options.fetchOptions
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
            config.body = JSON.stringify(data);
        }

        try {
            debugLog(`${config.method} ${url}`, data);
            
            // Aplicar interceptors de request
            for (const interceptor of this.requestInterceptors) {
                await interceptor(config);
            }

            const response = await fetch(url, config);
            
            // Verificar se a resposta é ok
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            let responseData = null;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            debugLog(`Response ${response.status}`, responseData);

            // Aplicar interceptors de response
            for (const interceptor of this.responseInterceptors) {
                responseData = await interceptor(responseData, response);
            }

            return {
                data: responseData,
                status: response.status,
                headers: response.headers
            };

        } catch (error) {
            debugLog('Request error', error);
            throw this.handleRequestError(error);
        }
    }

    // Tratar erros de resposta HTTP
    async handleErrorResponse(response) {
        let errorData = null;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch (e) {
            errorData = { message: 'Erro desconhecido' };
        }

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;

        // Se for erro 401, limpar token e redirecionar para login
        if (response.status === 401) {
            this.setAuthToken(null);
            if (window.AuthManager) {
                window.AuthManager.logout();
            }
        }

        throw error;
    }

    // Tratar erros de requisição
    handleRequestError(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError = new Error('Erro de conexão com o servidor');
            networkError.type = 'NETWORK_ERROR';
            return networkError;
        }
        return error;
    }

    // Métodos HTTP convenientes
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async patch(endpoint, data, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // Adicionar interceptor de request
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    // Adicionar interceptor de response
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    // Retry automático para falhas de rede
    async requestWithRetry(method, endpoint, data = null, options = {}, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(method, endpoint, data, options);
            } catch (error) {
                if (error.type === 'NETWORK_ERROR' && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
    }
}

/**
 * Serviços específicos da API
 */
class ApiService {
    constructor() {
        this.client = new ApiClient();
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Interceptor para mostrar loading
        this.client.addRequestInterceptor(async (config) => {
            if (window.UI) {
                window.UI.showLoading();
            }
        });

        // Interceptor para esconder loading
        this.client.addResponseInterceptor(async (data, response) => {
            if (window.UI) {
                window.UI.hideLoading();
            }
            return data;
        });
    }

    // Autenticação
    async login(username, password) {
        try {
            const response = await this.client.post(CONFIG.ENDPOINTS.AUTH.LOGIN, {
                username,
                password
            });
            
            if (response.data.token) {
                this.client.setAuthToken(response.data.token);
            }
            
            return response.data;
        } catch (error) {
            if (window.UI) {
                window.UI.hideLoading();
            }
            throw error;
        }
    }

    async logout() {
        try {
            await this.client.post(CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            // Ignorar erros de logout
        } finally {
            this.client.setAuthToken(null);
        }
    }

    async validateToken() {
        return this.client.get(CONFIG.ENDPOINTS.AUTH.VALIDATE);
    }

    // Usuários
    async getUsers() {
        const response = await this.client.get(CONFIG.ENDPOINTS.USERS.LIST);
        return response.data;
    }

    async createUser(userData) {
        const response = await this.client.post(CONFIG.ENDPOINTS.USERS.CREATE, userData);
        return response.data;
    }

    async updateUser(userId, userData) {
        const response = await this.client.put(CONFIG.ENDPOINTS.USERS.UPDATE, userData, {
            params: { id: userId }
        });
        return response.data;
    }

    async deleteUser(userId) {
        const response = await this.client.delete(CONFIG.ENDPOINTS.USERS.DELETE, {
            params: { id: userId }
        });
        return response.data;
    }

    // Perfis
    async getProfiles() {
        const response = await this.client.get(CONFIG.ENDPOINTS.PROFILES.LIST);
        return response.data;
    }

    async createProfile(profileData) {
        const response = await this.client.post(CONFIG.ENDPOINTS.PROFILES.CREATE, profileData);
        return response.data;
    }

    async updateProfile(profileId, profileData) {
        const response = await this.client.put(CONFIG.ENDPOINTS.PROFILES.UPDATE, profileData, {
            params: { id: profileId }
        });
        return response.data;
    }

    async deleteProfile(profileId) {
        const response = await this.client.delete(CONFIG.ENDPOINTS.PROFILES.DELETE, {
            params: { id: profileId }
        });
        return response.data;
    }

    // Produtos
    async getProducts() {
        const response = await this.client.get(CONFIG.ENDPOINTS.PRODUCTS.LIST);
        return response.data;
    }

    async createProduct(productData) {
        const response = await this.client.post(CONFIG.ENDPOINTS.PRODUCTS.CREATE, productData);
        return response.data;
    }

    async updateProduct(productId, productData) {
        const response = await this.client.put(CONFIG.ENDPOINTS.PRODUCTS.UPDATE, productData, {
            params: { id: productId }
        });
        return response.data;
    }

    async deleteProduct(productId) {
        const response = await this.client.delete(CONFIG.ENDPOINTS.PRODUCTS.DELETE, {
            params: { id: productId }
        });
        return response.data;
    }

    // Pedidos
    async getOrders() {
        const response = await this.client.get(CONFIG.ENDPOINTS.ORDERS.LIST);
        return response.data;
    }

    async createOrder(orderData) {
        const response = await this.client.post(CONFIG.ENDPOINTS.ORDERS.CREATE, orderData);
        return response.data;
    }

    async updateOrder(orderId, orderData) {
        const response = await this.client.put(CONFIG.ENDPOINTS.ORDERS.UPDATE, orderData, {
            params: { id: orderId }
        });
        return response.data;
    }

    async updateOrderStatus(orderId, status) {
        const response = await this.client.patch(CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS, { status }, {
            params: { id: orderId }
        });
        return response.data;
    }

    async addChatMessage(orderId, message, sender = 'system', senderName = 'Sistema') {
        const response = await this.client.post(CONFIG.ENDPOINTS.ORDERS.CHAT, { 
            orderId, 
            message, 
            sender, 
            senderName 
        });
        return response.data;
    }

    async getChatHistory(orderId) {
        const response = await this.client.get(CONFIG.ENDPOINTS.ORDERS.CHAT, {
            params: { orderId }
        });
        return response.data;
    }

    async getChatStats() {
        const response = await this.client.get('/chat/stats');
        return response.data;
    }

    async deleteOrder(orderId) {
        const response = await this.client.delete(CONFIG.ENDPOINTS.ORDERS.DELETE, {
            params: { id: orderId }
        });
        return response.data;
    }

    // Métricas
    async getDashboardMetrics() {
        const response = await this.client.get(CONFIG.ENDPOINTS.METRICS.DASHBOARD);
        return response.data;
    }

    async getReports(filters = {}) {
        const response = await this.client.get(CONFIG.ENDPOINTS.METRICS.REPORTS, {
            params: filters
        });
        return response.data;
    }
}

// Instância global da API
window.API = new ApiService();

