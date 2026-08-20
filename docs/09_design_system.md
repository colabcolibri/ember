---
title: Design System
status: review
version: 2.0
updated: 2026-08-20
depends_on: [01_tech_stack.md, 04_principles.md, 05_architecture.md]
blocks: []
---

# 09 — Design system

## Overview

Ember deve transmitir **calor e intenção** — não frieza de SaaS corporativo. A referência editorial está no mockup de pitch (`mockup/fogo-de-conselho-apresentacao.html`); o app de produto traduz essa linguagem para fluxos utilitários (login, presença, convite, facilitador).

| Attribute | Value |
| --------- | ----- |
| **Surfaces** | Web app responsiva (`apps/web/`) — membro + facilitador |
| **Primary UI stack** | `ts-shadcn` — ver `stacks/ts-shadcn.md` |
| **Mood** | Editorial, sóbrio, muito espaço em branco — ver `04_principles.md` |
| **Densidade** | Espaçosa; poucos elementos por tela; sem feed social |
| **Theme file** | `apps/web/src/styles/globals.css` (migrar de `styles.css`) |
| **Tailwind** | Tailwind CSS 4.x + `@tailwindcss/vite` |
| **Primitives (read-only)** | `apps/web/src/components/ui/*` — `npx shadcn@latest add` |
| **Composed templates** | `apps/web/src/components/app/*` |
| **Showcase routes** | `apps/web/src/pages/design/*` |

### Estado atual vs alvo

| Aspecto | Hoje (wireframe) | Alvo |
| ------- | ---------------- | ---- |
| Stack | CSS manual em `styles.css` | shadcn + tokens semânticos |
| Shell | Header + nav de links crus | `AppShell` com nav pill (mockup) |
| Tipografia | Parcial (Georgia h1) | Escala completa do mockup |
| Componentes | HTML nativo | Templates `App*` compostos |
| Telas | Funcionais, sem hierarquia visual | Layout por padrão (form, list, detail) |

---

## Brand direction

### Metáfora visual

- **Roda / círculos concêntricos** — sem fogo literal
- Orbitas sutis como decoração de fundo (hero, empty states)
- Números serifados grandes para etapas do ritual (1, 2, 3)

### Tom de voz (UI)

- Frases curtas, calor humano, sem jargão de networking
- Eyebrow em uppercase para contexto ("sua rodada", "convite")
- Títulos serifados para momentos de pausa; corpo Inter para ação

### Logo mark

Círculo com dois pontos laterais (`.mark` no mockup):

```
  ●——( )——●
```

- Tamanho nav: 22×22px
- Uso: sempre ao lado da palavra **Ember** em `AppBrand`
- Não distorcer, não recolorir pontos fora de `--rust` / `--sage`

### Imagery

- Sem fotos de stock na v1
- Ilustração = tipografia + orbitas + cards
- Comunidade piloto pode ter nome subtítulo; produto permanece **Ember**

---

## Colors

Paleta canônica (mockup). **Nunca hardcodar hex em feature code** — usar tokens CSS ou classes Tailwind mapeadas.

### Product tokens (source of truth)

| Token CSS | Hex | Uso semântico |
| --------- | --- | ------------- |
| `--bg` | `#f4efe7` | fundo da página |
| `--paper` | `#fbf8f3` | cards, superfícies elevadas |
| `--ink` | `#20211f` | texto principal, CTA escuro |
| `--muted` | `#68645d` | texto secundário |
| `--rust` | `#aa4f36` | accent primário, eyebrow, números |
| `--rust2` | `#c67155` | accent suave em títulos |
| `--sage` | `#4f6956` | sucesso, confirmação, pontes |
| `--sand` | `#d8cab6` | neutro quente, chips inativos |
| `--dark` | `#1c1f1c` | seções statement (raro no app) |
| `--line` | `rgba(32,33,31,.14)` | bordas e divisores |
| `--destructive` | `#9b2226` | erros destrutivos |
| `--success` | `#2d6a4f` | feedback positivo |

### shadcn semantic map (HSL em `globals.css`)

| shadcn key | Product token | Notas |
| ---------- | ------------- | ----- |
| `background` | `--bg` | |
| `foreground` | `--ink` | |
| `card` | `--paper` | |
| `primary` | `--rust` | botões primários |
| `primary-foreground` | `--paper` | texto em botão rust |
| `secondary` | `--sand` | chips, secondary actions |
| `muted` / `muted-foreground` | `--paper` / `--muted` | |
| `accent` | `--rust2` | hover suave |
| `destructive` | `--destructive` | |
| `border` | `--line` | |
| `ring` | `--rust` | focus ring |
| `success` | `--sage` | custom — estender theme |

