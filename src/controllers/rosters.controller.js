import * as rostersService from '../services/rosters.service.js';

// POST /api/v1/rosters - Crear roster (RF-07)
export const crear = async (req, res) => {
    try {
        const nuevoRoster = await rostersService.crearRoster(req.body);
        return res.status(201).json(nuevoRoster);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al registrar el roster', error: error.message });
    }
};

// GET /api/v1/rosters - Listar todos los rosters (RF-08)
export const listar = async (req, res) => {
    try {
        const { tipo, temporada } = req.query;
        const rosters = await rostersService.listarRosters({ tipo, temporada });
        return res.status(200).json(rosters);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al obtener la lista de rosters', error: error.message });
    }
};

// GET /api/v1/rosters/:id - Ver detalle del roster con sus jugadores (RF-09)
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const roster = await rostersService.obtenerRosterPorId(id);

        if (!roster) {
            return res.status(404).json({ mensaje: `Roster con ID ${id} no encontrado` });
        }

        return res.status(200).json(roster);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al obtener el detalle del roster', error: error.message });
    }
};

// PUT /api/v1/rosters/:id - Actualizar datos del roster (RF-10)
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const rosterActualizado = await rostersService.actualizarRoster(id, req.body);

        if (!rosterActualizado) {
            return res.status(404).json({ mensaje: `Roster con ID ${id} no encontrado` });
        }

        return res.status(200).json(rosterActualizado);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al actualizar el roster', error: error.message });
    }
};

// DELETE /api/v1/rosters/:id - Eliminar un roster (RF-11)
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await rostersService.eliminarRoster(id);

        if (!eliminado) {
            return res.status(404).json({ mensaje: `Roster con ID ${id} no encontrado` });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al eliminar el roster', error: error.message });
    }
};

// GET /api/v1/rosters/:id/jugadores - Listar jugadores de un roster
export const listarJugadores = async (req, res) => {
    try {
        const { id } = req.params;
        const jugadores = await rostersService.listarJugadoresDeRoster(id);

        if (!jugadores) {
            return res.status(404).json({ mensaje: `Roster con ID ${id} no encontrado` });
        }

        return res.status(200).json(jugadores);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al listar jugadores del roster', error: error.message });
    }
};

// POST /api/v1/rosters/:id/jugadores - Asignar jugador al roster (RF-12)
export const asignarJugador = async (req, res) => {
    try {
        const { id } = req.params;
        const asignacion = await rostersService.asignarJugadorARoster(id, req.body);
        return res.status(201).json(asignacion);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al asignar jugador al roster', error: error.message });
    }
};

// PUT /api/v1/rosters/:id/jugadores/:id_jugador - Cambiar rol dentro del roster (RF-12)
export const cambiarRol = async (req, res) => {
    try {
        const { id, id_jugador } = req.params;
        const asignacionActualizada = await rostersService.cambiarRolEnRoster(id, id_jugador, req.body);
        return res.status(200).json(asignacionActualizada);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'Error al cambiar rol en roster', error: error.message });
    }
};

// DELETE /api/v1/rosters/:id/jugadores/:id_jugador - Quitar jugador del roster (RF-13)
export const quitarJugador = async (req, res) => {
    try {
        const { id, id_jugador } = req.params;
        const resultado = await rostersService.quitarJugadorDeRoster(id, id_jugador);

        if (resultado === null) {
            return res.status(404).json({ mensaje: `Roster con ID ${id} no encontrado` });
        }
        if (resultado === false) {
            return res.status(404).json({ mensaje: `El jugador con ID ${id_jugador} no pertenece al roster` });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al remover jugador del roster', error: error.message });
    }
};
