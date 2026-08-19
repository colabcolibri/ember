#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MD=(python3 .agent/scripts/meridian_delivery.py)
V=v1

cu() {
  local title="$1" epic="$2" done="$3"
  "${MD[@]}" create-us --title "$title" --epic "$epic" --version "$V" --moscow Must --done-when "$done"
}

# EPIC-03
cu "API solicitar magic link" EPIC-03 "POST auth magic-link retorna 202 e dispara email"
cu "Verificar magic link e criar sessão" EPIC-03 "GET verify link cria cookie de sessão válido"

# EPIC-04
cu "API perfil membro fuso e idiomas" EPIC-04 "PUT perfil persiste timezone e idiomas"
cu "UI declaração de presença na rodada" EPIC-04 "Membro marca slots e intenção na rodada aberta"
cu "i18n PT EN ES fluxo membro" EPIC-04 "UI membro alterna idioma sem quebrar layout"

# EPIC-05
cu "Admin criar rodada com slots e pergunta" EPIC-05 "Facilitador cria rodada com 5 slots"
cu "Admin listar membros inscritos na rodada" EPIC-05 "Lista mostra quem declarou presença"
cu "Configurar template de encontro da comunidade" EPIC-05 "Template define 3 pessoas 30 minutos"

# EPIC-06
cu "MatchingEngine constraints horario e idioma" EPIC-06 "Engine rejeita trio sem horario ou idioma comum"
cu "MatchingEngine scoring memoria e pontes" EPIC-06 "Score prioriza pares que nunca se encontraram"
cu "UI sorteio assistido e publicar círculos" EPIC-06 "Facilitador revisa trios e confirma publicação"

# EPIC-07
cu "Gerar sala Jitsi por círculo" EPIC-07 "Cada círculo publicado tem URL Jitsi única"
cu "Gerar arquivo ics para círculo" EPIC-07 "ics anexado ou linkado no email circle_formed"
cu "Emails round_open e circle_formed" EPIC-07 "Emails enviados e gravados em sent_emails"
cu "Página convite roda para membro" EPIC-07 "Membro vê trio horário pergunta e links"

# EPIC-08
cu "Fluxo a roda aconteceu" EPIC-08 "Membro responde após slot do círculo"
cu "Persistir meeting_participations" EPIC-08 "Histórico alimenta scoring da próxima rodada"

echo "Created US-0009 through US-0025"
