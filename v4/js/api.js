/**
 * Módulo API - Centraliza todas as chamadas ao backend
 */
const API = (function() {
    'use strict';
    
    const API_BASE = 'http://localhost:8080/api';
    
    // Configurações de retry
    const RETRY_ATTEMPTS = 3;
    const RETRY_DELAY = 1000; // 1 segundo
    
    /**
     * Fetch com retry e tratamento de erro
     */
    async function fetchWithRetry(url, options = {}, attempts = RETRY_ATTEMPTS) {
        try {
            const response = await fetch(url, {
                credentials: 'include',
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            if (attempts > 1) {
                console.warn(`Tentativa falhou, tentando novamente em ${RETRY_DELAY}ms...`);
                await delay(RETRY_DELAY);
                return fetchWithRetry(url, options, attempts - 1);
            }
            throw error;
        }
    }
    
    /**
     * Delay para retry
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Busca pedidos com paginação e filtros
     */
    async function fetchOrders({ page = 1, size = 20, start, end, status } = {}) {
        const params = new URLSearchParams({ page, size });
        
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (status) params.set('status', status);
        
        const response = await fetchWithRetry(`${API_BASE}/orders?${params.toString()}`);
        return response.json();
    }
    
    /**
     * Busca pedido por ID
     */
    async function fetchOrderById(orderId) {
        const response = await fetchWithRetry(`${API_BASE}/orders/${orderId}`);
        return response.json();
    }
    
    /**
     * Cria novo pedido
     */
    async function createOrder(orderData) {
        const response = await fetchWithRetry(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        return response.json();
    }
    
    /**
     * Atualiza pedido existente
     */
    async function updateOrder(orderId, orderData) {
        const response = await fetchWithRetry(`${API_BASE}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        return response.json();
    }
    
    /**
     * Exclui pedido
     */
    async function deleteOrder(orderId) {
        const response = await fetchWithRetry(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE'
        });
        return response.json();
    }
    
    /**
     * Busca dados do calendário por mês
     */
    async function fetchCalendarData(month) {
        const response = await fetchWithRetry(`${API_BASE}/orders/calendar?month=${month}`);
        return response.json();
    }
    
    /**
     * Busca dados do dashboard
     */
    async function fetchDashboard(start, end) {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        
        const response = await fetchWithRetry(`${API_BASE}/dashboard?${params.toString()}`);
        return response.json();
    }
    
    /**
     * Busca clientes
     */
    async function fetchCustomers() {
        const response = await fetchWithRetry(`${API_BASE}/customers`);
        return response.json();
    }
    
    /**
     * Busca produtos
     */
    async function fetchProducts() {
        const response = await fetchWithRetry(`${API_BASE}/products`);
        return response.json();
    }
    
    /**
     * Login
     */
    async function login(username, password) {
        const response = await fetchWithRetry(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    }
    
    /**
     * Logout
     */
    async function logout() {
        const response = await fetchWithRetry(`${API_BASE}/auth/logout`, {
            method: 'POST'
        });
        return response.json();
    }
    
    // API pública
    return {
        fetchOrders,
        fetchOrderById,
        createOrder,
        updateOrder,
        deleteOrder,
        fetchCalendarData,
        fetchDashboard,
        fetchCustomers,
        fetchProducts,
        login,
        logout
    };
})();