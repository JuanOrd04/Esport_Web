import { api } from './api.js';

// Estado global de la aplicacion
const state = {
    currentUser: null,
    jugadores: [],
    rosters: [],
    rosterActual: null
};

// ==========================================
// UTILIDADES: TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// CONTROL DE AUTENTICACION Y SESION
// ==========================================
async function inicializarSesion() {
    state.currentUser = await api.checkAuth();
    actualizarVistaSegunRol();
}

function actualizarVistaSegunRol() {
    const roleBadge = document.getElementById('role-badge');
    const authSection = document.getElementById('auth-section');
    const statusText = document.getElementById('status-text');
    const statusSubtext = document.getElementById('status-subtext');
    const csrfIndicator = document.getElementById('csrf-indicator');
    const btnNuevoJugador = document.getElementById('btn-nuevo-jugador');
    const btnNuevoRoster = document.getElementById('btn-nuevo-roster');
    const formAsignarContainer = document.getElementById('form-asignar-container');

    const esAdmin = state.currentUser && state.currentUser.rol === 'Admin';

    if (esAdmin) {
        roleBadge.textContent = 'Admin';
        roleBadge.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        statusText.innerHTML = `🛡️ Sesión Activa: <strong>${state.currentUser.email}</strong> (Rol Administrador)`;
        statusSubtext.textContent = 'Tienes permisos completos para crear, editar y eliminar jugadores y gestionar rosters.';
        csrfIndicator.style.display = 'block';

        authSection.innerHTML = `
            <div class="user-badge">
                <span>👤 ${state.currentUser.email}</span>
                <button class="btn btn-secondary btn-sm" id="btn-logout">Cerrar Sesión</button>
            </div>
        `;
        document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

        btnNuevoJugador.style.display = 'inline-flex';
        btnNuevoRoster.style.display = 'inline-flex';
        if (formAsignarContainer) formAsignarContainer.style.display = 'block';
    } else {
        roleBadge.textContent = 'Público';
        roleBadge.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
        statusText.innerHTML = 'ℹ️ Modo Público (Solo lectura)';
        statusSubtext.textContent = 'Inicia sesión como Administrador para poder crear, editar y eliminar jugadores y armar rosters.';
        csrfIndicator.style.display = 'none';

        authSection.innerHTML = `
            <button class="btn btn-primary btn-sm" id="btn-open-login">🔐 Iniciar Sesión Admin</button>
        `;
        document.getElementById('btn-open-login').addEventListener('click', () => abrirModal('modal-login'));

        btnNuevoJugador.style.display = 'none';
        btnNuevoRoster.style.display = 'none';
        if (formAsignarContainer) formAsignarContainer.style.display = 'none';
    }

    renderJugadores();
    renderRosters();
}

