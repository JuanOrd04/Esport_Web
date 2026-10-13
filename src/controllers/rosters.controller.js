import * as rostersService from '../services/rosters.service.js';
import { AppError } from '../utils/AppError.js';

// POST /api/v1/rosters - Crear roster (RF-07)
export const crear = async (req, res, next) => {
    try {
        const nuevoRoster = await rostersService.crearRoster(req.body);
        return res.status(201).json(nuevoRoster);
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/rosters - Listar todos los rosters (RF-08)
export const listar = async (req, res, next) => {
    try {
        const { tipo, temporada } = req.query;
        const rosters = await rostersService.listarRosters({ tipo, temporada });
        return res.status(200).json(rosters);
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/rosters/:id - Ver detalle del roster con sus jugadores (RF-09)
export const obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const roster = await rostersService.obtenerRosterPorId(id);

        if (!roster) {
            throw new AppError(`Roster con ID ${id} no encontrado`, 404);
        }

        return res.status(200).json(roster);
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/rosters/:id - Actualizar datos del roster (RF-10)
export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rosterActualizado = await rostersService.actualizarRoster(id, req.body);

        if (!rosterActualizado) {
            throw new AppError(`Roster con ID ${id} no encontrado`, 404);
        }

        return res.status(200).json(rosterActualizado);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/rosters/:id - Eliminar un roster (RF-11)
export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const eliminado = await rostersService.eliminarRoster(id);

        if (!eliminado) {
            throw new AppError(`Roster con ID ${id} no encontrado`, 404);
        }

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/rosters/:id/jugadores - Listar jugadores de un roster
export const listarJugadores = async (req, res, next) => {
    try {
        const { id } = req.params;
        const jugadores = await rostersService.listarJugadoresDeRoster(id);

        if (!jugadores) {
            throw new AppError(`Roster con ID ${id} no encontrado`, 404);
        }

        return res.status(200).json(jugadores);
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/rosters/:id/jugadores - Asignar jugador al roster (RF-12)
export const asignarJugador = async (req, res, next) => {
    try {
        const { id } = req.params;
        const asignacion = await rostersService.asignarJugadorARoster(id, req.body);
        return res.status(201).json(asignacion);
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/rosters/:id/jugadores/:id_jugador - Cambiar rol dentro del roster (RF-12)
export const cambiarRol = async (req, res, next) => {
    try {
        const { id, id_jugador } = req.params;
        const asignacionActualizada = await rostersService.cambiarRolEnRoster(id, id_jugador, req.body);
        return res.status(200).json(asignacionActualizada);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/rosters/:id/jugadores/:id_jugador - Quitar jugador del roster (RF-13)
export const quitarJugador = async (req, res, next) => {
    try {
        const { id, id_jugador } = req.params;
        const resultado = await rostersService.quitarJugadorDeRoster(id, id_jugador);

        if (resultado === null) {
            throw new AppError(`Roster con ID ${id} no encontrado`, 404);
        }
        if (resultado === false) {
            throw new AppError(`El jugador con ID ${id_jugador} no pertenece al roster`, 404);
        }

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};
