import * as jugadoresService from '../services/jugadores.service.js';

// POST /api/v1/jugadores - Crear un nuevo jugador (RF-01)
export const crear = async (req, res) => {
    try {
        const nuevoJugador = await jugadoresService.crearJugador(req.body);
        return res.status(201).json(nuevoJugador);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al registrar el jugador', error: error.message });
    }
};

// GET /api/v1/jugadores - Listar jugadores con filtros opcionales (RF-02 y RF-06)
export const listar = async (req, res) => {
    try {
        const { rol, estado, search } = req.query;
        const jugadores = await jugadoresService.listarJugadores({ rol, estado, search });
        return res.status(200).json(jugadores);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al obtener la lista de jugadores', error: error.message });
    }
};

// GET /api/v1/jugadores/:id - Detalle de un jugador (RF-03)
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const jugador = await jugadoresService.obtenerJugadorPorId(id);

        if (!jugador) {
            return res.status(404).json({ mensaje: `Jugador con ID ${id} no encontrado` });
        }

        return res.status(200).json(jugador);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al consultar el jugador', error: error.message });
    }
};

// PUT /api/v1/jugadores/:id - Actualizar datos de un jugador (RF-04)
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const jugadorActualizado = await jugadoresService.actualizarJugador(id, req.body);

        if (!jugadorActualizado) {
            return res.status(404).json({ mensaje: `Jugador con ID ${id} no encontrado` });
        }

        return res.status(200).json(jugadorActualizado);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al actualizar el jugador', error: error.message });
    }
};

// DELETE /api/v1/jugadores/:id - Eliminar un jugador (RF-05)
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await jugadoresService.eliminarJugador(id);

        if (!eliminado) {
            return res.status(404).json({ mensaje: `Jugador con ID ${id} no encontrado` });
        }

        // 204 No Content para eliminacion exitosa
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al eliminar el jugador', error: error.message });
    }
};
