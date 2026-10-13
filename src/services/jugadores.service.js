import { Op } from 'sequelize';
import { Jugador, Roster, RosterJugador, ROLES_VALIDOS, ESTADOS_VALIDOS } from '../models/index.js';

// Servicio con la logica de negocio para Jugadores
export const crearJugador = async ({ nickname, nombre_real, pais, rol, estado }) => {
    // Validacion: nickname obligatorio y no vacio
    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
        const error = new Error('El campo nickname es obligatorio y no puede estar vacío');
        error.status = 400;
        throw error;
    }

    // Validacion: rol valido segun RF-01
    if (!rol || !ROLES_VALIDOS.includes(rol)) {
        const error = new Error(`Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // Validacion: estado valido si se envia
    const estadoFinal = estado || 'activo';
    if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
        const error = new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // RN-01: El nickname debe ser unico
    const existente = await Jugador.findOne({
        where: { nickname: nickname.trim() }
    });
    if (existente) {
        const error = new Error(`El nickname "${nickname}" ya está registrado`);
        error.status = 409;
        throw error;
    }

    // Guardar nuevo jugador
    const nuevoJugador = await Jugador.create({
        nickname: nickname.trim(),
        nombre_real: nombre_real ? nombre_real.trim() : null,
        pais: pais ? pais.trim() : null,
        rol,
        estado: estadoFinal
    });

    return nuevoJugador;
};

// RF-02 y RF-06: Listar jugadores con filtros opcionales (rol, estado, search)
export const listarJugadores = async ({ rol, estado, search }) => {
    const where = {};

    if (rol) {
        where.rol = rol;
    }

    if (estado) {
        where.estado = estado;
    }

    if (search) {
        where.nickname = {
            [Op.like]: `%${search}%`
        };
    }

    const jugadores = await Jugador.findAll({
        where,
        order: [['id', 'ASC']]
    });

    return jugadores;
};

// RF-03: Obtener un jugador por su ID
export const obtenerJugadorPorId = async (id) => {
    const jugador = await Jugador.findByPk(id);
    return jugador;
};

// RF-04: Actualizar un jugador con validaciones reforzadas
export const actualizarJugador = async (id, datos) => {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) {
        return null;
    }

    // Validar nickname no vacio si viene en la peticion
    if (datos.nickname !== undefined && (typeof datos.nickname !== 'string' || datos.nickname.trim() === '')) {
        const error = new Error('El nickname no puede estar vacío');
        error.status = 400;
        throw error;
    }

    // Si intenta cambiar el rol, validar catalogo
    if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
        const error = new Error(`Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // Si intenta cambiar el estado, validar catalogo
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
        const error = new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // RN-01: Si cambia el nickname, checar que otro jugador no lo tenga
    if (datos.nickname !== undefined && datos.nickname.trim() !== jugador.nickname) {
        const existeOtro = await Jugador.findOne({
            where: {
                nickname: datos.nickname.trim(),
                id: { [Op.ne]: id }
            }
        });
        if (existeOtro) {
            const error = new Error(`El nickname "${datos.nickname}" ya está registrado`);
            error.status = 409;
            throw error;
        }
    }

    // RN-03 Avanzada: Validar que el nuevo rol no cause conflicto en los rosters donde el jugador es Titular
    if (datos.rol && datos.rol !== jugador.rol) {
        const asignacionesTitular = await RosterJugador.findAll({
            where: { id_jugador: id, rol_en_roster: 'Titular' },
            include: [{ model: Roster, as: 'roster' }]
        });

        for (const asig of asignacionesTitular) {
            const conflicto = await RosterJugador.findOne({
                where: {
                    id_roster: asig.id_roster,
                    id_jugador: { [Op.ne]: id },
                    rol_en_roster: 'Titular'
                },
                include: [{
                    model: Jugador,
                    as: 'jugador',
                    where: { rol: datos.rol }
                }]
            });

            if (conflicto) {
                const nombreRoster = asig.roster ? asig.roster.nombre : `Roster ${asig.id_roster}`;
                const nickOtro = conflicto.jugador ? conflicto.jugador.nickname : 'otro jugador';
                const error = new Error(`No se puede cambiar el rol a "${datos.rol}": generaría conflicto en el roster "${nombreRoster}" donde ya existe un titular con ese rol (${nickOtro})`);
                error.status = 409;
                throw error;
            }
        }
    }

    // Actualizar campos
    await jugador.update({
        nickname: datos.nickname !== undefined ? datos.nickname.trim() : jugador.nickname,
        nombre_real: datos.nombre_real !== undefined ? datos.nombre_real : jugador.nombre_real,
        pais: datos.pais !== undefined ? datos.pais : jugador.pais,
        rol: datos.rol !== undefined ? datos.rol : jugador.rol,
        estado: datos.estado !== undefined ? datos.estado : jugador.estado
    });

    return jugador;
};

// RF-05: Eliminar un jugador
export const eliminarJugador = async (id) => {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) {
        return false;
    }

    await jugador.destroy();
    return true;
};
