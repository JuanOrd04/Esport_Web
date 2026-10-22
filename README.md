# Práctica: REST API - Perfiles de Jugadores y Rosters (eSports)

Esta es una práctica para la materia de Desarrollo de Aplicaciones Web. Desarrollamos una API RESTful para la gestión de jugadores y armado de rosters en equipos de eSports, utilizando Node.js, Express, Sequelize ORM y MySQL.

---

## Stack Tecnológico

- **Backend:** Node.js (con módulos ES6) y Express
- **ORM / Modelos:** Sequelize
- **Base de Datos:** MySQL 8
- **Frontend:** HTML5, CSS3 moderno (tema eSports responsivo) y JavaScript vanilla (SPA)
- **Documentación:** OpenAPI 3.0 con Swagger UI (`swagger-ui-express`)
- **Seguridad y Autorización:** JWT en cookies HTTP-Only, Doble Cookie Pattern para CSRF, validación de API Key y control de roles (Admin / Público)
- **Control de Versiones:** Git

---

## Interfaz Web (Frontend)

La aplicación cuenta con una interfaz web Single Page Application (SPA) responsiva con soporte para dos perfiles:

1. **Modo Público:** Permite consultar, explorar y filtrar el catálogo de jugadores y rosters sin necesidad de iniciar sesión.
2. **Modo Administrador (`/admin`):** Permite la gestión completa (crear, editar, eliminar jugadores y rosters, y gestionar asignaciones de titulares y suplentes con validaciones automáticas de las reglas de negocio RN-01 a RN-05).

- **Acceso:** `http://localhost:3000/` o `http://localhost:3000/admin`
- **Credenciales de prueba por defecto:**
  - **Email:** `admin@esports.com`
  - **Contraseña:** `admin123`

---

## Mecanismo de Seguridad: JWT, Cookies y Prevención de CSRF

Para cumplir con las directivas de seguridad web frente a vulnerabilidades como XSS y CSRF:

1. **Cookie HTTP-Only para JWT (`jwt_token`):** El token JWT se almacena en una cookie con flag `httpOnly: true` y `sameSite: 'lax'`, impidiendo que scripts maliciosos de terceros puedan leer el token vía JavaScript (mitigación XSS).
2. **Doble Cookie Pattern para CSRF:** Al iniciar sesión se emite una segunda cookie legible (`csrf_token`) que el frontend lee y envía de vuelta en la cabecera `x-csrf-token`. El middleware del backend compara que el valor de la cabecera coincida exactamente con el token CSRF autenticado en el JWT antes de permitir operaciones mutables (`POST`, `PUT`, `DELETE`).
3. **Validación de API Key:** Se valida el header `x-api-key` en todas las peticiones a la API para asegurar que provengan del cliente autorizado.
4. **Control de Rol Admin:** Las rutas de lectura (`GET`) son públicas, mientras que las operaciones de modificación de datos requieren estar autenticado con rol `Admin`.

---

## Instrucciones de Instalación y Uso

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd Esport_Web
npm install
```

### 2. Configurar la Base de Datos y Variables de Entorno

1. Tener tu servidor de MySQL corriendo en tu equipo.
2. Crea la base de datos ejecutando en MySQL (Workbench o consola):
   ```sql
   CREATE DATABASE IF NOT EXISTS esports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Crea un archivo `.env` en la raíz del proyecto (puedes basarte en `.env.example`):
   ```env
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=esports_db
   DB_USER=backenduser
   DB_PASSWORD=superpassword

   # Seguridad y Autorizacion
   JWT_SECRET=super_secreto_para_jwt_esports_2026
   JWT_EXPIRES_IN=2h
   API_KEY=esports_api_key_secret_2026
   COOKIE_MAX_AGE=7200000

   # Credenciales de Administrador para pruebas
   ADMIN_EMAIL=admin@esports.com
   ADMIN_PASSWORD=admin123
   ```

*Nota: Al arrancar el servidor, Sequelize se encarga automáticamente de crear y sincronizar las tablas (`jugadores`, `rosters`, `roster_jugador`) con sus llaves primarias, llaves foráneas y restricciones.*

### 3. Ejecutar el Servidor

Para iniciar en modo desarrollo con recarga automática:
```bash
npm run dev
```

O en modo normal:
```bash
npm start
```

El servidor estará escuchando en: `http://localhost:3000`.

---

## Documentación Interactiva OpenAPI (Swagger)

Puedes consultar la documentación interactiva y probar todos los endpoints desde tu navegador en:
- **Swagger UI:** `http://localhost:3000/api-docs`
- **Especificación OpenAPI (JSON):** `http://localhost:3000/openapi.json`

*(También se incluye el archivo `test-collection.http` para realizar pruebas directas con la extensión REST Client de VS Code).*

---

## Lista de Endpoints Disponibles (`/api/v1`)

### 1. Módulo: Autenticación y Sesión
| Método | Endpoint | Descripción | Acceso | Códigos |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Inicio de sesión, emisión de cookies JWT y CSRF | Público | 200, 400, 401, 500 |
| `POST` | `/api/v1/auth/logout` | Cierre de sesión y limpieza de cookies | Público | 200, 500 |
| `GET` | `/api/v1/auth/verify` | Valida el estado de la sesión actual | Autenticado | 200, 401 |

