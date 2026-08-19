#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
MD="python3 .agent/scripts/meridian_delivery.py"
V="v1"

update_epic_body() {
  local id="$1"
  $MD update-epic "$id" <<EOF
---
id: $id
title: $(python3 -c "import json; print(json.load(open('/dev/stdin'))['t'])" <<< "{\"t\":\"$2\"}" 2>/dev/null || echo "$2")
status: active
versions: [$V]
profiles: $3
outcome: "$4"
---

# $id — $2

## Capability

$5

## Expected outcome

$6

## Out of scope for this epic

$7

## Notes

$8
EOF
}

# Simpler: inline heredocs per epic
$MD update-epic EPIC-01 <<'EOF'
---
id: EPIC-01
title: Fundação monorepo e schema
status: active
versions: [v1]
profiles: [Admin da comunidade]
outcome: "Repositório executável com SQLite, migrations e ambiente de dev documentado."
---

# EPIC-01 — Fundação monorepo e schema

## Capability

Hoje não existe código de produto — só documentação Meridian. Sem monorepo, schema e tooling, nenhuma outra capability pode ser implementada de forma consistente.

Este epic entrega a estrutura `apps/web`, `apps/api`, `packages/db`, `packages/domain`, runner de migrations SQLite com naming `YYYYMMDDHHMMSS`, `.env.example` e validação Meridian no fluxo de dev.

## Expected outcome

Desenvolvedor clona o repo, instala dependências, roda migrations e sobe API + web em localhost com schema mínimo de comunidades, membros e rodadas criado.

## Out of scope for this epic

- Lógica de negócio de matching ou email (EPIC-02+)
- Deploy staging/produção (pós-MVP 0)
- UI além de shell Vite vazio

## Notes

Alinhado a `01_tech_stack.md` e `05_architecture.md` § Repository layout.
EOF

$MD update-epic EPIC-02 <<'EOF'
---
id: EPIC-02
title: Infraestrutura de email
status: active
versions: [v1]
profiles: [Facilitador, Membro da comunidade]
outcome: "Envio transacional com providers Osmo, gravação em sent_emails e Mailpit em dev."
---

# EPIC-02 — Infraestrutura de email

## Capability

Ember depende de convites silenciosos por email — magic link, rodada aberta, roda formada. Sem infraestrutura confiável de envio e auditoria, o piloto vira operação manual no WhatsApp.

Porta o padrão Osmo: factory de providers (`noop`/`logging`/`smtp`/`resend`), `sendTransactionalEmail`, tabela `sent_emails` com hash/vault, templates TS com layout Ember, e Mailpit local para testes.

## Expected outcome

Em dev com `EMBER_EMAIL_PROVIDER=smtp`, emails aparecem no Mailpit `:8025` e cada envio bem-sucedido grava linha em `sent_emails`. Em staging, Resend entrega emails reais.

## Out of scope for this epic

- Templates de negócio `round_open` / `circle_formed` (EPIC-07)
- UI admin de histórico de emails
- Fila/retry assíncrono

## Notes

Ver `docs/architecture/email.md` — fonte Osmo em `packages/licensing/server`.
EOF

$MD update-epic EPIC-03 <<'EOF'
---
id: EPIC-03
title: Auth magic link
status: active
versions: [v1]
profiles: [Membro da comunidade, Admin da comunidade]
outcome: "Membros entram sem senha via link assinado no email."
---

# EPIC-03 — Auth magic link

## Capability

Membros de comunidades fechadas não devem criar conta com senha — isso quebra a promessa de "poucos toques". O magic link reconhece quem é e abre a sessão.

Implementa pedido de link por email, token assinado com expiração, verificação e cookie HTTP-only de sessão, integrado ao epic de email (`kind: magic_link`).

## Expected outcome

Membro informa email, recebe link (Mailpit em dev), clica e acessa fluxo de presença autenticado. Sessão expira conforme `02_security.md`.

## Out of scope for this epic

- OAuth Google (deferido)
- MFA
- Self-service signup sem convite admin

## Notes

Convite-only na v1 — admin adiciona membros antes.
EOF

$MD update-epic EPIC-04 <<'EOF'
---
id: EPIC-04
title: Presença e perfil do membro
status: active
versions: [v1]
profiles: [Membro da comunidade]
outcome: "Membro declara slots, idiomas, fuso e intenção na rodada aberta."
---

# EPIC-04 — Presença e perfil do membro

## Capability

O matching só funciona se membros declararem quando podem estar presentes, em quais idiomas conversam e com que intenção (surpresa, fronteira, facilidade). Hoje isso não existe no produto.

