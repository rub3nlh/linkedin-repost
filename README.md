# LinkedIn Repost

Página simple para que tu equipo de comunicaciones repostee enlaces de LinkedIn en tu perfil sin tener acceso a tus credenciales.

## Cómo funciona

1. **Tú** (dueño del perfil) entras una vez, pulsas **Conectar con LinkedIn** y autorizas la app vía OAuth 2.0. El token queda guardado en `.token.json` (válido ~60 días).
2. **Tu equipo** entra a la misma página, escribe la URL del post + un mensaje opcional, mete la contraseña compartida (`ADMIN_PASSWORD`) y pulsa **Aceptar**.
3. La app crea un repost en tu perfil usando el endpoint `POST /rest/posts` con `reshareContext.parent` apuntando al URN del post original.

## Setup

### 1. Crear app en LinkedIn Developers

- Ve a https://www.linkedin.com/developers/apps y crea una app.
- En **Products**, añade:
  - `Sign In with LinkedIn using OpenID Connect`
  - `Share on LinkedIn`
- En **Auth → OAuth 2.0 settings → Authorized redirect URLs** añade:
  - `http://localhost:3000/api/auth/callback` (local)
  - `https://TU-APP.vercel.app/api/auth/callback` (producción)
- Copia el `Client ID` y `Client Secret`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Rellena LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI, ADMIN_PASSWORD
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre http://localhost:3000, conecta tu perfil, luego comparte el link + contraseña con tu equipo.

## Desplegar en Vercel

```bash
vercel
```

Configura las mismas variables de entorno en el dashboard de Vercel y actualiza `LINKEDIN_REDIRECT_URI` a la URL pública.

> **Nota sobre Vercel:** el sistema de archivos en Vercel es efímero, así que `.token.json` puede perderse entre despliegues. Para producción real, sustituye `lib/storage.ts` por Vercel KV / Upstash Redis / Postgres. Para uso esporádico es suficiente reconectar cuando haga falta.

## Formatos de URL soportados

El campo URL acepta cualquiera de estos:

- `https://www.linkedin.com/posts/usuario_slug-activity-7012345678901234567-abcd`
- `https://www.linkedin.com/feed/update/urn:li:activity:7012345678901234567/`
- `https://www.linkedin.com/feed/update/urn:li:share:7012345678901234567/`
- `urn:li:share:7012345678901234567`
- `7012345678901234567` (id desnudo)

## Limitaciones conocidas

- El access token de LinkedIn dura ~60 días. La UI te avisa cuántos días quedan; cuando caduca, basta con pulsar **Re-conectar**.
- LinkedIn no entrega refresh tokens en el flujo estándar de `w_member_social`; requiere aprobación adicional para programas tipo Marketing Developer Platform.
- Si tu app aún no está aprobada por LinkedIn para `w_member_social`, solo podrás postear en perfiles de desarrolladores listados en la app.
