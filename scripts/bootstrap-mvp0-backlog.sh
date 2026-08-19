#!/usr/bin/env bash
# Bootstrap MVP 0 backlog — version, epics, user stories, sprints
set -euo pipefail
cd "$(dirname "$0")/.."
MD="python3 .agent/scripts/meridian_delivery.py"
V="v1"

# --- Version ---
$MD create-version --id "$V" --title "MVP 0 — piloto na rede" --status planned --outcome "Primeira rodada real de círculos com email, Jitsi e memória de matching."

$MD update-version "$V" <<'EOF'
---
id: v1
title: MVP 0 — piloto na rede
status: planned
outcome: "Comunidade piloto consegue rodar 1–2 rodadas reais: presença, sorteio assistido, roda formada por email, Jitsi e confirmação pós-encontro."
---

# v1 — MVP 0 — piloto na rede

## Objective

Esta release entrega o ciclo mínimo do Ember para uma comunidade fechada: membros declaram presença, facilitador abre rodada e publica círculos, o sistema envia convites transacionais (padrão Osmo + Mailpit em dev), gera sala Jitsi e `.ics`, e registra se a roda aconteceu para alimentar o sorteio com memória. Não inclui automação total, WhatsApp, grafo visual nem multi-comunidade self-service.

## Done criteria

O manager valida uma rodada piloto de ponta a ponta: pelo menos um círculo de 3 pessoas formado, emails visíveis em Mailpit (dev) ou entregues (staging), link Jitsi funcional, `.ics` importável, e fluxo "a roda aconteceu?" persistido. Critério qualitativo do roadmap atingível em ambiente de piloto.

## Included in this version

- EPIC-01 — Fundação monorepo e schema SQLite
- EPIC-02 — Infraestrutura de email (Osmo)
- EPIC-03 — Auth magic link
- EPIC-04 — Presença e perfil do membro
- EPIC-05 — Rodadas e painel facilitador
- EPIC-06 — Matching com memória (assistido)
- EPIC-07 — Entrega da roda (Jitsi, ics, emails)
- EPIC-08 — Pós-encontro e histórico

## Explicitly out

- MVP 1: sorteio automático, lembretes 24h/15min, métricas
- MVP 2: WhatsApp, Google Meet
- MVP 3: grafo visual da rede
- UI admin de histórico de emails enviados

## Go-live checklist

### Product

- [ ] Rodada piloto executada com 3+ membros reais
- [ ] Nenhum membro perguntou "onde está o link?" fora do produto
- [ ] `sent_emails` registra todos os envios transacionais

## Sprints

- `v1-S1` — Fundação + email
- `v1-S2` — Auth + presença membro
- `v1-S3` — Facilitador + matching
- `v1-S4` — Entrega roda + pós-encontro
EOF

create_epic() {
  local id="$1" title="$2" profiles="$3"
  $MD create-epic --id "$id" --title "$title" --versions "[\"$V\"]" --profiles "$profiles" --status active
}

create_epic EPIC-01 "Fundação monorepo e schema" '["Admin da comunidade"]'
create_epic EPIC-02 "Infraestrutura de email" '["Facilitador","Membro da comunidade"]'
create_epic EPIC-03 "Auth magic link" '["Membro da comunidade","Admin da comunidade"]'
create_epic EPIC-04 "Presença e perfil do membro" '["Membro da comunidade"]'
create_epic EPIC-05 "Rodadas e painel facilitador" '["Facilitador"]'
create_epic EPIC-06 "Matching com memória" '["Facilitador"]'
create_epic EPIC-07 "Entrega da roda" '["Membro da comunidade","Facilitador"]'
create_epic EPIC-08 "Pós-encontro e histórico" '["Membro da comunidade","Facilitador"]'

echo "Version and epics created."
