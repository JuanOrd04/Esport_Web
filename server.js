import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor eSports corriendo en http://localhost:${PORT}`);
    console.log(`📡 Endpoints base disponibles en http://localhost:${PORT}/api/v1`);
});
