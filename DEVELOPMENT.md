# Development

This guide outlines the steps required to set up and run the project in a local environment.

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [bun](https://bun.sh/)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- [Git](https://git-scm.com/)

## Setup

### 1. Clone the repository:

```bash
git clone https://github.com/chef0111/tku-sparring.git
cd tku-sparring
```

### 2. Install Portless

Documentation: [portless.sh](https://portless.sh)

```bash
bun add -g portless
```

### 3. Install dependencies:

```bash
bun install
```

### 4. Configure environment variables:

- Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- Update the environment variables with your actual credentials. You can obtain these credentials by signing up on the respective websites.
- For **tournament realtime**, keep the local dev block from `.env.example` (or use the same custom secrets in `realtime/.env` — see step 5).

### 5. Tournament realtime service

Run the `[realtime/](realtime/)` service alongside the main app — without it, some realtime features (cross-device refresh) are unavailable. See `[docs/tournament-realtime.md](docs/tournament-realtime.md)` for how it works.

#### Install and configure

```bash
cd realtime
bun install
cp .env.example .env.local
```

Edit `realtime/.env.local`. `**INTERNAL_BROADCAST_SECRET**` and `**TOURNAMENT_SOCKET_JWT_SECRET**` must match the main app (`.env.local`):

| Main app (`.env.local`)              | Realtime (`realtime/.env.local`) |
| ------------------------------------ | -------------------------------- |
| `REALTIME_INTERNAL_BROADCAST_SECRET` | `INTERNAL_BROADCAST_SECRET`      |
| `TOURNAMENT_SOCKET_JWT_SECRET`       | `TOURNAMENT_SOCKET_JWT_SECRET`   |

Fill in the rest from `[.env.example](.env.example)` (main app) and `[realtime/.env.example](realtime/.env.example)`. Generate secrets once and paste the **same** value into both files for each pair in the table:

```bash
# Shared broadcast token (both env files)
openssl rand -base64 32

# Socket JWT signing secret — use a second run; keep ≥32 characters (both env files)
openssl rand -base64 32
```

On Windows without `openssl` (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Run that twice for the two secrets. Ensure `CORS_ORIGINS` in `realtime/.env` includes the browser origin you use (e.g. `https://tss.localhost` with Portless).

#### Run (separate terminal)

```bash
cd realtime
bun run dev
```

Check health:

```bash
curl http://localhost:3331/health
# → {"ok":true}
```

Restart `bun run dev` on the main app after changing any `VITE_*` variable.

More detail: `[docs/tournament-realtime.md](docs/tournament-realtime.md)`.

### 6. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

### 7. Start the development server:

Keep the realtime process from step 5 running, then in another terminal from the repo root:

```bash
bun run dev
```

The application should now be available at `https://tss.localhost`.

## Dev accounts (no sign-up UI)

The product is **sign-in only** — there is no registration page in the app (see `PRD.md`: system-admin scope). In **development**, Better Auth’s OpenAPI plugin is enabled so you can create accounts through the interactive API reference.

### Create an account

1. Start the dev server (`bun run dev`).
2. Open the auth reference UI (same host as the app): [https://tss.localhost/api/auth/reference](https://tss.localhost/api/auth/reference)
3. In the Scalar UI, open the **Default** group → `**POST /sign-up/email`\*\* (the username plugin extends this endpoint; do not look for a separate sign-up route).
4. Click **Test request** and send a body like:

```json
{
  "name": "Dev Admin",
  "email": "dev@example.com",
  "username": "dev.admin",
  "password": "DevPass1!"
}
```

| Field      | Notes                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `email`    | Required by Better Auth even though sign-in uses **username** (`/login`). Use any valid address for local dev. |
| `name`     | Display name (required).                                                                                       |
| `username` | Used on the login form. Rules: 3–30 chars, `[a-zA-Z0-9_.-]+`, at least one letter (`UsernameSchema`).          |
| `password` | Must satisfy `PasswordSchema`: ≥8 chars, upper, lower, digit, special character.                               |

5. On success, sign in at `https://tss.localhost/login` with that **username** and **password**.

### Optional: `curl`

```bash
curl -X POST "https://tss.localhost/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","name":"Dev Admin","username":"dev.admin","password":"DevPass1!"}'
```

Use the same origin you use in the browser (`BETTER_AUTH_URL` in `.env.local` should match that host for cookies and CSRF).

### 8. Build for production

```bash
bun run start
```
