import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const ROLES_USUARIO = ['Admin', 'Usuario'];

class Usuario extends Model {
    /**
     * Consulta si un usuario está registrado y autorizado en la base de datos
     * @param {string} email Correo del usuario
     * @returns {Promise<Usuario|null>}
     */
    static async isUserAuthorized(email) {
        if (!email || typeof email !== 'string') return null;
        const usuario = await this.findOne({
            where: {
                email: email.trim().toLowerCase(),
                autorizado: true
            }
        });
        return usuario;
    }

    /**
     * Registra o actualiza los datos de un usuario autenticado por Google
     * @param {object} userInfo Datos de perfil retornados por Google OAuth
     * @returns {Promise<Usuario>}
     */
    static async registrarOActualizarGoogleUser(userInfo) {
        const email = userInfo.email.trim().toLowerCase();
        let usuario = await this.findOne({ where: { email } });

        if (usuario) {
            usuario.google_id = userInfo.id || usuario.google_id;
            usuario.nombre = userInfo.name || usuario.nombre;
            usuario.avatar = userInfo.picture || usuario.avatar;
            usuario.ultimo_acceso = new Date();
            await usuario.save();
        } else {
            usuario = await this.create({
                google_id: userInfo.id,
                email,
                nombre: userInfo.name || email.split('@')[0],
                avatar: userInfo.picture || null,
                rol: 'Admin', // Por defecto los usuarios registrados en este proyecto son Admin
                autorizado: true,
                ultimo_acceso: new Date()
            });
        }

        return usuario;
    }
}

Usuario.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    rol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Admin'
    },
    autorizado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    ultimo_acceso: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Usuario;
