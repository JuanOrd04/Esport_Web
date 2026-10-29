import { Usuario } from '../models/index.js';

/**
 * Asegura la existencia de los usuarios iniciales autorizados en la base de datos
 */
export const asegurarUsuariosIniciales = async () => {
    try {
        const adminEmailEnv = process.env.ADMIN_EMAIL || 'admin@esports.com';

        const usuariosBase = [
            {
                email: 'admin@esports.com',
                nombre: 'Administrador eSports',
                rol: 'Admin',
                autorizado: true
            },
            {
                email: 'orduna.juan@uabc.edu.mx',
                nombre: 'Juan Roberto Orduña López',
                rol: 'Admin',
                autorizado: true
            },
            {
                email: 'molguin@uabc.edu.mx',
                nombre: 'Dr. José Martín Olguín E.',
                rol: 'Admin',
                autorizado: true
            }
        ];

        // Si hay otro ADMIN_EMAIL en el .env agregarlo
        if (!usuariosBase.some(u => u.email.toLowerCase() === adminEmailEnv.toLowerCase())) {
            usuariosBase.push({
                email: adminEmailEnv.toLowerCase(),
                nombre: 'Administrador Principal',
                rol: 'Admin',
                autorizado: true
            });
        }

        for (const u of usuariosBase) {
            const existe = await Usuario.findOne({ where: { email: u.email } });
            if (!existe) {
                await Usuario.create(u);
                console.log(`👤 Usuario inicial registrado en base de datos: ${u.email} [${u.rol}]`);
            }
        }
    } catch (error) {
        console.error('⚠️ Error al asegurar usuarios iniciales:', error.message);
    }
};
