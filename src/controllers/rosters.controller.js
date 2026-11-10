import * as rostersService from '../services/rosters.service.js';
import { AppError } from '../utils/AppError.js';


export const crear = async (req, res, next) => {
    try {
        const nuevoRoster = await rostersService.crearRoster(req.body);
        return res.status(201).json(nuevoRoster);
    } catch (error) {
        next(error);
    }
};


export const listar = async (req, res, next) => {
    try {
        const { tipo, temporada } = req.query;
        const rosters = await rostersService.listarRosters({ tipo, temporada });
        return res.status(200).json(rosters);
    } catch (error) {
        next(error);
    }
};


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


export const asignarJugador = async (req, res, next) => {
    try {
        const { id } = req.params;
        const asignacion = await rostersService.asignarJugadorARoster(id, req.body);
        return res.status(201).json(asignacion);
    } catch (error) {
        next(error);
    }
};


export const cambiarRol = async (req, res, next) => {
    try {
        const { id, id_jugador } = req.params;
        const asignacionActualizada = await rostersService.cambiarRolEnRoster(id, id_jugador, req.body);
        return res.status(200).json(asignacionActualizada);
    } catch (error) {
        next(error);
    }
};


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
