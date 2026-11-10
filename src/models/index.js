import sequelize from '../config/database.js';
import Jugador, { ROLES_VALIDOS, ESTADOS_VALIDOS } from './jugador.model.js';
import Roster, { TIPOS_ROSTER_VALIDOS } from './roster.model.js';
import RosterJugador, { ROLES_ROSTER_VALIDOS } from './rosterJugador.model.js';
import Usuario, { ROLES_USUARIO } from './usuario.model.js';


Roster.belongsToMany(Jugador, {
    through: RosterJugador,
    foreignKey: 'id_roster',
    otherKey: 'id_jugador',
    as: 'jugadores'
});

Jugador.belongsToMany(Roster, {
    through: RosterJugador,
    foreignKey: 'id_jugador',
    otherKey: 'id_roster',
    as: 'rosters'
});


Roster.hasMany(RosterJugador, { foreignKey: 'id_roster', as: 'asignaciones' });
RosterJugador.belongsTo(Roster, { foreignKey: 'id_roster', as: 'roster' });

Jugador.hasMany(RosterJugador, { foreignKey: 'id_jugador', as: 'asignaciones' });
RosterJugador.belongsTo(Jugador, { foreignKey: 'id_jugador', as: 'jugador' });

export {
    sequelize,
    Jugador,
    Roster,
    RosterJugador,
    Usuario,
    ROLES_USUARIO,
    ROLES_VALIDOS,
    ESTADOS_VALIDOS,
    TIPOS_ROSTER_VALIDOS,
    ROLES_ROSTER_VALIDOS
};

