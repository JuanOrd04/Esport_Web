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



router.get('/', listar);
router.get('/:id', obtenerPorId);


router.post('/', requerirAdmin, crear);
router.put('/:id', requerirAdmin, actualizar);
router.delete('/:id', requerirAdmin, eliminar);

export default router;
