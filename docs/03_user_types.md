---
title: User Types
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [02_security.md]
blocks: [04_principles.md, 05_architecture.md, 06_database.md, 07_api_contracts.md]
---

# 03 — User types

_Toda audiência de `00_scope` § Who it is for tem perfil abaixo._

## Profile index

| Profile | Primary surface | Auth required | Maps to role in `02_security` |
| ------- | --------------- | ------------- | ----------------------------- |
| Membro da comunidade | Web app | yes | `membro` |
| Facilitador | Web app (painel admin leve) | yes | `facilitador` |
| Admin da organização (GSA) | Web app (config comunidade) | yes | `org_admin` |

---

## Membro da comunidade

**Description:** Participante de uma comunidade fechada (ex.: GSA) que quer encontros intencionais sem gerenciar agenda manualmente. Usa o produto esporadicamente — quando há rodada de matching ou convite pendente.

**Origin:** link de convite por email → onboarding web

**Goals:**

- Declarar quando estou disponível e em quais idiomas converso
- Receber convites para círculos compatíveis (ex.: Fogo de Conselho)
- Confirmar presença e ver detalhes do encontro (horário, pergunta, link)

**Permissions — can:**

- Criar e editar próprio perfil (disponibilidade, idiomas, preferências de encontro)
- Aceitar ou recusar convite para círculo
- Ver próprios encontros passados e futuros

**Restrictions — cannot:**

- Ver perfil ou histórico de outros membros
- Configurar tipos de encontro ou disparar matching
- Acessar outras comunidades

**Session:** cookie HTTP-only após magic link / OAuth — ver `02_security`

**Visible data:** próprio perfil, convites pendentes, encontros confirmados, pergunta do Fogo de Conselho quando aplicável

**Edge cases:**

| Situation | Expected behavior |
| --------- | ----------------- |
| No permission | redirect para login |
| Empty state | onboarding guiado para preencher disponibilidade |
| Session expired | reauth via magic link; preservar draft de perfil se possível |

---

## Facilitador

**Description:** Membro com papel extra na comunidade — configura rituais, dispara rodadas de matching e acompanha se os círculos foram formados. No GSA, quem opera o Fogo de Conselho.

**Origin:** promovido por org_admin dentro da comunidade

**Goals:**

- Configurar template de encontro (Fogo de Conselho: 3 pessoas, 1 pergunta, 30 min)
- Disparar ou agendar rodada de matching
- Ver status dos círculos formados (confirmado / pendente / cancelado)

**Permissions — can:**

- Tudo que membro pode, na própria comunidade
- CRUD de tipos de encontro (templates)
- Iniciar rodada de matching
- Ver lista de membros (nome, status de perfil — não histórico detalhado de terceiros)

**Restrictions — cannot:**

- Remover org_admin
- Acessar dados de outras comunidades
- Exportar PII em massa sem auditoria

**Session:** mesma auth com claim `role: facilitador`

**Visible data:** membros da comunidade (nome, email, perfil completo?), círculos da rodada atual e histórico agregado

**Edge cases:**

| Situation | Expected behavior |
| --------- | ----------------- |
| Matching insuficiente | mensagem clara — faltam membros com perfil completo ou disponibilidade |
| Membro recusa convite | slot liberado; matching pode reoferecer em rodada seguinte |

---

## Admin da organização (GSA)

**Description:** Responsável pela comunidade piloto — gerencia membros, promove facilitadores e define políticas básicas.

**Origin:** primeiro usuário seed da comunidade GSA

**Goals:**

- Convidar ou importar membros
- Promover/rebaixar facilitadores
- Desativar membros que saíram da comunidade

**Permissions — can:**

- Tudo que facilitador pode
- Convidar membros (email)
- Alterar roles (membro ↔ facilitador)
- Desativar conta na comunidade

**Restrictions — cannot:**

- Acessar outras comunidades (v1 single-tenant por deploy `(assumption)`)

**Session:** mesma auth com claim `role: org_admin`

**Visible data:** todos os membros da comunidade, audit log de ações admin

## Anonymous / public access

| Capability | Allowed | Notes |
| ---------- | ------- | ----- |
| Ver landing page | yes | copy estática, sem dados de membros |
| Login / signup | parcial | apenas com convite válido na v1 |
| API pública | no | — |

## Service accounts / integrations

| Actor | Auth method | Scopes | Owner |
| ----- | ----------- | ------ | ----- |
| Email provider (Resend/SendGrid) | API key | enviar convites | infra |
| n/a v1 | — | — | — |

## Gaps / open questions

| # | Question | Blocks |
| - | -------- | ------ |
| 1 | Facilitador vê email de todos os membros ou só nome? | `07_api_contracts` |
| 2 | Um membro pode ser facilitador em múltiplas comunidades na v1? | `05_architecture` |
| 3 | Fluxo de convite: admin envia ou self-service com código? | US de onboarding |

## Gate

Permissions must match `02_security` § Authorization before `approved`.
