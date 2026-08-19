---
title: Code Principles
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [01_tech_stack.md, 02_security.md, 03_user_types.md]
blocks: [05_architecture.md]
---

# 04 — Principles

_Agentes leem isto em `/refine-us` e `/implement-us`._

## DRY — where each type of logic lives

| Concern | Single source of truth | Path / package |
| ------- | ---------------------- | -------------- |
| Domain rules / business logic | matching, formação de círculos, regras Fogo de Conselho | `packages/domain/` |
| Validation schemas | zod schemas compartilhados | `packages/domain/schemas/` |
| API clients / SDK wrappers | fetch tipado para o web app | `apps/web/src/lib/api/` |
| UI primitives (read-only) | shadcn `components/ui/` | `apps/web/src/components/ui/` |
| Composed UI templates | `App*` components | `apps/web/src/components/app/` |
| Constants / enums | tipos de encontro, roles, idiomas | `packages/domain/constants/` |
| Scripts / CLI | n/a v1 | — |

**Duplication policy:** extrair quando a mesma regra aparece em 2+ camadas (ex.: validação de disponibilidade no form e na API). Copy aceitável em test fixtures.

## Single responsibility — layers

| Layer | Responsibility | May import from | Must not |
| ----- | -------------- | --------------- | -------- |
| Domain / core | regras de matching, entidades, validação pura | — | UI, HTTP, DB drivers |
| Application / use cases | orquestrar rodada de matching, enviar convites | domain | React |
| Infrastructure | DB, email, auth provider | domain types | regras de negócio inline |
| UI / presentation | forms, estados, navegação | application hooks / API | SQL direto |
| Scripts / kit | Meridian | — | atalhos em produto |

## SOLID (project-specific)

| Principle | How we apply it here |
| --------- | -------------------- |
| SRP | `MatchingEngine` separado de `InviteService` e de handlers HTTP |
| OCP | novos tipos de encontro via template plugável (Fogo de Conselho como primeiro) |
| LSP | n/a significativo na v1 |
| ISP | interfaces pequenas por use case (ex.: `AvailabilityReader`) |
| DIP | use cases dependem de ports (repo interfaces), não de Drizzle/Prisma direto |

## Definition of Done (team-wide)

A user story is done when:

- [ ] All Acceptance items verified with evidence in `## Record`
- [ ] `tests: required` → `tests_status: done` and commands in Record § Executed
- [ ] No new linter **errors**
- [ ] Security-sensitive US → `/security-review` or Plan cites `02_security`
- [ ] UI Must US → Plan cites `09_design_system` when approved
- [ ] Human manager reviewed diff; one commit per US

## Mandatory conventions

| Area | Rule | Tool / config |
| ---- | ---- | ------------- |
| Naming | inglês no código; pt-BR na UI e docs | — |
| Imports | absolute com `@/` no web app | tsconfig paths |
| Commits | conventional commits | `feat:`, `fix:`, `docs:` |
| Branching | `main` + feature branches | — |
| Language | pt-BR UI e docs; en código e commits | — |

## Error handling

| Layer | Pattern | User-visible | Logged |
| ----- | ------- | ------------ | ------ |
| API | `{ error: { code, message } }` | mensagem amigável em pt-BR | stack só em dev |
| UI | toast + inline em forms | sim | erros de rede |
| Domain | Result type ou throw domain errors | mapeado na API | — |

## Security-aware coding

- Never log secrets or full PII
- Authorization checks on server for every mutating action — `community_id` + role
- Validate at trust boundaries — ver `02_security`
- Links de convite assinados com expiração

## Gaps / open questions

| # | Topic | Owner |
| - | ----- | ----- |
| 1 | Monorepo com Turborepo ou app único? | manager |
| 2 | tRPC vs REST para API interna? | architect |

## Gate

Human `approved` before architecture finalization.
