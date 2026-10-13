import { Sequelize } from 'sequelize';
import 'dotenv/config';

// Configuracion de Sequelize para conectarse a MySQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'esports_db',
    process.env.DB_USER || 'backenduser',
    process.env.DB_PASSWORD || 'superpassword',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false // No mostrar todos los logs de SQL en la terminal
    }
);

// Funcion para probar la conexion
export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida correctamente con MySQL.');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error.message);
    }
};

export default sequelize;
