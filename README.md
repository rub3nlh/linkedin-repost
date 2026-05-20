# LinkedIn Repost

Página simple para que tu equipo de comunicaciones repostee enlaces de LinkedIn en tu perfil sin tener acceso a tus credenciales.

## Cómo funciona

1. **Tú** (dueño del perfil) entras una vez, pulsas **Conectar con LinkedIn** y autorizas la app vía OAuth 2.0.
2. La página `/connected` te muestra el token y los valores listos para pegar como variables de entorno en Vercel.
3. **Tu equipo** entra a la misma URL, escribe la URL del post + mensaje opcional, mete la contraseña compartida (`ADMIN_PASSWORD`) y pulsa **Aceptar**.
4. La app crea un repost en tu perfil usando `POST /rest/posts` con `reshareContext.parent`.

El token se lee siempre desde variables de entorno (`LINKEDIN_TOKEN`, `LINKEDIN_SUB`, `LINKEDIN_TOKEN_EXPIRES_AT`). No hay base de datos.

## Setup

### 1. Crear app en LinkedIn Developers

- https://www.linkedin.com/developers/apps → crea una app.
- Añade los productos:
  - **Sign In with LinkedIn using OpenID Connect**
  - **Share on LinkedIn**
- En **Auth → OAuth 2.0 settings → Authorized redirect URLs** añade:
  - `http://localhost:3000/api/auth/callback` (local)
  - `https://TU-APP.vercel.app/api/auth/callback` (Vercel)
- Copia `Client ID` y `Client Secret`.

### 2. Variables de entorno en Vercel

En tu proyecto de Vercel → **Settings → Environment Variables** añade:

| Key | Value |
|---|---|
| `LINKEDIN_CLIENT_ID` | el Client ID de tu app de LinkedIn |
| `LINKEDIN_CLIENT_SECRET` | el Primary Client Secret |
| `LINKEDIN_REDIRECT_URI` | `https://TU-APP.vercel.app/api/auth/callback` |
| `ADMIN_PASSWORD` | una clave larga aleatoria que compartirás con tu equipo |

Redeploy.

### 3. Conectar tu perfil

1. Abre `https://TU-APP.vercel.app`.
2. Pulsa **Conectar con LinkedIn** → autoriza.
3. Aterrizarás en `/connected`. Copia los 5 valores que te muestra:
   - `LINKEDIN_TOKEN`
   - `LINKEDIN_SUB`
   - `LINKEDIN_TOKEN_EXPIRES_AT`
   - `LINKEDIN_NAME`
   - `LINKEDIN_PICTURE`
4. Pégalos en Vercel → Settings → Environment Variables (Production) → Redeploy.
5. Comparte la URL + `ADMIN_PASSWORD` con tu equipo.

### 4. Renovar el token (~cada 60 días)

Cuando la UI te avise que el token expiró:
1. Pulsa **Re-conectar** en la página principal.
2. Copia los nuevos valores desde `/connected` a Vercel.
3. Redeploy.

## Desarrollo local

```bash
cp .env.example .env.local
# Rellena LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI, ADMIN_PASSWORD
npm install
npm run dev
```

Abre http://localhost:3000, conecta LinkedIn, copia los valores de `/connected` al final de `.env.local`, reinicia el dev server.

## Formatos de URL soportados

El campo URL del formulario acepta cualquiera:

- `https://www.linkedin.com/posts/usuario_slug-activity-7012345678901234567-abcd`
- `https://www.linkedin.com/feed/update/urn:li:activity:7012345678901234567/`
- `https://www.linkedin.com/feed/update/urn:li:share:7012345678901234567/`
- `urn:li:share:7012345678901234567`
- `7012345678901234567` (id desnudo)

## Limitaciones conocidas

- LinkedIn no entrega refresh tokens en el flujo estándar de `w_member_social`; renovar es manual cada ~60 días.
- Si tu app aún no está aprobada por LinkedIn, solo podrás postear desde perfiles listados como devs en la sección "App roles" del developer console.
