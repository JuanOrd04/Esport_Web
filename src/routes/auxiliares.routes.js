import { Router } from 'express';
import {
    obtenerRoles,
    obtenerEstados,
    obtenerTiposRoster,
    obtenerHealth
} from '../controllers/auxiliares.controller.js';

const router = Router();


router.get('/roles', obtenerRoles);
router.get('/estados', obtenerEstados);
router.get('/tipos-roster', obtenerTiposRoster);
router.get('/health', obtenerHealth);

export default router;
