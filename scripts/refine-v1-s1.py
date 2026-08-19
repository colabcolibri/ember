#!/usr/bin/env python3
"""Refina US-0001 … US-0008 do sprint v1-S1 (one-shot)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

COMMON_TAIL = """
### Security notes

- Sem secrets reais em `.env.example`; pepper e API keys só no `.env` local.

### Related decisions

- Phase docs aprovados — infra email segue `docs/architecture/email.md`.

### Planned

"""


def run_update(us_id: str, body: str) -> None:
    proc = subprocess.run(
        [sys.executable, str(CLI), "update-us", us_id],
        input=body,
        text=True,
        cwd=ROOT,
        capture_output=True,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        raise SystemExit(proc.returncode)
    subprocess.run(
        [sys.executable, str(CLI), "set-ready", us_id, "--ready", "true"],
        cwd=ROOT,
        check=True,
    )
    print(f"refined {us_id}")


BODIES: dict[str, str] = {}

BODIES["US-0001"] = """---
id: US-0001
title: Monorepo scaffold apps e packages
epic: EPIC-01
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: []
ready: true
done_when: "pnpm dev sobe web e api sem erro"
tests: required
tests_status: pending
---

# US-0001 — Monorepo scaffold apps e packages

**As** desenvolvedor,
**I want** monorepo com apps/web, apps/api, packages/db e packages/domain,
**so that** posso implementar features com boundaries claros.

## Intent

### Acceptance

- [ ] `pnpm install` e `pnpm dev` funcionam
- [ ] Pastas alinhadas a `05_architecture.md`
- [ ] TypeScript compartilhado entre packages

### Why

Sem estrutura de repo, cada US seguinte carece de lugar canônico. Skeleton executável sem domínio de negócio.

### Where

Primeira US do v1-S1. Desbloqueia US-0002 e todo o MVP 0.

## Plan

### Approach

- Criar workspace pnpm na raiz com `apps/web` (Vite + React), `apps/api` (Hono + Node), `packages/db`, `packages/domain` e `packages/email`, espelhando o layout de `docs/05_architecture.md` § Repository layout.
- Compartilhar `tsconfig.base.json` na raiz para strict mode e `NodeNext`, evitando duplicar opções em cada package.
- Expor scripts raiz `dev`, `build`, `test` e `db:migrate` que delegam via `pnpm -r` / `--filter`, para onboarding com um único comando.
- `apps/web` consome `/api/health` via proxy Vite na porta 3000; `apps/api` escuta `EMBER_API_PORT` (3001) — validação de que ambos sobem juntos com `pnpm dev`.

### Architecture refs

- `docs/05_architecture.md` — § Repository layout (high level)
- `docs/01_tech_stack.md` — monorepo pnpm + TypeScript

### API / DB impact

- _n/a_ — apenas scaffold

### Security notes

- _n/a_

### Related decisions

- Phase docs aprovados pelo manager.

### Planned

- [ ] **manual** — `pnpm install && pnpm dev` e confirmar web em `:3000` e API `/health` em `:3001`
- [ ] **automated** — smoke tests mínimos em `apps/web` e `apps/api`

## Record

### Files

- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- `apps/web/**`, `apps/api/**`, `packages/db/**`, `packages/domain/**`

### Backend

- `apps/api/src/index.ts` — health check

### Frontend

- `apps/web/src/App.tsx` — shell com status da API

### Scripts / Docs

- _n/a_
"""

BODIES["US-0002"] = """---
id: US-0002
title: SQLite migrations schema core
epic: EPIC-01
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0001]
ready: true
done_when: "Migrations criam tabelas core e sent_emails"
tests: required
tests_status: pending
---

# US-0002 — SQLite migrations schema core

**As** desenvolvedor,
**I want** migrations versionadas SQLite,
**so that** o banco reflete `06_database.md`.

## Intent

### Acceptance

- [ ] Migration `YYYYMMDDHHMMSS_initial_schema.sql` aplica sem erro
- [ ] Tabelas communities, users, rounds, circles, sent_emails existem
- [ ] Comando documentado em `08_environments.md`

### Why

Persistência é pré-requisito de API, email e matching. SQLite no MVP 0.

### Where

v1-S1 após scaffold; desbloqueia email e auth.

## Plan

### Approach

