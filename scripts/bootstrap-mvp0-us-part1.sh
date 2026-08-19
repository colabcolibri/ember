#!/usr/bin/env bash
# Create all MVP 0 user stories
set -euo pipefail
cd "$(dirname "$0")/.."
MD="python3 .agent/scripts/meridian_delivery.py"
V="v1"

mkus() {
  local title="$1" epic="$2" done="$3"
  local id
  id=$($MD create-us --title "$title" --epic "$epic" --version "$V" --moscow Must --done-when "$done")
  $MD update-us "$id" <<USBODY
---
id: $id
title: $title
epic: $epic
version: $V
sprint:
status: ❌
moscow: Must
depends_on: $4
ready: false
done_when: "$done"
tests: required
tests_status: pending
---

# $id — $title

**As** $5,
**I want** $6,
**so that** $7.

## Intent

### Acceptance

$8

### Why

$9

### Where

$10

## Plan

### Approach _(optional at \`/create-us\` — **required** at \`/refine-us\`)_

_(refine)_

### Architecture refs

- \`docs/05_architecture.md\` — _(refine)_
$11

### API / DB impact

$12

### Security notes

$13

### Related decisions

- _n/a_

### Planned

- [ ] **manual** — _(refine)_
- [ ] **automated** — _(refine)_

## Record

### Files

_(pending)_

### Backend

_(pending)_

### Frontend

_(pending)_

### Scripts / Docs

_(pending)_

### Executed

_(pending)_

## Boundaries

### Out of scope for this story

$14

### Notes

$15
USBODY
  echo "$id"
}

# EPIC-01
mkus "Monorepo scaffold apps e packages" EPIC-01 "pnpm dev sobe web e api sem erro" "[]" \
  "desenvolvedor" "um monorepo com apps/web, apps/api, packages/db e packages/domain" "posso implementar features com boundaries claros" \
  "- [ ] \`pnpm install\` e \`pnpm dev\` funcionam\n- [ ] Pastas alinhadas a \`05_architecture.md\`\n- [ ] TypeScript compartilhado entre packages" \
  "Sem estrutura de repo, cada US seguinte carece de lugar canônico para código. Este slice só entrega skeleton executável — sem domínio de negócio." \
  "Primeira US do MVP 0 (v1-S1). Desbloqueia migrations (US-0002) e todo o restante." \
  "" \
  "- Schema migrations\n- Endpoints de negócio" \
  "- _n/a_" \
  "- _n/a_" \
  "Lógica de matching, email ou UI de produto." \
  "Usar pnpm workspaces + Turborepo se necessário."

US02=$(mkus "SQLite migrations schema core" EPIC-01 "Migrations criam tabelas communities users rounds circles sent_emails" "[\"US-0001\"]" \
  "desenvolvedor" "migrations versionadas para o schema MVP 0" "o banco reflete o modelo em 06_database.md" \
  "- [ ] Migration \`YYYYMMDDHHMMSS_initial_schema.sql\` aplica sem erro\n- [ ] Tabelas core + sent_emails existem\n- [ ] Comando documentado em 08_environments.md" \
  "O domínio precisa persistir comunidades, membros, rodadas e círculos antes de qualquer API. SQLite é store do MVP 0." \
  "Depende do monorepo (US-0001). Desbloqueia email persistence e APIs." \
  "- \`docs/06_database.md\`\n- \`docs/architecture/email.md\` § Schema" \
  "- Tabelas: communities, users, community_members, member_profiles, matching_rounds, circles, circle_members, sent_emails" \
  "- Pepper para vault documentado em .env.example" \
  "Dados de produção real — só seed sintético." \
  "")

US03=$(mkus "Dev environment env example e mailpit ports" EPIC-01 ".env.example completo e config/dev-ports.json com mailpit" "[\"US-0001\"]" \
  "desenvolvedor" "variáveis de ambiente e portas de dev documentadas" "subo Mailpit e API com copy-paste do README" \
  "- [ ] \`.env.example\` lista vars EMBER_* sem secrets\n- [ ] \`config/dev-ports.json\` com mailpit 1025/8025\n- [ ] \`08_environments.md\` alinhado" \
  "Onboarding lento gera erros de config em cada US. Centralizar env e portas evita drift." \
  "Paralelo a migrations; necessário antes de testar email (EPIC-02)." \
  "- \`docs/08_environments.md\`" \
  "- _n/a_" \
  "- Secrets nunca commitados" \
  "Script mailpit (US-0006) — só config aqui." \
  "")

# EPIC-02
US04=$(mkus "Email sender providers padrao Osmo" EPIC-02 "Factory noop logging smtp resend funciona por env" "[\"US-0002\",\"US-0003\"]" \
  "desenvolvedor" "providers de email portados do Osmo" "envio transacional usa adapter correto por ambiente" \
  "- [ ] \`EMBER_EMAIL_PROVIDER=noop\` não envia\n- [ ] \`smtp\` conecta Mailpit\n- [ ] \`resend\` exige API key" \
  "Reinventar email é risco — Osmo já validou factory e nodemailer. Port direto com prefixo EMBER_." \
  "Início EPIC-02 / v1-S1. Desbloqueia sent_emails e templates." \
  "- \`docs/architecture/email.md\`" \
  "- Módulos em packages/email ou apps/api" \
  "- Default noop — seguro sem config" \
  "Templates de negócio e gravação DB." \
  "Copiar de osmo/packages/licensing/server/src/email/")

US05=$(mkus "sent_emails persistencia hash e vault" EPIC-02 "Envio OK grava sent_emails envio falho nao grava" "[\"US-0004\"]" \
  "facilitador" "auditoria de emails enviados" "posso rastrear convites sem expor PII em logs" \
  "- [ ] \`recordSentEmail\` após \`result.ok\`\n- [ ] email_hash + vault no destinatário\n- [ ] html_vault + text_vault encriptados" \
  "LGPD e debug do piloto exigem saber o que foi enviado sem logar corpo em plaintext." \
  "Após providers; antes dos templates que disparam envio real." \
  "- \`docs/architecture/email.md\`\n- \`docs/02_security.md\`" \
  "- Tabela sent_emails" \
  "- EMBER_EMAIL_PEPPER obrigatório" \
  "UI admin de listagem." \
  "")

US06=$(mkus "Script Mailpit dev local" EPIC-02 "node scripts/dev/mailpit.mjs sobe SMTP e UI" "[\"US-0003\"]" \
  "desenvolvedor" "Mailpit local com um comando" "testo emails sem Resend em dev" \
  "- [ ] Script portado do Osmo com portas de dev-ports.json\n- [ ] UI em http://127.0.0.1:8025\n- [ ] Documentado em 08_environments" \
  "Sem Mailpit, devs enviam para Resend por engano ou não testam email." \
  "v1-S1; usado por todas US que enviam email." \
  "- \`docs/08_environments.md\`" \
  "- _n/a_" \
  "- _n/a_" \
  "Produção Resend." \
  "")

US07=$(mkus "Email layout e brand Ember" EPIC-02 "wrapEmailDocument usa tokens 09_design_system" "[\"US-0004\"]" \
  "membro da comunidade" "emails com visual Ember consistente" "convites parecem parte do produto não spam" \
  "- [ ] Layout HTML + text plain\n- [ ] Logo CID inline\n- [ ] Cores rust/paper/ink do design system" \
  "Emails genéricos quebram confiança. Layout compartilhado evita duplicação em cada template." \
  "Antes de magic_link e circle_formed templates." \
  "- \`docs/09_design_system.md\`" \
  "- _n/a_" \
  "- Sem PII no subject" \
  "Copy específica de cada kind." \
  "")

US08=$(mkus "Template email magic_link" EPIC-02 "Email magic link enviado e gravado em sent_emails" "[\"US-0005\",\"US-0007\"]" \
  "membro da comunidade" "receber link de acesso por email" "entro sem criar senha" \
  "- [ ] kind \`magic_link\` em sent_emails\n- [ ] Link assinado com expiração\n- [ ] Visível no Mailpit em dev" \
  "Auth depende do primeiro email transacional funcionando end-to-end." \
  "Fecha infra email; desbloqueia EPIC-03." \
  "- \`docs/architecture/email.md\` § Kinds" \
  "- POST auth magic-link dispara envio" \
  "- Anti-enumeration na API" \
  "Sessão após clique — EPIC-03." \
  "")

echo "EPIC-01/02 US done through US-0008"
