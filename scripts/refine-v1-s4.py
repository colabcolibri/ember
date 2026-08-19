#!/usr/bin/env python3
"""Refina US-0020 … US-0025 do sprint v1-S4."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

BODIES: dict[str, str] = {}

def u(us_id: str, body: str) -> None:
    BODIES[us_id] = body

u("US-0020", """---
id: US-0020
title: Gerar sala Jitsi por círculo
epic: EPIC-07
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0019]
ready: true
done_when: "URL Jitsi única por círculo"
tests: required
tests_status: pending
---

# US-0020 — Gerar sala Jitsi por círculo

**As** membro da comunidade,
**I want** link de vídeo sem criar conta,
**so that** entro na roda com um clique.

## Intent

### Acceptance

- [ ] URL gerada na publicação
- [ ] Persistida no círculo
- [ ] meet.jit.si ou self-hosted configurável

### Why

Critério operacional do piloto: ninguém pergunta o link — a sala nasce com o círculo.

### Where

v1-S4 EPIC-07; desbloqueia email e UI de convite.

## Plan

### Approach

- `packages/domain/src/meeting/jitsi.ts` — `buildJitsiRoomUrl(circleId)` com hash SHA-256 truncado (não adivinhável).
- `publishTriosWithDelivery` em `packages/db/src/repos/circles.ts` persiste `jitsi_url` ao publicar.
- `EMBER_JITSI_BASE_URL` (default `https://meet.jit.si`) em `.env.example` — sem SDK Jitsi no MVP 0.

### Architecture refs

- `docs/01_tech_stack.md` — § Video (Jitsi Meet)
- `docs/05_architecture.md` — § Integrações externas

### API / DB impact

- `circles.jitsi_url`

### Security notes

- Slug derivado do `circleId`, não sequencial.

### Planned

- [ ] **automated** — `packages/domain/src/meeting/meeting.test.ts` URL estável

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Jitsi JWT / sala com senha.

### Notes
""")

u("US-0021", """---
id: US-0021
title: Gerar arquivo ics para círculo
epic: EPIC-07
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0020]
ready: true
done_when: "ics válido anexado ou linkado"
tests: required
tests_status: pending
---

# US-0021 — Gerar arquivo ics para círculo

**As** membro da comunidade,
**I want** adicionar ao calendário,
**so that** não perco o horário no meu fuso.

## Intent

### Acceptance

- [ ] Horário no fuso do membro
- [ ] Duração 30 min
- [ ] Anexo ou download no email

### Why

Calendário reduz no-show — essencial no ritual síncrono do piloto GSA.

### Where

v1-S4; usado em US-0022 e US-0023.

## Plan

### Approach

- `packages/domain/src/meeting/slots.ts` — `resolveNextSlotDateTime()` mapeia slot facilitador → próximo instante (America/Sao_Paulo).
- `packages/domain/src/meeting/ics.ts` — `buildIcsEvent()` gera VCALENDAR/VEVENT sem dependência externa.
- `buildCircleIcs()` no repo `circles.ts`; download em `GET /api/v1/circles/:id/calendar.ics` e anexo no email.

### Architecture refs

- `docs/architecture/email.md` — § Templates `circle_formed`
- `docs/05_architecture.md` — § `.ics` calendar

### Planned

- [ ] **automated** — `meeting.test.ts` valida DTSTART/DTEND

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Google Calendar API OAuth.

### Notes
""")

u("US-0022", """---
id: US-0022
title: Emails round_open e circle_formed
epic: EPIC-07
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0008, US-0020, US-0021]
ready: true
done_when: "Emails enviados e em sent_emails"
tests: required
tests_status: pending
---

# US-0022 — Emails round_open e circle_formed

**As** membro da comunidade,
**I want** receber convites por email,
**so that** sei quando declarar presença e quando a roda formou.

## Intent

### Acceptance

- [ ] kind `round_open` e `circle_formed`
- [ ] Jitsi + ics no circle_formed
- [ ] meta_json com round_id e circle_id

### Why

Email é canal principal do MVP 0 — membros não ficam de fora do ciclo.

### Where

v1-S4; integra EPIC-02 e EPIC-07.

## Plan

### Approach

- Templates em `packages/email/src/email/circle-templates.ts` (PT; EN segue padrão magic_link).
- `apps/api/src/services/circle-notifications.ts` — `sendRoundOpenNotifications` no POST rodada; `sendCircleFormedNotifications` no publish.
- `delivery` context com `kind` + `meta` → `sent_emails`; anexo `.ics` via `files` no SMTP sender.

### Architecture refs

- `docs/architecture/email.md` — § Kinds e fluxo
- `docs/00_scope.md` — § E-mails transacionais

### Planned

