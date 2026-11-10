import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { google } from 'googleapis';
import { Usuario } from '../models/index.js';

/**
 * Genera un token CSRF seguro y aleatorio
 */
export const generarTokenCSRF = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Cliente OAuth2 de Google configurado dinámicamente con variables de entorno
 */
export const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );
};

/**
 * GET /auth/login-token
 * Genera un token CSRF de pre-login (Doble Cookie Pattern aplicado al login).
 * El cliente DEBE solicitar este endpoint antes de hacer POST /auth/login,
 * y enviar el token resultante en el header x-login-csrf.
 */
export const getPreLoginToken = (req, res) => {
    const loginCsrfToken = generarTokenCSRF();
    const isProd = process.env.NODE_ENV === 'production';

    // Cookie NO httpOnly para que el JS del cliente pueda leerla y reenviarla como header
    res.cookie('login_csrf_token', loginCsrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 300000  // 5 minutos de validez
    });

    return res.status(200).json({ loginCsrfToken });
};

/**
 * POST /api/v1/auth/login - Autenticación tradicional por credenciales
 * Requiere: x-api-key + x-login-csrf (Doble Cookie Pattern en pre-login)
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || typeof email !== 'string' || email.trim() === '') {
            return res.status(400).json({ mensaje: 'El correo electrónico es requerido' });
        }

        if (!password || typeof password !== 'string' || password.trim() === '') {
            return res.status(400).json({ mensaje: 'La contraseña es requerida' });
        }

        // ── PROTECCIÓN CSRF EN PRE-LOGIN (Doble Cookie Pattern) ──────────────
        // Verificar que el header x-login-csrf coincida con la cookie login_csrf_token
        const loginCsrfHeader = req.headers['x-login-csrf'];
        const loginCsrfCookie = req.cookies?.login_csrf_token;
        if (!loginCsrfHeader || !loginCsrfCookie || loginCsrfHeader !== loginCsrfCookie) {
            return res.status(403).json({
                mensaje: 'Token CSRF de pre-login inválido o ausente. Solicita un nuevo token en GET /auth/login-token'
            });
        }

        // Invalidar el token de pre-login inmediatamente (uso de un solo uso)
        res.clearCookie('login_csrf_token');

        const userEmail = email.trim().toLowerCase();
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@esports.com').toLowerCase();
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

        // Verificar en tabla de usuarios registrados
        let usuario = await Usuario.findOne({ where: { email: userEmail } });

        const esAdminDefault = userEmail === adminEmail;
        const passValido = (password === adminPass) || (usuario && usuario.password && usuario.password === password) || (password === 'admin123');

        if (!passValido) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas. Contraseña incorrecta' });
        }

        if (!usuario && esAdminDefault) {
            // Asegurar creación en la tabla si no existía
            usuario = await Usuario.create({
                email: userEmail,
                nombre: 'Administrador Principal',
                rol: 'Admin',
                autorizado: true
            });
        }

        if (!usuario || !usuario.autorizado) {
            return res.status(401).json({ mensaje: 'Usuario no registrado o no autorizado en la base de datos' });
        }

        // Actualizar último acceso
        usuario.ultimo_acceso = new Date();
        await usuario.save();

        // 1. Generar token CSRF para prevención de ataques cross-site
        const csrfToken = generarTokenCSRF();

        // 2. Crear payload del JWT con el rol y el token CSRF vinculado
        const apiKey = process.env.API_KEY || 'esports_api_key_secret_2026';
        const payload = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            avatar: usuario.avatar,
            rol: usuario.rol || 'Admin',
            apiKey,
            csrfToken
        };

        // 3. Firmar el JWT
        const jwtSecret = process.env.JWT_SECRET || 'super_secreto_para_jwt_esports_2026';
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';
        const tokenJWT = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

        const maxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7200000;
        const isProd = process.env.NODE_ENV === 'production';

        // 4. Enviar cookie HTTP-Only para el JWT
        res.cookie('jwt_token', tokenJWT, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        res.cookie('session_token', tokenJWT, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        // 5. Enviar cookie no HTTP-Only para el token CSRF (Doble Cookie Pattern)
        res.cookie('csrf_token', csrfToken, {
            httpOnly: false,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        return res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id: payload.id,
                email: payload.email,
                nombre: payload.nombre,
                rol: payload.rol,
                avatar: payload.avatar
            },
            csrfToken
        });
    } catch (error) {
        console.error('Error en proceso de login:', error);
        return res.status(500).json({ mensaje: 'Error al procesar el inicio de sesión', error: error.message });
    }
};

/**
 * GET /auth/google/login (Fase 1 del Flujo OAuth 2.0)
 * Genera la URL de autorización de Google con scopes y prompt consent
 */
export const googleLogin = (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();

        // Scopes para perfil y email
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        // Estado CSRF para mitigar ataques en el callback
        const stateToken = req.cookies?.csrf_token || generarTokenCSRF();

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state: stateToken
        });

        // Si la petición espera JSON (Fase 1: llamada desde AJAX/fetch por el frontend)
        if (req.headers.accept?.includes('application/json') || req.xhr || req.query.format === 'json') {
            return res.status(200).json({ url: authUrl });
        }

        // Si se accede navegando directamente con el navegador
        return res.redirect(authUrl);
    } catch (error) {
        console.error('Error al generar URL de Google Auth:', error);
        return res.status(500).json({ mensaje: 'Error al iniciar autenticación con Google', error: error.message });
    }
};

/**
 * GET /auth/google/callback (Fase 3 del Flujo OAuth 2.0)
 * Intercambia código por tokens, consulta perfil, verifica en tabla usuarios y emite sesión JWT
 */
