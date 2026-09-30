# Octocode — Frontend

React 19 + Vite + TypeScript single-page app for **Octocode**, a developer work organizer.

> The full project reference (product spec, domain model, conventions, roadmap) lives in
> [`../README.md`](../README.md). Read that first. This file only covers the frontend workspace.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` (type-check + production build) |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | `eslint .` |
| `npm run preview` | Serve the built `dist/` |

There is no test runner configured. The product's real test is visual; use `typecheck`, `lint`, and
`build` as static checks before viewing the app.

## Data

The app runs entirely on **local in-memory data** — no backend is required:

- Seed data: `src/data/seed.ts`
- Store + async API boundary: `src/api/*`

Changes are lost on a full page reload. Swapping `src/api/*` bodies for HTTP calls is the intended
path to the backend; see the root README §7.

## Structure (summary)

```text
src/
├── domain/    # framework-free types + pure logic
├── data/      # local seed
├── api/       # async data boundary (the only place that touches the store)
├── shared/    # cross-cutting helpers (date)
├── components/
│   ├── layout/ # AppShell, ProjectSidebar, navigation
│   └── shared/ # generic primitives: Button, Modal, Select, TextInput, Badge, …
├── pages/     # today, calendar, kanban, graph, project (backlog + progress)
└── styles/    # global.css (reset + design tokens only)
```

## Conventions

- No new dependencies without justification (no router, state, chart, form, or DnD libraries).
- CSS Modules colocated with components; global CSS is only reset + tokens.
- Visual components never call `api/*`; pages/hooks own requests and expose `loading`/`error`.
- Follow `.pi/skills/frontend/{structure,components,forms}`.
