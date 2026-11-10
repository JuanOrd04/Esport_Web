/**
 * Cliente API para la aplicacion eSports
 * Implementa:
 *   - Cookies HTTP-Only para JWT (mitigación XSS)
 *   - Doble Cookie Pattern para CSRF en sesiones autenticadas
 *   - Pre-login CSRF token para proteger el endpoint de login
 *   - API Key cargada desde el servidor (no hardcodeada en el fuente)
 */

const API_BASE = '/api/v1';

// API Key en memoria, cargada dinámicamente desde /api/config al iniciar
// Se evita así que esté visible en el código fuente del frontend
let API_KEY = null;

// Token CSRF de sesión (recibido al hacer login, almacenado en memoria)
let csrfTokenEnMemoria = null;

// Funcion auxiliar para leer cookies no HTTP-Only (como csrf_token, login_csrf_token)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export const api = {

    /**
     * Inicializa el cliente: obtiene la API Key del servidor.
     * Debe llamarse una sola vez antes de cualquier otra petición.
     */
    async init() {
        try {
            const res = await fetch('/api/config', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                API_KEY = data.apiKey;
            }
        } catch (e) {
            console.warn('[API] No se pudo obtener la configuración del servidor. Usando fallback.');
            API_KEY = '';
        }
    },

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
            ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            ...(options.headers || {})
        };

        // Si tenemos token CSRF de sesión lo adjuntamos en el header
        const currentCsrf = this.getCsrfToken();
        if (currentCsrf) {
            headers['x-csrf-token'] = currentCsrf;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include' // Obligatorio para transmitir las cookies HTTP-Only (jwt_token)
        };

        const url = endpoint.startsWith('http') || endpoint.startsWith('/auth')
            ? endpoint
            : `${API_BASE}${endpoint}`;

        const response = await fetch(url, config);

        // Si el servidor responde con un nuevo header CSRF, lo actualizamos en memoria
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

    // ── Métodos de conveniencia ───────────────────────────────────────────────
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

    // ── Funciones de autenticación ────────────────────────────────────────────

    /**
     * Login local con protección CSRF de pre-login (Doble Cookie Pattern en login).
     * Pasos:
     *   1. Solicita GET /auth/login-token → el servidor establece cookie login_csrf_token
     *   2. Lee la cookie y la envía como header x-login-csrf en el POST de login
     *   3. El backend valida que header == cookie antes de autenticar
     */
    async login(email, password) {
        // 1. Obtener token CSRF de pre-login
        const preTokenRes = await fetch('/auth/login-token', { credentials: 'include' });
        if (!preTokenRes.ok) {
            throw new Error('No se pudo obtener el token CSRF de pre-login');
        }
        const { loginCsrfToken } = await preTokenRes.json();

        // 2. Enviar login incluyendo el pre-login CSRF en el header
        const headers = {
            'Content-Type': 'application/json',
            'x-login-csrf': loginCsrfToken
        };
        if (API_KEY) headers['x-api-key'] = API_KEY;

        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        let data = {};
        try { data = await response.json(); } catch (e) { data = { mensaje: response.statusText }; }

        if (!response.ok) {
            const error = new Error(data.mensaje || 'Credenciales inválidas');
            error.status = response.status;
            throw error;
        }

        // 3. Guardar token CSRF de sesión en memoria
        if (data.csrfToken) {
            this.setCsrfToken(data.csrfToken);
        }

        return data;
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