- Implementar runner em `packages/db/src/migrate.ts` com `better-sqlite3`, lendo SQL de `packages/db/migrations/` e registrando em `schema_migrations` — forward-only, sem ORM no MVP 0.
- Migration `20260819162200_initial_schema.sql` cria entidades mínimas (`communities`, `users`, `rounds`, `circles`) alinhadas ao ER de `06_database.md` e tabela `sent_emails` conforme `docs/architecture/email.md` § Schema.
- Expor `ensureDatabaseReady()` e CLI `pnpm db:migrate` para aplicar migrations idempotentemente no path `EMBER_DB_PATH` (default `data/ember.db`).
- Teste Vitest cria DB temporário e asserta presença das tabelas core — sem reset destrutivo.

### Architecture refs

- `docs/06_database.md` — § Schema overview, § Migrations
- `docs/architecture/email.md` — § Schema `sent_emails`
- `docs/05_architecture.md` — § Repository layout (`packages/db`)

### API / DB impact

- Novas tabelas SQLite; sem endpoints ainda.

### Security notes

- `EMBER_DB_PATH` local; arquivo em `.gitignore` (`data/`).

### Related decisions

- SQLite MVP 0 (phase docs).

### Planned

- [ ] **manual** — `pnpm db:migrate` e inspecionar tabelas com `sqlite3 data/ember.db ".tables"`
- [ ] **automated** — `packages/db/src/migrate.test.ts`

## Record

### Files

- `packages/db/migrations/20260819162200_initial_schema.sql`
- `packages/db/src/migrate.ts`, `migrate-cli.ts`

### Backend

- Runner de migrations

### Frontend

- _n/a_

### Scripts / Docs

- `pnpm db:migrate` na raiz
"""

BODIES["US-0003"] = """---
id: US-0003
title: Dev environment env example e mailpit ports
epic: EPIC-01
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0001]
ready: true
done_when: ".env.example e dev-ports.json documentados"
tests: required
tests_status: pending
---

# US-0003 — Dev environment env example e mailpit ports

**As** desenvolvedor,
**I want** variáveis EMBER_* e portas Mailpit centralizadas,
**so that** onboarding local é copy-paste.

## Intent

### Acceptance

- [ ] `.env.example` sem secrets reais
- [ ] `config/dev-ports.json` com mailpit 1025/8025
- [ ] `08_environments.md` alinhado

### Why

Config dispersa gera falhas silenciosas em email e auth.

### Where

Paralelo ao scaffold; desbloqueia US-0004 e US-0006.

## Plan

### Approach

- Adicionar `.env.example` na raiz com todas as variáveis `EMBER_*` documentadas em `docs/architecture/email.md` § Variáveis de ambiente, usando placeholders seguros.
- Centralizar portas em `config/dev-ports.json` (`web`, `api`, `mailpitSmtp`, `mailpitWeb`) consumidas por `scripts/dev/mailpit.mjs` e referenciadas em `08_environments.md`.
- Documentar fluxo local: copiar `.env`, subir Mailpit, setar `EMBER_EMAIL_PROVIDER=smtp` — sem `supabase db reset`.

### Architecture refs

- `docs/08_environments.md` — § Local development, § Environment variables
- `docs/architecture/email.md` — § Variáveis de ambiente, § Mailpit (dev)

### API / DB impact

- _n/a_

### Security notes

- Pepper e `RESEND_API_KEY` só no `.env` gitignored.

### Related decisions

- Padrão Osmo para prefixo `EMBER_EMAIL_*`.

### Planned

- [ ] **manual** — `cp .env.example .env` e validar leitura de portas pelo script Mailpit
- [ ] **automated** — assert de existência de chaves em teste de config (smoke)

## Record

### Files

- `.env.example`, `config/dev-ports.json`

### Scripts / Docs

- Atualizar `docs/08_environments.md`
"""

BODIES["US-0004"] = """---
id: US-0004
title: Email sender providers padrao Osmo
epic: EPIC-02
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0002, US-0003]
ready: true
done_when: "Providers noop logging smtp resend por env"
tests: required
tests_status: pending
---

# US-0004 — Email sender providers padrao Osmo

**As** desenvolvedor,
**I want** factory de email portada do Osmo,
**so that** envio usa adapter correto por ambiente.

## Intent

### Acceptance

- [ ] `EMBER_EMAIL_PROVIDER=noop` não envia
- [ ] `smtp` entrega no Mailpit
- [ ] `resend` falha graciosamente sem API key

### Why

Reuso do padrão Osmo reduz risco no piloto.

### Where

`packages/email` — base para US-0005 e templates.

## Plan

### Approach

