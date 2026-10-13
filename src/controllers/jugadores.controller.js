import * as jugadoresService from '../services/jugadores.service.js';
import { AppError } from '../utils/AppError.js';

// POST /api/v1/jugadores - Crear un nuevo jugador (RF-01)
export const crear = async (req, res, next) => {
    try {
        const nuevoJugador = await jugadoresService.crearJugador(req.body);
        return res.status(201).json(nuevoJugador);
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/jugadores - Listar jugadores con filtros opcionales (RF-02 y RF-06)
export const listar = async (req, res, next) => {
    try {
        const { rol, estado, search } = req.query;
        const jugadores = await jugadoresService.listarJugadores({ rol, estado, search });
        return res.status(200).json(jugadores);
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/jugadores/:id - Detalle de un jugador (RF-03)
export const obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const jugador = await jugadoresService.obtenerJugadorPorId(id);

        if (!jugador) {
            throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
        }

        return res.status(200).json(jugador);
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/jugadores/:id - Actualizar datos de un jugador (RF-04)
export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const jugadorActualizado = await jugadoresService.actualizarJugador(id, req.body);

        if (!jugadorActualizado) {
            throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
        }

        return res.status(200).json(jugadorActualizado);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/jugadores/:id - Eliminar un jugador (RF-05)
export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const eliminado = await jugadoresService.eliminarJugador(id);

        if (!eliminado) {
            throw new AppError(`Jugador con ID ${id} no encontrado`, 404);
        }

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};
