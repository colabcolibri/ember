#!/usr/bin/env python3
"""Batch-update US narratives via meridian_delivery.py (stdin heredoc)."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD = ["python3", str(ROOT / ".agent/scripts/meridian_delivery.py")]


def us_body(
    us_id: str,
    title: str,
    epic: str,
    done: str,
    deps: list[str],
    role: str,
    want: str,
    so_that: str,
    acceptance: list[str],
    why: str,
    where: str,
    arch_refs: str,
    api_db: str,
    security: str,
    out_scope: str,
    notes: str = "",
) -> str:
    deps_yaml = "[]" if not deps else "[" + ", ".join(deps) + "]"
    acc = "\n".join(f"- [ ] {a}" for a in acceptance)
    return f"""---
id: {us_id}
title: {title}
epic: {epic}
version: v1
sprint:
status: ❌
moscow: Must
depends_on: {deps_yaml}
ready: false
done_when: "{done}"
tests: required
tests_status: pending
---

# {us_id} — {title}

**As** {role},
**I want** {want},
**so that** {so_that}.

## Intent

### Acceptance

{acc}

### Why

{why}

### Where

{where}

## Plan

### Approach _(optional at `/create-us` — **required** at `/refine-us`)_

_(refine)_

### Architecture refs

{arch_refs}

### API / DB impact

{api_db}

### Security notes

{security}

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

{out_scope}

### Notes