async function cerrarSesion() {
    try {
        await api.logout();
        state.currentUser = null;
        showToast('Sesión cerrada correctamente', 'success');
        actualizarVistaSegunRol();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// MODULO: JUGADORES
// ==========================================
async function cargarJugadores() {
    try {
        const params = new URLSearchParams();
        const search = document.getElementById('filtro-search').value.trim();
        const rol = document.getElementById('filtro-rol').value;
        const estado = document.getElementById('filtro-estado').value;

        if (search) params.append('search', search);
        if (rol) params.append('rol', rol);
        if (estado) params.append('estado', estado);

        const query = params.toString() ? `?${params.toString()}` : '';
        state.jugadores = await api.get(`/jugadores${query}`);
        renderJugadores();
    } catch (error) {
        showToast(`Error al cargar jugadores: ${error.message}`, 'error');
    }
}

// ==========================================
// HELPERS VISUALES LEAGUE OF LEGENDS / HEXTECH
// ==========================================
const BANDERAS_PAIS = {
    'mexico': '🇲🇽', 'méxico': '🇲🇽', 'mx': '🇲🇽',
    'corea': '🇰🇷', 'corea del sur': '🇰🇷', 'kr': '🇰🇷', 'korea': '🇰🇷', 'south korea': '🇰🇷',
    'estados unidos': '🇺🇸', 'eeuu': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸',
    'españa': '🇪🇸', 'espana': '🇪🇸', 'es': '🇪🇸', 'spain': '🇪🇸',
    'canada': '🇨🇦', 'canadá': '🇨🇦', 'ca': '🇨🇦',
    'argentina': '🇦🇷', 'ar': '🇦🇷',
    'chile': '🇨🇱', 'cl': '🇨🇱',
    'colombia': '🇨🇴', 'co': '🇨🇴',
    'peru': '🇵🇪', 'perú': '🇵🇪', 'pe': '🇵🇪',
    'brasil': '🇧🇷', 'brazil': '🇧🇷', 'br': '🇧🇷',
    'china': '🇨🇳', 'cn': '🇨🇳',
    'francia': '🇫🇷', 'france': '🇫🇷', 'fr': '🇫🇷',
    'alemania': '🇩🇪', 'germany': '🇩🇪', 'de': '🇩🇪',
    'dinamarca': '🇩🇰', 'denmark': '🇩🇰', 'dk': '🇩🇰',
    'reino unido': '🇬🇧', 'uk': '🇬🇧', 'gb': '🇬🇧',
    'suecia': '🇸🇪', 'sweden': '🇸🇪', 'se': '🇸🇪',
    'japon': '🇯🇵', 'japón': '🇯🇵', 'jp': '🇯🇵', 'japan': '🇯🇵'
};

function obtenerBanderaPais(pais) {
    if (!pais) return '🌐';
    const clave = pais.trim().toLowerCase();
    return BANDERAS_PAIS[clave] || '🌐';
}

const ICONOS_ROLES = {
    Top: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20V4h16"/>
            <polyline points="8 4 4 4 4 8"/>
            <line x1="4" y1="4" x2="12" y2="12"/>
          </svg>`,
    Jungle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C7 6 6 11 9 15c1.5 2 2 4 1 7 5-2 8-6 8-11 0-4-3-8-6-9z"/>
            <path d="M8 14c-2 2-3 4-3 6 3-1 5-2 6-4"/>
          </svg>`,
    Mid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="20" x2="20" y2="4"/>
            <polygon points="17 4 20 4 20 7" fill="currentColor"/>
            <polygon points="4 17 4 20 7 20" fill="currentColor"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>`,
    ADC: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20h16V4"/>
            <polyline points="16 20 20 20 20 16"/>
            <line x1="20" y1="20" x2="12" y2="12"/>
          </svg>`,
    Support: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>`
};

const SVG_LAPIZ = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
</svg>`;

const SVG_BASURA = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
</svg>`;

// ==========================================
// FOTOS PERSONALIZADAS DE JUGADORES
// Coloca aquí la URL de internet o la ruta local de la foto de cada jugador.
// Ejemplo: 'faker': 'https://mi-servidor.com/faker.jpg' o 'faker': '/img/jugadores/faker.jpg'
// ==========================================
const FOTOS_PERSONALIZADAS = {
    'faker': 'https://e7.pngegg.com/pngimages/77/262/png-clipart-faker-league-of-legends-champions-korea-mid-season-invitational-sk-telecom-t1-mid-background-game-glasses.png',
    'impact': 'https://e7.pngegg.com/pngimages/105/294/png-clipart-impact-north-america-league-of-legends-championship-series-league-of-legends-world-championship-league-of-legends-face-team-liquid.png',
    'chovy': 'https://tse2.mm.bing.net/th/id/OIP.9WtapzXuYqTam4ifeJxyVQHaGA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    'zomb1x': ''
    // Agrega aquí más jugadores: 'nickname': 'URL_O_RUTA_DE_LA_FOTO'
};

function obtenerAvatarUrl(nickname) {
    const nick = (nickname || '').trim().toLowerCase();
    if (FOTOS_PERSONALIZADAS[nick] && FOTOS_PERSONALIZADAS[nick].trim() !== '') {
        return FOTOS_PERSONALIZADAS[nick];
    }
    // Si no tiene foto personalizada, genera un avatar con DiceBear
    const seed = encodeURIComponent(nickname || 'jugador');
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;
}

function renderJugadores() {
    const container = document.getElementById('tabla-jugadores-body');
    const esAdmin = state.currentUser && state.currentUser.rol === 'Admin';

    if (state.jugadores.length === 0) {
        container.innerHTML = `<div class="empty-state">No se encontraron invocadores con los filtros seleccionados.</div>`;
        return;
    }

    container.innerHTML = state.jugadores.map(j => {
        const bandera = obtenerBanderaPais(j.pais);
        const iconSvg = ICONOS_ROLES[j.rol] || '';
        const seed = encodeURIComponent(j.nickname || 'jugador');
        const avatarUrl = obtenerAvatarUrl(j.nickname);
        const fallbackUrl = `https://ui-avatars.com/api/?name=${seed}&background=091428&color=c8aa6e&bold=true`;

        return `
            <div class="player-row-card">
                <!-- Columna 1: Perfil con Avatar -->
                <div class="player-profile-col">
                    <div class="player-avatar-wrapper">
                        <img 
                            src="${avatarUrl}" 
                            alt="${escapeHtml(j.nickname)}" 
                            class="player-avatar" 
                            loading="lazy"
                            onerror="this.onerror=null; this.src='${fallbackUrl}';"
                        />
                        <span class="avatar-id-tag">#${j.id}</span>
                    </div>
                    <div class="player-names">
                        <div class="player-nickname">
                            ${escapeHtml(j.nickname)}
                        </div>
                        <div class="player-realname">
                            ${escapeHtml(j.nombre_real || 'Invocador')}
                        </div>
                    </div>
                </div>

                <!-- Columna 2: País con Bandera -->
                <div class="player-country-col">
                    <span class="country-flag">${bandera}</span>
                    <span class="country-name">${escapeHtml(j.pais || 'No especificado')}</span>
                </div>

                <!-- Columna 3: Rol con Ícono SVG -->
                <div class="player-role-col">
                    <span class="role-badge role-${j.rol.toLowerCase()}">
                        ${iconSvg}
                        <span>${j.rol}</span>
                    </span>
                </div>

                <!-- Columna 4: Estado con Dot Brillante -->
                <div class="player-status-col">
                    <span class="status-pill status-${j.estado}">
                        <span class="status-dot"></span>
                        <span>${j.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                    </span>
                </div>

                <!-- Columna 5: Botones de Acción Minimalistas -->
                <div class="player-actions-col">
                    ${esAdmin ? `
                        <button class="action-btn btn-action-edit btn-edit-jugador" title="Editar invocador" data-id="${j.id}">
                            ${SVG_LAPIZ}
                        </button>
                        <button class="action-btn btn-action-delete btn-del-jugador" title="Eliminar invocador" data-id="${j.id}" data-nick="${escapeHtml(j.nickname)}">
                            ${SVG_BASURA}
                        </button>
                    ` : `
                        <span class="readonly-label">Lectura</span>
                    `}
                </div>
            </div>
        `;
    }).join('');

    // Listeners de botones de accion
    document.querySelectorAll('.btn-edit-jugador').forEach(btn => {
        btn.addEventListener('click', () => abrirEditarJugador(btn.dataset.id));
    });

    document.querySelectorAll('.btn-del-jugador').forEach(btn => {
        btn.addEventListener('click', () => eliminarJugador(btn.dataset.id, btn.dataset.nick));
    });
}