- Criar `packages/email` portando `create-email-sender.ts`, senders (`noop`, `logging`, `smtp`, `resend`, `misconfigured`) e `smtp-config.ts` do Osmo, trocando prefixo `OSMO_` → `EMBER_`.
- Default seguro: provider vazio → `NoopEmailSender`; `resend` sem `RESEND_API_KEY` → `MisconfiguredEmailSender` com erro explícito (não lança exceção).
- Singleton com `resetEmailSenderCacheForTests()` para testes isolados — SRP: factory só resolve provider; senders só transportam.
- Reutilizar `nodemailer` para SMTP apontando Mailpit (`127.0.0.1:1025`).

### Architecture refs

- `docs/architecture/email.md` — § Providers, § Módulos a portar do Osmo
- `docs/02_security.md` — default noop em CI

### API / DB impact

- _n/a_ nesta US

### Security notes

- Nunca enviar email real em CI (`noop` default).

### Related decisions

- Copiar estrutura Osmo, não reinventar.

### Planned

- [ ] **manual** — com Mailpit: `EMBER_EMAIL_PROVIDER=smtp node -e` smoke ou POST `/dev/magic-link`
- [ ] **automated** — `packages/email/src/email.test.ts` (noop + resend misconfigured)

## Record

### Files

- `packages/email/src/email/create-email-sender.ts`
- `packages/email/src/email/*-email-sender.ts`
"""

BODIES["US-0005"] = """---
id: US-0005
title: sent_emails persistencia hash e vault
epic: EPIC-02
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0004]
ready: true
done_when: "Envio OK grava sent_emails"
tests: required
tests_status: pending
---

# US-0005 — sent_emails persistencia hash e vault

**As** facilitador,
**I want** auditoria de emails enviados,
**so that** rastreio convites sem PII em logs.

## Intent

### Acceptance

- [ ] `recordSentEmail` só após `result.ok`
- [ ] email_hash + email_vault no destinatário
- [ ] html_vault e text_vault encriptados

### Why

LGPD e debug do piloto exigem trilha sem expor corpo em log.

### Where

Integrado em `sendTransactionalEmail` — US-0008 consome.

## Plan

### Approach

- Portar `record-sent-email.ts`, `sent-emails-db.ts`, `sent-email-body-vault.ts` e `crypto/vault-crypto.ts` para `packages/email`, adaptando `license-email-vault` → `recipient-email-vault.ts` com `EMBER_EMAIL_PEPPER`.
- `sendTransactionalEmail` chama `recordSentEmail` **somente** quando `result.ok === true`; falha de provider não grava linha.
- Corpo HTML/text passa por `redact-sent-email-body.ts` (redige token de magic link) antes do vault AES-256-GCM.
- DRY: persistência concentrada em `recordSentEmail`; handlers só passam `delivery` context.

### Architecture refs

- `docs/architecture/email.md` — § Fluxo, § Schema `sent_emails`, § Segurança e LGPD
- `docs/02_security.md` — classificação PII

### API / DB impact

- Escrita em `sent_emails` após envio OK.

### Security notes

- Pepper obrigatório para vault; hash SHA-256 com pepper no destinatário.

### Related decisions

- Sem `license_key_prefix` (diferente do Osmo).

### Planned

- [ ] **manual** — enviar magic link e consultar `SELECT kind, provider FROM sent_emails`
- [ ] **automated** — testes de gravação e não-gravação em falha

## Record

### Files

- `packages/email/src/record-sent-email.ts`, `sent-emails-db.ts`, `crypto/**`
"""

BODIES["US-0006"] = """---
id: US-0006
title: Script Mailpit dev local
epic: EPIC-02
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0003]
ready: true
done_when: "mailpit.mjs sobe SMTP e UI"
tests: required
tests_status: pending
---

# US-0006 — Script Mailpit dev local

**As** desenvolvedor,
**I want** Mailpit com um comando,
**so that** testo emails sem Resend.

## Intent

### Acceptance

- [ ] Script em `scripts/dev/mailpit.mjs`
- [ ] UI em http://127.0.0.1:8025
- [ ] Documentado em `08_environments`

### Why

Dev sem Mailpit envia email real por engano.

### Where

Dev tooling — usado com US-0004 smtp e US-0008.

## Plan

### Approach

- Portar `osmo/scripts/dev/mailpit.mjs` para `scripts/dev/mailpit.mjs`, lendo portas de `config/dev-ports.json` (não hardcoded).
- Preferir binário nativo `mailpit` (brew); fallback Docker `axllent/mailpit` com container `ember-mailpit`.
- Documentar em `08_environments.md` o fluxo: terminal 1 Mailpit, terminal 2 API com `EMBER_EMAIL_PROVIDER=smtp`.

### Architecture refs

- `docs/architecture/email.md` — § Mailpit (dev)
- `docs/08_environments.md` — § Daily commands

### API / DB impact

- _n/a_

