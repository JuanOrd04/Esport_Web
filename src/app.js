import express from 'express';

const app = express();

// Middlewares basicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simple de peticiones en consola
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Ruta base de bienvenida y estado general
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API REST de eSports: Perfiles de Jugadores y Rosters',
        version: '1.0.0',
        base_url: '/api/v1',
        endpoints: {
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

// Manejo de ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        mensaje: 'Ruta no encontrada'
    });
});

// Manejo centralizado de errores (500)
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: err.message
    });
});

export default app;
