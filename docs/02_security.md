---
title: Security
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [00_scope.md, 01_tech_stack.md]
blocks: [03_user_types.md, 04_principles.md, 05_architecture.md]
---

# 02 — Security

> **Init:** stub em `/init-meridian`. **Deepen:** `/security-pass bootstrap` após `01`, `/privacy-pass bootstrap` (PII em escopo), depois `/security-pass full` + `/privacy-pass full` antes de `approved`.

## Security posture summary

| Attribute | Value |
| --------- | ----- |
| **Exposure** | public internet (web app para membros de comunidades fechadas) |
| **Auth required** | yes — todas as superfícies de membro e facilitador |
| **Sensitive data** | PII — nome, email, disponibilidade, histórico de encontros |
| **Compliance** | LGPD (membros brasileiros no GSA); GDPR N/A até expansão EU |
| **Trust boundary** | Browser e email do membro ficam fora; dentro ficam perfil, matching, histórico e regras de comunidade |

## Data classification

| Class | Examples in this product | Storage | Retention | Encryption |
| ----- | ------------------------ | ------- | --------- | ---------- |
| Public | Nome do produto, copy de landing | estático | indefinido | n/a |
| Internal | Regras de matching, logs agregados | DB / logs | 90 dias logs | in transit |
| Confidential | Email, disponibilidade, histórico de encontros | Postgres | enquanto membro ativo + 30 dias após exclusão | at rest + in transit |
| Regulated | — | — | — | — |

**PII inventory:** nome completo, email, fuso horário, janelas de disponibilidade, idiomas declarados, histórico de participação em círculos (não público).

**Data minimization:** sem foto de perfil, bio pública, cargo ou empresa na v1; sem localização GPS; sem dados de calendário externo.

## Privacy — LGPD (Brazil)

| Topic | This product |
| ----- | ------------ |
| Controlador / operador | GSA como controlador dos dados dos membros; Ember como operador da plataforma `(assumption — validar juridicamente)` |
| Bases legais (Art. 7 / 11) | Execução de contrato / legítimo interesse para matching dentro da comunidade |
| Direitos do titular (Art. 18) — como exercer | Canal email do encarregado; export e exclusão via painel ou solicitação |
| Encarregado — contato | a definir com GSA |
| RIPD necessário? | em elaboração — volume inicial pequeno no piloto |
| Retenção e exclusão | Dados de perfil excluídos em até 30 dias após pedido; histórico anonimizado para métricas agregadas |
| Transferência internacional | possível se hosting US — documentar e DPA com provedor |
| Incidentes — procedimento | notificar controlador (GSA) em 24h; titulares conforme orientação legal |

## Privacy — GDPR (EU/EEA)

N/A na v1 — sem membros EU planejados. Reavaliar se comunidade expandir.

## Authentication model

| Surface | Mechanism | Session / token | Expiry | Notes |
| ------- | --------- | --------------- | ------ | ----- |
| Web | magic link ou OAuth2 `(candidate)` | HTTP-only cookie / JWT | 7 dias `(candidate)` | Decisão pendente — ver open questions |
| API | Bearer (mesma sessão web) | JWT | alinhado à sessão | |
| Admin / facilitador | mesmo auth + role claim | | | RBAC no servidor |

**Password policy:** N/A se magic link; se senha for adotada, mínimo 12 caracteres.

**MFA:** N/A na v1 — comunidade fechada de baixo risco `(assumption)`.

**Account recovery:** reenvio de magic link; sem revelar se email existe em mensagens genéricas.

## Authorization model

| Role / profile | Can | Cannot | Enforced where |
| -------------- | --- | ------ | -------------- |
| membro | Editar próprio perfil; confirmar convites; ver próprios encontros | Ver histórico de outros; configurar comunidade | server |
| facilitador | Configurar tipos de encontro; disparar rodada de matching; ver status dos círculos | Acessar PII fora da própria comunidade | server |
| org_admin | Gerenciar membros da comunidade; promover facilitadores | Acessar outras comunidades | server |

**Model type:** RBAC por comunidade (multi-tenant por `community_id`)

**Privileged operations:** exclusão de membro, export de dados — org_admin + log de auditoria

**Multi-tenant isolation:** toda query filtrada por `community_id`; RLS no Postgres se Supabase

## Threat model (STRIDE summary)

