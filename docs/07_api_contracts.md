---
title: API contracts
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [05_architecture.md, 02_security.md, 03_user_types.md]
blocks: []
---

# 07 — API contracts

API REST JSON para o web app Ember. Rotas sob `/api/v1/`. Autenticação via sessão (cookie) ou Bearer JWT — alinhado a `02_security`.

## API style

| Attribute | Value |
| --------- | ----- |
| **Style** | REST |
| **Base URL** | `https://{host}/api/v1` / `http://localhost:3000/api/v1` |
| **Versioning** | URL `/v1` |
| **Documentation** | OpenAPI em `docs/openapi.yaml` `(planned)` |

## Authentication

| Mechanism | Header / param | Consistent with `02_security` |
| --------- | -------------- | ----------------------------- |
| Session cookie | `Cookie` | yes |
| Bearer JWT | `Authorization: Bearer` | yes — mobile/API futuro |

## Common headers

| Header | Required | Description |
| ------ | -------- | ----------- |
| `Content-Type` | yes (mutations) | `application/json` |
| `X-Community-Id` | em rotas multi-community futuro | UUID da comunidade ativa |

## Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Disponibilidade inválida",
    "details": [{ "field": "slots", "message": "..." }]
  }
}
```

## Endpoints (stub — expand before `approved`)

| Method | Path | Purpose | Auth | Request | Response |
| ------ | ---- | ------- | ---- | ------- | -------- |
| GET | `/health` | liveness | no | — | `200 { "ok": true }` |
| POST | `/auth/magic-link` | enviar link de login | no | `{ email }` | `202` |
| GET | `/me` | perfil do usuário logado | yes | — | `200 User` |
| GET | `/me/profile` | disponibilidade e idiomas | yes | — | `200 MemberProfile` |
| PUT | `/me/profile` | atualizar perfil | yes | `MemberProfileInput` | `200` |
| GET | `/circles` | convites e encontros do membro | yes | — | `200 Circle[]` |
| POST | `/circles/:id/confirm` | confirmar presença | yes | — | `200` |
| POST | `/circles/:id/decline` | recusar convite | yes | — | `200` |
| GET | `/admin/members` | lista membros | facilitador+ | — | `200 Member[]` |
| POST | `/admin/invites` | convidar membro | org_admin | `{ email }` | `201` |
| GET | `/admin/templates` | tipos de encontro | facilitador+ | — | `200 Template[]` |
| PUT | `/admin/templates/:id` | editar template | facilitador+ | `TemplateInput` | `200` |
| POST | `/admin/matching-rounds` | disparar rodada | facilitador+ | `{ templateId, question? }` | `201 MatchingRound` |
| GET | `/admin/matching-rounds/:id` | status dos círculos | facilitador+ | — | `200` |

## Pagination / filtering

| Param | Type | Default | Max |
| ----- | ---- | ------- | --- |
| `page` | int | 1 | — |
| `limit` | int | 20 | 100 |

Aplicável em `/admin/members` e listagens futuras.

## Webhooks / callbacks

n/a na v1.

## Rate limits

Ver `02_security` § Rate limiting — `429` com `Retry-After`.

## Internal contracts (non-HTTP)

| Consumer | Provider | Contract location |
| -------- | -------- | ----------------- |
| MatchingEngine | ProfileRepository | `packages/domain/ports/` |
| InviteService | EmailAdapter | `packages/domain/ports/email.ts` |

## Gaps / open questions

| # | Endpoint / contract missing | US / epic |
| - | ------------------------- | --------- |
| 1 | Schemas OpenAPI completos | epic API |
| 2 | Endpoint de re-match após recusa | epic convites |
| 3 | Import bulk de membros GSA | epic onboarding |

## Gate

Paths must exist in repo or be explicitly `planned` before `approved`.