Entrega API de perfil, UI responsiva de declaração de presença nos slots da rodada, e i18n PT/EN/ES na superfície do membro.

## Expected outcome

Membro autenticado completa perfil e marca um ou mais slots da rodada ativa; facilitador vê inscrição na lista (EPIC-05).

## Out of scope for this epic

- Edição de perfil público ou foto
- Sync com calendário externo
- Notificações push

## Notes

Copy e visual seguem `09_design_system.md`; piloto pode usar ritual configurável por comunidade.
EOF

$MD update-epic EPIC-05 <<'EOF'
---
id: EPIC-05
title: Rodadas e painel facilitador
status: active
versions: [v1]
profiles: [Facilitador]
outcome: "Facilitador cria rodada, define slots/pergunta e vê inscritos."
---

# EPIC-05 — Rodadas e painel facilitador

## Capability

Cada ciclo de encontros começa quando um facilitador abre uma rodada com slots fixos e uma pergunta comum. Sem painel admin, o piloto depende de planilhas.

Entrega CRUD de rodada, configuração de template de encontro (tamanho do círculo, duração), listagem de membros inscritos com perfil completo para matching.

## Expected outcome

Facilitador cria rodada quinzenal, define 5 slots e pergunta, e vê quem declarou presença antes de disparar sorteio.

## Out of scope for this epic

- Sorteio automático sem revisão (MVP 1)
- Multi-comunidade no mesmo painel
- Métricas e dashboards

## Notes

RBAC `facilitador` em `03_user_types.md`.
EOF

$MD update-epic EPIC-06 <<'EOF'
---
id: EPIC-06
title: Matching com memória
status: active
versions: [v1]
profiles: [Facilitador]
outcome: "Sorteio assistido forma trios respeitando constraints e memória de encontros."
---

# EPIC-06 — Matching com memória

## Capability

Formar círculos manualmente não escala e repete os mesmos pares. O motor deve cruzar horário, idioma, intenção e histórico — priorizando novos encontros e pontes (geração, geografia).

Entrega `MatchingEngine` em `packages/domain`, UI de sorteio assistido onde facilitador revisa proposta antes de publicar, persistência de círculos em estado draft → invited.

## Expected outcome

Facilitador dispara sorteio, vê trios propostos, ajusta se necessário e confirma publicação — sem enviar emails até EPIC-07.

## Out of scope for this epic

- Otimização perfeita / solver global
- Re-match automático na mesma rodada após recusa
- Grafo visual (MVP 3)

## Notes

Pesos em `orientacao-produto.md` e `architecture/email.md` meta_json.
EOF

$MD update-epic EPIC-07 <<'EOF'
---
id: EPIC-07
title: Entrega da roda
status: active
versions: [v1]
profiles: [Membro da comunidade, Facilitador]
outcome: "Membros recebem email com roda, Jitsi, ics e página de confirmação."
---

# EPIC-07 — Entrega da roda

## Capability

Após publicação, cada membro precisa saber com quem se encontra, quando (no seu fuso) e como entrar — sem perguntar no WhatsApp. A tecnologia deve desaparecer.

Entrega geração de sala Jitsi, arquivo `.ics`, templates `round_open` e `circle_formed`, envio transacional, e página do membro para ver convite e confirmar presença.

## Expected outcome

Três membros de um círculo recebem email com horário local, pergunta, link Jitsi e `.ics`; página web mostra os mesmos dados.

## Out of scope for this epic

- Vídeo integrado no app
- Lembretes 24h/15min (MVP 1)
- WhatsApp

## Notes

Critério operacional do roadmap: ninguém pergunta "onde está o link?".
EOF

$MD update-epic EPIC-08 <<'EOF'
---
id: EPIC-08
title: Pós-encontro e histórico
status: active
versions: [v1]
profiles: [Membro da comunidade, Facilitador]
outcome: "Sistema registra se a roda aconteceu e alimenta memória do matching."
---

# EPIC-08 — Pós-encontro e histórico

## Capability

Sem feedback pós-encontro, o matching não aprende quem de fato se encontrou. A pergunta "a roda aconteceu?" é leve mas essencial para memória da rede.

Entrega fluxo pós-slot para membros confirmarem participação real, persistência em `meeting_participations`, e uso desse histórico no scoring do EPIC-06 em rodadas futuras.

## Expected outcome

Após horário do círculo, membros respondem se a roda aconteceu; segunda rodada do piloto evita repetir os mesmos pares imediatamente.

## Out of scope for this epic

- No-show automático sem resposta
- Métricas agregadas (MVP 1)
- Avaliação qualitativa da conversa

## Notes

Fecha o loop MVP 0 do roadmap.
EOF

echo "Epic bodies updated."