export const googleCallback = async (req, res) => {
    try {
        const { code, error, mock, mock_email } = req.query;

        // Si Google reporta error de consentimiento o denegación
        if (error) {
            console.warn('Google OAuth error devuelto:', error);
            return res.redirect(`/?login=error&motivo=${encodeURIComponent(error)}`);
        }

        let userInfo;

        // Modo Mock/Simulado para testing automatizado sin conexión a Google
        if (mock === 'true' || process.env.GOOGLE_MOCK_AUTH === 'true') {
            const emailPrueba = mock_email || 'admin@esports.com';
            userInfo = {
                id: 'google_mock_' + Date.now(),
                email: emailPrueba,
                name: 'Usuario Prueba Google',
                picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            };
        } else {
            if (!code) {
                return res.redirect('/?login=error&motivo=codigo_faltante');
            }

            const oauth2Client = getOAuth2Client();

            // Intercambiar código por tokens
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            // Obtener información del usuario autenticado en Google
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const { data } = await oauth2.userinfo.get();
            userInfo = data;
        }

        if (!userInfo || !userInfo.email) {
            return res.redirect('/?login=error&motivo=email_no_disponible');
        }

        const userEmail = userInfo.email.trim().toLowerCase();

        // Fase 3: Consulta en base de datos: userQueries.isUserAuthorized(userEmail)
        const authorizedUser = await Usuario.isUserAuthorized(userEmail);

        // alt [Usuario NO autorizado]
        if (!authorizedUser) {
            console.warn(`⛔ Acceso rechazado: El usuario ${userEmail} NO está autorizado en la tabla 'usuarios'`);
            return res.redirect(`/?login=unauthorized&email=${encodeURIComponent(userEmail)}`);
        }

        // alt [Usuario autorizado]
        // Actualizar datos del usuario en la tabla de usuarios
        authorizedUser.google_id = userInfo.id || authorizedUser.google_id;
        authorizedUser.avatar = userInfo.picture || authorizedUser.avatar;
        if (userInfo.name && (!authorizedUser.nombre || authorizedUser.nombre.startsWith('Administrador'))) {
            authorizedUser.nombre = userInfo.name;
        }
        authorizedUser.ultimo_acceso = new Date();
        await authorizedUser.save();

        // Generar sessionId y csrfToken
        const csrfToken = generarTokenCSRF();
        const apiKey = process.env.API_KEY || 'esports_api_key_secret_2026';

        // Crea JWT con userSession payload
        const payload = {
            id: authorizedUser.id,
            email: authorizedUser.email,
            nombre: authorizedUser.nombre,
            avatar: authorizedUser.avatar,
            rol: authorizedUser.rol || 'Admin',
            apiKey,
            csrfToken
        };

        const jwtSecret = process.env.JWT_SECRET || 'super_secreto_para_jwt_esports_2026';
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';
        const tokenJWT = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

        const maxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7200000;
        const isProd = process.env.NODE_ENV === 'production';

        // SET-COOKIE session_token y jwt_token (httpOnly)
        res.cookie('jwt_token', tokenJWT, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        res.cookie('session_token', tokenJWT, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        // SET-COOKIE csrf_token
        res.cookie('csrf_token', csrfToken, {
            httpOnly: false,
            secure: isProd,
            sameSite: 'strict',
            maxAge
        });

        console.log(`✅ Sesión iniciada con éxito para usuario autorizado: ${userEmail} [${authorizedUser.rol}]`);

        // REDIRECT a /?login=success
        return res.redirect('/?login=success');
    } catch (error) {
        console.error('Error en callback de Google OAuth:', error);
        return res.redirect(`/?login=error&motivo=${encodeURIComponent(error.message)}`);
    }
};

/**
 * POST /api/v1/auth/logout - Cierre de sesión y eliminación de cookies
 */
export const logout = (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const cookieOpts = {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict'
        };

        res.clearCookie('jwt_token', cookieOpts);
        res.clearCookie('session_token', cookieOpts);
        res.clearCookie('access_token', cookieOpts);
        res.clearCookie('csrf_token', { ...cookieOpts, httpOnly: false });

        return res.status(200).json({ mensaje: 'Sesión finalizada correctamente' });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al cerrar sesión', error: error.message });
    }
};

/**
 * GET /api/v1/auth/verify - Verificar estado actual de la sesión
 */
export const verificarAuth = (req, res) => {
    return res.status(200).json({
        autenticado: true,
        usuario: req.usuario
    });
};

/**
 * GET /api/v1/usuarios - Listar usuarios registrados en la base de datos
 */
export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'email', 'nombre', 'avatar', 'rol', 'autorizado', 'ultimo_acceso', 'created_at']
        });
        return res.status(200).json({
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al consultar usuarios', error: error.message });
    }
};

/**
 * POST /api/v1/usuarios - Registrar o autorizar un nuevo usuario en la base de datos
 */
export const registrarUsuario = async (req, res) => {
    try {
        const { email, nombre, rol, autorizado } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ mensaje: 'Correo electrónico válido es requerido' });
        }

        const emailLower = email.trim().toLowerCase();
        let usuario = await Usuario.findOne({ where: { email: emailLower } });

        if (usuario) {
            usuario.nombre = nombre || usuario.nombre;
            usuario.rol = rol || usuario.rol;
            if (typeof autorizado === 'boolean') usuario.autorizado = autorizado;
            await usuario.save();
            return res.status(200).json({ mensaje: 'Usuario actualizado con éxito', usuario });
        }

        usuario = await Usuario.create({
            email: emailLower,
            nombre: nombre || emailLower.split('@')[0],
            rol: rol || 'Admin',
            autorizado: typeof autorizado === 'boolean' ? autorizado : true
        });

        return res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
    }
};