### Security notes

- Mailpit só em localhost; nunca em produção.

### Related decisions

- Portas 1025/8025 padrão Osmo.

### Planned

- [ ] **manual** — `node scripts/dev/mailpit.mjs` e abrir UI `:8025`
- [ ] **automated** — smoke: script existe e JSON de portas válido

## Record

### Files

- `scripts/dev/mailpit.mjs`
"""

BODIES["US-0007"] = """---
id: US-0007
title: Email layout e brand Ember
epic: EPIC-02
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0004]
ready: true
done_when: "Layout usa tokens do design system"
tests: required
tests_status: pending
---

# US-0007 — Email layout e brand Ember

**As** membro da comunidade,
**I want** emails com visual Ember,
**so that** convites geram confiança.

## Intent

### Acceptance

- [ ] HTML + text plain
- [ ] Logo CID inline
- [ ] Cores rust/paper/ink

### Why

Layout único evita duplicação em cada template.

### Where

`packages/email/src/email/email-layout.ts` — base para todos os kinds.

## Plan

### Approach

- Implementar `email-brand.ts` com tokens de `09_design_system.md` (rust `#aa4f36`, paper `#fbf8f3`, ink `#20211f`) e tagline Ember.
- `email-layout.ts` expõe `wrapEmailDocument`, `ctaButton`, header/footer — HTML table-based para clientes de email.
- Logo via CID inline opcional (`assets/ember-logo-email.png`); fallback visual se asset ausente — não falha envio.
- DRY: templates futuros só montam `panelHtml` e chamam `wrapEmailDocument`.

### Architecture refs

- `docs/09_design_system.md` — § Color tokens (semantic)
- `docs/architecture/email.md` — § Módulos (`email-layout`, `email-brand`)

### API / DB impact

- _n/a_

### Security notes

- `escapeHtml` em todo conteúdo dinâmico.

### Related decisions

- Sem React Email no MVP 0.

### Planned

- [ ] **manual** — inspecionar HTML no Mailpit
- [ ] **automated** — assert de cor rust no HTML gerado

## Record

### Files

- `packages/email/src/email/email-brand.ts`, `email-layout.ts`
"""

BODIES["US-0008"] = """---
id: US-0008
title: Template email magic_link
epic: EPIC-02
version: v1
sprint: v1-S1
status: ❌
moscow: Must
depends_on: [US-0005, US-0007]
ready: true
done_when: "magic_link enviado e gravado"
tests: required
tests_status: pending
---

# US-0008 — Template email magic_link

**As** membro da comunidade,
**I want** receber link de acesso,
**so that** entro sem senha.

## Intent

### Acceptance

- [ ] kind `magic_link` em sent_emails
- [ ] Link com expiração
- [ ] Visível no Mailpit em dev

### Why

Primeiro email transacional end-to-end.

### Where

Fecha slice email do v1-S1; auth completo em v1-S2.

## Plan

### Approach

- `buildMagicLinkEmailContent` em `magic-link-templates.ts` gera subject/text/html PT com CTA, link plain e menção de expiração (`ttlMinutes`).
- `buildMagicLinkUrl` monta URL `{EMBER_APP_URL}/auth/magic?token=…` — token gerado no handler dev.
- Endpoint dev `POST /dev/magic-link` na API chama `sendTransactionalEmail` com `delivery.kind = magic_link` e meta `expires_in_minutes`.
- Reutiliza layout US-0007 e persistência US-0005 — SRP: template não envia; orquestrador não monta HTML.

### Architecture refs

- `docs/architecture/email.md` — § Kinds (`magic_link`), § Padrão de uso no caller
- `docs/07_api_contracts.md` — auth magic link (stub dev)

### API / DB impact

- `POST /dev/magic-link` (dev only); grava `sent_emails`.

### Security notes

- Token em URL redigido no vault armazenado; expiração documentada no corpo.

### Related decisions

- Auth completo (validação de token) fora desta US.

### Planned

- [ ] **manual** — Mailpit + `curl -X POST localhost:3001/dev/magic-link -d '{"email":"test@example.com"}'`
- [ ] **automated** — teste e2e noop grava `magic_link` em SQLite

## Record

### Files

- `packages/email/src/email/magic-link-templates.ts`
- `apps/api/src/index.ts` — `/dev/magic-link`
"""


def main() -> None:
    for us_id in [
        "US-0001",
        "US-0002",
        "US-0003",
        "US-0004",
        "US-0005",
        "US-0006",
        "US-0007",
        "US-0008",
    ]:
        run_update(us_id, BODIES[us_id])


if __name__ == "__main__":
    main()
