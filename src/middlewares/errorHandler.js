// Middleware centralizado para captura y respuesta uniforme de errores
export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const mensaje = err.message || 'Error interno del servidor';

    if (status === 500) {
        console.error('❌ Error 500 interno:', err);
    }

    return res.status(status).json({
        mensaje
    });
};

export default errorHandler;
