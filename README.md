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

### Estructura

```text
src/
├── api/          # Cliente axios (interceptor JWT), auth, errores, modo simulado
├── components/   # Layout, rutas protegidas, aviso de "despertando el servidor"
├── context/      # AuthContext / AuthProvider / useAuth
├── pages/        # Login, panel, 403, 404 y vistas provisionales
├── routes/       # Navegación por rol (matriz de permisos del plan, 5.4)
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
