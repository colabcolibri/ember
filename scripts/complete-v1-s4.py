#!/usr/bin/env python3
"""Completa US-0020…0025 (patch-record) após implementação v1-S4."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

PATCHES = {
    "US-0020": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/domain/src/meeting/jitsi.ts`
- `packages/db/src/repos/circles.ts` — `publishTriosWithDelivery` persiste `jitsi_url`
- `.env.example` — `EMBER_JITSI_BASE_URL`

### Executed

- `packages/domain/src/meeting/meeting.test.ts`
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] URL gerada na publicação
- [x] Persistida no círculo
- [x] meet.jit.si ou self-hosted configurável

### Planned

- [x] **automated** — `meeting.test.ts`
""",
    "US-0021": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/domain/src/meeting/slots.ts`, `ics.ts`
- `packages/db/src/repos/circles.ts` — `buildCircleIcs`
- `apps/api/src/routes/circles.ts` — `GET .../calendar.ics`

### Executed

- `meeting.test.ts` — DTSTART/DTEND
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] Horário no fuso do membro
- [x] Duração 30 min
- [x] Anexo ou download no email

### Planned

- [x] **automated** — `meeting.test.ts`
""",
    "US-0022": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/email/src/email/circle-templates.ts`
- `apps/api/src/services/circle-notifications.ts`
- `packages/email/src/email/smtp-email-sender.ts` — anexos `.ics`

### Executed

- `admin.test.ts` — logs `round_open` + `circle_formed`
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] kind `round_open` e `circle_formed`
- [x] Jitsi + ics no circle_formed
- [x] meta_json com round_id e circle_id

### Planned

- [x] **automated** — publish em noop provider
""",
    "US-0023": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/circles.ts`
- `apps/web/src/pages/CirclesPage.tsx`, `CircleDetailPage.tsx`
- `apps/web/src/i18n/locales/{pt,en}.json`

### Executed

- `circles.test.ts` — lista com jitsiUrl
- `pnpm -r build` — passou

## Intent

### Acceptance

- [x] Lista os 3 participantes (nome, comunidade)
- [x] Horário no fuso local
- [x] Botões entrar e calendário

### Planned

- [x] **manual** — fluxo membro após publish
- [x] **automated** — `circles.test.ts`
""",
    "US-0024": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/circles.ts` — `POST .../attendance`
- `packages/db/migrations/20260819171753_circle_delivery.sql` — `attendance` em `circle_members`
- `CircleDetailPage.tsx` — prompt sim/não

### Executed

- `circles.test.ts` — attendance após horário
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] Prompt após slot + buffer
- [x] Sim/não por membro
- [x] UI mínima, sem gamificação

### Planned

- [x] **automated** — `circles.test.ts`
""",
    "US-0025": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/db/src/repos/circles.ts` — `persistCircleParticipations`
- `packages/db/src/repos/matching.ts` — `loadMetPairs` (S3, usado aqui)

### Executed

- `circles.test.ts` — 3 pares em `meeting_participations`
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] Tabela meeting_participations
- [x] US-0018 lê histórico em teste
- [x] Par não se repete na rodada seguinte (teste)

### Planned

- [x] **automated** — `circles.test.ts`
""",
}


def run(cmd: list[str], input_text: str | None = None) -> None:
    proc = subprocess.run(cmd, input=input_text, text=True, cwd=ROOT, capture_output=True)
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        raise SystemExit(proc.returncode)


def main() -> None:
    for us_id, patch in PATCHES.items():
        run([sys.executable, str(CLI), "patch-record", us_id], patch)
        print(f"completed {us_id}")


if __name__ == "__main__":
    main()
