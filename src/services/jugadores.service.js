import { Op } from 'sequelize';
import { Jugador, ROLES_VALIDOS, ESTADOS_VALIDOS } from '../models/index.js';

// Servicio con la logica de negocio para Jugadores
export const crearJugador = async ({ nickname, nombre_real, pais, rol, estado }) => {
    // Validacion: nickname obligatorio
    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
        const error = new Error('El campo nickname es obligatorio');
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

// RF-04: Actualizar un jugador
export const actualizarJugador = async (id, datos) => {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) {
        return null;
    }

    // Si intenta cambiar el rol, validar que sea valido
    if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
        const error = new Error(`Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // Si intenta cambiar el estado, validar que sea valido
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
        const error = new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // RN-01: Si cambia el nickname, checar que otro jugador no lo tenga
    if (datos.nickname && datos.nickname.trim() !== jugador.nickname) {
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
