---
title: Roadmap — Fogo de Conselho
status: draft
updated: 2026-08-19
depends_on: [product-brief.md]
---

# Roadmap — Fogo de Conselho

Plano incremental alinhado ao [product brief](./product-brief.md) e à orientação de produto do piloto GSA.

> **Nota:** artefato de discovery — o contrato executável permanece em `docs/00_scope.md`. Detalhe técnico de entregas em `docs/07_api_contracts.md` e `docs/06_database.md`.

---

## MVP 0 — piloto na rede

**Objetivo:** validar o ritual com 1–2 rodadas reais.

| Entrega | Status |
|---------|--------|
| Orientação de produto e specs | ✅ |
| Mockup editorial de apresentação | ✅ |
| Phase docs Meridian (Ember) | ✅ |
| Schema SQLite + migrations | 🔲 |
| API: rodadas, magic link, presença | 🔲 |
| UI: declaração de presença PT/EN/ES | 🔲 |
| Admin: criar rodada, ver inscritos | 🔲 |
| Sorteio com memória (assistido) | 🔲 |
| E-mail: convite + roda formada | 🔲 |
| Infra e-mail (padrão Osmo: envio + `sent_emails` + Mailpit) | 🔲 |
| Sala Jitsi + `.ics` | 🔲 |
| "A roda aconteceu?" | 🔲 |

**Critério de sucesso qualitativo:**

> "Ontem sentei com duas pessoas da rede que eu provavelmente não teria chamado. Foi muito bom."

**Critério operacional:**

- Ninguém pergunta "onde está o link?" no WhatsApp
- A tecnologia deixa de ser o assunto

---

## MVP 1 — automação

| Entrega | Descrição |
|---------|-----------|
| Formação de rodas em um clique | Sorteio com memória automatizado |
| Publicação automática | E-mails ao publicar |
| Lembretes | 24h e 15min |
| Painel de exceções | Quem ficou sem roda |
| Métricas | Novos fios, no-show, diversidade |

---

## MVP 2 — canais

| Entrega | Descrição |
|---------|-----------|
| WhatsApp opt-in | Avisos individuais |
| Convite de calendário pelo sistema | Organizador `fogo@dominio` |
| Google Meet opcional | Se comunidade pedir |

---

## MVP 3 — memória da rede

| Entrega | Descrição |
|---------|-----------|
| Grafo visual (admin) | Conectividade da rede |
| Prioridade a nós pouco conectados | Cuidar dos fios fracos |
| Sugestão de slots | Baseada em adesão histórica |

---

## Cadência do piloto

| Parâmetro | Valor (hipótese) |
|-----------|------------------|
| Rodadas | quinzenais |
| Rodas | 3 pessoas |
| Duração | 30 minutos |
| Slots oferecidos | 5 (2 semana + 3 fim de semana) |
| Revisão | após 4 rodadas |

---

## Hipóteses a validar

1. Três pessoas é o tamanho ideal?
2. 30 minutos funciona?
3. Quinzenal ou mensal?
4. Fim de semana aumenta adesão?
5. A rede quer atravessar fronteiras ou prefere facilidade?
6. Qual é a taxa de no-show?
7. A pergunta comum ajuda?
8. Como preservar a integridade simbólica do Fogo de Conselho no digital?

---

## Fora de escopo (todos os MVPs)

- Chat, feed, likes, gamificação
- Perfis públicos, reputação, ranking
- Linguagem de networking na UI
- App nativo, IA, marketplace
