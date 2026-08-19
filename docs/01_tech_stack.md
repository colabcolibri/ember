---
title: Tech Stack
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [00_scope.md]
blocks: [02_security.md, 04_principles.md, 08_environments.md, 09_design_system.md, 10_test_strategy.md]
---

# 01 — Tech stack

## Summary

Ember é um monorepo web para matching de rodas no ritual Fogo de Conselho (piloto GSA). **MVP 0** usa SQLite, API com magic link, UI Vite + shadcn, e-mail, Jitsi e `.ics`. Postgres/Supabase fica para escala pós-piloto se necessário. Decisão humana necessária antes de `approved`.

## Runtime and language

| Layer | Technology | Version (if pinned) | Rationale |
| ----- | ---------- | ------------------- | --------- |
| Primary language | TypeScript | 5.x `(candidate)` | Tipagem forte para domínio de matching e contratos de API |
| Runtime | Node.js | 22 LTS `(candidate)` | Ecossistema maduro para web full-stack |
| Package manager | pnpm | 9.x `(candidate)` | Monorepo-friendly, lockfile único |

## Application surfaces

| Surface | Framework / host | Path in repo | Notes |
| ------- | ---------------- | ------------ | ----- |
| Web app | Vite + React `(planned — cloud agent)` | `apps/web/` | UI presença PT/EN; mockup editorial como referência |
| API / backend | Node + Hono ou Express `(planned)` | `apps/api/` | Rodadas, magic link, matching, Jitsi, `.ics` |
| CLI | n/a | — | Fora do escopo v1 |
| Extension / desktop | n/a | — | — |
| Mobile | n/a | — | Web responsiva na v1 |

## Data layer

| Concern | Choice | Config / path | Notes |
| ------- | ------ | ------------- | ----- |
| Primary database | SQLite (MVP 0) | `DATABASE_URL` ou path local | Piloto GSA; migra para Postgres se escala exigir |
| ORM / client | Drizzle `(planned)` | `packages/db/` | Migrações `YYYYMMDDHHMMSS_description.sql` |
| Migrations | SQL timestamped | `packages/db/migrations/` | |
| File / object storage | none na v1 | — | |
| Cache | none na v1 | — | |
| Video | Jitsi Meet | API ou link gerado | Sala por roda — MVP 0 |
| Calendar | `.ics` generation | lib `ics` ou similar | Anexo em e-mail de roda formada |

## Email (padrão Osmo)

| Concern | Choice | Notes |
| ------- | ------ | ----- |
| Envio dev | nodemailer → Mailpit `:1025` | `EMBER_EMAIL_PROVIDER=smtp` |
| Envio prod | Resend (`fetch`, sem SDK) | `EMBER_EMAIL_PROVIDER=resend` |
| Default | `noop` | Seguro se env ausente |
| Persistência | tabela `sent_emails` | Só após envio OK — ver `docs/architecture/email.md` |
| Templates | TS functions → html/text | Layout compartilhado + logo CID |
| Dev UI | Mailpit `http://127.0.0.1:8025` | `scripts/dev/mailpit.mjs` |

## Infrastructure and hosting

| Environment | Provider | Region | Notes |
| ----------- | -------- | ------ | ----- |
| Local | developer machine | — | Postgres local ou Supabase local |
| Staging | Vercel + Supabase `(candidate)` | sa-east-1 ou us-east | Piloto GSA |
| Production | Vercel + Supabase `(candidate)` | a definir | Após piloto |

## Dev tooling

| Tool | Purpose | Config file |
| ---- | ------- | ----------- |
| Bundler / compiler | Vite | `apps/web/vite.config.ts` |
| Linter | ESLint | `eslint.config.mjs` |
| Formatter | Prettier | `.prettierrc` |
| Unit test runner | Vitest `(candidate)` | `vitest.config.ts` |
| E2E runner | Playwright `(candidate)` | `playwright.config.ts` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

## UI stack signals

- [x] Web UI → `09_design_system.md`; run `/design-pass bootstrap`
- [x] Automated tests in scope → `10_test_strategy.md`; run `/test-pass bootstrap`

**Suggested UI stack id:** `ts-shadcn`

**Suggested test stack id:** `ts-vitest`

## Discarded alternatives

| Option | Why rejected |
| ------ | ------------ |
| Mobile-first (React Native) | Fora do escopo v1 — web responsiva suficiente |
| Firebase Realtime DB | Modelo relacional + histórico de grafos favorece Postgres |
| Matching em serverless puro sem DB | Histórico de encontros exige persistência |

## Evidence (Mode B)

Greenfield — sem `package.json` de produto ainda.

## Gaps / open questions

| # | Unknown | Blocker for |
| - | ------- | ----------- |
| 1 | Confirmar Vite + shadcn vs Next.js | `05_architecture` |
| 2 | Hono vs Express em `apps/api` | `07_api_contracts` |
| 3 | Jitsi: self-hosted vs meet.jit.si | `08_environments` |

## Gate

Human approves before `/security-pass bootstrap` and architecture work.
