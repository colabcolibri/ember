#!/usr/bin/env python3
"""Refina US-0009 … US-0013 do sprint v1-S2."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

BODIES: dict[str, str] = {
    "US-0009": """---
id: US-0009
title: API solicitar magic link
epic: EPIC-03
version: v1
sprint: v1-S2
status: ❌
moscow: Must
depends_on: [US-0008]
ready: true
done_when: "POST magic-link retorna 202"
tests: required
tests_status: pending
---

# US-0009 — API solicitar magic link

**As** membro da comunidade,
**I want** solicitar link por email,
**so that** acesso sem senha.

## Intent

### Acceptance

- [ ] POST `/api/v1/auth/magic-link`
- [ ] Resposta genérica se email existe ou não
- [ ] Rate limit por IP

### Why

Auth é porta de entrada do membro.

### Where

v1-S2 início EPIC-03.

## Plan

### Approach

- Expor `POST /api/v1/auth/magic-link` em `apps/api/src/routes/auth.ts`, recebendo `{ email, communitySlug? }` validado com zod em `packages/domain`.
- Persistir token como hash SHA-256 em `auth_magic_tokens` (nunca o token em claro no DB); reutilizar `sendTransactionalEmail` + `buildMagicLinkEmailContent` de `@ember/email` — DRY com US-0008.
- Responder sempre `202` com mensagem genérica anti-enumeration, independente de o email existir — conforme `02_security.md` § Account recovery.
- Middleware `rate-limit.ts` in-memory: 5 req/hora/IP em magic-link — retorna `429` + `Retry-After`.

### Architecture refs

- `docs/07_api_contracts.md` — § Endpoints `POST /auth/magic-link`
- `docs/02_security.md` — § Rate limiting (`Login / magic link`), § Account recovery

### API / DB impact

- Tabela `auth_magic_tokens`; upsert `users` por email_hash ao solicitar.

### Security notes

- Sem revelar existência de email; rate limit por IP.

### Related decisions

- Token one-time com TTL 15 min (padrão email US-0008).

### Planned

- [ ] **manual** — `curl -X POST /api/v1/auth/magic-link` e verificar 202 idêntico para emails válido/inválido
- [ ] **automated** — `apps/api/src/routes/auth.test.ts` (202 + rate limit)

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

Verificação do token (US-0010).

### Notes
""",
    "US-0010": """---
id: US-0010
title: Verificar magic link e criar sessão
epic: EPIC-03
version: v1
sprint: v1-S2
status: ❌
moscow: Must
depends_on: [US-0009]
ready: true
done_when: "Link válido cria sessão HTTP-only"
tests: required
tests_status: pending
---

# US-0010 — Verificar magic link e criar sessão

**As** membro da comunidade,
**I want** clicar no link e entrar,
**so that** uso o app autenticado.

## Intent

### Acceptance

- [ ] GET verify com token assinado
- [ ] Cookie HTTP-only secure
- [ ] Token expirado retorna erro claro

### Why

Completa loop auth magic link.

### Where

v1-S2; desbloqueia perfil e presença.

## Plan

### Approach

- `GET /api/v1/auth/magic-link/verify?token=` valida hash em `auth_magic_tokens`, marca `used_at`, cria `users` + `community_members` se necessário.
- Criar linha em `sessions` (7 dias) e setar cookie `ember_session` HTTP-only, `SameSite=Lax`, `Secure` em produção — `apps/api/src/lib/session.ts`.
- Redirect browser para `EMBER_APP_URL` após sucesso; JSON `{ ok: true }` se `Accept: application/json`.
- Token expirado/usado/inválido → `410` com mensagem clara sem vazar PII.

### Architecture refs

- `docs/02_security.md` — § Authentication model (HTTP-only cookie, 7 dias)
- `docs/03_user_types.md` — § Session

### API / DB impact

- Tabelas `sessions`, `community_members`; atualiza `auth_magic_tokens.used_at`.

### Security notes

- Cookie httpOnly; token single-use.

### Related decisions

- `EMBER_SESSION_SECRET` para assinar cookie sid.

### Planned

- [ ] **manual** — clicar link no Mailpit e ver cookie + redirect
- [ ] **automated** — teste verify válido/expirado

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

OAuth, MFA.

### Notes
""",
    "US-0011": """---
id: US-0011
title: API perfil membro fuso e idiomas
epic: EPIC-04
version: v1
sprint: v1-S2
status: ❌
moscow: Must
depends_on: [US-0010]
ready: true
done_when: "PUT perfil persiste timezone e idiomas"
tests: required
tests_status: pending
---

# US-0011 — API perfil membro fuso e idiomas

**As** membro da comunidade,
**I want** salvar fuso e idiomas,
**so that** matching respeita minha disponibilidade real.

## Intent

### Acceptance

- [ ] GET/PUT `/api/v1/me/profile`
- [ ] Validação zod
- [ ] community_id scoped

### Why

Matching sem perfil é impossível.

### Where

v1-S2 EPIC-04; antes da UI presença.

## Plan

### Approach

