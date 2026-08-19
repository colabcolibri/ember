---
title: Product brief
status: ready for scope
updated: 2026-08-19
---

# Product brief — Ember

## Problem

Comunidades intencionais (como o GSA) dependem de conexões humanas reais, mas formar encontros pequenos e significativos entre membros espalhados por fusos e agendas é trabalhoso e ad hoc. Quem organiza acaba virando "operador de calendário" e as mesmas duplas se repetem, enfraquecendo o tecido da rede.

## Vision / outcome

Ember é a brasa que mantém a rede acesa: uma infraestrutura silenciosa que forma círculos pequenos e intencionais entre pessoas de uma comunidade — um encontro de cada vez — privilegiando novas conexões e pontes dentro da rede.

## Users and jobs

| User type | Job to be done | Notes |
| --------- | -------------- | ----- |
| Membro da comunidade | Declarar quando posso estar presente, em quais idiomas converso e que tipo de encontro desejo; receber convites para círculos compatíveis | Primary — GSA como primeiro piloto |
| Facilitador / operador da comunidade | Configurar tipos de encontro (ex.: Fogo de Conselho), regras de formação e acompanhar saúde da rede | Secondary — pode ser o mesmo membro com papel extra |
| Organização anfitriã (GSA) | Dar vida a rituais como Fogo de Conselho sem virar rede social ou agenda pública | Primeiro cliente / caso de uso âncora |

## Value

- **Para membros:** encontros relevantes sem esforço de coordenação manual; exposição a pessoas novas dentro da comunidade.
- **Para a comunidade:** tecido social mais denso e diverso; menos bolhas e repetição de pares.
- **Vs status quo:** não é Calendly (não é agenda), não é LinkedIn (não é networking performático), não é feed social — é matching intencional com memória de quem já se encontrou.

## In scope (candidates)

- Cadastro e perfil de membro (disponibilidade, idiomas, preferências de encontro)
- Motor de matching: fusos, disponibilidade, histórico de encontros, priorização de novas conexões e pontes
- Template **Fogo de Conselho**: 3 pessoas · 1 pergunta · 30 minutos
- Formação de círculos pequenos e convite/confirmação de participantes
- Histórico de encontros por membro (para o algoritmo, não feed público)
- Administração básica de comunidade (tipos de encontro, membros)

## Out of scope (candidates)

- Feed, posts, likes, perfil público estilo rede social
- Agenda pessoal completa / sincronização bidirecional com Google Calendar ou similar
- Networking aberto, busca de pessoas por cargo ou empresa
- Vídeo integrado na v1 (link externo é suficiente)
- Marketplace de mentores ou monetização de encontros
- App nativo iOS/Android na v1

## Constraints

- Primeiro piloto: **GSA** e ritual **Fogo de Conselho**
- Comunidade fechada (não marketplace aberto) — `(assumption)`
- Dados pessoais mínimos (nome, email, disponibilidade, idiomas) — LGPD desde o início
- Stack MVP 0: monorepo `apps/web` + `apps/api`, SQLite, magic link, Jitsi, `.ics`
- Roadmap incremental: MVP 0 (piloto) → MVP 3 (grafo de rede) — ver `docs/discovery/roadmap.md`

## Assumptions

- GSA é a primeira comunidade e define o template Fogo de Conselho como formato padrão de encontro. `(assumption)`
- Membros aceitam convites por email (ou link mágico) sem app instalado na v1. `(assumption)`
- O matching roda em rodadas **quinzenais** com sorteio assistido no MVP 0. `(roadmap)`
- Idiomas na UI: **PT, EN**. `(roadmap / mockup)`
- "Pontes na rede" = priorizar pares que ainda não se encontraram e conexões de 2º grau dentro da comunidade. `(assumption)`

## Epic candidates (MVP 0)

- Schema SQLite + migrations
- API: rodadas, magic link, presença
- UI: declaração de presença PT/EN
- Admin: criar rodada, ver inscritos
- Sorteio com memória (assistido)
- Infra e-mail transacional (copiar padrão Osmo)
- E-mail: convite + roda formada
- Sala Jitsi + `.ics`
- Pós-rodada: "A roda aconteceu?"

Ver `docs/discovery/roadmap.md` para MVP 1–3.

## Evidence (existing codebase)

Greenfield — kit Meridian + mockup de apresentação em `mockup/fogo-de-conselho-apresentacao.html`. Ver `docs/discovery/orientacao-produto.md`.

## Open questions

| # | Question |
| - | -------- |
| 1 | Vite + shadcn confirmado para `apps/web`? |
| 2 | Onboarding GSA: import de lista ou self-service? |
| 3 | Jitsi self-hosted vs meet.jit.si no piloto? |
| 4 | Hipóteses do roadmap — ver `roadmap.md` § Hipóteses |

## Promotion notes

- **Problem / vision / in-out** → `00_scope.md`
- **User table** → `03_user_types.md` (membro, facilitador, org anfitriã)
- **Epic candidates** → backlog após `05_architecture` aprovada
