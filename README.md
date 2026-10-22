# SaitoLab Money

Personal finance app: accounts, transactions, transfers, contacts, loans, categories.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, shadcn/radix-ui components.
- **Forms/validation:** react-hook-form + zod schemas (`lib/schemas/`).
- **Backend:** [InsForge](https://insforge.dev) — Postgres database, auth, storage, realtime, edge functions, AI gateway, payments — accessed via `@insforge/sdk` (`lib/insforge/client.ts` client-side, `lib/insforge/server.ts` server-side).
- **Auth routing:** `proxy.ts` (Next.js middleware) gates `/dashboard/*` behind the `insforge_access_token` cookie and redirects authenticated users away from `/sign-in`, `/sign-up`, `/verify-email`.
- **Edge functions:** `insforge/functions/sync-currencies` — deployed to InsForge's Deno runtime, not bundled into the Next.js build.
- **Database:** schema-managed via SQL migrations in `migrations/`, applied with the InsForge CLI.

## Architecture

```
Browser
  │
  ▼
Next.js app (Vercel, via InsForge deployments)
  │  @insforge/sdk (NEXT_PUBLIC_INSFORGE_URL / NEXT_PUBLIC_INSFORGE_ANON_KEY)
  ▼
InsForge backend (Postgres + Auth + Storage + Realtime + Functions)
  │
  ▼
Edge function: sync-currencies (Deno, deployed separately)
```

The app talks to InsForge entirely through the SDK — no custom API routes for CRUD. Each environment (dev / prod) is a **separate InsForge backend instance** (its own Postgres, own API keys) and a **separate frontend deployment**, so they never share data.

## Environments

InsForge branching gives dev and prod fully isolated backends sharing the same auth `JWT_SECRET`. The frontend is deployed once per backend context via `npx -y @insforge/cli deployments deploy`.

| Environment | Frontend URL | InsForge backend | Env file |
|---|---|---|---|
| **Production** | https://saitolab-money-ai.insforge.site | `https://znr8sdut.us-east.insforge.app` (parent project) | `.env.local.prod` |
| **Development** | https://saitolab-money-ai-dev.insforge.site | `https://znr8sdut-x4k.us-east.insforge.app` (`dev` branch) | `.env.local` |

Switching which backend the CLI deploys/targets:

```bash
npx -y @insforge/cli branch switch dev       # target dev branch
npx -y @insforge/cli branch switch --parent  # target prod
```

`deployments env` vars are scoped per linked context (dev vs. prod), so `deployments deploy .` always ships the right `NEXT_PUBLIC_INSFORGE_URL` / `NEXT_PUBLIC_INSFORGE_ANON_KEY` for whichever side is currently switched to.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Local dev reads `.env.local` (points at the `dev` InsForge branch).

## Database migrations

```bash
npx -y @insforge/cli db migrations new <name>
npx -y @insforge/cli db migrations up --all
```

## Deploying

```bash
# Build check
pnpm build

# Deploy whichever backend context is currently switched to
npx -y @insforge/cli deployments deploy .
```