**Dark mode:** fora do escopo v1 (light-only). Não implementar toggle.

---

## Typography

| Level | Size | Font | Weight | Uso |
| ----- | ---- | ---- | ------ | --- |
| pill / eyebrow | 11px | Inter | 850 | labels de seção, uppercase, letter-spacing `.12em` |
| micro | 12–13px | Inter | 600–800 | metadados, lang switcher |
| body | 16–17px | Inter | 400 | copy padrão, line-height 1.55 |
| body-lg | 18–19px | Inter | 400 | parágrafos de destaque |
| lead | 21–28px | Inter | 400 | subtítulos de página |
| card title | 20px | Inter | 700 | títulos de card |
| page title | clamp(28px, 5vw, 40px) | Georgia | 500 | h1 de fluxo (menor que marketing hero) |
| hero (marketing only) | clamp(64–158px) | Georgia | 500 | não usar em telas de app |
| mono code | 32px | Inter | 700 | OTP login — letter-spacing `.35em` |

**Font loading:** Inter + Georgia via Google Fonts ou self-host em `index.html`.

---

## Layout

### Spacing scale

Tailwind default (4px base). Preferir `gap-4`, `gap-6`, `p-6`, `py-8` em cards.

### Containers

| Contexto | Max width | Padding horizontal |
| -------- | --------- | ------------------ |
| Fluxos de membro (login, presença, convite) | `max-w-lg` (512px) | `px-5` mobile, `px-6` desktop |
| Facilitador / admin | `max-w-4xl` (896px) | `px-5` / `px-8` |
| Design showcase | `max-w-5xl` | `px-6` |

### App shell (`AppShell`)

Substitui o layout atual em `App.tsx`.

```
┌─────────────────────────────────────────────┐
│  [mark] Ember          PT | EN   (pill nav) │
├─────────────────────────────────────────────┤
│  eyebrow (opcional)                         │
│  Page title (Georgia)                       │
│  lead / subtitle (muted)                    │
├─────────────────────────────────────────────┤
│  {children} — card ou stack de cards        │
└─────────────────────────────────────────────┘
```

- **Nav membro:** Presença · Minhas rodas · Perfil · Sair (ocultar links de facilitador)
- **Nav facilitador:** + Facilitador (badge sage)
- **Login:** shell minimal — sem nav principal, só brand + lang
- Nav fixa estilo mockup: pill com blur (`backdrop-filter`), `border-radius: 999px`

### Grid patterns

| Pattern | Uso |
| ------- | --- |
| Single column | Default mobile + membro |
| 2-col admin | Tabela de inscritos + painel de sorteio |
| Chip row | Slots, idiomas, intenções |

---

## Elevation and depth

- Cards: `border` 1px `--line`, `rounded-(--radius-card)` (token `--radius-card: 28px` em `globals.css`)
- Sombras: mínimas — `shadow-sm` só na nav pill e dialogs
- Fundo: `--bg` sólido; sem gradientes chamativos

---

## Shapes

| Element | Radius |
| ------- | ------ |
| Nav pill, chips, lang buttons | `rounded-full` |
| Cards, fieldsets | `rounded-(--radius-card)` (`--radius-card: 28px`) |
| Inputs, buttons | `rounded-lg` (12px) |
| Dialog | `rounded-(--radius-card)` |

---

## Tailwind CSS 4 — convenções de classe

O app usa **Tailwind CSS 4.x** (`@tailwindcss/vite`). O IntelliSense sugere classes **canônicas** (`suggestCanonicalClasses`); preferir sempre a forma curta quando existir equivalente.

### Regras gerais

| Situação | Evitar | Preferir |
| -------- | ------ | -------- |
| CSS variable como valor | `rounded-[var(--radius-card)]` | `rounded-(--radius-card)` |
| Tamanho com token da escala | `max-w-[14rem]`, `min-h-[5.5rem]`, `h-[4.5rem]` | `max-w-56`, `min-h-22`, `h-18` |
| Gradiente (v4) | `bg-gradient-to-r` | `bg-linear-to-r` |
| Z-index baixo | `z-[1]` | `z-1` |
| Tracking padrão | `tracking-[-0.025em]` | `tracking-tight` |
| Seletor descendente (cmdk/shadcn) | `[&_[cmdk-group-heading]]:px-2` | `**:[[cmdk-group-heading]]:px-2` |

### Tokens de produto

