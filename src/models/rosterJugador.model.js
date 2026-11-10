import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_ROSTER_VALIDOS = ['Titular', 'Suplente'];


const RosterJugador = sequelize.define('RosterJugador', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_roster: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rosters',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    id_jugador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'jugadores',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    rol_en_roster: {
        type: DataTypes.ENUM(...ROLES_ROSTER_VALIDOS),
        allowNull: false
    }
}, {
    tableName: 'roster_jugador',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['id_roster', 'id_jugador'],
            name: 'unique_roster_jugador'
        }
    ]
});

export default RosterJugador;
