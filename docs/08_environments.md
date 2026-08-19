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
| pnpm | 9+ | `corepack enable` |
| Mailpit (opcional) | latest | `brew install mailpit` |

### First-time setup

```bash
git clone <repo-url>
cd ember
pnpm install
cp .env.example .env
# editar .env — nunca commitar

pnpm db:migrate
pnpm dev
```

Portas locais: `config/dev-ports.json` — web `3000`, API `3001`, Mailpit SMTP `1025`, UI `8025`.

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
| `EMBER_DB_PATH` | yes | no | SQLite MVP 0 | `data/ember.db` |
| `EMBER_API_PORT` | no | no | porta da API | `3001` |
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
