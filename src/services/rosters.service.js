import { Roster, Jugador, RosterJugador, TIPOS_ROSTER_VALIDOS, ROLES_ROSTER_VALIDOS } from '../models/index.js';

// Servicio con la logica para Rosters y Asignacion de Jugadores

// RF-07: Crear roster
export const crearRoster = async ({ nombre, juego, tipo, temporada }) => {
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        const error = new Error('El campo nombre es obligatorio');
        error.status = 400;
        throw error;
    }

    const tipoFinal = tipo || 'Principal';
    if (!TIPOS_ROSTER_VALIDOS.includes(tipoFinal)) {
        const error = new Error(`Tipo de roster inválido. Debe ser uno de: ${TIPOS_ROSTER_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    if (!temporada) {
        const error = new Error('El campo temporada es obligatorio');
        error.status = 400;
        throw error;
    }

    const nuevoRoster = await Roster.create({
        nombre: nombre.trim(),
        juego: juego ? juego.trim() : 'League of Legends',
        tipo: tipoFinal,
        temporada: String(temporada).trim()
    });

    return nuevoRoster;
};

// RF-08: Listar rosters con cantidad de jugadores y filtros por tipo y temporada
export const listarRosters = async ({ tipo, temporada }) => {
    const where = {};
    if (tipo) where.tipo = tipo;
    if (temporada) where.temporada = String(temporada);

    const rosters = await Roster.findAll({
        where,
        include: [{
            model: RosterJugador,
            as: 'asignaciones'
        }],
        order: [['id', 'ASC']]
    });

    // Devolvemos la lista incluyendo cantidad_jugadores como pide RF-08
    return rosters.map(r => ({
        id: r.id,
        nombre: r.nombre,
        juego: r.juego,
        tipo: r.tipo,
        temporada: r.temporada,
        cantidad_jugadores: r.asignaciones ? r.asignaciones.length : 0
    }));
};

// RF-09: Ver detalle del roster con sus jugadores y roles (ejemplo de pagina 6)
export const obtenerRosterPorId = async (id) => {
    const roster = await Roster.findByPk(id, {
        include: [{
            model: RosterJugador,
            as: 'asignaciones',
            include: [{
                model: Jugador,
                as: 'jugador'
            }]
        }]
    });

    if (!roster) return null;

    // Formatear jugadores segun la respuesta esperada
    const jugadoresFormateados = (roster.asignaciones || []).map(asig => ({
        id: asig.jugador.id,
        nickname: asig.jugador.nickname,
        rol: asig.jugador.rol,
        rol_en_roster: asig.rol_en_roster
    }));

    return {
        id: roster.id,
        nombre: roster.nombre,
        juego: roster.juego,
        tipo: roster.tipo,
        temporada: roster.temporada,
        jugadores: jugadoresFormateados
    };
};

// RF-10: Editar roster con validaciones reforzadas
export const actualizarRoster = async (id, datos) => {
    const roster = await Roster.findByPk(id);
    if (!roster) return null;

    if (datos.nombre !== undefined && (typeof datos.nombre !== 'string' || datos.nombre.trim() === '')) {
        const error = new Error('El nombre del roster no puede estar vacío');
        error.status = 400;
        throw error;
    }

    if (datos.temporada !== undefined && String(datos.temporada).trim() === '') {
        const error = new Error('La temporada no puede estar vacía');
        error.status = 400;
        throw error;
    }

    if (datos.tipo && !TIPOS_ROSTER_VALIDOS.includes(datos.tipo)) {
        const error = new Error(`Tipo de roster inválido. Debe ser uno de: ${TIPOS_ROSTER_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    await roster.update({
        nombre: datos.nombre !== undefined ? datos.nombre.trim() : roster.nombre,
        juego: datos.juego !== undefined ? datos.juego.trim() : roster.juego,
        tipo: datos.tipo !== undefined ? datos.tipo : roster.tipo,
        temporada: datos.temporada !== undefined ? String(datos.temporada).trim() : roster.temporada
    });

    return roster;
};

// RF-11 y RN-05: Eliminar roster (los jugadores no se eliminan)
export const eliminarRoster = async (id) => {
    const roster = await Roster.findByPk(id);
    if (!roster) return false;

    await roster.destroy();
    return true;
};

// RF-12: Listar jugadores de un roster
export const listarJugadoresDeRoster = async (idRoster) => {
    const roster = await Roster.findByPk(idRoster);
    if (!roster) return null;

    const asignaciones = await RosterJugador.findAll({
        where: { id_roster: idRoster },
        include: [{ model: Jugador, as: 'jugador' }]
    });

    return asignaciones.map(a => ({
        id: a.jugador.id,
        nickname: a.jugador.nickname,
        rol: a.jugador.rol,
        rol_en_roster: a.rol_en_roster
    }));
};

// RF-12: Asignar jugador a un roster con reglas RN-02, RN-03 y RN-04
export const asignarJugadorARoster = async (idRoster, { id_jugador, rol_en_roster }) => {
    // 1. Roster existente (404 si no existe)
    const roster = await Roster.findByPk(idRoster);
    if (!roster) {
        const error = new Error(`Roster con ID ${idRoster} no encontrado`);
        error.status = 404;
        throw error;
    }

    // 2. Jugador existente (404 si no existe)
    if (!id_jugador) {
        const error = new Error('El campo id_jugador es obligatorio');
        error.status = 400;
        throw error;
    }
    const jugador = await Jugador.findByPk(id_jugador);
    if (!jugador) {
        const error = new Error(`Jugador con ID ${id_jugador} no encontrado`);
        error.status = 404;
        throw error;
    }

    // 3. Rol en roster valido (400 si no es Titular o Suplente)
    if (!rol_en_roster || !ROLES_ROSTER_VALIDOS.includes(rol_en_roster)) {
        const error = new Error(`Rol en roster inválido. Debe ser uno de: ${ROLES_ROSTER_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // 4. Jugador ya asignado a este mismo roster (409 Conflict)
    const yaAsignado = await RosterJugador.findOne({
        where: { id_roster: idRoster, id_jugador: id_jugador }
    });
    if (yaAsignado) {
        const error = new Error('El jugador ya está asignado a este roster');
        error.status = 409;
        throw error;
    }

    // 5. Validaciones para Titular
    if (rol_en_roster === 'Titular') {
        const asignacionesActuales = await RosterJugador.findAll({
            where: { id_roster: idRoster },
            include: [{ model: Jugador, as: 'jugador' }]
        });

        const titulares = asignacionesActuales.filter(a => a.rol_en_roster === 'Titular');

        // RN-02: Maximo 5 titulares por roster (409 Conflict)
        if (titulares.length >= 5) {
            const error = new Error('El roster ya cuenta con el máximo de 5 titulares');
            error.status = 409;
            throw error;
        }

        // RN-03: No puede haber dos titulares con el mismo rol (409 Conflict)
        const titularConMismoRol = titulares.find(a => a.jugador.rol === jugador.rol);
        if (titularConMismoRol) {
            const error = new Error(`Conflicto de rol: ya existe un titular con el rol "${jugador.rol}" (${titularConMismoRol.jugador.nickname})`);
            error.status = 409;
            throw error;
        }
    }

    // Guardar asignacion
    const nuevaAsignacion = await RosterJugador.create({
        id_roster: Number(idRoster),
        id_jugador: Number(id_jugador),
        rol_en_roster
    });

    return {
        id: nuevaAsignacion.id,
        id_roster: nuevaAsignacion.id_roster,
        id_jugador: nuevaAsignacion.id_jugador,
        rol_en_roster: nuevaAsignacion.rol_en_roster
    };
};

// Cambiar rol dentro del roster (Titular/Suplente)
export const cambiarRolEnRoster = async (idRoster, idJugador, { rol_en_roster }) => {
    const roster = await Roster.findByPk(idRoster);
    if (!roster) {
        const error = new Error(`Roster con ID ${idRoster} no encontrado`);
        error.status = 404;
        throw error;
    }

    const asignacion = await RosterJugador.findOne({
        where: { id_roster: idRoster, id_jugador: idJugador },
        include: [{ model: Jugador, as: 'jugador' }]
    });

    if (!asignacion) {
        const error = new Error(`El jugador con ID ${idJugador} no pertenece a este roster`);
        error.status = 404;
        throw error;
    }

    if (!rol_en_roster || !ROLES_ROSTER_VALIDOS.includes(rol_en_roster)) {
        const error = new Error(`Rol en roster inválido. Debe ser uno de: ${ROLES_ROSTER_VALIDOS.join(', ')}`);
        error.status = 400;
        throw error;
    }

    // Si se pasa a Titular, validar limites
    if (rol_en_roster === 'Titular' && asignacion.rol_en_roster !== 'Titular') {
        const asignacionesActuales = await RosterJugador.findAll({
            where: { id_roster: idRoster },
            include: [{ model: Jugador, as: 'jugador' }]
        });

        const titulares = asignacionesActuales.filter(a => a.rol_en_roster === 'Titular');

        // RN-02: Maximo 5 titulares
        if (titulares.length >= 5) {
            const error = new Error('El roster ya cuenta con el máximo de 5 titulares');
            error.status = 409;
            throw error;
        }

        // RN-03: No repetir rol titular
        const titularConMismoRol = titulares.find(a => a.jugador.rol === asignacion.jugador.rol);
        if (titularConMismoRol) {
            const error = new Error(`Conflicto de rol: ya existe un titular con el rol "${asignacion.jugador.rol}" (${titularConMismoRol.jugador.nickname})`);
            error.status = 409;
            throw error;
        }
    }

    await asignacion.update({ rol_en_roster });

    return {
        id: asignacion.id,
        id_roster: asignacion.id_roster,
        id_jugador: asignacion.id_jugador,
        rol_en_roster: asignacion.rol_en_roster
    };
};

// RF-13: Quitar jugador del roster
export const quitarJugadorDeRoster = async (idRoster, idJugador) => {
    const roster = await Roster.findByPk(idRoster);
    if (!roster) {
        return null; // Roster no encontrado
    }

    const asignacion = await RosterJugador.findOne({
        where: { id_roster: idRoster, id_jugador: idJugador }
    });

    if (!asignacion) {
        return false; // Asignacion no encontrada
    }

    await asignacion.destroy();
    return true;
};
