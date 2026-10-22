/**
 * Cliente API para la aplicacion eSports
 * Implementa el manejo de Cookies HTTP-Only, Header API-Key y Doble Cookie Pattern para CSRF
 */

const API_BASE = '/api/v1';
const API_KEY = 'esports_api_key_secret_2026';

// Variable en memoria para el token CSRF recibido en el login
let csrfTokenEnMemoria = null;

// Funcion auxiliar para leer cookies no HTTP-Only (como csrf_token)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export const api = {
    setCsrfToken(token) {
        csrfTokenEnMemoria = token;
    },

    getCsrfToken() {
        return csrfTokenEnMemoria || getCookie('csrf_token') || '';
    },

    /**
     * Wrapper de fetch que adjunta credenciales, API-Key y token CSRF
     */
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            ...(options.headers || {})
        };

        // Si tenemos un token CSRF y no es una peticion GET, lo adjuntamos en el header
        const currentCsrf = this.getCsrfToken();
        if (currentCsrf) {
            headers['x-csrf-token'] = currentCsrf;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include' // Obligatorio para transmitir las cookies HTTP-Only (jwt_token)
        };

        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // Si el servidor nos responde con un nuevo header de CSRF, lo actualizamos
        const nuevoCsrf = response.headers.get('x-csrf-token');
        if (nuevoCsrf) {
            this.setCsrfToken(nuevoCsrf);
        }

        // Manejo de respuesta 204 No Content
        if (response.status === 204) {
            return { ok: true, status: 204 };
        }

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            data = { mensaje: response.statusText };
        }

        if (!response.ok) {
            const error = new Error(data.mensaje || 'Error en la petición');
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    },

    // Métodos de conveniencia
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Funciones de autenticacion
    async login(email, password) {
        const res = await this.post('/auth/login', { email, password });
        if (res.csrfToken) {
            this.setCsrfToken(res.csrfToken);
        }
        return res;
    },

    async logout() {
        try {
            await this.post('/auth/logout', {});
        } finally {
            this.setCsrfToken(null);
        }
    },

    async checkAuth() {
        try {
            const res = await this.get('/auth/verify');
            return res.usuario;
        } catch (error) {
            return null;
        }
    }
};
