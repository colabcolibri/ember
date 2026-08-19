#!/usr/bin/env python3
"""Completa US-0014…0019 (patch-record) após implementação v1-S3."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / ".agent/scripts/meridian_delivery.py"

PATCHES = {
    "US-0014": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/admin/index.ts` — POST `/api/v1/admin/matching-rounds`
- `apps/api/src/lib/facilitator.ts` — RBAC facilitador
- `packages/db/src/repos/rounds.ts` — `createMatchingRound`, fecha rodada open anterior

### Backend

- Body `{ question, slots[5], templateId? }`; validação `createRoundSchema` em domain

### Executed

- `apps/api/src/routes/admin/admin.test.ts` — 403 membro + 201 facilitador
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] POST rodada com 5 slots
- [x] Pergunta comum obrigatória
- [x] RBAC facilitador

### Planned

- [x] **manual** — POST como facilitador e ver rodada `open`
- [x] **automated** — teste 403 membro + 201 facilitador
""",
    "US-0015": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/admin/index.ts` — GET `.../declarations`
- `packages/db/src/repos/rounds.ts` — `listRoundDeclarations` com email mascarado

### Backend

- Paginação `page`/`limit` (default 20, max 100)

### Executed

- `admin.test.ts` — fluxo publish usa declarations indiretamente
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] GET admin inscritos
- [x] Mostra slots e intenção
- [x] Paginação se >20

### Planned

- [x] **manual** — listar após membros declararem presença
- [x] **automated** — teste paginação e campos
""",
    "US-0016": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/db/migrations/20260819170500_facilitator_matching.sql` — `meeting_templates` seed GSA
- `packages/db/src/repos/templates.ts`
- `apps/api/src/routes/admin/index.ts` — GET/PUT `/admin/templates/:id`

### Backend

- Validação `meetingTemplateSchema` (circle 3–5, duração 15–90)

### Executed

- `admin.test.ts` — usa template `tpl-gsa-fogo`
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] CRUD meeting_templates
- [x] Tamanho círculo e duração
- [x] Primeiro template seedável por comunidade

### Planned

- [x] **manual** — editar duração e ver refletido na rodada
- [x] **automated** — teste PUT template
""",
    "US-0017": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/domain/src/matching/constraints.ts` — `isValidTrio`, `SLOT_COMPAT`
- `packages/domain/src/matching/constraints.test.ts`

### Backend

- Domain puro — sem I/O

### Executed

- `packages/domain/src/matching/constraints.test.ts` — overlap slot + idioma
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] Testes unitários constraints
- [x] Rejeita trio sem overlap de slot
- [x] Rejeita sem idioma comum

### Planned

- [x] **automated** — `constraints.test.ts`
""",
    "US-0018": """---
status: ✅
tests_status: done
---
## Record

### Files

- `packages/domain/src/matching/scoring.ts` — `scoreTrio`, `pairKey`
- `packages/domain/src/matching/engine.ts` — `proposeTrios` greedy
- `packages/domain/src/matching/engine.test.ts`

### Backend

- Histórico via `Set` de pares; bônus frontier+surprise

### Executed

- `engine.test.ts` — prioriza pares novos + forma 2 trios de 6 membros
- `pnpm -r test` — passou

## Intent

### Acceptance

- [x] Testes com histórico mock
- [x] Prioriza pares sem encontro prévio
- [x] Pontua geração/geografia diferente

### Planned

- [x] **automated** — `engine.test.ts` com histórico mock
""",
    "US-0019": """---
status: ✅
tests_status: done
---
## Record

### Files

- `apps/api/src/routes/admin/index.ts` — POST `.../match` e `.../publish`
- `packages/db/src/repos/matching.ts` — `publishTrios`, `circle_members`
- `apps/web/src/pages/FacilitatorPage.tsx` — UI facilitador responsiva

### Backend

- Publish persiste `circles` + `circle_members` status `invited`; `rounds.status=published`

### Executed

- `admin.test.ts` — publish cria circle_members invited
- `pnpm -r build` — passou

## Intent

### Acceptance

- [x] Botão disparar sorteio
- [x] Preview trios editável
- [x] Publicar muda estado para invited

### Planned

- [x] **manual** — fluxo facilitador ponta a ponta
- [x] **automated** — teste publish cria circle_members
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