Variáveis definidas em `apps/web/src/styles/globals.css` — usar parênteses, não `var()` dentro de colchetes:

```tsx
// correto
className="rounded-(--radius-card) border-outline-variant/30"

// evitar (legado v3 / arbitrário redundante)
className="rounded-[var(--radius-card)]"
```

### Quando manter valor arbitrário

Valores **fora da escala** Tailwind (ex.: `rounded-[1.15rem]`, `text-[clamp(...)]`) permanecem em `[...]` — só migrar quando o IntelliSense indicar equivalente exato na escala (ex.: `rounded-[2rem]` → `rounded-4xl`).

### Onde não documentar

Erros de tipo `vite/client` no IDE → `docs/08_environments.md` (setup `pnpm install` + `src/vite-env.d.ts`), não neste doc.

---

## Motion and interaction

| Interaction | Behavior |
| ----------- | -------- |
| Button hover | `opacity-90` ou `bg-primary/90` — sem scale |
| Focus | `ring-2 ring-primary ring-offset-2` |
| Page transition | none na v1 |
| Loading | `AppButton` com spinner inline; skeleton só em listas |
| Chip/slot toggle | border rust + bg `rgba(170,79,54,.06)` quando selected |

---

## Screen inventory

Mapa de todas as telas do MVP — cada uma usa `AppShell` + templates compostos.

| Route | Página | Padrão | Componentes principais |
| ----- | ------ | ------ | ---------------------- |
| `/login` | Login | form-centered | `AppCard`, `AppFormField`, `AppButton`, OTP step |
| `/presence` | Presença | form | `AvailabilityPicker`, `IntentionPicker`, `AppEmptyState` |
| `/circles` | Minhas rodas | list | `CircleListRow`, `AppEmptyState` |
| `/circles/:id` | Convite / detalhe | detail + actions | `CircleInviteCard`, `AppButton`, `AttendancePrompt` |
| `/profile` | Perfil | form | `AppFormField`, `LanguageChipPicker` |
| `/facilitator` | Facilitador | admin split | `AppPageHeader`, `DeclarationTable`, `TrioPreview`, `AppDialog` |
| `/design` | Showcase index | catalog | `AppShell` (dev only) |
| `/design/tokens` | Token gallery | catalog | swatches |
| `/design/components` | Component gallery | catalog | todos `App*` |
| `/design/patterns` | Layout patterns | catalog | form, list, detail, empty |

### Per-screen notes

#### Login (`/login`)

- Passo 1: email + CTA "Enviar código"
- Passo 2: input OTP 6 dígitos centralizado, fonte mono grande
- Mensagens genéricas anti-enumeração em `AppAlert` variant success
- Sem link mágico — só código

#### Presença (`/presence`)

- `AppPageHeader` com eyebrow "rodada aberta"
- `AvailabilityPicker`: chips de slot, multi-select
- `IntentionPicker`: 3 radio cards com título + descrição curta
- Empty: `AppEmptyState` quando não há rodada

#### Minhas rodas (`/circles`)

- Lista de `CircleListRow`: comunidade, pergunta, data, status badge
- Empty: ilustração orbital + copy acolhedora

#### Convite (`/circles/:id`)

- `CircleInviteCard` hero: pergunta da rodada, quando, participantes (iniciais apenas — sem avatar foto)
- Actions: Jitsi (primary), .ics (secondary), confirmar (sage)
- `AttendancePrompt` pós-encontro: sim/não em `AppDialog` ou inline card

#### Perfil (`/profile`)

- Timezone + idiomas em chips
- Form compacto, uma coluna

#### Facilitador (`/facilitator`)

- Seções empilhadas com `AppPageHeader`
- Criar rodada → ver inscritos → preview sorteio → publicar
- `DeclarationTable`: email mascarado, slots, intenção
- `TrioPreview`: cards de trio com score
- Confirmações destrutivas em `AppDialog` variant destructive

---

## Components

### Composition rules

- Config-driven props: `title`, `description`, `body`, `footer`, `variant`, `size`
- Primitivos shadcn **nunca editados** — só `npx shadcn@latest add`
- Feature pages importam apenas de `components/app/*`

### Inventory (composed)

