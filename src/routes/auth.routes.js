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


router.get('/google/login', googleLogin);
router.get('/google/callback', googleCallback);


router.post('/login', validarApiKey, login);
router.post('/logout', logout);
router.get('/verify', verificarToken, verificarAuth);


router.get('/usuarios', verificarToken, listarUsuarios);
router.post('/usuarios', verificarToken, requerirAdmin, registrarUsuario);

export default router;
