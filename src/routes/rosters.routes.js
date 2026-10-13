import { Router } from 'express';
import {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    eliminar,
    listarJugadores,
    asignarJugador,
    cambiarRol,
    quitarJugador
} from '../controllers/rosters.controller.js';

const router = Router();

// Endpoints de Rosters (seccion 6.2)
router.get('/', listar);          // GET /api/v1/rosters (?tipo=...&temporada=...)
router.get('/:id', obtenerPorId);  // GET /api/v1/rosters/:id (incluye jugadores y roles)
router.post('/', crear);          // POST /api/v1/rosters
router.put('/:id', actualizar);   // PUT /api/v1/rosters/:id
router.delete('/:id', eliminar);  // DELETE /api/v1/rosters/:id

// Endpoints de Asignacion de jugadores a rosters (seccion 6.3)
router.get('/:id/jugadores', listarJugadores);                   // GET /api/v1/rosters/:id/jugadores
router.post('/:id/jugadores', asignarJugador);                   // POST /api/v1/rosters/:id/jugadores
router.put('/:id/jugadores/:id_jugador', cambiarRol);            // PUT /api/v1/rosters/:id/jugadores/:id_jugador
router.delete('/:id/jugadores/:id_jugador', quitarJugador);      // DELETE /api/v1/rosters/:id/jugadores/:id_jugador

export default router;
