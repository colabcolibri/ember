---
title: Scope
status: approved
version: 1.1
updated: 2026-08-19
depends_on: []
blocks: [01_tech_stack.md, 04_principles.md, 05_architecture.md]
---

# 00 — Scope

## Name and description

**Product name:** Ember

Ember é uma plataforma para **comunidades fechadas** formarem encontros pequenos e intencionais entre membros. Cada pessoa informa quando pode estar presente, em quais idiomas conversa e que tipo de encontro deseja. O sistema cruza fusos, disponibilidade e histórico para montar círculos pequenos, privilegiando novas conexões e pontes na rede. Opera como infraestrutura silenciosa — não é rede social, não é agenda pública, não é networking.

O **primeiro piloto** é uma comunidade específica (GSA) com o ritual **Fogo de Conselho** — isso valida o produto, mas **Ember não é "app dos guerreiros"**: o modelo é multi-comunidade; rituais, copy e identidade visual são configuráveis por comunidade.

> A apresentação HTML em `mockup/` é material de pitch para um piloto — não define o escopo do produto.

## Problem it solves

**Before:** Comunidades distribuídas dependem de coordenação manual para encontros significativos. Organizadores viram operadores de calendário; os mesmos pares se repetem; novos fios na rede são raros.

**After:** Membros recebem convites para círculos compatíveis com sua disponibilidade, idioma e intenção — sem expor uma agenda social ou feed. A comunidade ganha encontros regulares que fortalecem o tecido relacional.

**Why now:** Comunidades intencionais precisam de infraestrutura leve para encontros recorrentes — sem virar mais uma plataforma social. Um piloto fecha o modelo antes de escalar para outras comunidades.

## Who it is for

| Audience | Role / context | Technical level | Primary need |
| -------- | -------------- | --------------- | ------------ |
| Primary — Membro da comunidade | Participante de qualquer comunidade no Ember | Baixo a médio — browser | Declarar presença e receber convites para círculos |
| Secondary — Facilitador | Operador do ritual na comunidade | Médio | Abrir rodadas, revisar sorteio, publicar rodas |
| Tertiary — Admin da comunidade | Dono da instância (tenant) | Baixo | Membros, configuração, primeiro piloto |

## In initial scope — MVP 0 (piloto na rede)

Objetivo: validar o ritual com 1–2 rodadas reais no piloto. Detalhe em `docs/discovery/roadmap.md`.

1. Membro declara **presença** em slots da rodada, com perfil e idiomas.
2. Membro declara **intenção**: *me surpreenda* · *atravessar uma fronteira* · *facilidade*.
3. Auth por **magic link** — e-mail transacional com padrão Osmo (ver `docs/architecture/email.md`).
4. Facilitador cria **rodada**, vê inscritos, **sorteio com memória** assistido.
5. Sistema forma **círculos de 3** (horário + idioma essenciais; novidade + pontes como prioridade).
6. **E-mails** `round_open` e `circle_formed` — gravados em `sent_emails`; dev via **Mailpit**.
7. Sala **Jitsi** + **`.ics`** no e-mail da roda formada.
8. Pós-encontro: **"A roda aconteceu?"** para memória do matching.
9. UI mínima — sem feed, chat ou gamificação.

**Cadência piloto (hipótese):** rodadas quinzenais · 30 min · revisão após 4 rodadas.

**Critério de sucesso qualitativo:** *"Ontem sentei com duas pessoas da rede que eu provavelmente não teria chamado. Foi muito bom."*

**Critério operacional:** ninguém pergunta "onde está o link?" no WhatsApp; a tecnologia deixa de ser o assunto.

## Out of initial scope (MVP 0)

- Feed, posts, comentários, likes, gamificação ou perfil público
- Linguagem de networking na UI
- Chat entre membros
- Sorteio totalmente automático sem revisão humana (MVP 1)
- Lembretes automáticos 24h/15min (MVP 1)
- WhatsApp opt-in (MVP 2)
- Google Meet integrado (MVP 2 — Jitsi basta no piloto)
- Grafo visual da rede (MVP 3)
- App nativo iOS/Android
- IA, marketplace, billing

**Deferido para MVPs posteriores:** ver `docs/discovery/roadmap.md` (MVP 1–3).

## Known constraints

| Type | Constraint | Impact |
| ---- | ---------- | ------ |
| Team | Greenfield — time pequeno | Escopo v1 enxuto; matching em batch, não real-time |
| Timeline | Piloto GSA como âncora | Fogo de Conselho é o primeiro template obrigatório |
| Legal / compliance | LGPD — dados de membros (nome, email, disponibilidade) | Privacy-by-design desde o início; ver `02_security` |
| Technology | Monorepo `apps/web` + `apps/api`, SQLite no MVP 0, Jitsi + `.ics` | Ver `01_tech_stack` — draft até aprovação humana |
| Ritual | Fogo de Conselho: 3 pessoas · 1 pergunta · 30 min | Integridade simbólica — hipótese #8 no roadmap |

## Assumptions

| # | Assumption | Confidence | Validate by |
| - | ---------- | ---------- | ----------- |
| 1 | GSA é comunidade fechada com lista de membros conhecidos | medium | Confirmar com stakeholders GSA |
| 2 | Rodadas quinzenais com 5 slots (2 semana + 3 fim de semana) | medium | Revisão após 4 rodadas |
| 3 | Convites por email + link mágico são suficientes na v1 | high | Piloto com 10–20 membros |
| 4 | "Pontes na rede" = priorizar quem ainda não se encontrou e conexões de 2º grau | medium | Validar com facilitador GSA |
| 5 | Encontro em sala Jitsi gerada pelo sistema + `.ics` | high | MVP 0 — confirmar URL e credenciais |
| 6 | Sorteio assistido (facilitador confirma) antes de publicar rodas | high | Piloto 1–2 rodadas |

## Open questions

| # | Question | Owner | Target date |
| - | -------- | ----- | ----------- |
| 1 | Vite + shadcn vs Next.js para `apps/web`? | manager | antes de `01` approved |
| 2 | Onboarding GSA: import de lista ou self-service com aprovação? | manager | antes do piloto |
| 3 | Hipóteses do roadmap (#1–8) — ver `docs/discovery/roadmap.md` | product-owner | após 4 rodadas |

## Gate

Human sets `status: approved` before deepening `01_tech_stack` and security work.
