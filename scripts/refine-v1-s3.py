#!/usr/bin/env python3
"""Refina US-0014 … US-0019 do sprint v1-S3."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

BODIES: dict[str, str] = {}

def u(us_id: str, body: str) -> None:
    BODIES[us_id] = body

u("US-0014", """---
id: US-0014
title: Admin criar rodada com slots e pergunta
epic: EPIC-05
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0002]
ready: true
done_when: "Facilitador cria rodada com slots"
tests: required
tests_status: pending
---

# US-0014 — Admin criar rodada com slots e pergunta

**As** facilitador,
**I want** abrir rodada com horários e pergunta,
**so that** membros possam se inscrever.

## Intent

### Acceptance

- [ ] POST rodada com 5 slots
- [ ] Pergunta comum obrigatória
- [ ] RBAC facilitador

### Why

Ciclo de encontros do piloto começa quando o facilitador abre a rodada com pergunta e janelas.

### Where

v1-S3 início EPIC-05; desbloqueia inscrições e matching.

## Plan

### Approach

- `POST /api/v1/admin/matching-rounds` em `apps/api/src/routes/admin/rounds.ts` com body `{ question, slots }` — exatamente 5 slots do catálogo `FACILITATOR_ROUND_SLOTS` em `packages/domain`.
- Middleware `requireFacilitator` valida `community_members.role` ∈ `facilitador|org_admin` antes de mutações admin — SRP separado de `requireAuth`.
- Persistir em `rounds` com `status=open`, `question`, `slots_json`; fechar rodada `open` anterior da mesma comunidade para evitar duplicidade.
- Seed `meeting_templates` default na migration para comunidade piloto referenciar depois (US-0016).

### Architecture refs

- `docs/07_api_contracts.md` — § `POST /admin/matching-rounds`
- `docs/05_architecture.md` — § Flow 2 — passo 1
- `docs/02_security.md` — § Authorization (facilitador)

### API / DB impact

- `rounds` + colunas `question`, `slots_json`, `template_id`

### Security notes

- RBAC server-side; membro não cria rodada.

### Related decisions

- SQLite MVP 0 mantido no piloto.

### Planned

- [ ] **manual** — POST como facilitador e ver rodada `open`
- [ ] **automated** — teste 403 membro + 201 facilitador

## Record

### Files

_(pending)_

## Boundaries

### Out of scope for this story

Sorteio e publicação (US-0019).

### Notes
""")

u("US-0015", """---
id: US-0015
title: Admin listar membros inscritos na rodada
epic: EPIC-05
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0014, US-0012]
ready: true
done_when: "Lista inscritos com perfil"
tests: required
tests_status: pending
---

# US-0015 — Admin listar membros inscritos na rodada

**As** facilitador,
**I want** ver quem declarou presença,
**so that** valido antes do sorteio.

## Intent

### Acceptance

- [ ] GET admin inscritos
- [ ] Mostra slots e intenção
- [ ] Paginação se >20

### Why

Sorteio assistido exige visibilidade de quem está na rodada antes de formar trios.

### Where

v1-S3; input do MatchingEngine (US-0017).

## Plan

### Approach

- `GET /api/v1/admin/matching-rounds/:id/declarations` join `round_declarations` + `member_profiles` + email mascarado via vault.
- Resposta inclui `slots`, `intention`, `languages`, `timezone` por membro — DRY: reutiliza repo `rounds.ts` sem duplicar SQL na rota.
- Paginação `?page=&limit=` (default 20, max 100) conforme `07_api_contracts.md`.

### Architecture refs

- `docs/03_user_types.md` — perfil Facilitador
- `docs/07_api_contracts.md` — § Pagination

### API / DB impact

- Leitura join declarations + profiles

### Security notes

- Só facilitador da comunidade da rodada.

### Planned

- [ ] **manual** — listar após membros declararem presença
- [ ] **automated** — teste paginação e campos

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Export CSV.

### Notes
""")

u("US-0016", """---
id: US-0016
title: Configurar template de encontro da comunidade
epic: EPIC-05
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0014]
ready: true
done_when: "Template 3 pessoas 30 min configurável"
tests: required
tests_status: pending
---

# US-0016 — Configurar template de encontro da comunidade

**As** facilitador,
**I want** definir regras do ritual da comunidade,
**so that** rodadas seguem formato acordado.

## Intent

### Acceptance

- [ ] CRUD meeting_templates
- [ ] Tamanho círculo e duração
- [ ] Primeiro template seedável por comunidade

### Why

Ember é multi-comunidade — tamanho do círculo e duração não podem ser hardcoded no código.

### Where

v1-S3; usado pelo matching e publicação.

## Plan

### Approach

- Tabela `meeting_templates` na migration S3; seed "Fogo de Conselho" 3×30min para `gsa-pilot`.
- `GET/PUT /api/v1/admin/templates/:id` — MVP 0 sem lista múltipla; facilitador edita template default da comunidade.
- Validação zod: `circleSize` 3–5, `durationMinutes` 15–90.
- `rounds.template_id` referencia template na criação da rodada.

