# Octocode — Frontend

React 19 + Vite + TypeScript single-page app for **Octocode**, a developer work organizer.

> The full project reference (product spec, domain model, backend, conventions, roadmap) lives in
> [`../README.md`](../README.md). Read that first. This file only covers the frontend workspace.

## Run

The app **requires the backend** — there is no local-data mode. Start the API first (see the root
README §6.2), then:

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

## Environment

Documented in `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3333` | Backend API base URL. |
| `VITE_DEV_LOGIN` | `false` | Show the dev-only "sign in with a personal access token" form. Requires `ALLOW_DEV_TOKEN_LOGIN=true` on the backend. **Never enable in production.** |

## Auth

Sign-in is GitHub OAuth handled by the backend. The API sets an HttpOnly session cookie; `apiFetch`
sends it with `credentials: "include"`. `App` gates the whole UI behind `useCurrentUser`
(`GET /auth/me`), showing `LoginScreen` when there is no session.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build | Vite |
| Language | TypeScript |
| Styling | CSS Modules (colocated) + CSS variables in `styles/global.css` |
| Routing | None — navigation is app state (`ScreenId`) |
| State | Local React state + feature hooks (no Redux/Zustand/Context for app data) |
| Data | HTTP via `src/api/*` → backend REST API |
| Drag & drop | Native HTML5 DnD |
| Charts | Hand-built SVG (`BurndownChart`) |
| Forms | Controlled inputs + hand-rolled validators |

**Do not add dependencies** (router, state library, chart library, form/validation library, DnD
library, HTTP library, auth library) without a concrete justification.

## Structure

```text
src/
├── main.tsx                     # React root; imports styles/global.css
├── App.tsx                      # auth gate + screen state + renders AppShell
├── styles/global.css            # reset + design tokens (CSS variables)
│
├── domain/                      # framework-free types + pure logic (no React)
│   ├── types.ts                 # Project, Story, Sprint, Commit, CalendarEvent, CurrentUser
│   ├── story.ts                 # priority order/labels, status labels, comparator, branch slug
│   ├── sprint.ts                # active-sprint selection + burndown math
│   └── calendar.ts              # calendar event type labels
│
├── api/                         # HTTP boundary (the only place that calls the backend)
│   ├── http.ts                  # apiFetch + ApiError + getApiBaseUrl (credentials: include)
│   └── projects/stories/sprints/calendar-events/github/google-calendar/debug/auth
│
├── auth/                        # useCurrentUser + LoginScreen
├── shared/date.ts               # ISO date parsing/formatting, week/month helpers
│
├── components/
│   ├── layout/                  # AppShell, ProjectSidebar, views.ts
│   ├── sprints/                 # CreateSprintModal
│   ├── stories/                 # CommitList, StoryCommitsModal
│   └── shared/                  # Badge, Button, EmptyState, ErrorState, Modal, Select, Spinner, TextInput
│
└── pages/                       # today, sprints, calendar, kanban, graph, debug, project (backlog + progress)
```

## Conventions

- Visual components never call `api/*` directly. Pages and feature hooks own requests.
- Components receive data via props and emit intent via `onX` callbacks.
- Hooks expose `{ data, loading, error, …actions }`; the page decides rendering.
- Transport details (base URL, credentials, error mapping) stay in `api/http.ts`.
- Server-derived data is separate from UI state (open modal, active tab, filters).
- Keep component styles in colocated `*.module.css`; global CSS is only reset + tokens.
- Follow `.pi/skills/frontend/{structure,components,forms}`.

## Tests

There is no frontend test runner. Use `typecheck`, `lint`, and `build` as static checks, then verify
the app visually against the backend.
