import 'dotenv/config';
import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

// Funcion para arrancar el servidor y sincronizar la BD
const startServer = async () => {
    try {
        // Verificar conexion
        await sequelize.authenticate();
        console.log('✅ Conexión establecida con MySQL.');

        // Sincronizar modelos (crea las tablas si no existen)
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados correctamente con la base de datos.');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor eSports corriendo en http://localhost:${PORT}`);
            console.log(`📚 Documentación interactiva (Swagger UI): http://localhost:${PORT}/api-docs`);
            console.log(`📄 Especificación OpenAPI (JSON):         http://localhost:${PORT}/openapi.json`);
            console.log(`📡 Endpoints base disponibles en:          http://localhost:${PORT}/api/v1`);
        });
    } catch (error) {
        console.error('❌ Error fatal al conectar con la base de datos:', error.message);
        process.exit(1);
    }
};

startServer();
