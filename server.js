import 'dotenv/config';
import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

// Funcion para arrancar el servidor HTTP
const startServer = async () => {
    try {
        // Verificar conexion con MySQL (las tablas se gestionan mediante migraciones con 'npm run migrate')
        await sequelize.authenticate();
        console.log('✅ Conexión establecida con MySQL.');

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
