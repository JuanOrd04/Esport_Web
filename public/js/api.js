








const API_BASE = '/api/v1';



let API_KEY = null;


let csrfTokenEnMemoria = null;


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export const api = {





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




    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            ...(options.headers || {})
        };


        const currentCsrf = this.getCsrfToken();
        if (currentCsrf) {
            headers['x-csrf-token'] = currentCsrf;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        const url = endpoint.startsWith('http') || endpoint.startsWith('/auth')
            ? endpoint
            : `${API_BASE}${endpoint}`;

        const response = await fetch(url, config);


        const nuevoCsrf = response.headers.get('x-csrf-token');
        if (nuevoCsrf) {
            this.setCsrfToken(nuevoCsrf);
        }


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










    async login(email, password) {

        const preTokenRes = await fetch('/auth/login-token', { credentials: 'include' });
        if (!preTokenRes.ok) {
            throw new Error('No se pudo obtener el token CSRF de pre-login');
        }
        const { loginCsrfToken } = await preTokenRes.json();


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
