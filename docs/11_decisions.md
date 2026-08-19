---
title: Decision Log
status: approved
version: 1.0
updated: 2026-08-19
depends_on: []
blocks: []
---

# 11 — Decision log

Decisions live in **SQLite**: `.meridian/meridian.db` → table `decisions`.

`docs/11_decisions.md` is the human index (this file). The canonical store is the database, not JSON files under `docs/decisions/`.

## Entry shape

Each row stores `decision_date`, `entry_index` (0 = newest that day), and `payload_json`:

```json
{
  "time": "HH:MM",
  "title": "Objective title",
  "affected_document": "path/to/doc.md",
  "what_changed": "factual description",
  "why_changed": "context and motivation",
  "impact": "affected docs; mark review",
  "responsible": "role or person"
}
```

- `time` = real clock when logged (`date +"%H:%M"`). Do not round or invent.
- New entries are **prepended** (`entry_index` 0) for the calendar day.
- Never edit or delete old rows.

## Write

```bash
date +"%Y-%m-%d"
date +"%H:%M"
python3 .agent/scripts/meridian_delivery.py prepend-decision \
  --date "YYYY-MM-DD" \
  --time "HH:MM" \
  --title "…" \
  --affected-document "docs/…" \
  --what-changed "…" \
  --why-changed "…" \
  --impact "…" \
  --responsible "manager"
```

Workflow: `/update-decisions-log` + skill `update-decisions-log`.

## When to log

| Event | Log? |
| ----- | ---- |
| Project started (init) | yes — first entry |
| Phase doc `approved` → `review` after edit | yes |
| Security / architecture material change | yes |
| US scope change after refine | yes |
| Typo fix | no |

## Recent decisions (index)

| Date | Title | Affected |
| ---- | ----- | -------- |
| 2026-08-19 | Phase docs aprovados pelo manager | `docs/` |
| 2026-08-19 | Projeto Ember iniciado com Meridian | `docs/` |

## Gate

`status: approved` on this stub means rules are understood — not that history is complete.