| Template | Purpose | Variants / states | Showcase |
| -------- | ------- | ----------------- | -------- |
| `AppShell` | Layout global, nav, brand | member, facilitator, auth | `/design/patterns#shell` |
| `AppBrand` | Logo mark + wordmark | default | `/design/components#brand` |
| `AppPageHeader` | eyebrow + title + lead + actions slot | default | `/design/components#page-header` |
| `AppCard` | Superfície paper | default, interactive | `/design/components#card` |
| `AppButton` | CTA | primary, secondary, ghost, destructive; loading, disabled | `/design/components#button` |
| `AppFormField` | label + control + error | default, error, disabled | `/design/components#form-field` |
| `AppInput` | text, email, otp | default, error, otp | `/design/components#input` |
| `AppAlert` | feedback inline | success, error, info | `/design/components#alert` |
| `AppDialog` | modais confirmar/recusar | default, destructive | `/design/components#dialog` |
| `AppBadge` | status (invited, confirmed) | default, sage, rust | `/design/components#badge` |
| `AppEmptyState` | listas vazias | with/without action | `/design/components#empty` |
| `AvailabilityPicker` | slots semanais | selected, disabled | `/design/components#availability` |
| `IntentionPicker` | 3 intenções | surprise, frontier, ease | `/design/components#intention` |
| `LanguageChipPicker` | idiomas perfil | multi-select | `/design/components#languages` |
| `CircleListRow` | item lista de rodas | default | `/design/patterns#list` |
| `CircleInviteCard` | convite Fogo de Conselho | invited, confirmed | `/design/components#invite` |
| `AttendancePrompt` | pós-encontro | yes/no | `/design/components#attendance` |
| `DeclarationTable` | inscritos facilitador | default, loading | `/design/patterns#admin-table` |
| `TrioPreview` | preview sorteio | default | `/design/components#trio` |

### Primitives to install (shadcn)

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input label badge separator alert checkbox radio-group table tabs
```

Record aliases in `components.json`: `@/components`, `@/lib/utils`.

---

## Do's and don'ts

- Do usar tokens semânticos e templates `App*`
- Do citar este doc em US de UI (`Plan Architecture refs → 09 § Screen inventory`)
- Do manter mobile-first e touch targets 44px
- Don't editar primitivos shadcn diretamente
- Don't hardcodar hex em feature code
- Don't parecer feed social (sem avatares grandes, likes, contadores)
- Don't usar hero marketing 158px em telas de app
- Don't expor nav de facilitador para membros comuns

---

## Responsive behavior

| Breakpoint | Width | Notes |
| ---------- | ----- | ----- |
| mobile | < 640px | single column; botões full-width em CTAs principais |
| tablet | 640–1024px | igual mobile para fluxos de membro |
| desktop | > 1024px | facilitador 2-col; nav pill centralizada max-w-5xl |

Sem overflow horizontal — `overflow-x-hidden` no shell; inputs `min-w-0`.

---

## Accessibility baseline

- Focus visible em todos interativos (`ring` rust)
- Contraste WCAG AA — rust on paper, ink on bg
- Touch targets mínimo 44×44px
- Labels visíveis; erros ligados via `aria-describedby`
- OTP: `inputMode="numeric"`, `autoComplete="one-time-code"`
- Tabelas facilitador: headers semânticos `<th scope>`

---

## Showcase catalog

| Route | Contents | US slice | Status |
| ----- | -------- | -------- | ------ |
| `/design` | Index + nav + stack id | US-0027 (DS-S2) | done |
| `/design/tokens` | Cores, tipografia, spacing | US-0028 (DS-S3) | done |
| `/design/components` | Todos `App*` + estados | US-0029 (DS-S4) | done |
| `/design/patterns` | Shell, form, list, detail, empty | US-0030 (DS-S5) | done |

### Implementation slices (via `/implement-us`)

| US | Título | Entrega |
| -- | ------ | ------- |
| US-0026 (DS-S1) | Wire theme tokens + shadcn bootstrap | `globals.css`, Tailwind, primitives instalados |
| US-0027 (DS-S2) | Design catalog shell | `/design` index + nav |
| US-0028 (DS-S3) | Token gallery | `/design/tokens` |
| US-0029 (DS-S4) | Component gallery | `/design/components` — todos templates |
| US-0030 (DS-S5) | Layout patterns + screen reskin | `/design/patterns` + aplicar `AppShell` nas 6 telas |
| US-0031 (DS-S6) | Facilitador admin polish | `DeclarationTable`, `TrioPreview`, 2-col layout |

**Dependências:** DS-S1 → DS-S2 → DS-S3/DS-S4 (paralelo) → DS-S5 → DS-S6.

---

## Gate

Human sets `status: approved` after reviewing v2.0 screen map and showcase plan.

Must UI US (`ready: true`) must cite `09_design_system.md` sections in Plan Architecture refs before `/implement-us`.
