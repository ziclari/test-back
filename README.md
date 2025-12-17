# Simuladores Innovación
Framework de simulación educativa orientado a experiencias narrativas e inmersivas, diseñado para que los estudiantes resuelvan casos prácticos a través de escenarios interactivos.

## Desarrollador
- Citlalli Itzel Santiago Palmero

## Tecnologías

* Node.js 24+
* npm 11+
* Frontend: React + Vite
* Backend: Express.js

## Estructura del proyecto

```
/
├── frontend/
└── backend/
```

## Instalación de dependencias

### Frontend

```bash
cd frontend
npm install
```

### Backend (opcional)

```bash
cd backend
npm install
```

## Variables de entorno 📄

### Frontend (`.env`)

```env
VITE_API_URL=
VITE_CONTENT_CDN=http://localhost:5173
```

**Descripción:**

* `VITE_API_URL`
  URL del backend propio.
  En desarrollo local se utiliza el **proxy de Vite** apuntando a `http://localhost:3000`.
  Es esencial cuando se prueban flujos de login localmente.

* `VITE_CONTENT_CDN`
  Origen desde donde se sirven los archivos estáticos de los simuladores.
  En local apunta al `public` del frontend, pero puede ser cualquier CDN (S3, CloudFront, etc.).


### Backend (`.env`)

```env
# Configuración básica
NODE_ENV=production
PORT=3000
MOODLE_BASE=https://moodleqa.ebc.edu.mx
FRONTEND_URL=http://localhost:5173
BASE_PATH=/

# JWT
JWT_SECRET=tu_secreto_super_seguro_de_32_caracteres_o_mas
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://moodleqa.ebc.edu.mx/,https://moodleqa.ebc.edu.mx
```

**Descripción:**

* `PORT`
  Puerto donde se expone la API del backend.

* `MOODLE_BASE`
  URL base de la instancia Moodle con la que se integra la aplicación.

* `FRONTEND_URL`
  URL del frontend autorizada para redirecciones y validaciones.

* `JWT_SECRET` / `JWT_REFRESH_SECRET`
  Secretos para la firma de tokens.
  Deben ser distintos y suficientemente largos.

* `ALLOWED_ORIGINS`
  Dominios permitidos para CORS.
  Deben incluir:

  * el frontend
  * los dominios de Moodle utilizados

## Ejecución local 🚀

### Frontend (obligatorio)

```bash
cd frontend
npm run dev
```

Aplicación disponible en:

```
http://localhost:5173
```

Al iniciar sin parámetros se carga un simulador por defecto.

### Backend (opcional)

El backend solo es necesario para simuladores que requieren autenticación Moodle.

```bash
cd backend
node index.js
```

API disponible en:

```
http://localhost:3000
```

## Qué esperar al ejecutar el proyecto

* Sin backend: simuladores funcionan en modo local sin login.
* Con backend: se habilitan simuladores que requieren autenticación Moodle.


## Simuladores disponibles

Accesibles directamente vía URL:

* `http://localhost:5173/` — **Default**
* `http://localhost:5173/corp-espionage`
* `http://localhost:5173/english-mission`
* `http://localhost:5173/electroconexiones` *(requiere login)*
* `http://localhost:5173/haunted-mansion`
* `http://localhost:5173/neon-detective`

Este README describe únicamente el **arranque y uso básico** del proyecto.
La documentación técnica y el desarrollo de nuevos simuladores se encuentran en la carpeta `/docs`. (Pendiente)
