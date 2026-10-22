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
import { requerirAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoints de Rosters (seccion 6.2)
// Acceso Publico: Consulta
router.get('/', listar);          // GET /api/v1/rosters (?tipo=...&temporada=...)
router.get('/:id', obtenerPorId);  // GET /api/v1/rosters/:id (incluye jugadores y roles)

// Acceso Admin: Crear, editar y eliminar
router.post('/', requerirAdmin, crear);          // POST /api/v1/rosters
router.put('/:id', requerirAdmin, actualizar);   // PUT /api/v1/rosters/:id
router.delete('/:id', requerirAdmin, eliminar);  // DELETE /api/v1/rosters/:id

// Endpoints de Asignacion de jugadores a rosters (seccion 6.3)
// Acceso Publico: Listar jugadores del roster
router.get('/:id/jugadores', listarJugadores);                   // GET /api/v1/rosters/:id/jugadores

// Acceso Admin: Asignar, cambiar rol y remover jugador
router.post('/:id/jugadores', requerirAdmin, asignarJugador);                   // POST /api/v1/rosters/:id/jugadores
router.put('/:id/jugadores/:id_jugador', requerirAdmin, cambiarRol);            // PUT /api/v1/rosters/:id/jugadores/:id_jugador
router.delete('/:id/jugadores/:id_jugador', requerirAdmin, quitarJugador);      // DELETE /api/v1/rosters/:id/jugadores/:id_jugador

export default router;
