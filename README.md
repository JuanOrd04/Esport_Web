# Práctica: REST API - Perfiles de Jugadores y Rosters (eSports)

Esta es una práctica para la materia de Desarrollo de Aplicaciones Web. Desarrollamos una API RESTful para la gestión de jugadores y armado de rosters en equipos de eSports, utilizando Node.js, Express, Sequelize ORM y MySQL.

---

## Stack Tecnológico

- **Backend:** Node.js (con módulos ES6) y Express
- **ORM / Modelos:** Sequelize
- **Base de Datos:** MySQL 8
- **Documentación:** OpenAPI 3.0 con Swagger UI (`swagger-ui-express`)
- **Control de Versiones:** Git

---

## Instrucciones de Instalación y Uso

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd Esport_Web
npm install
```

### 2. Configurar la Base de Datos

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

### 1. Módulo: Jugadores
| Método | Endpoint | Descripción | Códigos |
|---|---|---|---|
| `GET` | `/api/v1/jugadores` | Listar todos los jugadores (soporta filtros `?rol=Mid&estado=activo&search=faker`) | 200, 500 |
| `GET` | `/api/v1/jugadores/:id` | Ver detalle de un jugador por ID | 200, 404, 500 |
| `POST` | `/api/v1/jugadores` | Crear nuevo jugador (`nickname`, `nombre_real`, `pais`, `rol`, `estado`) | 201, 400, 409, 500 |
| `PUT` | `/api/v1/jugadores/:id` | Actualizar datos del jugador | 200, 400, 404, 409, 500 |
| `DELETE` | `/api/v1/jugadores/:id` | Eliminar jugador | 204, 404, 500 |

### 2. Módulo: Rosters
| Método | Endpoint | Descripción | Códigos |
|---|---|---|---|
| `GET` | `/api/v1/rosters` | Listar rosters (con `cantidad_jugadores`, filtros `?tipo=...&temporada=...`) | 200, 500 |
| `GET` | `/api/v1/rosters/:id` | Ver detalle de un roster y su lista de jugadores con roles | 200, 404, 500 |
| `POST` | `/api/v1/rosters` | Crear nuevo roster (`nombre`, `juego`, `tipo`, `temporada`) | 201, 400, 500 |
| `PUT` | `/api/v1/rosters/:id` | Modificar datos del roster | 200, 400, 404, 500 |
| `DELETE` | `/api/v1/rosters/:id` | Eliminar roster (los jugadores no se borran) | 204, 404, 500 |

### 3. Asignación de Jugadores a Rosters
| Método | Endpoint | Descripción | Códigos |
|---|---|---|---|
| `GET` | `/api/v1/rosters/:id/jugadores` | Listar jugadores asignados a un roster | 200, 404, 500 |
| `POST` | `/api/v1/rosters/:id/jugadores` | Asignar jugador a roster (`id_jugador`, `rol_en_roster`) | 201, 400, 404, 409, 500 |
| `PUT` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Cambiar rol dentro del roster (`Titular`/`Suplente`) | 200, 400, 404, 409, 500 |
| `DELETE` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Quitar un jugador del roster | 204, 404, 500 |

### 4. Endpoints Auxiliares
| Método | Endpoint | Descripción | Códigos |
|---|---|---|---|
| `GET` | `/api/v1/roles` | Lista de roles válidos (`Top`, `Jungle`, `Mid`, `ADC`, `Support`) | 200 |
| `GET` | `/api/v1/estados` | Lista de estados válidos (`activo`, `inactivo`) | 200 |
| `GET` | `/api/v1/tipos-roster` | Lista de tipos de roster válidos (`Principal`, `Academy`) | 200 |
| `GET` | `/api/v1/health` | Estado del servidor y conexión con MySQL | 200, 500 |

---

## Reglas de Negocio Implementadas

- **RN-01:** El nickname de un jugador es único en el sistema. Si se intenta registrar o actualizar con un nickname existente, devuelve `409 Conflict`.
- **RN-02:** Un roster puede tener como máximo **5 titulares**. Intentar asignar o cambiar a un 6to titular devuelve `409 Conflict`.
- **RN-03:** No puede haber dos titulares con el mismo rol en un mismo roster (por ejemplo, dos jugadores con rol `Mid` como titulares). Devuelve `409 Conflict`.
- **RN-04:** Un jugador puede pertenecer a más de un roster simultáneamente.
- **RN-05:** Al eliminar un roster o remover una asignación, los jugadores permanecen registrados en la base de datos (integridad referencial con eliminación en cascada solo sobre la tabla intermedia).

---

## Estructura del Proyecto

Organizamos el código en una arquitectura por capas clara y fácil de entender:

```text
config/                  # Credenciales de Sequelize CLI
└── config.json
migrations/              # Migraciones de Sequelize CLI
├── 20261013170001-create-jugadores.cjs
├── 20261013170002-create-rosters.cjs
└── 20261013170003-create-roster-jugador.cjs
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
│   ├── jugadores.controller.js
│   ├── rosters.controller.js
│   └── auxiliares.controller.js
├── routes/              # Definición de rutas Express
│   ├── jugadores.routes.js
│   ├── rosters.routes.js
│   └── auxiliares.routes.js
├── docs/                # Especificación OpenAPI 3.0 en formato JSON
│   └── openapi.json
└── app.js               # Configuración central de Express y Swagger
server.js                # Punto de entrada que levanta el servidor HTTP
```
