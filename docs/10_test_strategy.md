---
title: Test Strategy
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [01_tech_stack.md, 08_environments.md]
blocks: []
---

# 10 — Test strategy

> **Deepen:** `/test-pass bootstrap` após `01` e `08` rascunhados.

## Summary

Ember exige confiança no motor de matching (regras de negócio críticas) e fluxos de convite. Pirâmide: muitos unitários no domain, integração nos use cases, poucos E2E nos happy paths.

## Test stack

| Attribute | Value |
| --------- | ----- |
| **Test stack id** | `ts-vitest` |
| **Unit runner** | Vitest |
| **Component tests** | Vitest + Testing Library `(candidate)` |
| **E2E** | Playwright `(candidate)` |
| **CI** | GitHub Actions |

## Pyramid

| Layer | Scope | Tool | When required |
| ----- | ----- | ---- | ------------- |
| Unit | `MatchingEngine`, validações zod, scoring | Vitest | US com `tests: required` no domain |
| Integration | use cases + DB test container | Vitest + test DB | US de API |
| E2E | onboarding → confirmar convite | Playwright | smoke antes de piloto GSA |

## Layout

```txt
packages/domain/**/*.test.ts
packages/db/**/*.test.ts
apps/web/src/**/*.test.tsx
e2e/
  onboarding.spec.ts
  fogo-de-conselho.spec.ts
```

## Coverage

- **Tool:** Vitest coverage (c8)
- **Threshold:** 80% lines em `packages/domain` — advisory na v1; blocking antes de prod
- **Exclusions:** `components/ui/`, generated types

## US conventions

- Must US com `tests: required` citam este doc no Plan § Architecture refs
- Matching e formação de círculos sempre têm unit tests
- Planned steps nomeiam comandos; Executed lista evidência antes de `/complete-us`

## Manual testing

Checklist antes do piloto GSA:

- [ ] Membro completa perfil com 2+ idiomas e disponibilidade
- [ ] Facilitador dispara rodada Fogo de Conselho
- [ ] 3 membros recebem email e confirmam
- [ ] Círculo confirmado mostra pergunta e horário no fuso correto
- [ ] Segunda rodada prioriza par que não se encontrou na primeira

## Gate

Human `approved` before US with `tests: required` ship to production.