- Rotas `GET/PUT /api/v1/me/profile` em `apps/api/src/routes/profile.ts`, protegidas por `requireAuth` middleware.
- Header `X-Community-Id` (UUID) ou fallback `EMBER_DEFAULT_COMMUNITY_SLUG` no dev — toda query filtra `community_id` (multi-tenant).
- Schema zod em `packages/domain/src/schemas/profile.ts`: `timezone` IANA, `languages` array subset `pt|en|es`.
- Upsert em `member_profiles` — SRP: handler só orquestra; repositório em `packages/db/src/repositories/profile.ts`.

### Architecture refs

- `docs/06_database.md` — § Entity `member_profiles`
- `docs/07_api_contracts.md` — § `GET/PUT /me/profile`
- `docs/02_security.md` — § Authorization (membro só próprio perfil)

### API / DB impact

- Tabela `member_profiles`; migration `20260819164600_auth_profiles_presence.sql`.

### Security notes

- RBAC: membro autenticado só acessa próprio perfil na comunidade ativa.

### Related decisions

- Idiomas como JSON array na v1 (gap #1 em 06_database).

### Planned

- [ ] **manual** — PUT perfil com timezone `America/Sao_Paulo` e languages `["pt","en"]`
- [ ] **automated** — `profile.test.ts` com sessão mock

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

Preferências avançadas, foto.

### Notes
""",
    "US-0012": """---
id: US-0012
title: UI declaração de presença na rodada
epic: EPIC-04
version: v1
sprint: v1-S2
status: ❌
moscow: Must
depends_on: [US-0011]
ready: true
done_when: "Membro marca slots e intenção"
tests: required
tests_status: pending
---

# US-0012 — UI declaração de presença na rodada

**As** membro da comunidade,
**I want** declarar presença na rodada aberta,
**so that** entro no sorteio.

## Intent

### Acceptance

- [ ] Seleção de 1+ slots
- [ ] Intenção: surpresa / fronteira / facilidade
- [ ] Responsivo mobile sem overflow-x

### Why

Core do fluxo membro no MVP 0.

### Where

v1-S2; alimenta matching em v1-S3.

## Plan

### Approach

- API `GET /api/v1/rounds/current` retorna rodada `open` da comunidade; `POST /api/v1/rounds/:id/presence` persiste `round_declarations` com `slots_json` e `intention` enum.
- Página `apps/web/src/pages/PresencePage.tsx` com grid de slots (checkboxes) e radio de intenção — tokens `09_design_system.md`, mobile-first sem `overflow-x`.
- Fluxo: auth → perfil mínimo → presença; reutiliza fetch autenticado via cookie (`credentials: 'include'`).
- Slots fixos MVP 0: 3 janelas semanais codificadas (`mon-evening`, `wed-evening`, `sat-morning`) — detalhe em handler, não duplicar no client.

### Architecture refs

- `docs/09_design_system.md` — § Brand direction, responsivo
- `docs/07_api_contracts.md` — presença na rodada (expand)
- `docs/05_architecture.md` — fluxo membro § 2

### API / DB impact

- Tabela `round_declarations`; status `rounds.status = open`.

### Security notes

- Auth obrigatória; membro só declara na própria comunidade.

### Related decisions

- Intenção: `surprise | frontier | ease` mapeia copy PT surpresa/fronteira/facilidade.

### Planned

- [ ] **manual** — fluxo mobile 375px sem scroll horizontal
- [ ] **automated** — teste API presence + smoke UI

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

i18n strings (US-0013) — estrutura preparada.

### Notes
""",
    "US-0013": """---
id: US-0013
title: i18n PT EN ES fluxo membro
epic: EPIC-04
version: v1
sprint: v1-S2
status: ❌
moscow: Must
depends_on: [US-0012]
ready: true
done_when: "UI membro em PT EN ES"
tests: required
tests_status: pending
---

# US-0013 — i18n PT EN ES fluxo membro

**As** membro da comunidade,
**I want** usar o app no meu idioma,
**so that** entendo convites e formulários.

## Intent

### Acceptance

- [ ] Toggle PT/EN/ES
- [ ] Strings centralizadas
- [ ] Layout não quebra em mobile

### Why

Comunidades piloto são multilíngues.

### Where

v1-S2 fecha superfície membro.

## Plan

### Approach

- `react-i18next` em `apps/web` com arquivos `src/i18n/locales/{pt,en,es}.json` — strings do fluxo login, perfil e presença centralizadas.
- Componente `LanguageSwitcher` no header; persistir escolha em `localStorage` key `ember_locale`.
- Inicializar locale a partir de `member_profiles.languages[0]` quando logado, senão browser/default `pt`.
- Testar labels longas em ES no mobile — flex-wrap e `min-width: 0` nos containers para evitar overflow-x.

### Architecture refs

- `docs/09_design_system.md` — § Typography, responsivo
- `docs/01_tech_stack.md` — UI PT/EN/ES

### API / DB impact

- _n/a_ — UI only; perfil já persiste languages (US-0011).

### Security notes

- _n/a_

### Related decisions

- Emails i18n fora de escopo (US-0022).

### Planned

- [ ] **manual** — alternar PT/EN/ES nas 3 telas membro
- [ ] **automated** — teste unitário i18n keys presentes nos 3 locales

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

Emails i18n (US-0022).

### Notes
""",
}


def main() -> None:
    for us_id, body in BODIES.items():
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


if __name__ == "__main__":
    main()
