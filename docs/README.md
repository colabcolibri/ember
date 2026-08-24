# Ember

Ember é uma plataforma para criar encontros pequenos e intencionais entre pessoas de uma comunidade. Cada pessoa declara disponibilidade, idiomas e tipo de encontro; Ember cruza fusos, histórico e preferências para formar círculos que alimentam o tecido social — um encontro de cada vez.

Estes documentos seguem o protocolo **Meridian** e são a fonte de verdade do produto antes do código.

## Phase documents

| Doc | Status | Description |
| --- | ------ | ----------- |
| [00_scope.md](00_scope.md) | approved | Escopo e limites do produto |
| [01_tech_stack.md](01_tech_stack.md) | approved | Linguagens, frameworks, infraestrutura |
| [02_security.md](02_security.md) | approved | Modelo de ameaças, auth, dados, segredos |
| [03_user_types.md](03_user_types.md) | approved | Perfis e permissões |
| [04_principles.md](04_principles.md) | approved | DRY, camadas, Definition of Done |
| [05_architecture.md](05_architecture.md) | approved | Estrutura do sistema |
| [06_database.md](06_database.md) | approved | Schema e migrações |
| [07_api_contracts.md](07_api_contracts.md) | approved | Contratos de API |
| [08_environments.md](08_environments.md) | approved | Setup local, CI, variáveis de ambiente |
| [09_design_system.md](09_design_system.md) | approved | Contrato de UI |
| [10_test_strategy.md](10_test_strategy.md) | approved | Pirâmide de testes |
| [11_decisions.md](11_decisions.md) | approved | Regras do log de decisões |

## Discovery

| Artefato | Status |
| -------- | ------ |
| [discovery/product-brief.md](discovery/product-brief.md) | ready for scope |
| [discovery/orientacao-produto.md](discovery/orientacao-produto.md) | draft — tese, ritual, matching |
| [discovery/roadmap.md](discovery/roadmap.md) | draft — MVP 0–3 |
| [discovery/convite-primeiro-encontro-gsa.md](discovery/convite-primeiro-encontro-gsa.md) | draft — convite e direção de arte do primeiro encontro |
| [architecture/email.md](architecture/email.md) | approved | envio, persistência, Mailpit |
| [mockup/fogo-de-conselho-apresentacao.html](../mockup/fogo-de-conselho-apresentacao.html) | pitch piloto — não é escopo do produto |

## Backlog (SQLite)

| Artefato | Qtd |
| -------- | --- |
| Version `v1` | MVP 0 — piloto na rede |
| Epics | EPIC-01 … EPIC-08 |
| User stories | US-0001 … US-0025 (`ready: false`) |
| Sprints | v1-S1 … v1-S4 |

Consultar: `python3 .agent/scripts/meridian_delivery.py list user_stories`

## Delivery artifacts

| Artifact | Location | Role |
| -------- | -------- | ---- |
| Epics, versions, sprints, user stories | `.meridian/meridian.db` | Delivery canônico |
| Decision log entries | `.meridian/meridian.db` → `decisions` | Somente prepend |
| Kit templates | `.agent/references/templates/` | Contratos de agentes — não copiar para `docs/templates/` |

## How to work

1. Aprovar phase docs na ordem: `00` → `01` → `02` → `03` → `04` → **`05`** → docs de detalhe.
2. UI: `/design-pass bootstrap` em `09` após `01` rascunhado.
3. Testes: `/test-pass bootstrap` em `10` após `01` / `08` rascunhados.
4. Após `05_architecture` **`approved`**: `/create-epic` → `/create-version` → `/plan-sprint` → `/create-us`.
5. Por US: `/refine-us` → `/implement-us` → `/complete-us` (commit humano).
6. Validar: `python3 .agent/scripts/validate_meridian.py .`

## Meridian kit

| Resource | Path |
| -------- | ---- |
| Protocol | `.agent/MERIDIAN.md` |
| Agents help | `.agent/references/agents-help.md` |
| Start here | `.agent/references/start-here.md` |
