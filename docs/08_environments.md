---
title: Environments
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [01_tech_stack.md, 05_architecture.md]
blocks: [10_test_strategy.md]
---

# 08 — Environments

## Environment matrix

| Environment | Purpose | URL / access | Data | Deploy trigger |
| ----------- | ------- | ------------ | ---- | -------------- |
| local | dev | `http://localhost:3000` | synthetic / seed GSA | manual |
| staging | pre-prod piloto GSA | `https://ember-staging.vercel.app` `(candidate)` | seed + membros teste | push `main` |
| production | live | a definir | real GSA | tag / manual |

## Local development

### Prerequisites

| Tool | Version | Install |
| ---- | ------- | ------- |
| Node.js | 22 LTS | nvm / fnm |
| pnpm | 9.x | `corepack enable` |
| PostgreSQL ou Supabase CLI | latest | docker / brew |

### First-time setup

```bash
git clone <repo-url>
cd ember
pnpm install
cp .env.example .env
# editar .env — nunca commitar

# banco (candidato Supabase)
supabase start
supabase db reset  # NÃO usar em ambientes compartilhados — apenas local isolado

pnpm db:migrate
pnpm dev
```

### Daily commands

| Task | Command |
| ---- | ------- |
| Start dev | `pnpm dev` |
| Mailpit (email dev) | `node scripts/dev/mailpit.mjs` → UI `http://127.0.0.1:8025` |
| Run tests | `pnpm test` |
| Lint | `pnpm lint` |
| Validate Meridian | `python3 .agent/scripts/validate_meridian.py .` |

## Environment variables

| Variable | Required | Secret | Purpose | Example (non-secret) |
| -------- | -------- | ------ | ------- | -------------------- |
| `DATABASE_URL` | yes | yes | Postgres connection | `postgres://localhost:5432/ember` |
| `NEXT_PUBLIC_APP_URL` | yes | no | base URL para links | `http://localhost:3000` |
| `AUTH_SECRET` | yes | yes | assinatura de sessão | — |
| `EMAIL_API_KEY` | yes | yes | Resend (prod) | — |
| `EMBER_EMAIL_PROVIDER` | dev | no | `noop` / `smtp` / `resend` | `smtp` |
| `EMBER_SMTP_HOST` | dev | no | Mailpit | `127.0.0.1` |
| `EMBER_SMTP_PORT` | dev | no | Mailpit SMTP | `1025` |
| `EMBER_EMAIL_FROM` | yes | no | remetente | `Ember <dev@localhost>` |
| `EMBER_EMAIL_PEPPER` | yes | yes | hash/vault destinatário + corpo | — |
| `EMBER_APP_URL` | yes | no | links em templates | `http://localhost:3000` |

## Staging

| Attribute | Value |
| --------- | ----- |
| Host | Vercel preview / staging `(candidate)` |
| Deploy | push to `main` |
| Smoke test URL | `/api/v1/health` |

## Production

| Attribute | Value |
| --------- | ----- |
| Host | a definir |
| Deploy | manual / tag — HAR para credenciais |
| Rollback | revert deploy Vercel |
| Production approver | manager |

## Deploy and release

| Step | Environment | Trigger | Approver | Rollback |
| ---- | ----------- | ------- | -------- | -------- |
| Build artifact | CI | PR merge | automated | n/a |
| Promote staging | staging | merge main | automated | revert |
| Promote production | production | tag | manager | revert deploy |

## CI/CD

| Pipeline file | Triggers | Jobs |
| ------------- | -------- | ---- |
| `.github/workflows/ci.yml` | PR, push main | lint, test, build |

| Gate | Blocking | Tool |
| ---- | -------- | ---- |
| Lint | yes | ESLint |
| Unit tests | yes | Vitest |
| E2E | no na v1 | Playwright |
| Security audit | warn | `pnpm audit` |

## Observability (optional at init)

| Signal | Tool | Dashboard |
| ------ | ---- | --------- |
| Logs | Vercel logs | — |
| Errors | Sentry `(candidate)` | — |

## Gaps / open questions

| # | Gap | Owner |
| - | --- | ----- |
| 1 | Domínio de produção GSA | manager |
| 2 | Seed de dados para dev local | dev |

## Gate

Local setup must be copy-pasteable before `approved`.
