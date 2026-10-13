import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const TIPOS_ROSTER_VALIDOS = ['Principal', 'Academy'];

// Modelo Roster segun RF-07 y Modelo de Datos
const Roster = sequelize.define('Roster', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    juego: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'League of Legends'
    },
    tipo: {
        type: DataTypes.ENUM(...TIPOS_ROSTER_VALIDOS),
        allowNull: false,
        defaultValue: 'Principal'
    },
    temporada: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'rosters',
    timestamps: false
});

export default Roster;
