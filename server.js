import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import app from './src/app.js';
import { sequelize } from './src/models/index.js';
import { asegurarUsuariosIniciales } from './src/config/seedUsuarios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5000;

// Función para arrancar el servidor (HTTP y HTTPS opcional)
const startServer = async () => {
    try {
        // 1. Verificar conexión con MySQL
        await sequelize.authenticate();
        console.log('✅ Conexión establecida con MySQL.');

        // 2. Asegurar que los usuarios iniciales autorizados existan en la tabla usuarios
        await asegurarUsuariosIniciales();

        // 3. Iniciar Servidor HTTP principal
        const httpServer = http.createServer(app);
        httpServer.listen(PORT, () => {
            console.log(`🚀 Servidor eSports HTTP corriendo en:        http://localhost:${PORT}`);
            console.log(`🔐 Ruta Google Login:                        http://localhost:${PORT}/auth/google/login`);
            console.log(`↩️  Ruta Google Callback:                     http://localhost:${PORT}/auth/google/callback`);
            console.log(`📚 Documentación interactiva (Swagger UI):    http://localhost:${PORT}/api-docs`);
            console.log(`📡 Endpoints base disponibles en:             http://localhost:${PORT}/api/v1`);
        });

        // 4. Configurar Servidor HTTPS si los certificados SSL están presentes (Unidad 4)
        const certDir = path.join(__dirname, 'cert');
        const keyPath = fs.existsSync(path.join(certDir, 'key.pem'))
            ? path.join(certDir, 'key.pem')
            : (fs.existsSync(path.join(__dirname, 'key.pem')) ? path.join(__dirname, 'key.pem') : null);

        const certPath = fs.existsSync(path.join(certDir, 'cert.pem'))
            ? path.join(certDir, 'cert.pem')
            : (fs.existsSync(path.join(__dirname, 'cert.pem')) ? path.join(__dirname, 'cert.pem') : null);

        if (keyPath && certPath) {
            try {
                const sslOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };

                const httpsServer = https.createServer(sslOptions, app);
                httpsServer.listen(HTTPS_PORT, () => {
                    console.log(`🔒 Servidor eSports HTTPS seguro activo en:    https://localhost:${HTTPS_PORT}`);
                    console.log(`🔐 Google Login seguro (HTTPS):              https://localhost:${HTTPS_PORT}/auth/google/login`);
                });
            } catch (sslErr) {
                console.warn('⚠️ No se pudo inicializar servidor HTTPS con certificados existentes:', sslErr.message);
            }
        }
    } catch (error) {
        console.error('❌ Error fatal al conectar con la base de datos:', error.message);
        process.exit(1);
    }
};

startServer();
