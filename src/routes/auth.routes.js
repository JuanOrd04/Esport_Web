import { Router } from 'express';
import {
    login,
    logout,
    verificarAuth,
    googleLogin,
    googleCallback,
    listarUsuarios,
    registrarUsuario
} from '../controllers/auth.controller.js';
import { validarApiKey, verificarToken, requerirAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de autenticacion con Google OAuth 2.0 (bajo /api/v1/auth)
router.get('/google/login', googleLogin);
router.get('/google/callback', googleCallback);

// Rutas de autenticacion local / credenciales
router.post('/login', validarApiKey, login);
router.post('/logout', logout); // Permitir logout para limpiar cookies
router.get('/verify', verificarToken, verificarAuth);

// Rutas para gestion de la tabla de usuarios registrados
router.get('/usuarios', verificarToken, listarUsuarios);
router.post('/usuarios', verificarToken, requerirAdmin, registrarUsuario);

export default router;
