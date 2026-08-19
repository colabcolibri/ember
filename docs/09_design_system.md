---
title: Design System
status: approved
version: 1.0
updated: 2026-08-19
depends_on: [01_tech_stack.md, 05_architecture.md]
blocks: []
---

# 09 — Design system

> **Deepen:** `/design-pass bootstrap` após `01` rascunhado.

Ember deve transmitir calor e intenção — não frieza de SaaS corporativo. UI minimalista, focada em ações pontuais (preencher disponibilidade, confirmar encontro). Responsiva mobile-first.

## Stack

| Attribute | Value |
| --------- | ----- |
| **UI stack id** | `ts-shadcn` |
| **CSS** | Tailwind CSS 4.x `(candidate)` |
| **Primitives** | shadcn/ui — `components/ui/` (read-only) |
| **Icons** | Lucide React |
| **Font** | Georgia / serif (display) + Inter (corpo) — ver `mockup/fogo-de-conselho-apresentacao.html` |

## Brand direction

- **Metáfora:** roda / círculos concêntricos — sem fogo literal
- **Tom:** editorial, sóbrio, muito espaço em branco — menos "app de startup"
- **Densidade:** espaçosa; poucos elementos por tela

## Color tokens (semantic)

Paleta canônica extraída do mockup de apresentação (`mockup/fogo-de-conselho-apresentacao.html`):

| Token CSS | Hex | Uso semântico |
| --------- | --- | ------------- |
| `--bg` | `#f4efe7` | fundo da página |
| `--paper` | `#fbf8f3` | cards, superfícies elevadas |
| `--ink` | `#20211f` | texto principal, CTAs escuros |
| `--muted` | `#68645d` | texto secundário |
| `--rust` | `#aa4f36` | accent primário, eyebrow, números do ritual |
| `--rust2` | `#c67155` | accent suave, destaques em títulos |
| `--sage` | `#4f6956` | accent secundário (pontes na rede) |
| `--sand` | `#d8cab6` | neutro quente, grafos |
| `--dark` | `#1c1f1c` | seções statement / final |
| `--line` | `rgba(32,33,31,.14)` | bordas e divisores |

Mapeamento shadcn sugerido: `background` → `--bg`, `foreground` → `--ink`, `primary` → `--rust`, `muted-foreground` → `--muted`, `card` → `--paper`.

## Typography

Escala do mockup (mobile reduz proporcionalmente):

| Level | Size | Font | Uso |
| ----- | ---- | ---- | --- |
| pill / eyebrow | 11px | Inter 850 | labels de seção, uppercase |
| micro | 12–13px | Inter | metadados, nav idioma |
| body | 16–17px | Inter | copy padrão |
| body-lg | 18–19px | Inter | parágrafos de destaque |
| lead | 21–28px | Inter | subtítulos hero |
| card title | 20px | Inter 700 | títulos de card |
| section | clamp(40–90px) | Georgia 500 | títulos de seção |
| hero | clamp(64–158px) | Georgia 500 | headline principal |
| quote | clamp(34–72px) | Georgia 500 | citações |

**Logo mark:** círculo com dois pontos laterais (roda) — ver `.mark` no mockup.

## Layout

- **Spacing scale:** Tailwind default (4px base)
- **Container max-width:** `max-w-lg` em fluxos de membro; `max-w-4xl` em admin
- **Grid:** single column mobile; 2-col apenas em admin tables

## Elevation and depth

Cards com `border` sutil; sombras mínimas. Foco em conteúdo, não chrome.

## Shapes

- **Border radius:** `rounded-lg` para cards; `rounded-md` para buttons

## Components

- **Primitives (read-only):** `apps/web/src/components/ui/`
- **Composed templates:** `apps/web/src/components/app/`
- **Composition:** `AppCard`, `AppDialog`, `AvailabilityPicker`, `CircleInviteCard`

### Inventory (composed)

| Template | Purpose | Showcase route |
| -------- | ------- | -------------- |
| AppDialog | Fluxos modais (confirmar/recusar) | `/design/components#dialog` |
| AvailabilityPicker | Seleção de janelas semanais | `/design/components#availability` |
| CircleInviteCard | Convite Fogo de Conselho | `/design/components#invite` |

## Do's and don'ts

- Do usar tokens semânticos e templates `App*`
- Do citar este doc em US de UI
- Don't editar primitivos shadcn diretamente
- Don't hardcodar hex em feature code
- Don't parecer feed social (sem avatares grandes, likes, contadores)

## Responsive behavior

| Breakpoint | Width | Notes |
| ---------- | ----- | ----- |
| mobile | < 640px | layout single column; botões full-width |
| tablet | 640–1024px | mesmo que mobile para fluxos de membro |
| desktop | > 1024px | admin com sidebar opcional |

Sem overflow horizontal — conteúdo sempre contido no parent.

## Accessibility baseline

- Focus visible em elementos interativos
- Contraste WCAG AA mínimo
- Touch targets 44×44px no mobile
- Labels visíveis em forms de disponibilidade

## Showcase catalog

| Route | Contents | Status |
| ----- | -------- | ------ |
| `/design` | Overview + nav | planned |
| `/design/tokens` | Cores, tipografia | planned |
| `/design/components` | Templates compostos | planned |

## Gate

Human sets `status: approved` before Must US with visual Acceptance ship.
