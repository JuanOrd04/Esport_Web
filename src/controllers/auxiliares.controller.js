import { ROLES_VALIDOS, ESTADOS_VALIDOS, TIPOS_ROSTER_VALIDOS } from '../models/index.js';
import sequelize from '../config/database.js';


export const obtenerRoles = (req, res) => {
    res.status(200).json(ROLES_VALIDOS);
};


export const obtenerEstados = (req, res) => {
    res.status(200).json(ESTADOS_VALIDOS);
};


export const obtenerTiposRoster = (req, res) => {
    res.status(200).json(TIPOS_ROSTER_VALIDOS);
};


export const obtenerHealth = async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({
            status: 'ok',
            mensaje: 'API eSports funcionando correctamente',
            database: 'conectada',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            mensaje: 'Fallo de conexion con la base de datos',
            database: 'desconectada',
            error: error.message
        });
    }
};