### Architecture refs

- `docs/06_database.md` — § `meeting_templates`
- `docs/00_scope.md` — ritual configurável por comunidade

### API / DB impact

- `meeting_templates`; FK em `rounds`

### Security notes

- RBAC facilitador+

### Planned

- [ ] **manual** — editar duração e ver refletido na rodada
- [ ] **automated** — teste PUT template

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Múltiplos rituais por comunidade na v1.

### Notes
""")

u("US-0017", """---
id: US-0017
title: MatchingEngine constraints horario e idioma
epic: EPIC-06
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0015, US-0016]
ready: true
done_when: "Engine exige horário e idioma comum"
tests: required
tests_status: pending
---

# US-0017 — MatchingEngine constraints horario e idioma

**As** facilitador,
**I want** motor que respeita constraints duras,
**so that** trios propostos são viáveis.

## Intent

### Acceptance

- [ ] Testes unitários constraints
- [ ] Rejeita trio sem overlap de slot
- [ ] Rejeita sem idioma comum

### Why

Constraints erradas geram rodas impossíveis — horário e idioma são essenciais no piloto.

### Where

v1-S3 EPIC-06; `packages/domain` puro (sem I/O).

## Plan

### Approach

- `packages/domain/src/matching/constraints.ts` — `hasCommonSlot()` via mapa `SLOT_COMPAT` entre slots membro e slots da rodada; `hasCommonLanguage()` intersect languages.
- `isValidTrio()` combina constraints para 3 membros — testável sem DB.
- Zero dependência de Hono/SQLite — domain puro para TDD.

### Architecture refs

- `docs/discovery/orientacao-produto.md` — constraints duras
- `docs/05_architecture.md` — § Flow 2 passo 3

### API / DB impact

- _n/a_

### Planned

- [ ] **automated** — `packages/domain/src/matching/constraints.test.ts`

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Scoring (US-0018).

### Notes
""")

u("US-0018", """---
id: US-0018
title: MatchingEngine scoring memoria e pontes
epic: EPIC-06
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0017]
ready: true
done_when: "Score prioriza novos encontros e pontes"
tests: required
tests_status: pending
---

# US-0018 — MatchingEngine scoring memoria e pontes

**As** facilitador,
**I want** sorteio com memória,
**so that** a rede ganha novos fios.

## Intent

### Acceptance

- [ ] Testes com histórico mock
- [ ] Prioriza pares sem encontro prévio
- [ ] Pontua geração/geografia diferente

### Why

Sem memória, os mesmos pares se repetem e a rede não cria pontes novas.

### Where

v1-S3; alimenta `proposeTrios()` antes da UI publicar.

## Plan

### Approach

- `packages/domain/src/matching/scoring.ts` — `scoreTrio()` penaliza pares em `meeting_participations`; bônus se intenções misturam `frontier`/`surprise`.
- `packages/domain/src/matching/engine.ts` — greedy: ordena membros por restrição, monta trios válidos com maior score.
- Histórico injetado como `Set<string>` de pares `userA:userB` — port para repo em US-0019.

### Architecture refs

- `docs/discovery/orientacao-produto.md` — pesos memória e pontes
- `docs/06_database.md` — § `meeting_participations`

### Planned

- [ ] **automated** — `engine.test.ts` com histórico mock

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Solver ótimo global / ILP.

### Notes
""")

u("US-0019", """---
id: US-0019
title: UI sorteio assistido e publicar círculos
epic: EPIC-06
version: v1
sprint: v1-S3
status: ❌
moscow: Must
depends_on: [US-0018]
ready: true
done_when: "Facilitador revisa e publica trios"
tests: required
tests_status: pending
---

# US-0019 — UI sorteio assistido e publicar círculos

**As** facilitador,
**I want** revisar sorteio antes de enviar,
**so that** controlo exceções no piloto.

## Intent

### Acceptance

- [ ] Botão disparar sorteio
- [ ] Preview trios editável
- [ ] Publicar muda estado para invited

### Why

MVP 0 é sorteio assistido — facilitador valida trios antes de notificar membros.

### Where

v1-S3; desbloqueia EPIC-07 (emails/Jitsi).

## Plan

### Approach

- `POST .../match` roda engine e retorna preview; `POST .../publish` persiste `circles` + `circle_members` status `invited`.
- `apps/web/src/pages/FacilitatorPage.tsx` — criar rodada, listar inscritos, botão sortear, preview trios, publicar; responsivo mobile.
- Após publish: `rounds.status=published`; círculos `status=invited` — emails ficam para v1-S4.

### Architecture refs

- `docs/05_architecture.md` — § Flow 2 passos 3–4
- `docs/09_design_system.md` — layout responsivo

### API / DB impact

- `circles`, `circle_members`; leitura `meeting_participations`

### Security notes

- RBAC facilitador; preview não notifica membros até publish.

### Planned

- [ ] **manual** — fluxo facilitador ponta a ponta
- [ ] **automated** — teste publish cria circle_members

## Record

### Files

_(pending)_

## Boundaries

### Out of scope

Emails transacionais (v1-S4).

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