| Surface | Threat actors | Top STRIDE threats | Mitigation | Residual risk |
| ------- | ------------- | ------------------ | ---------- | ------------- |
| Web app | membro malicioso | Spoofing, Tampering, Elevation | Auth obrigatória; RBAC server-side | medium |
| API matching | membro / anonymous | Information disclosure | Sem endpoint público de histórico; rate limit | low |
| Email convites | third party | Spoofing | Links assinados com expiração | medium |
| Admin | facilitador comprometido | Tampering em círculos | Audit log de ações de facilitador | medium |

**Business-logic abuse:** membro criando múltiplas contas para manipular matching — convite-only na v1 mitiga.

## Secrets and configuration

| Secret type | Storage | Rotation | Never in Git |
| ----------- | ------- | -------- | ------------ |
| API keys (email, DB) | `.env` / Vercel env | anual | yes |
| DB credentials | provider secret | automático | yes |
| Signing keys (session) | env | 90 dias `(candidate)` | yes |

- `.env` e `.env.*` no `.gitignore`
- `.env.example` commitado — chaves documentadas, sem valores reais
- **Secrets manager:** Vercel env + Supabase dashboard na v1

## Input validation and output encoding

| Boundary | Validation approach | Library | Encoding notes |
| -------- | ------------------- | ------- | -------------- |
| HTTP API | server-side required | zod `(candidate)` | JSON |
| Forms / UI | client + server | zod + react-hook-form | escape em HTML |
| File upload | n/a v1 | — | — |
| Webhooks | n/a v1 | — | — |

## Data protection

- **In transit:** TLS 1.2+ em todas as rotas
- **At rest:** encryption do provider (Supabase/RDS)
- **Logs:** sem email completo; hash ou truncar
- **Backups:** provider-managed; acesso restrito

## Rate limiting and abuse

| Endpoint / action | Limit | Response | Notes |
| ----------------- | ----- | -------- | ----- |
| Login / magic link | 5 / hora / IP | 429 | anti-enumeration |
| API global | 100 / min / user | 429 | |

## Audit and logging

| Event | Logged fields | Retention | Who can read |
| ----- | ------------- | --------- | ------------ |
| Auth success/fail | user_id, IP, timestamp | 90 dias | org_admin |
| Matching run | community_id, circles formed | 1 ano | facilitador |
| Admin actions | actor, action, target | 1 ano | org_admin |

## Dependencies and supply chain

| Concern | Policy |
| ------- | ------ |
| Lockfiles committed | yes — pnpm-lock.yaml |
| Audit command | `pnpm audit` |
| CI gate | warn na v1; fail antes de prod |
| Copyleft / license review | MIT/Apache preferidos |

## AI and automation safety (Meridian / agents)

| Rule | Detail |
| ---- | ------ |
| Write scope | `apps/`, `packages/`, `supabase/migrations/` |
| Forbidden | secrets em prompts, `git push --force`, desabilitar auth |
| Human gates | `ready: true`, `Record`, docs `approved` |
| HAR | OAuth, billing, produção — ação humana necessária |

## OWASP and common risks

| Risk area | Posture for this product | Follow-up |
| --------- | ------------------------ | --------- |
| Broken access control | RBAC + community_id em toda query | US de auth |
| Cryptographic failures | TLS + cookies secure/httpOnly | `08` |
| Injection | queries parametrizadas | ORM |
| Insecure design | matching não expõe dados de terceiros | revisão de API |
| Security misconfiguration | `.env.example` + CI lint | bootstrap |
| Vulnerable components | `pnpm audit` em CI | `/dependency-audit` |
| Auth failures | magic link com expiração | US auth |
| Data integrity | transações para formação de círculo | `06` |
| Logging failures | structured logs sem PII | `08` |
| SSRF | n/a v1 — sem fetch de URL do usuário | — |

## Gaps / open questions

| # | Gap | Severity | Owner | Target |
| - | --- | -------- | ----- | ------ |
| 1 | Definir controlador vs operador LGPD com GSA | high | manager | antes do piloto |
| 2 | Escolher mecanismo de auth final | high | manager | antes de implementação |
| 3 | Política de retenção pós-exclusão — confirmar 30 dias | medium | legal | antes de prod |

## Gate

Human sets `status: approved` before `/architecture` gate and backlog.