{notes}
"""


STORIES = [
    dict(
        us_id="US-0001",
        title="Monorepo scaffold apps e packages",
        epic="EPIC-01",
        done="pnpm dev sobe web e api sem erro",
        deps=[],
        role="desenvolvedor",
        want="monorepo com apps/web, apps/api, packages/db e packages/domain",
        so_that="posso implementar features com boundaries claros",
        acceptance=[
            "`pnpm install` e `pnpm dev` funcionam",
            "Pastas alinhadas a `05_architecture.md`",
            "TypeScript compartilhado entre packages",
        ],
        why="Sem estrutura de repo, cada US seguinte carece de lugar canônico. Skeleton executável sem domínio de negócio.",
        where="Primeira US do v1-S1. Desbloqueia US-0002 e todo o MVP 0.",
        arch_refs="- `docs/05_architecture.md` — § Repository layout",
        api_db="- _n/a_",
        security="- _n/a_",
        out_scope="Migrations, endpoints de negócio, UI de produto.",
        notes="pnpm workspaces; Vite + shadcn.",
    ),
    dict(
        us_id="US-0002",
        title="SQLite migrations schema core",
        epic="EPIC-01",
        done="Migrations criam tabelas core e sent_emails",
        deps=["US-0001"],
        role="desenvolvedor",
        want="migrations versionadas SQLite",
        so_that="o banco reflete `06_database.md`",
        acceptance=[
            "Migration `YYYYMMDDHHMMSS_initial_schema.sql` aplica sem erro",
            "Tabelas communities, users, rounds, circles, sent_emails existem",
            "Comando documentado em `08_environments.md`",
        ],
        why="Persistência é pré-requisito de API, email e matching. SQLite no MVP 0.",
        where="v1-S1 após US-0001. Desbloqueia EPIC-02 e APIs.",
        arch_refs="- `docs/06_database.md`\n- `docs/architecture/email.md`",
        api_db="- Migrations em `packages/db/migrations/`",
        security="- `EMBER_EMAIL_PEPPER` em `.env.example`",
        out_scope="Seed de dados reais do piloto.",
    ),
    dict(
        us_id="US-0003",
        title="Dev environment env example e mailpit ports",
        epic="EPIC-01",
        done=".env.example e dev-ports.json documentados",
        deps=["US-0001"],
        role="desenvolvedor",
        want="variáveis EMBER_* e portas Mailpit centralizadas",
        so_that="onboarding local é copy-paste",
        acceptance=[
            "`.env.example` sem secrets reais",
            "`config/dev-ports.json` com mailpit 1025/8025",
            "`08_environments.md` alinhado",
        ],
        why="Config dispersa gera falhas silenciosas em email e auth.",
        where="v1-S1; necessário antes de US-0006 e testes SMTP.",
        arch_refs="- `docs/08_environments.md`",
        api_db="- _n/a_",
        security="- Secrets gitignored",
        out_scope="Script Mailpit (US-0006).",
    ),
    dict(
        us_id="US-0004",
        title="Email sender providers padrao Osmo",
        epic="EPIC-02",
        done="Providers noop logging smtp resend por env",
        deps=["US-0002", "US-0003"],
        role="desenvolvedor",
        want="factory de email portada do Osmo",
        so_that="envio usa adapter correto por ambiente",
        acceptance=[
            "`EMBER_EMAIL_PROVIDER=noop` não envia",
            "`smtp` entrega no Mailpit",
            "`resend` falha graciosamente sem API key",
        ],
        why="Reuso do padrão Osmo reduz risco no piloto.",
        where="v1-S1 EPIC-02. Desbloqueia US-0005 e templates.",
        arch_refs="- `docs/architecture/email.md`",
        api_db="- Módulos `packages/email/`",
        security="- Default noop",
        out_scope="Templates e gravação DB.",
        notes="Fonte: osmo/packages/licensing/server/src/email/",
    ),
    dict(
        us_id="US-0005",
        title="sent_emails persistencia hash e vault",
        epic="EPIC-02",
        done="Envio OK grava sent_emails",
        deps=["US-0004"],
        role="facilitador",
        want="auditoria de emails enviados",
        so_that="rastreio convites sem PII em logs",
        acceptance=[
            "`recordSentEmail` só após `result.ok`",
            "email_hash + email_vault no destinatário",
            "html_vault e text_vault encriptados",
        ],
        why="LGPD e debug do piloto exigem trilha sem expor corpo em log.",
        where="v1-S1 após providers.",
        arch_refs="- `docs/architecture/email.md`\n- `docs/02_security.md`",
        api_db="- Tabela `sent_emails`",
        security="- `EMBER_EMAIL_PEPPER`",
        out_scope="UI admin de histórico.",
    ),
    dict(
        us_id="US-0006",
        title="Script Mailpit dev local",
        epic="EPIC-02",
        done="mailpit.mjs sobe SMTP e UI",
        deps=["US-0003"],
        role="desenvolvedor",
        want="Mailpit com um comando",
        so_that="testo emails sem Resend",
        acceptance=[
            "Script em `scripts/dev/mailpit.mjs`",
            "UI em http://127.0.0.1:8025",
            "Documentado em `08_environments`",
        ],
        why="Dev sem Mailpit envia email real por engano.",
        where="v1-S1; usado por todas US de email.",
        arch_refs="- `docs/08_environments.md`",
        api_db="- _n/a_",
        security="- _n/a_",
        out_scope="Produção Resend.",
    ),
    dict(
        us_id="US-0007",
        title="Email layout e brand Ember",
        epic="EPIC-02",
        done="Layout usa tokens do design system",
        deps=["US-0004"],
        role="membro da comunidade",
        want="emails com visual Ember",
        so_that="convites geram confiança",
        acceptance=[
            "HTML + text plain",
            "Logo CID inline",
            "Cores rust/paper/ink",
        ],
        why="Layout único evita duplicação em cada template.",
        where="Antes de US-0008 e US-0022.",
        arch_refs="- `docs/09_design_system.md`",
        api_db="- _n/a_",
        security="- _n/a_",
        out_scope="Copy por kind.",
    ),
    dict(
        us_id="US-0008",
        title="Template email magic_link",
        epic="EPIC-02",
        done="magic_link enviado e gravado",
        deps=["US-0005", "US-0007"],
        role="membro da comunidade",
        want="receber link de acesso",
        so_that="entro sem senha",
        acceptance=[
            "kind `magic_link` em sent_emails",
            "Link com expiração",
            "Visível no Mailpit em dev",
        ],
        why="Primeiro email transacional end-to-end.",
        where="Fecha EPIC-02 infra; desbloqueia US-0009.",
        arch_refs="- `docs/architecture/email.md`",
        api_db="- Disparado por POST auth",
        security="- Anti-enumeration na API (US-0009)",
        out_scope="Sessão após clique (US-0010).",
    ),
    dict(
        us_id="US-0009",
        title="API solicitar magic link",
        epic="EPIC-03",
        done="POST magic-link retorna 202",
        deps=["US-0008"],
        role="membro da comunidade",
        want="solicitar link por email",
        so_that="acesso sem senha",
        acceptance=[
            "POST `/api/v1/auth/magic-link`",
            "Resposta genérica se email existe ou não",
            "Rate limit por IP",
        ],
        why="Auth é porta de entrada do membro.",
        where="v1-S2 início EPIC-03.",
        arch_refs="- `docs/07_api_contracts.md`\n- `docs/02_security.md`",
        api_db="- _n/a_",
        security="- Rate limit; sem revelar existência de email",
        out_scope="Verificação do token (US-0010).",
    ),
    dict(
        us_id="US-0010",
        title="Verificar magic link e criar sessão",
        epic="EPIC-03",
        done="Link válido cria sessão HTTP-only",
        deps=["US-0009"],
        role="membro da comunidade",
        want="clicar no link e entrar",
        so_that="uso o app autenticado",
        acceptance=[
            "GET verify com token assinado",
            "Cookie HTTP-only secure",
            "Token expirado retorna erro claro",
        ],
        why="Completa loop auth magic link.",
        where="v1-S2; desbloqueia perfil e presença.",
        arch_refs="- `docs/02_security.md` § Authentication",
        api_db="- Sessão persistida ou JWT",
        security="- Cookies secure/httpOnly",
        out_scope="OAuth, MFA.",
    ),
    dict(
        us_id="US-0011",
        title="API perfil membro fuso e idiomas",
        epic="EPIC-04",
        done="PUT perfil persiste timezone e idiomas",
        deps=["US-0010"],
        role="membro da comunidade",
        want="salvar fuso e idiomas",
        so_that="matching respeita minha disponibilidade real",
        acceptance=[
            "GET/PUT `/api/v1/me/profile`",
            "Validação zod",
            "community_id scoped",
        ],
        why="Matching sem perfil é impossível.",
        where="v1-S2 EPIC-04; antes da UI presença.",
        arch_refs="- `docs/06_database.md` — member_profiles",
        api_db="- `member_profiles`, `availability_slots`",
        security="- RBAC membro só próprio perfil",
        out_scope="Preferências avançadas, foto.",
    ),
    dict(
        us_id="US-0012",
        title="UI declaração de presença na rodada",
        epic="EPIC-04",
        done="Membro marca slots e intenção",
        deps=["US-0011"],
        role="membro da comunidade",
        want="declarar presença na rodada aberta",
        so_that="entro no sorteio",
        acceptance=[
            "Seleção de 1+ slots",
            "Intenção: surpresa / fronteira / facilidade",
            "Responsivo mobile sem overflow-x",
        ],
        why="Core do fluxo membro no MVP 0.",
        where="v1-S2; alimenta US-0015.",
        arch_refs="- `docs/09_design_system.md`",
        api_db="- POST presença na rodada",
        security="- Auth obrigatória",
        out_scope="i18n (US-0013) pode paralelizar.",
    ),
    dict(
        us_id="US-0013",
        title="i18n PT EN ES fluxo membro",
        epic="EPIC-04",
        done="UI membro em PT EN ES",
        deps=["US-0012"],
        role="membro da comunidade",
        want="usar o app no meu idioma",
        so_that="entendo convites e formulários",
        acceptance=[
            "Toggle PT/EN/ES",
            "Strings centralizadas",
            "Layout não quebra em mobile",
        ],
        why="Comunidades piloto são multilíngues.",
        where="v1-S2 fecha superfície membro.",
        arch_refs="- `docs/09_design_system.md`",
        api_db="- _n/a_",
        security="- _n/a_",
        out_scope="Emails i18n (US-0022).",
    ),
    dict(
        us_id="US-0014",
        title="Admin criar rodada com slots e pergunta",
        epic="EPIC-05",
        done="Facilitador cria rodada com slots",
        deps=["US-0002"],
        role="facilitador",
        want="abrir rodada com horários e pergunta",
        so_that="membros possam se inscrever",
        acceptance=[
            "POST rodada com 5 slots",
            "Pergunta comum obrigatória",
            "RBAC facilitador",
        ],
        why="Ciclo de encontros começa na rodada.",
        where="v1-S3 início EPIC-05.",
        arch_refs="- `docs/07_api_contracts.md`",
        api_db="- `matching_rounds`",
        security="- RBAC facilitador+",
        out_scope="Sorteio (EPIC-06).",
    ),
    dict(
        us_id="US-0015",
        title="Admin listar membros inscritos na rodada",
        epic="EPIC-05",
        done="Lista inscritos com perfil",
        deps=["US-0014", "US-0012"],
        role="facilitador",
        want="ver quem declarou presença",
        so_that="valido antes do sorteio",
        acceptance=[
            "GET admin inscritos",
            "Mostra slots e intenção",
            "Paginação se >20",
        ],
        why="Sorteio assistido precisa visibilidade.",
        where="v1-S3; input do matching.",
        arch_refs="- `docs/03_user_types.md` — Facilitador",
        api_db="- join members + presence",
        security="- Só facilitador da comunidade",
        out_scope="Export CSV.",
    ),
    dict(
        us_id="US-0016",
        title="Configurar template de encontro da comunidade",
        epic="EPIC-05",
        done="Template 3 pessoas 30 min configurável",
        deps=["US-0014"],
        role="facilitador",
        want="definir regras do ritual da comunidade",
        so_that="rodadas seguem formato acordado",
        acceptance=[
            "CRUD meeting_templates",
            "Tamanho círculo e duração",
            "Primeiro template seedável por comunidade",
        ],
        why="Ember é multi-comunidade — ritual não é hardcoded.",
        where="v1-S3; usado pelo matching.",
        arch_refs="- `docs/00_scope.md`",
        api_db="- `meeting_templates`",
        security="- RBAC facilitador",
        out_scope="Múltiplos rituais por comunidade na v1.",
    ),
    dict(
        us_id="US-0017",
        title="MatchingEngine constraints horario e idioma",
        epic="EPIC-06",
        done="Engine exige horário e idioma comum",
        deps=["US-0015", "US-0016"],
        role="facilitador",
        want="motor que respeita constraints duras",
        so_that="trios propostos são viáveis",
        acceptance=[
            "Testes unitários constraints",
            "Rejeita trio sem overlap de slot",
            "Rejeita sem idioma comum",
        ],
        why="Constraints erradas geram rodas impossíveis.",
        where="v1-S3 EPIC-06; packages/domain puro.",
        arch_refs="- `docs/discovery/orientacao-produto.md`",
        api_db="- _n/a_ — domain puro",
        security="- _n/a_",
        out_scope="Scoring (US-0018).",
    ),
    dict(
        us_id="US-0018",
        title="MatchingEngine scoring memoria e pontes",
        epic="EPIC-06",
        done="Score prioriza novos encontros e pontes",
        deps=["US-0017"],
        role="facilitador",
        want="sorteio com memória",
        so_that="a rede ganha novos fios",
        acceptance=[
            "Testes com histórico mock",
            "Prioriza pares sem encontro prévio",
            "Pontua geração/geografia diferente",
        ],
        why="Sem memória, mesmos pares se repetem.",
        where="v1-S3; antes da UI publicar.",
        arch_refs="- `docs/discovery/orientacao-produto.md`",
        api_db="- Lê `meeting_participations` quando existir",
        security="- _n/a_",
        out_scope="Solver ótimo global.",
    ),
    dict(
        us_id="US-0019",
        title="UI sorteio assistido e publicar círculos",
        epic="EPIC-06",
        done="Facilitador revisa e publica trios",
        deps=["US-0018"],
        role="facilitador",
        want="revisar sorteio antes de enviar",
        so_that="controlo exceções no piloto",
        acceptance=[
            "Botão disparar sorteio",
            "Preview trios editável",
            "Publicar muda estado para invited",
        ],
        why="MVP 0 é sorteio assistido, não automático.",
        where="v1-S3; desbloqueia EPIC-07.",
        arch_refs="- `docs/05_architecture.md` — Flow 2",
        api_db="- `circles`, `circle_members`",
        security="- RBAC facilitador",
        out_scope="Emails (US-0022).",
    ),
    dict(
        us_id="US-0020",
        title="Gerar sala Jitsi por círculo",
        epic="EPIC-07",
        done="URL Jitsi única por círculo",
        deps=["US-0019"],
        role="membro da comunidade",
        want="link de vídeo sem criar conta",
        so_that="entro na roda com um clique",
        acceptance=[
            "URL gerada na publicação",
            "Persistida no círculo",
            "meet.jit.si ou self-hosted configurável",
        ],
        why="Critério operacional: ninguém pergunta o link.",
        where="v1-S4 EPIC-07.",
        arch_refs="- `docs/01_tech_stack.md`",
        api_db="- campo jitsi_url em meetings",
        security="- URL não adivinhável",
        out_scope="Vídeo embutido no app.",
    ),
    dict(
        us_id="US-0021",
        title="Gerar arquivo ics para círculo",
        epic="EPIC-07",
        done="ics válido anexado ou linkado",
        deps=["US-0020"],
        role="membro da comunidade",
        want="adicionar ao calendário",
        so_that="não perco o horário no meu fuso",
        acceptance=[
            "Horário no fuso do membro",
            "Duração 30 min",
            "Anexo ou download no email",
        ],
        why="Calendário reduz no-show.",
        where="v1-S4; usado em US-0022.",
        arch_refs="- `docs/architecture/email.md`",
        api_db="- _n/a_",
        security="- Sem expor agenda inteira",
        out_scope="Sync bidirecional Google Calendar.",
    ),
    dict(
        us_id="US-0022",
        title="Emails round_open e circle_formed",
        epic="EPIC-07",
        done="Emails enviados e em sent_emails",
        deps=["US-0008", "US-0020", "US-0021"],
        role="membro da comunidade",
        want="receber convites por email",
        so_that="sei quando declarar presença e quando a roda formou",
        acceptance=[
            "kind `round_open` e `circle_formed`",
            "Jitsi + ics no circle_formed",
            "meta_json com round_id e circle_id",
        ],
        why="Email é canal principal do MVP 0.",
        where="v1-S4; integra EPIC-02 e EPIC-07.",
        arch_refs="- `docs/architecture/email.md`",
        api_db="- `sent_emails`",
        security="- delivery context em todo envio",
        out_scope="Lembretes MVP 1.",
    ),
    dict(
        us_id="US-0023",
        title="Página convite roda para membro",
        epic="EPIC-07",
        done="Página mostra trio horário pergunta links",
        deps=["US-0022"],
        role="membro da comunidade",
        want="ver detalhes da minha roda",
        so_that="confirmo presença e entro no Jitsi",
        acceptance=[
            "Lista os 3 participantes (nome, comunidade)",
            "Horário no fuso local",
            "Botões entrar e calendário",
        ],
        why="Backup ao email; experiência web completa.",
        where="v1-S4; antes do pós-encontro.",
        arch_refs="- `docs/09_design_system.md` — CircleInviteCard",
        api_db="- GET circles do membro",
        security="- Só membros do círculo",
        out_scope="Chat entre membros.",
    ),
    dict(
        us_id="US-0024",
        title="Fluxo a roda aconteceu",
        epic="EPIC-08",
        done="Membro responde após horário do círculo",
        deps=["US-0023"],
        role="membro da comunidade",
        want="confirmar se a roda aconteceu",
        so_that="a rede registra encontros reais",
        acceptance=[
            "Prompt após slot + buffer",
            "Sim/não por membro",
            "UI mínima, sem gamificação",
        ],
        why="Fecha loop qualitativo do piloto.",
        where="v1-S4 EPIC-08.",
        arch_refs="- `docs/discovery/roadmap.md`",
        api_db="- POST participação",
        security="- Só participantes do círculo",
        out_scope="No-show automático.",
    ),
    dict(
        us_id="US-0025",
        title="Persistir meeting_participations",
        epic="EPIC-08",
        done="Histórico usado no scoring US-0018",
        deps=["US-0024"],
        role="facilitador",
        want="memória de quem se encontrou",
        so_that="próxima rodada evita repetição",
        acceptance=[
            "Tabela meeting_participations",
            "US-0018 lê histórico em teste",
            "Par não se repete na rodada seguinte (teste)",
        ],
        why="Sem persistência, memória do matching é vazia.",
        where="Última US do MVP 0; fecha v1.",
        arch_refs="- `docs/06_database.md`",
        api_db="- `meeting_participations`",
        security="- Dados privados, não públicos",
        out_scope="Grafo visual MVP 3.",
    ),
]


def main() -> None:
    for s in STORIES:
        body = us_body(**s)
        subprocess.run(
            [*MD, "update-us", s["us_id"]],
            input=body,
            text=True,
            check=True,
            cwd=ROOT,
        )
        print(f"Updated {s['us_id']}")


if __name__ == "__main__":
    main()
