# 🍽️ RestoAPI — Frontend

Interfaz web de RestoAPI: login, panel por rol, carta, mesas, reservas, pedidos y pantalla de cocina en tiempo real.

> Backend: [IA-P1-BCN/Resto-API_Backend](https://github.com/IA-P1-BCN/Resto-API_Backend) · Despliegue: [guía de deploy](https://github.com/IA-P1-BCN/Resto-API_Backend/blob/dev/docs/deploy.md) (solo Anna despliega)

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite |
| Rutas | React Router |
| Cliente HTTP | axios (interceptor JWT) |
| Tipos de la API | openapi-typescript (generados desde `/openapi.json`) |
| Calidad | ESLint + typescript-eslint |
| Hosting | Vercel |

## Puesta en marcha

Requisitos: **Node.js 20+** y **Git**.

```bash
# 1. Clonar y situarse en dev
git clone https://github.com/IA-P1-BCN/Resto-API_Frontend.git
cd Resto-API_Frontend
git switch dev

# 2. Dependencias (instala exactamente las versiones del package-lock.json)
npm ci

# 3. Variables de entorno
cp .env.example .env
```

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest + Testing Library) · `npm run test:watch` en modo continuo |
| `npm run gen:api` | Genera los tipos de la API desde el backend local (`src/api/schema.d.ts`) |

### Modo simulado (sin API)

Con `VITE_USE_MOCK=true` en el `.env`, el login funciona con usuarios de prueba y no se llama a la API. Sirve para trabajar en la UI antes de que el backend esté listo.

| Rol | Email | Contraseña |
|---|---|---|
| Administración | `admin@restoapi.dev` | `demo1234` |
| Sala (camarero) | `camarero@restoapi.dev` | `demo1234` |
| Cocina | `cocina@restoapi.dev` | `demo1234` |
| Cliente | `cliente@restoapi.dev` | `demo1234` |

En la pantalla de login hay un botón por rol que rellena las credenciales. **En Vercel debe ser `false`.**

En la vista **Cocina**, el botón *Simular pedido de sala* genera un pedido nuevo que aparece al instante, como si llegara por el WebSocket `/ws/cocina`. Los datos simulados (carta, mesas, reservas y pedidos) se reinician al recargar la página.

### Tiempo real (cocina)

La vista de cocina se conecta a `ws(s)://<API>/ws/cocina?token=<JWT>` y aplica los eventos `pedido_creado` y `pedido_actualizado`. Si la conexión se cae, reintenta con espera creciente (1 s, 2 s, 4 s… hasta 30 s) y, mientras tanto, consulta `GET /pedidos` cada 10 s.

### Estructura

```text
src/
├── api/          # Cliente axios (interceptor JWT) y un servicio por recurso (auth, menu, mesas, reservas)
│   └── mock/     # Modo simulado: datos de prueba (db.ts) y reglas de la API (server.ts)
├── components/   # Layout, rutas protegidas, paginación, formulario de reserva…
├── context/      # AuthContext / AuthProvider / useAuth
├── hooks/        # useQuery (carga de datos)
├── pages/        # Login, panel, carta, mesas, reservas, 403, 404
├── routes/       # Navegación por rol (matriz de permisos del plan, 5.4)
├── utils/        # Formato de precios y fechas, etiquetas
└── test/         # Tests de Vitest
```

> Para añadir una dependencia: `npm install <paquete>` y subir **también** el `package-lock.json`.

## Flujo de trabajo (Gitflow)

| Rama | Uso | Commits directos |
|---|---|---|
| `main` | Producción (Vercel) | ❌ Nunca |
| `dev` | Integración, rama por defecto | ❌ Nunca |
| `feature/HU-XX-descripcion` | Una rama por HU, sale de `dev` | ✅ Solo su dueña/o |
| `fix/HU-XX-descripcion` | Bug detectado en `dev` | ✅ Solo su dueña/o |
| `hotfix/descripcion` | Urgencia en producción, sale de `main` | ✅ Solo su dueña/o |

```bash
# Empezar una HU
git switch dev
git pull origin dev
git switch -c feature/HU-12-login

# Antes de abrir el PR
git pull origin dev     # traer lo último de dev y resolver conflictos en TU rama
npm run build
git push -u origin feature/HU-12-login
```

1. PR **`feature/...` → `dev`** con título `[HU-XX] Descripción` y `Closes #N`.
2. Lo revisa, aprueba y mergea **otra persona** (*Squash and merge*). La rama se borra automáticamente.
3. Quien mergea avisa en el canal: `✅ Mergeado #N [HU-XX] en dev → ¡haced pull!`
4. Todo el equipo actualiza su rama: `git pull origin dev`.
5. Al cierre de cada sprint: PR `dev` → `main` (*merge commit*) → despliegue.

**Commits** — [Conventional Commits](https://www.conventionalcommits.org/es/):
`feat(ui): ...` · `fix(login): ...` · `test: ...` · `docs: ...` · `ci: ...` · `chore(deps): ...`

## Reglas

- `.env` nunca se sube; solo `.env.example`.
- PRs pequeños (idealmente < 400 líneas).
