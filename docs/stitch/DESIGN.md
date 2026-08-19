---
name: Ember
colors:
  background: '#f4efe7'
  paper: '#fbf8f3'
  ink: '#20211f'
  muted: '#68645d'
  rust: '#aa4f36'
  rust-soft: '#c67155'
  sage: '#4f6956'
  sand: '#d8cab6'
  dark: '#1c1f1c'
  line: 'rgba(32,33,31,0.14)'
  on-background: '#20211f'
  on-paper: '#20211f'
  primary: '#aa4f36'
  on-primary: '#fbf8f3'
  surface: '#f4efe7'
  surface-container: '#fbf8f3'
  outline: 'rgba(32,33,31,0.14)'
typography:
  eyebrow:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '850'
    letterSpacing: 0.12em
    textTransform: uppercase
  display:
    fontFamily: Georgia
    fontSize: clamp(40px, 6vw, 64px)
    fontWeight: '500'
    lineHeight: '1.05'
    letterSpacing: -0.04em
  page-title:
    fontFamily: Georgia
    fontSize: clamp(28px, 5vw, 40px)
    fontWeight: '500'
    lineHeight: '1.15'
  body:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.55'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '700'
rounded:
  pill: 9999px
  card: 28px
  input: 12px
  button: 9999px
spacing:
  base: 4px
  page-x: 20px
  section: 48px
  card: 30px
---

## Brand & style

Ember is a warm, editorial web app for intentional small-group meetings in closed communities — not a social network. The aesthetic is **calm ritual**: cream paper backgrounds, rust accents, Georgia serif headlines, Inter body text, generous whitespace, subtle orbital circle motifs (concentric rings with two dots — the "wheel" logo). No stock photos, no avatars, no likes. Feels like a premium print annual report turned into a focused utility app.

## Colors

- **Background** `#f4efe7` warm cream canvas
- **Paper** `#fbf8f3` elevated cards
- **Ink** `#20211f` primary text and dark CTAs
- **Rust** `#aa4f36` brand accent — eyebrows, active chips, primary buttons
- **Sage** `#4f6956` success / confirmed states
- **Sand** `#d8cab6` secondary chips
- Borders: 1px `rgba(32,33,31,0.14)` — never heavy shadows

## Typography

- **Georgia** for page titles and ritual moments
- **Inter** for UI, forms, metadata
- Eyebrow pills: 11px uppercase rust, pill border `rgba(170,79,54,0.22)`, background `rgba(170,79,54,0.055)`

## Layout

- Fixed floating **nav pill** at top: blur backdrop, soft shadow `0 10px 38px rgba(35,28,22,0.06)`, brand mark + links + PT/EN
- Mobile-first single column, max-width 480px for member flows, 960px for facilitator
- Decorative **orbit circles** partially off-canvas on hero/empty states (1px line, rust/sage dots)
- No sidebar; horizontal nav only

## Components

- **Primary CTA:** pill button ink background `#20211f` white text, or rust for secondary emphasis
- **Cards:** paper background, 28px radius, 30px padding, subtle border
- **Slot chips:** pill toggles — selected = rust border + rust tint bg
- **Intention picker:** 3 stacked radio cards with title + description
- **OTP input:** large centered 6-digit mono tracking
- **Circle invite:** hero card with serif question, metadata row, Jitsi + calendar actions
- **Empty state:** dashed border card with orbital decoration

## Screens to design

1. Login (email step + OTP step)
2. Declare presence (slot chips + intention cards)
3. My circles list
4. Circle invite detail
5. Profile (timezone + languages)
6. Facilitator dashboard (2-column on desktop)
