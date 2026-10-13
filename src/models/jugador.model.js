import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_VALIDOS = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
export const ESTADOS_VALIDOS = ['activo', 'inactivo'];

// Modelo Jugador segun la especificacion RF-01 y Modelo de Datos
const Jugador = sequelize.define('Jugador', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    nombre_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pais: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rol: {
        type: DataTypes.ENUM(...ROLES_VALIDOS),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_VALIDOS),
        allowNull: false,
        defaultValue: 'activo'
    }
}, {
    tableName: 'jugadores',
    timestamps: false
});

export default Jugador;
