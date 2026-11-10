import { test, expect } from '@playwright/test';

/**
 * ============================================================================
 * SUITE DE PRUEBAS E2E CON PLAYWRIGHT - META 4.2
 * API eSports: Perfiles de Jugadores y Rosters
 * ============================================================================
 * Cumple con los requerimientos de la Meta 4.2:
 * 1. Frontend con funcionalidad completa para roles Admin y Public.
 * 2. Backend que provee los servicios para el Frontend.
 * 3. Suite de validación en Playwright con al menos una prueba por funcionalidad.
 * 4. Esquema de seguridad JWT con protección CSRF (HTTP-Only + Doble Cookie).
 * 5. Autenticación local (usuario y password almacenados localmente) para agilizar las pruebas.
 */

test.describe('1. Funcionalidades del Rol Público (Solo Lectura)', () => {

    test.beforeEach(async ({ page, context }) => {
        // Asegurarse de que no haya cookies de sesión residuales
        await context.clearCookies();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('1.1 Debería mostrar la interfaz en Modo Público y solo lectura', async ({ page }) => {
        // 1. Verificar insignia de rol
        const roleBadge = page.locator('#role-badge');
        await expect(roleBadge).toHaveText('Público');

        // 2. Verificar banner informativo de modo público
        const statusText = page.locator('#status-text');
        await expect(statusText).toContainText('Modo Público (Solo lectura)');

        // 3. Verificar botón para abrir login
        const btnOpenLogin = page.locator('#btn-open-login');
        await expect(btnOpenLogin).toBeVisible();

        // 4. Los botones administrativos deben estar ocultos para el público
        await expect(page.locator('#btn-nuevo-jugador')).toBeHidden();
        await expect(page.locator('#btn-nuevo-roster')).toBeHidden();
        await expect(page.locator('#csrf-indicator')).toBeHidden();
    });

    test('1.2 Debería mostrar el catálogo de jugadores en modo solo lectura', async ({ page }) => {
        // Esperar a que se carguen las tarjetas de jugadores
        const playerCards = page.locator('.player-row-card');
        await expect(playerCards.first()).toBeVisible({ timeout: 10000 });
        const count = await playerCards.count();
        expect(count).toBeGreaterThan(0);

        // En modo público se muestra "Lectura" en lugar de botones de acción
        const readonlyLabels = page.locator('.readonly-label');
        await expect(readonlyLabels.first()).toHaveText('Lectura');

        // No debe haber botones de editar o eliminar jugador
        await expect(page.locator('.btn-edit-jugador')).toHaveCount(0);
        await expect(page.locator('.btn-del-jugador')).toHaveCount(0);
    });

    test('1.3 Debería permitir buscar jugadores por nickname reactivamente', async ({ page }) => {
        const inputSearch = page.locator('#filtro-search');
        await inputSearch.fill('Faker');
        // Esperar el debounce de 300ms
        await page.waitForTimeout(600);

        const playerCards = page.locator('.player-row-card');
        await expect(playerCards).toHaveCount(1);
        await expect(page.locator('.player-nickname').first()).toContainText('Faker');

        // Limpiar búsqueda y verificar restauración de la lista
        await inputSearch.fill('');
        await page.waitForTimeout(600);
        const countDespues = await page.locator('.player-row-card').count();
        expect(countDespues).toBeGreaterThan(1);
    });

    test('1.4 Debería permitir filtrar jugadores por Rol y por Estado', async ({ page }) => {
        const selectRol = page.locator('#filtro-rol');
        await selectRol.selectOption('Mid');
        await page.waitForTimeout(500);

        // Verificar que los jugadores mostrados tengan rol Mid
        const roleBadges = page.locator('.role-badge');
        const count = await roleBadges.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(roleBadges.nth(i)).toContainText('Mid');
        }

        // Restablecer filtro de rol y probar filtro de estado
        await selectRol.selectOption('');
        const selectEstado = page.locator('#filtro-estado');
        await selectEstado.selectOption('activo');
        await page.waitForTimeout(500);

        const statusPills = page.locator('.status-pill');
        const statusCount = await statusPills.count();
        expect(statusCount).toBeGreaterThan(0);
        for (let i = 0; i < statusCount; i++) {
            await expect(statusPills.nth(i)).toContainText('Activo');
        }
    });

    test('1.5 Debería navegar a la sección de Rosters en modo público', async ({ page }) => {
        // Clic en pestaña de Rosters
        await page.locator('#tab-rosters-btn').click();
        await expect(page.locator('#section-rosters')).toBeVisible();
        await expect(page.locator('#section-jugadores')).toBeHidden();

        // Verificar que no se muestre el botón de crear nuevo roster
        await expect(page.locator('#btn-nuevo-roster')).toBeHidden();

        // Verificar que se muestre al menos una tarjeta de roster
        const rosterCards = page.locator('.roster-card');
        await expect(rosterCards.first()).toBeVisible({ timeout: 10000 });

        // En modo público solo debe tener el botón "Ver Roster", sin botones de editar o eliminar
        await expect(page.locator('.btn-ver-roster').first()).toBeVisible();
        await expect(page.locator('.btn-edit-roster')).toHaveCount(0);
        await expect(page.locator('.btn-del-roster')).toHaveCount(0);
    });

    test('1.6 Debería permitir filtrar rosters por Tipo y Temporada', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        // 1. Filtrar por Tipo Principal
        const selectTipo = page.locator('#filtro-roster-tipo');
        await selectTipo.selectOption('Principal');
        await page.waitForTimeout(500);

        const badges = page.locator('.roster-card .badge-principal');
        const count = await badges.count();
        expect(count).toBeGreaterThan(0);

        // 2. Limpiar tipo y filtrar por temporada 2025
        await selectTipo.selectOption('');
        const inputTemporada = page.locator('#filtro-roster-temporada');
        await inputTemporada.fill('2025');
        await page.waitForTimeout(500);
        await expect(page.locator('.roster-card').first()).toBeVisible();

        // 3. Limpiar temporada
        await inputTemporada.fill('');
        await page.waitForTimeout(500);
    });

    test('1.7 Debería abrir el modal de detalle del roster en modo solo lectura', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        // Abrir detalle del primer roster
        await page.locator('.btn-ver-roster').first().click();

        const modalDetalle = page.locator('#modal-detalle-roster');
        await expect(modalDetalle).toHaveClass(/active/);
        await expect(page.locator('#detalle-roster-nombre')).toBeVisible();

        // En modo público el formulario para asignar jugador debe estar oculto
        await expect(page.locator('#form-asignar-container')).toBeHidden();

        // Si hay jugadores asignados, sus acciones deben indicar "Solo lectura"
        const accionesCeldas = page.locator('#tabla-asignaciones-body tr td:last-child');
        const celdasCount = await accionesCeldas.count();
        if (celdasCount > 0) {
            await expect(accionesCeldas.first()).toContainText('Solo lectura');
        }

        // Cerrar modal
        await page.locator('#btn-close-detalle').click();
        await expect(modalDetalle).not.toHaveClass(/active/);
    });
});


