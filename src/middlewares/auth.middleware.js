import jwt from 'jsonwebtoken';

/**
 * Middleware para validar la API Key en el header personalizado
 * Identifica la aplicacion cliente que realiza la peticion
 */
export const validarApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const apiKeyValida = process.env.API_KEY || 'esports_api_key_secret_2026';

    if (!apiKey) {
        return res.status(401).json({ mensaje: 'API Key no proporcionada en header x-api-key' });
    }

    if (apiKey !== apiKeyValida) {
        return res.status(401).json({ mensaje: 'API Key inválida' });
    }

    next();
};

/**
 * Middleware para verificar JWT en cookie HTTP-Only y proteccion CSRF
 * Implementa el patron Doble Cookie para evitar ataques Cross-Site Request Forgery
 */
export const verificarToken = (req, res, next) => {
    try {
        // 1. Obtener JWT desde la cookie HTTP-Only
        const tokenJWT = req.cookies?.jwt_token;
        if (!tokenJWT) {
            return res.status(401).json({ mensaje: 'Token JWT no proporcionado en la cookie HTTP-Only' });
        }

        // 2. Obtener Token CSRF desde el header personalizado
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken) {
            return res.status(403).json({ mensaje: 'Token CSRF no proporcionado en el header x-csrf-token' });
        }

        // 3. Verificar y decodificar el JWT
        const jwtSecret = process.env.JWT_SECRET || 'super_secreto_para_jwt_esports_2026';
        const decoded = jwt.verify(tokenJWT, jwtSecret);

        // 4. Doble Cookie Pattern: comparar token CSRF del header con el emitido en el JWT
        if (decoded.csrfToken !== csrfToken) {
            return res.status(403).json({ mensaje: 'Token CSRF inválido o no coincide' });
        }

        // 5. Validar que la API Key coincida
        const apiKeyValida = process.env.API_KEY || 'esports_api_key_secret_2026';
        if (decoded.apiKey !== apiKeyValida) {
            return res.status(401).json({ mensaje: 'API Key inválida en el token de sesión' });
        }

        // 6. Inyectar informacion del usuario en la solicitud
        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol || 'Admin',
            apiKey: decoded.apiKey
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ mensaje: 'Token JWT inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Token JWT expirado, inicie sesión nuevamente' });
        }
        return res.status(500).json({ mensaje: 'Error al procesar la autenticación', error: error.message });
    }
};

/**
 * Middleware de autorizacion para el rol Admin
 * Asegura que solo usuarios con rol 'Admin' puedan crear, editar o eliminar recursos
 */
export const requerirAdmin = (req, res, next) => {
    verificarToken(req, res, () => {
        if (!req.usuario || req.usuario.rol !== 'Admin') {
            return res.status(403).json({ mensaje: 'Acceso denegado: se requieren permisos de Administrador' });
        }
        next();
    });
};
