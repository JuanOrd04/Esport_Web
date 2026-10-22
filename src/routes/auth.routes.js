import { Router } from 'express';
import { login, logout, verificarAuth } from '../controllers/auth.controller.js';
import { validarApiKey, verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de autenticacion con JWT y proteccion CSRF
router.post('/login', validarApiKey, login);
router.post('/logout', verificarToken, logout);
router.get('/verify', verificarToken, verificarAuth);

export default router;
