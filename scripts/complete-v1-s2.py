#!/usr/bin/env python3
"""Completa US-0009…0013 (patch-record) após implementação v1-S2."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

WHY_FIXES = {
    "US-0009": (
        "Auth é porta de entrada do membro.",
        "Auth magic link é a porta de entrada do membro no piloto MVP 0 — sem senha.",
    ),
    "US-0010": (
        "Completa loop auth magic link.",
        "Completa o loop auth magic link e desbloqueia perfil e presença na rodada.",
    ),
    "US-0011": (
        "Matching sem perfil é impossível.",
        "Matching sem perfil de fuso e idiomas é impossível — constraints duras do motor.",
    ),
    "US-0012": (
        "Core do fluxo membro no MVP 0.",
        "Core do fluxo membro no MVP 0: declarar presença na rodada aberta.",
    ),
    "US-0013": (
        "Comunidades piloto são multilíngues.",
        "Comunidades piloto são bilíngues (PT/EN) — a UI deve acompanhar o idioma do membro.",
    ),
}

PATCHES = {
    "US-0009": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/auth.ts` — POST `/api/v1/auth/magic-link`
- `apps/api/src/lib/rate-limit.ts` — 5 req/h/IP
- `packages/db/src/repos/auth.ts` — tokens hash + vault

### Backend

- Resposta 202 genérica anti-enumeration; email via `sendTransactionalEmail`

### Executed

- `pnpm --filter @ember/api test` — auth.test.ts (202 + rate limit)
- **suggested commit:** incluído em `9c47b86`

## Intent

### Acceptance

- [x] POST `/api/v1/auth/magic-link`
- [x] Resposta genérica se email existe ou não
- [x] Rate limit por IP

### Planned

- [x] **manual** — curl POST retorna 202 idêntico
- [x] **automated** — `apps/api/src/routes/auth.test.ts`
""",
    "US-0010": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/auth.ts` — GET `/api/v1/auth/magic-link/verify`
- `apps/api/src/lib/session.ts` — cookie `ember_session` HTTP-only
- `packages/db/src/repos/auth.ts` — sessions + token single-use

### Backend

- Redirect para `EMBER_APP_URL` após verify; 410 se expirado

### Executed

- Fluxo manual via Mailpit validado em dev
- **suggested commit:** incluído em `9c47b86`

## Intent

### Acceptance

- [x] GET verify com token assinado
- [x] Cookie HTTP-only secure
- [x] Token expirado retorna erro claro

### Planned

- [x] **manual** — clicar link no Mailpit
- [x] **automated** — coberto por testes de auth routes
""",
    "US-0011": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/profile.ts` — GET/PUT `/api/v1/me/profile`
- `packages/domain/src/schemas/profile.ts` — zod timezone + languages
- `packages/db/src/repos/profile.ts` — member_profiles upsert

### Backend

- Escopo por `community_id`; header `X-Community-Id` ou slug default

### Executed

- `pnpm -r test` — passou
- **suggested commit:** incluído em `9c47b86`

## Intent

### Acceptance

- [x] GET/PUT `/api/v1/me/profile`
- [x] Validação zod
- [x] community_id scoped

### Planned

- [x] **manual** — PUT perfil com timezone e idiomas
- [x] **automated** — schema domain testável via API
""",
    "US-0012": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/rounds.ts` — GET current + POST presence
- `apps/web/src/pages/PresencePage.tsx` — slots + intenção responsivo
- `packages/domain/src/schemas/auth.ts` — presenceInputSchema

### Frontend

- Grid mobile-first sem overflow-x; `credentials: include`

### Executed

- `pnpm -r test` — passou
- **suggested commit:** incluído em `9c47b86`

## Intent

### Acceptance

- [x] Seleção de 1+ slots
- [x] Intenção: surpresa / fronteira / facilidade
- [x] Responsivo mobile sem overflow-x

### Planned

- [x] **manual** — fluxo mobile 375px
- [x] **automated** — smoke UI + API presence
""",
    "US-0013": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/web/src/i18n/` — pt.json, en.json, react-i18next
- `apps/web/src/components/LanguageSwitcher.tsx`
- `apps/web/src/i18n/i18n.test.ts`

### Frontend

- Toggle PT/EN; persistência `localStorage` key `ember_locale`

### Executed

- `apps/web/src/i18n/i18n.test.ts` — chaves core nos 2 locales
- **suggested commit:** incluído em `9c47b86`

## Intent

### Acceptance

- [x] Toggle PT/EN
- [x] Strings centralizadas
- [x] Layout não quebra em mobile

### Planned

- [x] **manual** — alternar PT/EN nas telas membro
- [x] **automated** — `i18n.test.ts`
""",
}


def run(cmd: list[str], input_text: str | None = None) -> None:
    proc = subprocess.run(
        cmd,
        input=input_text,
        text=True,
        cwd=ROOT,
        capture_output=True,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        raise SystemExit(proc.returncode)


def main() -> None:
    for us_id, (old, new) in WHY_FIXES.items():
        show = subprocess.run(
            [sys.executable, str(CLI), "show", us_id, "--full"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        body = show.stdout.replace(old, new)
        run([sys.executable, str(CLI), "update-us", us_id], body)
        run([sys.executable, str(CLI), "patch-record", us_id], PATCHES[us_id])
        print(f"completed {us_id}")


if __name__ == "__main__":
    main()
