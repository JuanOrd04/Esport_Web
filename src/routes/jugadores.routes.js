import { Router } from 'express';
import {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    eliminar
} from '../controllers/jugadores.controller.js';

const router = Router();

// Rutas del modulo de Jugadores (seccion 6.1 de la practica)
router.get('/', listar);          // GET /api/v1/jugadores (?rol=...&estado=...&search=...)
router.get('/:id', obtenerPorId);  // GET /api/v1/jugadores/:id
router.post('/', crear);          // POST /api/v1/jugadores
router.put('/:id', actualizar);   // PUT /api/v1/jugadores/:id
router.delete('/:id', eliminar);  // DELETE /api/v1/jugadores/:id

export default router;
