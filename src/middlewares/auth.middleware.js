import jwt from 'jsonwebtoken';





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





export const verificarToken = (req, res, next) => {
    try {

        const tokenJWT = req.cookies?.jwt_token || req.cookies?.session_token || req.cookies?.access_token;
        if (!tokenJWT) {
            return res.status(401).json({ mensaje: 'Token JWT no proporcionado en la cookie HTTP-Only' });
        }


        const csrfToken = req.headers['x-csrf-token'] || req.headers['x-csrf'];
        if (!csrfToken) {
            return res.status(403).json({ mensaje: 'Token CSRF no proporcionado en el header x-csrf-token' });
        }


        const jwtSecret = process.env.JWT_SECRET || 'super_secreto_para_jwt_esports_2026';
        const decoded = jwt.verify(tokenJWT, jwtSecret);


        if (decoded.csrfToken !== csrfToken) {
            return res.status(403).json({ mensaje: 'Token CSRF inválido o no coincide' });
        }


        const apiKeyValida = process.env.API_KEY || 'esports_api_key_secret_2026';
        if (decoded.apiKey && decoded.apiKey !== apiKeyValida) {
            return res.status(401).json({ mensaje: 'API Key inválida en el token de sesión' });
        }


        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nombre: decoded.nombre,
            avatar: decoded.avatar,
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





export const requerirAdmin = (req, res, next) => {
    verificarToken(req, res, () => {
        if (!req.usuario || req.usuario.rol !== 'Admin') {
            return res.status(403).json({ mensaje: 'Acceso denegado: se requieren permisos de Administrador' });
        }
        next();
    });
};