### 2. Módulo: Jugadores
| Método | Endpoint | Descripción | Acceso | Códigos |
|---|---|---|---|---|
| `GET` | `/api/v1/jugadores` | Listar todos los jugadores (soporta filtros `?rol=Mid&estado=activo&search=faker`) | Público | 200, 500 |
| `GET` | `/api/v1/jugadores/:id` | Ver detalle de un jugador por ID | Público | 200, 404, 500 |
| `POST` | `/api/v1/jugadores` | Crear nuevo jugador (`nickname`, `nombre_real`, `pais`, `rol`, `estado`) | Admin | 201, 400, 401, 403, 409, 500 |
| `PUT` | `/api/v1/jugadores/:id` | Actualizar datos del jugador | Admin | 200, 400, 401, 403, 404, 409, 500 |
| `DELETE` | `/api/v1/jugadores/:id` | Eliminar jugador | Admin | 204, 401, 403, 404, 500 |

### 3. Módulo: Rosters
| Método | Endpoint | Descripción | Acceso | Códigos |
|---|---|---|---|---|
| `GET` | `/api/v1/rosters` | Listar rosters (con `cantidad_jugadores`, filtros `?tipo=...&temporada=...`) | Público | 200, 500 |
| `GET` | `/api/v1/rosters/:id` | Ver detalle de un roster y su lista de jugadores con roles | Público | 200, 404, 500 |
| `POST` | `/api/v1/rosters` | Crear nuevo roster (`nombre`, `juego`, `tipo`, `temporada`) | Admin | 201, 400, 401, 403, 500 |
| `PUT` | `/api/v1/rosters/:id` | Modificar datos del roster | Admin | 200, 400, 401, 403, 404, 500 |
| `DELETE` | `/api/v1/rosters/:id` | Eliminar roster (los jugadores no se borran) | Admin | 204, 401, 403, 404, 500 |

### 4. Asignación de Jugadores a Rosters
| Método | Endpoint | Descripción | Acceso | Códigos |
|---|---|---|---|---|
| `GET` | `/api/v1/rosters/:id/jugadores` | Listar jugadores asignados a un roster | Público | 200, 404, 500 |
| `POST` | `/api/v1/rosters/:id/jugadores` | Asignar jugador a roster (`id_jugador`, `rol_en_roster`) | Admin | 201, 400, 401, 403, 404, 409, 500 |
| `PUT` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Cambiar rol dentro del roster (`Titular`/`Suplente`) | Admin | 200, 400, 401, 403, 404, 409, 500 |
| `DELETE` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Quitar un jugador del roster | Admin | 204, 401, 403, 404, 500 |

### 5. Endpoints Auxiliares
| Método | Endpoint | Descripción | Acceso | Códigos |
|---|---|---|---|---|
| `GET` | `/api/v1/roles` | Lista de roles válidos (`Top`, `Jungle`, `Mid`, `ADC`, `Support`) | Público | 200 |
| `GET` | `/api/v1/estados` | Lista de estados válidos (`activo`, `inactivo`) | Público | 200 |
| `GET` | `/api/v1/tipos-roster` | Lista de tipos de roster válidos (`Principal`, `Academy`) | Público | 200 |
| `GET` | `/api/v1/health` | Estado del servidor y conexión con MySQL | Público | 200, 500 |

---

## Reglas de Negocio Implementadas

- **RN-01:** El nickname de un jugador es único en el sistema. Si se intenta registrar o actualizar con un nickname existente, devuelve `409 Conflict`.
- **RN-02:** Un roster puede tener como máximo **5 titulares**. Intentar asignar o cambiar a un 6to titular devuelve `409 Conflict`.
- **RN-03:** No puede haber dos titulares con el mismo rol en un mismo roster (por ejemplo, dos jugadores con rol `Mid` como titulares). Devuelve `409 Conflict`.
- **RN-04:** Un jugador puede pertenecer a más de un roster simultáneamente.
- **RN-05:** Al eliminar un roster o remover una asignación, los jugadores permanecen registrados en la base de datos (integridad referencial con eliminación en cascada solo sobre la tabla intermedia).

---

## Estructura del Proyecto

```text
config/                  # Credenciales de Sequelize CLI
└── config.json
migrations/              # Migraciones de Sequelize CLI
├── 20261013170001-create-jugadores.cjs
├── 20261013170002-create-rosters.cjs
└── 20261013170003-create-roster-jugador.cjs
public/                  # Frontend Web SPA
├── css/
│   └── styles.css       # Estilos visuales con tema eSports oscuro
├── js/
│   ├── api.js           # Cliente fetch con cookies, CSRF y API Key
│   └── app.js           # Lógica SPA, estado de sesión y CRUDs
└── index.html           # Plantilla principal y vistas de Admin y Público
src/
├── config/              # Conexión Sequelize con variables de entorno
│   └── database.js
├── models/              # Modelos de datos y relaciones (N:M y 1:N)
│   ├── jugador.model.js
│   ├── roster.model.js
│   ├── rosterJugador.model.js
│   └── index.js
├── services/            # Lógica de negocio y reglas (RN-01 a RN-05)
│   ├── jugadores.service.js
│   └── rosters.service.js
├── controllers/         # Manejo de peticiones HTTP y respuestas JSON
│   ├── auth.controller.js
│   ├── jugadores.controller.js
│   ├── rosters.controller.js
│   └── auxiliares.controller.js
├── middlewares/         # Middlewares de seguridad y manejo de errores
│   ├── auth.middleware.js # Validación de API Key, JWT y Doble Cookie CSRF
│   └── errorHandler.js
├── routes/              # Definición de rutas Express
│   ├── auth.routes.js
│   ├── jugadores.routes.js
│   ├── rosters.routes.js
│   └── auxiliares.routes.js
├── docs/                # Especificación OpenAPI 3.0 en formato JSON
│   └── openapi.json
└── app.js               # Configuración central de Express, Cookies, CORS y Swagger
server.js                # Punto de entrada que levanta el servidor HTTP
```
