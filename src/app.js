import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import auxiliaresRoutes from './routes/auxiliares.routes.js';
import jugadoresRoutes from './routes/jugadores.routes.js';
import rostersRoutes from './routes/rosters.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar la especificacion de OpenAPI
const swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'docs', 'openapi.json'), 'utf8')
);

const app = express();

// Middlewares basicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simple de peticiones en consola
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Documentacion interactiva Swagger / OpenAPI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/openapi.json', (req, res) => res.json(swaggerDocument));

// Indice base de la API bajo /api/v1
app.get('/api/v1', (req, res) => {
    res.json({
        mensaje: 'API REST eSports v1',
        version: '1.0.0',
        recursos: {
            jugadores: '/api/v1/jugadores',
            rosters: '/api/v1/rosters',
            auxiliares: {
                roles: '/api/v1/roles',
                estados: '/api/v1/estados',
                tipos_roster: '/api/v1/tipos-roster',
                health: '/api/v1/health'
            }
        }
    });
});

// Rutas de la API bajo /api/v1
app.use('/api/v1', auxiliaresRoutes);
app.use('/api/v1/jugadores', jugadoresRoutes);
app.use('/api/v1/rosters', rostersRoutes);

// Ruta raiz general
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Bienvenido a la API REST de eSports: Perfiles de Jugadores y Rosters',
        version: '1.0.0',
        documentacion: '/api-docs',
        especificacion_openapi: '/openapi.json',
        base_url: '/api/v1'
    });
});

// Manejo de ruta no encontrada (404)
app.use((req, res, next) => {
    next(new AppError('Recurso no encontrado', 404));
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

export default app;
