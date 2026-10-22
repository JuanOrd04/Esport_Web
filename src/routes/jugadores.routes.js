import { Router } from 'express';
import {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    eliminar
} from '../controllers/jugadores.controller.js';
import { requerirAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de Jugadores (seccion 6.1)
// Acceso Publico: Solo lectura
router.get('/', listar);          // GET /api/v1/jugadores (?rol=...&estado=...&search=...)
router.get('/:id', obtenerPorId);  // GET /api/v1/jugadores/:id

// Acceso Admin: Crear, editar y eliminar con JWT, Cookies y CSRF
router.post('/', requerirAdmin, crear);          // POST /api/v1/jugadores
router.put('/:id', requerirAdmin, actualizar);   // PUT /api/v1/jugadores/:id
router.delete('/:id', requerirAdmin, eliminar);  // DELETE /api/v1/jugadores/:id

export default router;
