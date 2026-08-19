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

## Onde estamos (ago 2026)

O **MVP 0 técnico** foi entregue em código (US-0001 a US-0031): auth por magic link, perfil básico, presença, rodada, matching assistido, círculos, e-mails, Jitsi, `.ics` e pós-encontro. O piloto **ainda não rodou com rede real** — faltam ajustes de produto antes de abrir a primeira rodada GSA.

### Entregue no repositório

| Área | Status | Observação |
|------|--------|------------|
| Orientação de produto e specs | ✅ | `docs/discovery/` |
| Phase docs Meridian (Ember) | ✅ | `docs/00`–`11` |
| Schema SQLite + migrations | ✅ | US-0002+ |
| Auth magic link + sessão | ✅ | US-0009, US-0010 |
| Perfil membro (fuso + idiomas) | 🔶 | fuso é campo texto manual; sem nome nem ano da edição |
| Declaração de presença PT/EN | 🔶 | chips fixos; slots ancorados em `America/Sao_Paulo` |
| Facilitador: criar rodada | 🔶 | uma pergunta; sem tema; slots hardcoded |
| Matching assistido + publicar círculos | ✅ | US-0017–US-0019 |
| E-mail convite + roda formada | ✅ | US-0022 |
| Sala Jitsi + `.ics` | ✅ | US-0020, US-0021 |
| "A roda aconteceu?" | ✅ | US-0024 |
| Design system + reskin Stitch | ✅ | US-0026–US-0031 |

### Lacunas antes do piloto real (próximo ciclo)

| Lacuna | US planejada | Por quê importa |
|--------|--------------|-----------------|
| Mensagem genérica "API offline" | US-0032 | Qualquer falha de fetch mostra offline — confunde membro e facilitador |
| Fuso horário manual | US-0033 | Deve ser seletor IANA (Combobox); fuso dita toda exibição de horário |
| Perfil incompleto | US-0034 | Falta nome e ano da edição GSA para matching e comunicação humana |
| Rodada rasa | US-0035 | Falta tema da rodada e conjunto de perguntas comuns (ritual compartilhado) |
| Slots só Brasil | US-0036–US-0038 | Rede é multi-fuso: calendários regionais com horário oficial + conversão local |

---

## MVP 0 — piloto na rede

**Objetivo:** validar o ritual com 1–2 rodadas reais.

| Entrega | Status |
|---------|--------|
| Orientação de produto e specs | ✅ |
| Mockup editorial de apresentação | ✅ |
| Phase docs Meridian (Ember) | ✅ |
| Schema SQLite + migrations | ✅ |
| API: rodadas, magic link, presença | ✅ |
| UI: declaração de presença PT/EN | 🔶 |
| Admin: criar rodada, ver inscritos | 🔶 |
| Sorteio com memória (assistido) | ✅ |
| E-mail: convite + roda formada | ✅ |
| Infra e-mail (padrão Osmo: envio + `sent_emails` + Mailpit) | ✅ |
| Sala Jitsi + `.ics` | ✅ |
| "A roda aconteceu?" | ✅ |
| Fuso, perfil completo e slots regionais | 🔲 |

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
| Slots oferecidos | 5 (2 semana + 3 fim de semana) — **evoluir para calendários regionais** |
| Revisão | após 4 rodadas |

### Modelo de slots regionais (direção de produto)

Cada **calendário regional** define horários oficiais ancorados no fuso da região (ex.: `Americas/Sunday 14:00 America/Sao_Paulo`, `Europe/Sunday 13:00 Europe/Lisbon`). O membro sempre vê:

1. **Horário oficial** — o que o facilitador definiu para aquela região
2. **Horário no meu fuso** — convertido a partir do perfil do membro

O fuso do membro deve ser fácil de alterar (perfil + Combobox) porque governa toda a experiência temporal.

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
