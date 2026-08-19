# Ember

**Small gatherings, with intention.**

Ember is infrastructure for **closed communities** to form small, intentional gatherings between members. It is not a social network, not a public calendar, and not a networking platform. Members declare when they are available, which languages they speak, and what kind of encounter they want. The system matches across timezones into small circles—typically trios—prioritizing new connections and bridges in the community's relational fabric. Facilitators open rounds, review matching, and publish circles. Ember stays in the background so the gathering itself can be the focus.

The first pilot runs with a specific community (GSA) using a ritual called *Fogo de Conselho*; Ember is designed for any intentional community, with configurable rituals, copy, and identity per community.

---

## Who it's for

| Audience | What they need |
| -------- | -------------- |
| **Members** | Declare presence for a round, receive circle invitations, join gatherings |
| **Facilitators** | Open rounds, review assisted matching, publish circles, oversee gatherings |
| **Community admins** | Manage members and community configuration |

---

## How it works

### Member flow

1. **Sign in** via magic link—no passwords to manage.
2. **Declare presence** for an open round: availability slots, languages, and intention (*surprise me*, *cross a frontier*, or *ease*).
3. **Receive an invitation** when a compatible circle is published.
4. **Join the gathering** via Jitsi link and calendar attachment (`.ics`) in email.

### Facilitator flow

1. **Open a round** and invite members to declare presence.
2. **Review assisted matching**—the system suggests circles using availability, language, history, and connection novelty; the facilitator approves before publishing.
3. **Publish circles**—members get transactional emails with meeting details.
4. **Track gatherings** from the facilitator panel and gathering list.

After gatherings, members can confirm whether the circle happened—memory that improves future matching.

---

## MVP features

- Magic-link authentication
- Presence declaration (availability, languages, intention)
- Assisted matching with memory across rounds
- Jitsi meeting links and `.ics` calendar attachments in email
- Facilitator panel (rounds, matching review, publish)
- Gatherings list for facilitators

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Web | React 19, Vite, Tailwind CSS, shadcn/ui |
| API | Node.js, Hono |
| Data | SQLite (MVP), timestamped SQL migrations |
| Email | Transactional templates; SMTP (dev) / Resend (prod) |
| Video | Jitsi Meet |
| Monorepo | pnpm workspaces, TypeScript |

---

## Getting started

### Prerequisites

- **Node.js** 20 or later
- **pnpm** 9

### Full stack (local development)

```bash
git clone <repository-url>
cd ember
pnpm install
cp .env.example .env   # adjust values as needed
pnpm db:migrate
pnpm dev
```

| Service | URL |
| ------- | --- |
| Web | http://localhost:2000 |
| API | http://localhost:2001 |

The web app proxies `/api` to the API during development.

### Mock demo (no backend)

Run a pre-filled frontend demo without database or API:

```bash
pnpm install
pnpm dev:mock
```

Open http://localhost:2000 and explore member presence, facilitator flows, and gatherings with seeded demo data.

A static mock build is deployed to **GitHub Pages** on pushes to `main` via `.github/workflows/github-pages.yml`—useful for sharing the UI without running the full stack.

### Other commands

```bash
pnpm build          # build all packages
pnpm build:mock     # build web mock for static hosting
pnpm test           # run tests across the monorepo
```

---

## Project structure

```
ember/
├── apps/
│   ├── web/          # React SPA — member UI, facilitator panel
│   └── api/          # Hono API — auth, rounds, matching, circles
├── packages/
│   ├── config/       # Shared env, ports, and build config
│   ├── db/           # SQLite schema, migrations, repositories
│   ├── domain/       # Shared domain types and logic
│   └── email/        # Email templates and delivery
├── docs/             # Product and architecture documentation
└── .github/workflows/  # CI and GitHub Pages deploy
```

---

## License

This repository is **private**. All rights reserved.