test.describe('2. Autenticación Local y Seguridad (JWT + CSRF)', () => {

    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('2.1 Debería rechazar intento de inicio de sesión con contraseña incorrecta', async ({ page }) => {
        // Abrir modal de login
        await page.locator('#btn-open-login').click();
        const modalLogin = page.locator('#modal-login');
        await expect(modalLogin).toHaveClass(/active/);

        // Ingresar credenciales inválidas
        await page.locator('#login-email').fill('admin@esports.com');
        await page.locator('#login-password').fill('clave_totalmente_invalida_999');

        await page.locator('#form-login button[type="submit"]').click();

        // Debe aparecer un toast de error
        const toastError = page.locator('.toast-error');
        await expect(toastError).toBeVisible({ timeout: 5000 });
        await expect(toastError).toContainText(/incorrecta|inválidas/i);

        // El usuario debe seguir en rol Público
        await expect(page.locator('#role-badge')).toHaveText('Público');
    });

    test('2.2 Debería autenticar exitosamente con credenciales locales y activar cookies seguras y CSRF', async ({ page, context }) => {
        // Abrir modal de login
        await page.locator('#btn-open-login').click();

        // Ingresar credenciales locales válidas
        await page.locator('#login-email').fill('admin@esports.com');
        await page.locator('#login-password').fill('admin123');

        await page.locator('#form-login button[type="submit"]').click();

        // Esperar toast de bienvenida
        await expect(page.locator('.toast-success', { hasText: /Bienvenido/i })).toBeVisible({ timeout: 5000 });

        // El modal debe haberse cerrado
        await expect(page.locator('#modal-login')).not.toHaveClass(/active/);

        // Verificar cambio visual al Rol Administrador
        await expect(page.locator('#role-badge')).toHaveText('Admin');
        await expect(page.locator('#status-text')).toContainText('Rol Administrador');
        await expect(page.locator('#csrf-indicator')).toBeVisible();

        // Verificar que el botón de nuevo jugador es visible en la sección de jugadores
        await expect(page.locator('#btn-nuevo-jugador')).toBeVisible();

        // Cambiar a la pestaña de Rosters para verificar que el botón de nuevo roster también es visible
        await page.locator('#tab-rosters-btn').click();
        await expect(page.locator('#btn-nuevo-roster')).toBeVisible();

        // Volver a la pestaña de Jugadores
        await page.locator('#tab-jugadores-btn').click();

        // Verificar que en cada jugador ahora aparezcan los botones de editar y eliminar
        await expect(page.locator('.btn-edit-jugador').first()).toBeVisible();
        await expect(page.locator('.btn-del-jugador').first()).toBeVisible();

        // Verificar existencia de cookies seguras (JWT HTTP-Only y token CSRF)
        const cookies = await context.cookies();
        const jwtCookie = cookies.find(c => c.name === 'jwt_token' || c.name === 'session_token');
        const csrfCookie = cookies.find(c => c.name === 'csrf_token');

        expect(jwtCookie).toBeDefined();
        expect(jwtCookie?.httpOnly).toBe(true); // Mitigación XSS (HTTP-Only)
        expect(csrfCookie).toBeDefined();
        expect(csrfCookie?.value.length).toBeGreaterThan(10);
    });

    test('2.3 Debería validar que el backend rechaza peticiones protegidas sin header CSRF válido', async ({ request }) => {
        // Primero obtener una sesión válida haciendo login directo vía API
        const loginRes = await request.post('/api/v1/auth/login', {
            data: { email: 'admin@esports.com', password: 'admin123' },
            headers: { 'x-api-key': 'esports_api_key_secret_2026' }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        const csrfValido = loginData.csrfToken;
        expect(csrfValido).toBeDefined();

        // Intentar crear un jugador SIN el header x-csrf-token -> Debe retornar 403 Forbidden
        const resSinCsrf = await request.post('/api/v1/jugadores', {
            data: {
                nickname: 'HackerSinCSRF',
                rol: 'Mid',
                estado: 'activo'
            },
            headers: {
                'x-api-key': 'esports_api_key_secret_2026'
                // Omitimos x-csrf-token
            }
        });
        expect(resSinCsrf.status()).toBe(403);
        const dataSinCsrf = await resSinCsrf.json();
        expect(dataSinCsrf.mensaje).toMatch(/CSRF/i);

        // Intentar con un x-csrf-token falso -> Debe retornar 403 Forbidden
        const resCsrfInvalido = await request.post('/api/v1/jugadores', {
            data: {
                nickname: 'HackerCsrfFalso',
                rol: 'Mid',
                estado: 'activo'
            },
            headers: {
                'x-api-key': 'esports_api_key_secret_2026',
                'x-csrf-token': 'token_completamente_falso_y_malicioso_123'
            }
        });
        expect(resCsrfInvalido.status()).toBe(403);
    });

    test('2.4 Debería cerrar sesión correctamente (Logout) y volver al estado Público', async ({ page }) => {
        // Iniciar sesión
        await page.locator('#btn-open-login').click();
        await page.locator('#login-email').fill('admin@esports.com');
        await page.locator('#login-password').fill('admin123');
        await page.locator('#form-login button[type="submit"]').click();
        await expect(page.locator('#role-badge')).toHaveText('Admin');

        // Cerrar sesión
        await page.locator('#btn-logout').click();

        // Verificar mensaje de confirmación
        await expect(page.locator('.toast-success', { hasText: /Sesión cerrada/i })).toBeVisible({ timeout: 5000 });

        // Debe regresar al modo Público
        await expect(page.locator('#role-badge')).toHaveText('Público');
        await expect(page.locator('#status-text')).toContainText('Modo Público');
        await expect(page.locator('#btn-open-login')).toBeVisible();
        await expect(page.locator('#btn-nuevo-jugador')).toBeHidden();
        await expect(page.locator('#csrf-indicator')).toBeHidden();
    });
});


test.describe.serial('3. Funcionalidades del Rol Administrador (CRUD y Reglas de Negocio)', () => {

    const testNick = `PW_${Date.now().toString().slice(-6)}`;
    const testRosterName = `Roster_E2E_${Date.now().toString().slice(-4)}`;

    test.beforeEach(async ({ page }) => {
        // Login como Administrador antes de cada prueba
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#btn-open-login').click();
        await page.locator('#login-email').fill('admin@esports.com');
        await page.locator('#login-password').fill('admin123');
        await page.locator('#form-login button[type="submit"]').click();

        await expect(page.locator('#role-badge')).toHaveText('Admin', { timeout: 10000 });
    });

    test('3.1 Admin: Debería crear un nuevo jugador exitosamente', async ({ page }) => {
        // Clic en + Nuevo Jugador
        await page.locator('#btn-nuevo-jugador').click();
        const modal = page.locator('#modal-jugador');
        await expect(modal).toHaveClass(/active/);

        // Llenar datos
        await page.locator('#jugador-nickname').fill(testNick);
        await page.locator('#jugador-nombre').fill('Jugador Playwright Test');
        await page.locator('#jugador-pais').fill('Corea del Sur');
        await page.locator('#jugador-rol').selectOption('Top');
        await page.locator('#jugador-estado').selectOption('activo');

        // Guardar
        await page.locator('#form-jugador button[type="submit"]').click();

        // Esperar notificación de éxito
        await expect(page.locator('.toast-success', { hasText: /registrado exitosamente/i })).toBeVisible({ timeout: 5000 });
        await expect(modal).not.toHaveClass(/active/);

        // Buscar el jugador creado para confirmar que aparece en la lista
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);

        const card = page.locator('.player-row-card', { hasText: testNick });
        await expect(card).toBeVisible();
        await expect(card.locator('.player-nickname')).toContainText(testNick);
        await expect(card.locator('.player-role-col')).toContainText('Top');
    });

    test('3.2 Admin: Debería editar un jugador existente', async ({ page }) => {
        // Buscar el jugador de prueba
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);

        const card = page.locator('.player-row-card', { hasText: testNick });
        await expect(card).toBeVisible();

        // Clic en botón editar
        await card.locator('.btn-edit-jugador').click();

        const modal = page.locator('#modal-jugador');
        await expect(modal).toHaveClass(/active/);
        await expect(page.locator('#modal-jugador-titulo')).toContainText('Editar Jugador');

        // Modificar nombre real y país
        await page.locator('#jugador-nombre').fill('Nombre Modificado Playwright');
        await page.locator('#jugador-pais').fill('México');

        // Guardar
        await page.locator('#form-jugador button[type="submit"]').click();

        await expect(page.locator('.toast-success', { hasText: /actualizado correctamente/i })).toBeVisible({ timeout: 5000 });
        await expect(modal).not.toHaveClass(/active/);

        // Verificar cambio en la tarjeta
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);
        await expect(page.locator('.player-row-card', { hasText: testNick }).locator('.player-realname')).toHaveText('Nombre Modificado Playwright');
    });

    test('3.3 Admin: Debería crear un nuevo Roster', async ({ page }) => {
        // Ir a sección de Rosters
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        // Clic en + Nuevo Roster
        await page.locator('#btn-nuevo-roster').click();
        const modal = page.locator('#modal-roster');
        await expect(modal).toHaveClass(/active/);

        // Llenar formulario
        await page.locator('#roster-nombre').fill(testRosterName);
        await page.locator('#roster-juego').fill('League of Legends');
        await page.locator('#roster-tipo').selectOption('Academy');
        await page.locator('#roster-temporada').fill('2026');

        // Guardar
        await page.locator('#form-roster button[type="submit"]').click();

        await expect(page.locator('.toast-success', { hasText: /creado exitosamente/i })).toBeVisible({ timeout: 5000 });
        await expect(modal).not.toHaveClass(/active/);

        // Verificar que el nuevo roster se muestra en el grid
        await page.locator('#filtro-roster-temporada').fill('2026');
        await page.waitForTimeout(500);

        const card = page.locator('.roster-card', { hasText: testRosterName });
        await expect(card).toBeVisible();
        await expect(card.locator('.roster-title')).toHaveText(testRosterName);
    });

    test('3.4 Admin: Debería asignar un jugador al Roster creado', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        // Ubicar el roster de prueba y abrir detalle
        const rosterCard = page.locator('.roster-card', { hasText: testRosterName });
        await expect(rosterCard).toBeVisible();
        await rosterCard.locator('.btn-ver-roster').click();

        const modalDetalle = page.locator('#modal-detalle-roster');
        await expect(modalDetalle).toHaveClass(/active/);

        // En modo Admin el formulario de asignación debe estar disponible
        const formAsignar = page.locator('#form-asignar-container');
        await expect(formAsignar).toBeVisible();

        // Esperar a que se carguen los jugadores en el select
        const selectJugador = page.locator('#select-asignar-jugador');
        await expect(selectJugador.locator('option')).not.toHaveCount(1, { timeout: 5000 });

        // Seleccionar la opción del jugador creado
        const optionJugador = selectJugador.locator('option', { hasText: testNick });
        await expect(optionJugador).toBeAttached({ timeout: 5000 });
        const valJugador = await optionJugador.getAttribute('value');
        await selectJugador.selectOption(valJugador);
        await page.locator('#select-asignar-rol').selectOption('Titular');

        // Confirmar asignación
        await page.locator('#btn-confirmar-asignacion').click();

        // Verificar notificación de éxito
        await expect(page.locator('.toast-success', { hasText: /asignado correctamente/i })).toBeVisible({ timeout: 5000 });

        // Verificar que aparezca en la tabla de asignaciones con rol Titular
        const filaJugador = page.locator('#tabla-asignaciones-body tr', { hasText: testNick });
        await expect(filaJugador).toBeVisible();
        await expect(filaJugador.locator('.badge-titular')).toHaveText('Titular');

        // Cerrar modal
        await page.locator('#btn-close-detalle').click();
    });

    test('3.5 Admin: Debería cambiar el rol del jugador en el Roster (Titular -> Suplente)', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        const rosterCard = page.locator('.roster-card', { hasText: testRosterName });
        await expect(rosterCard).toBeVisible();
        await rosterCard.locator('.btn-ver-roster').click();

        const modalDetalle = page.locator('#modal-detalle-roster');
        await expect(modalDetalle).toHaveClass(/active/);

        // Ubicar al jugador en la tabla
        const fila = page.locator('#tabla-asignaciones-body tr', { hasText: testNick });
        await expect(fila).toBeVisible();

        // Clic en "Cambiar a Suplente"
        const btnCambiar = fila.locator('.btn-cambiar-rol');
        await expect(btnCambiar).toContainText('Cambiar a Suplente');
        await btnCambiar.click();

        await expect(page.locator('.toast-success', { hasText: /Rol cambiado a Suplente/i })).toBeVisible({ timeout: 5000 });

        // La fila debe actualizarse a Suplente
        const filaActualizada = page.locator('#tabla-asignaciones-body tr', { hasText: testNick });
        await expect(filaActualizada.locator('.badge-suplente')).toHaveText('Suplente');

        // Cerrar modal
        await page.locator('#btn-close-detalle').click();
    });

    test('3.6 Admin: Debería quitar al jugador del Roster conservándolo en la BD general (RN-05)', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        const rosterCard = page.locator('.roster-card', { hasText: testRosterName });
        await expect(rosterCard).toBeVisible();
        await rosterCard.locator('.btn-ver-roster').click();

        const modalDetalle = page.locator('#modal-detalle-roster');
        await expect(modalDetalle).toHaveClass(/active/);

        const fila = page.locator('#tabla-asignaciones-body tr', { hasText: testNick });
        await expect(fila).toBeVisible();

        // Aceptar confirmación del diálogo modal del navegador
        page.once('dialog', dialog => dialog.accept());
        await fila.locator('.btn-quitar-jugador').click();

        await expect(page.locator('.toast-success', { hasText: /removido del roster/i })).toBeVisible({ timeout: 5000 });

        // Cerrar modal de roster
        await page.locator('#btn-close-detalle').click();

        // Verificar que el jugador SIGUE existiendo en la lista general de jugadores (RN-05)
        await page.locator('#tab-jugadores-btn').click();
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);

        const jugadorCard = page.locator('.player-row-card', { hasText: testNick });
        await expect(jugadorCard).toBeVisible();
    });

    test('3.7 Admin: Debería eliminar un jugador del sistema', async ({ page }) => {
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);

        const jugadorCard = page.locator('.player-row-card', { hasText: testNick });
        await expect(jugadorCard).toBeVisible();

        // Aceptar confirmación
        page.once('dialog', dialog => dialog.accept());
        await jugadorCard.locator('.btn-del-jugador').click();

        await expect(page.locator('.toast-success', { hasText: /eliminado exitosamente/i })).toBeVisible({ timeout: 5000 });

        // Verificar que ya no existe
        await page.locator('#filtro-search').fill(testNick);
        await page.waitForTimeout(600);
        await expect(page.locator('.player-row-card', { hasText: testNick })).toHaveCount(0);
    });

    test('3.8 Admin: Debería eliminar un Roster del sistema', async ({ page }) => {
        await page.locator('#tab-rosters-btn').click();
        await page.waitForTimeout(300);

        const rosterCard = page.locator('.roster-card', { hasText: testRosterName });
        await expect(rosterCard).toBeVisible();

        // Aceptar confirmación
        page.once('dialog', dialog => dialog.accept());
        await rosterCard.locator('.btn-del-roster').click();

        await expect(page.locator('.toast-success', { hasText: /eliminado/i })).toBeVisible({ timeout: 5000 });

        // Verificar que el roster desaparece
        await expect(page.locator('.roster-card', { hasText: testRosterName })).toHaveCount(0);
    });
});
