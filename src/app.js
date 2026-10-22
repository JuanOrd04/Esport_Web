import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import auxiliaresRoutes from './routes/auxiliares.routes.js';
import jugadoresRoutes from './routes/jugadores.routes.js';
import rostersRoutes from './routes/rosters.routes.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar la especificacion de OpenAPI
const swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'docs', 'openapi.json'), 'utf8')
);

const app = express();

// Middlewares basicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuracion de CORS para transmision segura de Cookies y Headers personalizados
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones del mismo origen (navegador directo) o listas permitidas
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // Flexible para desarrollo
    },
    credentials: true, // Requerido para recibir y enviar cookies HTTP-Only
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token']
}));

// Log simple de peticiones en consola
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Servir frontend estatico para el panel de Administrador desde public/
app.use(express.static(path.join(rootDir, 'public')));
app.get('/admin', (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'index.html'));
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
            auth: {
                login: 'POST /api/v1/auth/login',
                logout: 'POST /api/v1/auth/logout',
                verify: 'GET /api/v1/auth/verify'
            },
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', auxiliaresRoutes);
app.use('/api/v1/jugadores', jugadoresRoutes);
app.use('/api/v1/rosters', rostersRoutes);

// Manejo de ruta no encontrada (404)
app.use((req, res, next) => {
    next(new AppError('Recurso no encontrado', 404));
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

export default app;