function abrirCrearJugador() {
    document.getElementById('modal-jugador-titulo').textContent = '+ Nuevo Jugador';
    document.getElementById('form-jugador').reset();
    document.getElementById('jugador-id').value = '';
    abrirModal('modal-jugador');
}

function abrirEditarJugador(id) {
    const jugador = state.jugadores.find(j => j.id == id);
    if (!jugador) return;

    document.getElementById('modal-jugador-titulo').textContent = `✏️ Editar Jugador #${jugador.id} (${jugador.nickname})`;
    document.getElementById('jugador-id').value = jugador.id;
    document.getElementById('jugador-nickname').value = jugador.nickname;
    document.getElementById('jugador-nombre').value = jugador.nombre_real || '';
    document.getElementById('jugador-pais').value = jugador.pais || '';
    document.getElementById('jugador-rol').value = jugador.rol;
    document.getElementById('jugador-estado').value = jugador.estado;

    abrirModal('modal-jugador');
}

async function guardarJugador(e) {
    e.preventDefault();
    const id = document.getElementById('jugador-id').value;
    const datos = {
        nickname: document.getElementById('jugador-nickname').value.trim(),
        nombre_real: document.getElementById('jugador-nombre').value.trim(),
        pais: document.getElementById('jugador-pais').value.trim(),
        rol: document.getElementById('jugador-rol').value,
        estado: document.getElementById('jugador-estado').value
    };

    try {
        if (id) {
            await api.put(`/jugadores/${id}`, datos);
            showToast('Jugador actualizado correctamente', 'success');
        } else {
            await api.post('/jugadores', datos);
            showToast('Jugador registrado exitosamente', 'success');
        }
        cerrarModal('modal-jugador');
        cargarJugadores();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function eliminarJugador(id, nickname) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al jugador "${nickname}"?`)) {
        return;
    }

    try {
        await api.delete(`/jugadores/${id}`);
        showToast(`Jugador "${nickname}" eliminado exitosamente`, 'success');
        cargarJugadores();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// MODULO: ROSTERS
// ==========================================
async function cargarRosters() {
    try {
        const params = new URLSearchParams();
        const tipo = document.getElementById('filtro-roster-tipo').value;
        const temporada = document.getElementById('filtro-roster-temporada').value.trim();

        if (tipo) params.append('tipo', tipo);
        if (temporada) params.append('temporada', temporada);

        const query = params.toString() ? `?${params.toString()}` : '';
        state.rosters = await api.get(`/rosters${query}`);
        renderRosters();
    } catch (error) {
        showToast(`Error al cargar rosters: ${error.message}`, 'error');
    }
}

function renderRosters() {
    const grid = document.getElementById('rosters-grid');
    const esAdmin = state.currentUser && state.currentUser.rol === 'Admin';

    if (state.rosters.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay rosters registrados con los filtros aplicados.</p>`;
        return;
    }

    grid.innerHTML = state.rosters.map(r => `
        <div class="roster-card">
            <div>
                <div class="roster-card-header">
                    <span class="roster-title">${escapeHtml(r.nombre)}</span>
                    <span class="badge badge-${r.tipo.toLowerCase()}">${r.tipo}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--accent);">🎮 ${escapeHtml(r.juego)}</div>
                
                <div class="roster-stats">
                    <span>📅 Temporada: <strong>${escapeHtml(r.temporada)}</strong></span>
                    <span>👥 Jugadores: <strong>${r.cantidad_jugadores}</strong></span>
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm btn-ver-roster" data-id="${r.id}" style="flex: 1;">
                    👥 Ver Roster
                </button>
                ${esAdmin ? `
                    <button class="btn btn-secondary btn-sm btn-edit-roster" data-id="${r.id}">✏️</button>
                    <button class="btn btn-danger btn-sm btn-del-roster" data-id="${r.id}" data-nombre="${escapeHtml(r.nombre)}">🗑️</button>
                ` : ''}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.btn-ver-roster').forEach(btn => {
        btn.addEventListener('click', () => abrirDetalleRoster(btn.dataset.id));
    });

    document.querySelectorAll('.btn-edit-roster').forEach(btn => {
        btn.addEventListener('click', () => abrirEditarRoster(btn.dataset.id));
    });

    document.querySelectorAll('.btn-del-roster').forEach(btn => {
        btn.addEventListener('click', () => eliminarRoster(btn.dataset.id, btn.dataset.nombre));
    });
}

function abrirCrearRoster() {
    document.getElementById('modal-roster-titulo').textContent = '+ Nuevo Roster';
    document.getElementById('form-roster').reset();
    document.getElementById('roster-id').value = '';
    document.getElementById('roster-juego').value = 'League of Legends';
    abrirModal('modal-roster');
}

function abrirEditarRoster(id) {
    const roster = state.rosters.find(r => r.id == id);
    if (!roster) return;

    document.getElementById('modal-roster-titulo').textContent = `✏️ Editar Roster #${roster.id}`;
    document.getElementById('roster-id').value = roster.id;
    document.getElementById('roster-nombre').value = roster.nombre;
    document.getElementById('roster-juego').value = roster.juego;
    document.getElementById('roster-tipo').value = roster.tipo;
    document.getElementById('roster-temporada').value = roster.temporada;

    abrirModal('modal-roster');
}

async function guardarRoster(e) {
    e.preventDefault();
    const id = document.getElementById('roster-id').value;
    const datos = {
        nombre: document.getElementById('roster-nombre').value.trim(),
        juego: document.getElementById('roster-juego').value.trim(),
        tipo: document.getElementById('roster-tipo').value,
        temporada: document.getElementById('roster-temporada').value.trim()
    };

    try {
        if (id) {
            await api.put(`/rosters/${id}`, datos);
            showToast('Roster actualizado correctamente', 'success');
        } else {
            await api.post('/rosters', datos);
            showToast('Roster creado exitosamente', 'success');
        }
        cerrarModal('modal-roster');
        cargarRosters();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function eliminarRoster(id, nombre) {
    if (!confirm(`¿Eliminar el roster "${nombre}"? Los jugadores asignados no serán eliminados del sistema (RN-05).`)) {
        return;
    }

    try {
        await api.delete(`/rosters/${id}`);
        showToast(`Roster "${nombre}" eliminado`, 'success');
        cargarRosters();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// MODULO: DETALLE DE ROSTER Y ASIGNACIONES
// ==========================================
async function abrirDetalleRoster(idRoster) {
    try {
        state.rosterActual = await api.get(`/rosters/${idRoster}`);
        
        document.getElementById('detalle-roster-nombre').textContent = `🛡️ ${state.rosterActual.nombre}`;
        document.getElementById('detalle-roster-sub').textContent = 
            `Juego: ${state.rosterActual.juego} | Tipo: ${state.rosterActual.tipo} | Temporada: ${state.rosterActual.temporada}`;

        // Llenar dropdown de jugadores disponibles para asignar
        await llenarSelectJugadoresDisponibles();
        renderAsignaciones();

        abrirModal('modal-detalle-roster');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function llenarSelectJugadoresDisponibles() {
    const select = document.getElementById('select-asignar-jugador');
    const todosJugadores = await api.get('/jugadores');
    
    // IDs de los jugadores que ya estan en este roster
    const asignadosIds = new Set((state.rosterActual.jugadores || []).map(j => j.id));
    const disponibles = todosJugadores.filter(j => !asignadosIds.has(j.id) && j.estado === 'activo');

    select.innerHTML = '<option value="">Selecciona un jugador...</option>' + 
        disponibles.map(j => `<option value="${j.id}">${escapeHtml(j.nickname)} (${j.rol})</option>`).join('');
}

function renderAsignaciones() {
    const tbody = document.getElementById('tabla-asignaciones-body');
    const jugadores = state.rosterActual.jugadores || [];
    const esAdmin = state.currentUser && state.currentUser.rol === 'Admin';

    document.getElementById('detalle-conteo-jugadores').textContent = jugadores.length;

    if (jugadores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No hay jugadores asignados a este roster.</td></tr>`;
        return;
    }

    tbody.innerHTML = jugadores.map(j => {
        const esTitular = j.rol_en_roster === 'Titular';
        return `
            <tr>
                <td><strong>${escapeHtml(j.nickname)}</strong></td>
                <td><span class="badge badge-${j.rol.toLowerCase()}">${j.rol}</span></td>
                <td>
                    <span class="badge badge-${esTitular ? 'titular' : 'suplente'}">
                        ${j.rol_en_roster}
                    </span>
                </td>
                <td>
                    ${esAdmin ? `
                        <div style="display: flex; gap: 0.4rem;">
                            <button class="btn btn-secondary btn-sm btn-cambiar-rol" data-id="${j.id}" data-rol="${esTitular ? 'Suplente' : 'Titular'}">
                                Cambiar a ${esTitular ? 'Suplente' : 'Titular'}
                            </button>
                            <button class="btn btn-danger btn-sm btn-quitar-jugador" data-id="${j.id}" data-nick="${escapeHtml(j.nickname)}">
                                Quitar
                            </button>
                        </div>
                    ` : '<span style="color:var(--text-muted); font-size: 0.8rem;">Solo lectura</span>'}
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.btn-cambiar-rol').forEach(btn => {
        btn.addEventListener('click', () => cambiarRolJugador(btn.dataset.id, btn.dataset.rol));
    });

    document.querySelectorAll('.btn-quitar-jugador').forEach(btn => {
        btn.addEventListener('click', () => quitarJugadorDeRoster(btn.dataset.id, btn.dataset.nick));
    });
}

async function asignarJugadorAlRoster() {
    const selectJugador = document.getElementById('select-asignar-jugador');
    const selectRol = document.getElementById('select-asignar-rol');

    const id_jugador = selectJugador.value;
    const rol_en_roster = selectRol.value;

    if (!id_jugador) {
        showToast('Por favor selecciona un jugador', 'error');
        return;
    }

    try {
        await api.post(`/rosters/${state.rosterActual.id}/jugadores`, {
            id_jugador: Number(id_jugador),
            rol_en_roster
        });

        showToast('Jugador asignado correctamente', 'success');
        // Recargar detalle
        await abrirDetalleRoster(state.rosterActual.id);
        cargarRosters(); // Actualizar contador en la lista principal
    } catch (error) {
        // Muestra error descriptivo de reglas de negocio (ej. 409 max 5 titulares o rol titular duplicado)
        showToast(error.message, 'error');
    }
}

async function cambiarRolJugador(idJugador, nuevoRol) {
    try {
        await api.put(`/rosters/${state.rosterActual.id}/jugadores/${idJugador}`, {
            rol_en_roster: nuevoRol
        });

        showToast(`Rol cambiado a ${nuevoRol}`, 'success');
        await abrirDetalleRoster(state.rosterActual.id);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function quitarJugadorDeRoster(idJugador, nickname) {
    if (!confirm(`¿Remover a "${nickname}" del roster? El jugador seguirá en el sistema (RN-05).`)) {
        return;
    }

    try {
        await api.delete(`/rosters/${state.rosterActual.id}/jugadores/${idJugador}`);
        showToast(`Jugador "${nickname}" removido del roster`, 'success');
        await abrirDetalleRoster(state.rosterActual.id);
        cargarRosters();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function abrirModal(idModal) {
    document.getElementById(idModal).classList.add('active');
}

function cerrarModal(idModal) {
    document.getElementById(idModal).classList.remove('active');
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// EVENT LISTENERS & INICIALIZACION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar sesion
    inicializarSesion();

    // 2. Cargar datos iniciales
    cargarJugadores();
    cargarRosters();

    // 3. Pestanas
    const tabJugadoresBtn = document.getElementById('tab-jugadores-btn');
    const tabRostersBtn = document.getElementById('tab-rosters-btn');
    const secJugadores = document.getElementById('section-jugadores');
    const secRosters = document.getElementById('section-rosters');

    tabJugadoresBtn.addEventListener('click', () => {
        tabJugadoresBtn.classList.add('active');
        tabRostersBtn.classList.remove('active');
        secJugadores.style.display = 'block';
        secRosters.style.display = 'none';
    });

    tabRostersBtn.addEventListener('click', () => {
        tabRostersBtn.classList.add('active');
        tabJugadoresBtn.classList.remove('active');
        secRosters.style.display = 'block';
        secJugadores.style.display = 'none';
    });

    // 4. Filtros reactivos
    document.getElementById('filtro-search').addEventListener('input', debounce(cargarJugadores, 300));
    document.getElementById('filtro-rol').addEventListener('change', cargarJugadores);
    document.getElementById('filtro-estado').addEventListener('change', cargarJugadores);

    document.getElementById('filtro-roster-tipo').addEventListener('change', cargarRosters);
    document.getElementById('filtro-roster-temporada').addEventListener('input', debounce(cargarRosters, 300));

    // 5. Botones abrir modales
    document.getElementById('btn-nuevo-jugador').addEventListener('click', abrirCrearJugador);
    document.getElementById('btn-nuevo-roster').addEventListener('click', abrirCrearRoster);

    // 6. Cerrar modales
    document.getElementById('btn-close-login').addEventListener('click', () => cerrarModal('modal-login'));
    document.getElementById('btn-cancel-login').addEventListener('click', () => cerrarModal('modal-login'));

    document.getElementById('btn-close-jugador').addEventListener('click', () => cerrarModal('modal-jugador'));
    document.getElementById('btn-cancel-jugador').addEventListener('click', () => cerrarModal('modal-jugador'));

    document.getElementById('btn-close-roster').addEventListener('click', () => cerrarModal('modal-roster'));
    document.getElementById('btn-cancel-roster').addEventListener('click', () => cerrarModal('modal-roster'));

    document.getElementById('btn-close-detalle').addEventListener('click', () => cerrarModal('modal-detalle-roster'));
    document.getElementById('btn-cerrar-detalle-footer').addEventListener('click', () => cerrarModal('modal-detalle-roster'));

    // 7. Envio de formularios
    document.getElementById('form-jugador').addEventListener('submit', guardarJugador);
    document.getElementById('form-roster').addEventListener('submit', guardarRoster);
    document.getElementById('btn-confirmar-asignacion').addEventListener('click', asignarJugadorAlRoster);

    // 8. Formulario de Login
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await api.login(email, password);
            state.currentUser = res.usuario;
            cerrarModal('modal-login');
            showToast('¡Bienvenido! Has iniciado sesión como Administrador', 'success');
            actualizarVistaSegunRol();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
});

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