- [ ] **automated** — admin publish gera `circle_formed` em noop (log)

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Lembretes 24h (MVP 1).

### Notes
""")

u("US-0023", """---
id: US-0023
title: Página convite roda para membro
epic: EPIC-07
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0022]
ready: true
done_when: "Página mostra trio horário pergunta links"
tests: required
tests_status: pending
---

# US-0023 — Página convite roda para membro

**As** membro da comunidade,
**I want** ver detalhes da minha roda,
**so that** confirmo presença e entro no Jitsi.

## Intent

### Acceptance

- [ ] Lista os 3 participantes (nome, comunidade)
- [ ] Horário no fuso local
- [ ] Botões entrar e calendário

### Why

Backup ao email; experiência web completa no piloto.

### Where

v1-S4; antes do pós-encontro.

## Plan

### Approach

- `GET /api/v1/circles` e `GET /api/v1/circles/:id` em `apps/api/src/routes/circles.ts` — RBAC membro do círculo.
- `apps/web/src/pages/CirclesPage.tsx` + `CircleDetailPage.tsx` — lista, trio mascarado, Jitsi, `.ics`, confirmar.
- i18n PT/EN em `locales/*.json`; layout responsivo sem overflow-x.

### Architecture refs

- `docs/07_api_contracts.md` — § `/circles`
- `docs/09_design_system.md` — layout mobile-first

### Planned

- [ ] **manual** — fluxo membro após publish
- [ ] **automated** — `circles.test.ts` lista com jitsiUrl

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Chat entre membros.

### Notes
""")

u("US-0024", """---
id: US-0024
title: Fluxo a roda aconteceu
epic: EPIC-08
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0023]
ready: true
done_when: "Membro responde após horário do círculo"
tests: required
tests_status: pending
---

# US-0024 — Fluxo a roda aconteceu

**As** membro da comunidade,
**I want** confirmar se a roda aconteceu,
**so that** a rede registra encontros reais.

## Intent

### Acceptance

- [ ] Prompt após slot + buffer
- [ ] Sim/não por membro
- [ ] UI mínima, sem gamificação

### Why

Fecha loop qualitativo do piloto — memória do matching depende de encontros reais.

### Where

v1-S4 EPIC-08.

## Plan

### Approach

- `POST /api/v1/circles/:id/attendance` com `{ happened: boolean }` — abre após `scheduled_at + duration + 15min`.
- `circle_members.attendance` persiste resposta; UI em `CircleDetailPage` só quando `canRecordAttendance`.
- Sem badges/pontos — copy neutro PT/EN.

### Architecture refs

- `docs/discovery/roadmap.md` — pós-encontro MVP 0
- `docs/05_architecture.md` — § Flow 2 passo 5

### Planned

- [ ] **automated** — `circles.test.ts` attendance após horário passado

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

NPS / pesquisa longa.

### Notes
""")

u("US-0025", """---
id: US-0025
title: Persistir meeting_participations
epic: EPIC-08
version: v1
sprint: v1-S4
status: ❌
moscow: Must
depends_on: [US-0024]
ready: true
done_when: "Histórico usado no scoring US-0018"
tests: required
tests_status: pending
---

# US-0025 — Persistir meeting_participations

**As** facilitador,
**I want** memória de quem se encontrou,
**so that** próxima rodada evita repetição.

## Intent

### Acceptance

- [ ] Tabela meeting_participations
- [ ] US-0018 lê histórico em teste
- [ ] Par não se repete na rodada seguinte (teste)

### Why

Sem persistência, memória do matching é vazia e trios se repetem no piloto.

### Where

Última US do MVP 0; fecha v1.

## Plan

### Approach

- `persistCircleParticipations()` em `circles.ts` — quando todos respondem `yes`, grava pares em `meeting_participations` (já criada na migration S3).
- `loadMetPairs()` em `matching.ts` alimenta `proposeTrios()` — teste integrado em `circles.test.ts` (3 pares para trio de 3).
- Círculo passa a `status=completed` após persistência.

### Architecture refs

- `docs/06_database.md` — § `meeting_participations`
- `docs/discovery/orientacao-produto.md` — memória de encontros

### Planned

- [ ] **automated** — `circles.test.ts` grava 3 participações

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Re-match automático após recusa.

### Notes
""")


def main() -> None:
    for us_id, body in BODIES.items():
        subprocess.run(
            [sys.executable, str(CLI), "update-us", us_id],
            input=body,
            text=True,
            cwd=ROOT,
            check=True,
        )
        subprocess.run(
            [sys.executable, str(CLI), "set-ready", us_id, "--ready", "true"],
            cwd=ROOT,
            check=True,
        )
        print(f"refined {us_id}")


if __name__ == "__main__":
    main()
