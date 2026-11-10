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



router.get('/', listar);
router.get('/:id', obtenerPorId);


router.post('/', requerirAdmin, crear);
router.put('/:id', requerirAdmin, actualizar);
router.delete('/:id', requerirAdmin, eliminar);



router.get('/:id/jugadores', listarJugadores);


router.post('/:id/jugadores', requerirAdmin, asignarJugador);
router.put('/:id/jugadores/:id_jugador', requerirAdmin, cambiarRol);
router.delete('/:id/jugadores/:id_jugador', requerirAdmin, quitarJugador);

export default router;
