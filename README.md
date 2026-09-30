# Octocode — Developer Work Organizer

> **Audience: AI coding agents.** This document is the primary context source for this repository.
> It is intentionally verbose and structured so an agent can understand the project without reading
> every file. Prefer this file over guessing. When behavior here disagrees with the code, the code
> wins — update this document.
>
> **Status:** early-stage monorepo. The **frontend is implemented** (React SPA with local in-memory
> data). The **backend is a scaffold** (Express + Prisma, no models/routes yet).
>
> **Last structural update:** frontend screens split into global Today / Calendar / Kanban / Graph
> plus a per-project Backlog + Progress view; branches are per-story; kanban card arrows removed in
> favor of drag-and-drop.

---

## 0. How to use this document

Sections are ordered from product → domain → architecture → implementation → workflow.

| If you need to… | Read |
| --- | --- |
| Understand the product goal | §1, §2 |
| Learn the vocabulary/types | §3 |
| Find where a file lives | §4, §5.4 |
| Change frontend code | §5, §7 |
| Change backend code | §6 |
| Connect frontend to backend | §7 |
| Know the working rules | §8 |
| See what is not done | §9 |

**Hard rules for agents (summary, full text in §8 and `AGENTS.md`):**

1. Read and understand existing code before changing it.
2. Prefer simple solutions over abstractions.
3. Do not add dependencies without justification.
4. Never weaken/remove/skip tests to make code pass.
5. Never run mutating git commands (`add`, `commit`, `push`, `reset`, `stash`, branch/tag ops, etc.).
6. `.pi/extensions/` is protected by the harness — read only, never edit. If a change is required
   there, stop and report the exact edit for a human to apply.

---

## 1. What this project is

**Octocode** is a work organizer for software developers. It combines three planning surfaces in one
application:

1. **Sprint board** — a per-project funnel that moves user stories through
   `backlog → design → code → test → refactor`, with story points and priorities, plus a burndown
   graph for the active sprint.
2. **Backlog** — where a project's stories are groomed: title, story points (Fibonacci 1–21),
   priority, and the GitHub branch/commits attached to each story.
3. **Planner** — a calendar for meetings, short non-coding tasks, and reminders, plus a "Today"
   agenda (spreadsheet view) of everything scheduled for the current day.

A project also has a **Progress** view showing the history of every sprint (committed vs. completed
points and stories) to track delivery over time.

The long-term intent (see §2) is that every story is tied to a GitHub branch, so the app can show
the commits made for a story, and that calendars synchronize with Google Calendar. Neither GitHub
nor Google integration is implemented yet — both are mocked/local so far.

---

## 2. Product specification (source of truth)

### 2.1 Original brief (verbatim)

The following is the original product brief exactly as written. It is the authoritative feature
description; treat it as requirements, not prose.

```text
This should be a system to that organizes developers. here is the UX

side screen with all current projects. you can select them. there is also a option of the main
kanvan with all of them

the first stage is the backlog. it should be set eith the option of story points (fibonnacci
sequence fro m1 to 21) and a priority option as well. order tham from oldest to newest under the
priority order

there should be a option of filtering whcib project you see and which priority you see as well

the stories are moved forward then on the kanban. the name of this screen is actually sprint. it
should have a date to start and finnish + a graph os story points remaining in the sprint on Y axis
and days passed on X axis. all sprints have 1 week.

there should also be a view of calendar where you can add other stuff, like reminders and short
boring tasks beyond coding, as well as meetigs. iddeally it should sincronize with google calendar

on the project views you should get detailed information about all sprints you made on the project
to check progress.

the stages of the funnel are

backlog | design | code | test | refactor

each card on backlog should show

story name on top
story points and priority below

if clicked, we can add the branch on github that we work on that. the project should have the github
account it is being made and all cards should have their own branch. with this i would hope that it
shows all commits made. the number of them and their names on a list

thats the project.
```

### 2.2 Requirements checklist (normalized)

| # | Requirement | Implementation | Status |
| --- | --- | --- | --- |
| R1 | Sidebar with all projects, selectable | `ProjectSidebar` | ✅ |
| R2 | "Main kanban" across all projects | `KanbanPage` with project filter | ✅ |
| R3 | Backlog is the first stage | Story `status: "backlog"` | ✅ |
| R4 | Story points from Fibonacci 1–21 | `STORY_POINTS` union | ✅ |
| R5 | Priority option | `STORY_PRIORITIES` union | ✅ |
| R6 | Order backlog by priority, then oldest→newest | `compareStoriesByPriorityThenAge` | ✅ (see §5.7 note on terminology) |
| R7 | Filter by project and by priority | `StoryFilters` | ✅ |
| R8 | Sprint screen: start + finish dates | `SprintHeader` | ✅ |
| R9 | Burndown graph (points remaining Y, days X) | `BurndownChart` (SVG) | ✅ |
| R10 | All sprints are 1 week | seed data + `domain/sprint.ts` | ✅ (data; not enforced in UI) |
| R11 | Calendar for reminders / tasks / meetings | `CalendarPage` | ✅ |
| R12 | Google Calendar sync | — | ❌ not implemented |
| R13 | Project view: history of all sprints | `ProgressPage` | ✅ |
| R14 | Funnel: backlog/design/code/test/refactor | `STORY_STATUSES` | ✅ |
| R15 | Backlog card: name on top, points+priority below | `StoryCard` | ✅ |
| R16 | Click a card to attach the GitHub branch | `StoryDetailModal` + `BranchForm` | ✅ (local) |
| R17 | Project has a GitHub account | `Project.githubAccount` | ✅ (displayed in sidebar) |
| R18 | Every story has its own branch | required `Story.branch`, auto-generated | ✅ |
| R19 | Show number and names of commits | `CommitList` | ✅ (seed data) |
| R20 | "Today" spreadsheet view of calendar tasks | `TodayPage` + `TodayTable` | ✅ (added after brief) |
| R21 | Reminders | calendar event `type: "reminder"` + add form | ✅ |
| R22 | Drag-and-drop stories between stages | native HTML5 DnD in kanban | ✅ |

### 2.3 Terminology note

The brief says stories move "forward on the kanban" and calls the kanban screen "sprint". In the
implemented app:

- **Kanban** = the board screen (one global board, filterable by project).
- **Graph** = the burndown screen (split out of the old combined "Sprint" screen).
- **Sprint** = a time box (1 week) that owns a set of stories; not a screen name anymore.

The word "sprint" therefore refers to the data entity, while the UI screens are `Kanban` and `Graph`.

---

## 3. Domain model & vocabulary

All types live in `frontend/src/domain/types.ts`. Read it as the canonical model.

### 3.1 Entities

**Project** — a piece of work being organized.

```ts
interface Project {
  id: string;            // e.g. "project-octocode"
  name: string;          // displayed in the sidebar
  githubAccount: string; // e.g. "octocode-labs"
  repository: string;    // e.g. "octocode"
  color: string;         // sidebar dot color (hex)
}
```

The GitHub identity is displayed as `githubAccount/repository` under each project in the sidebar
(R17). There is no real GitHub API integration.

**Story** — a unit of work.

```ts
interface Story {
  id: string;
  projectId: string;
  sprintId: string | null;   // null = not scheduled into a sprint
  title: string;
  storyPoints: StoryPoints;  // 1 | 2 | 3 | 5 | 8 | 13 | 21
  priority: StoryPriority;   // "critical" | "high" | "medium" | "low"
  status: StoryStatus;       // the funnel stage
  branch: string;            // REQUIRED, always present, e.g. "feat/my-story"
  commits: Commit[];
  createdAt: string;         // ISO datetime
  completedAt: string | null;// ISO date (YYYY-MM-DD) when moved to "refactor"
}
```

**StoryStatus** (the funnel, R14):

```ts
type StoryStatus = "backlog" | "design" | "code" | "test" | "refactor";
```

`refactor` is treated as "done" for progress/burndown purposes.

**Commit** — a commit on a story branch.

```ts
interface Commit {
  id: string;
  sha: string;        // full sha; UI shows first 7 chars
  message: string;
  author: string;
  committedAt: string; // ISO datetime
}
```

**Sprint** — a one-week time box.

```ts
interface Sprint {
  id: string;
  projectId: string;
  name: string;       // e.g. "Octocode Sprint 1"
  startDate: string;  // ISO date
  endDate: string;    // ISO date
}
```

There is at most one *active* sprint per project in the current seed/UI: the one with the latest
`startDate`.

**CalendarEvent** — planner item.

```ts
type CalendarEventType = "reminder" | "task" | "meeting";

interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;       // ISO date
  startTime: string;  // "HH:MM"
  notes: string;
}
```

### 3.2 Derived concepts

- **Active sprints** — `selectActiveSprints(sprints, projectId)`: the latest sprint per project
  (or the latest for one project). See `domain/sprint.ts`.
- **Burndown** — `buildBurndown(sprints, stories)`: an array of `{ day, ideal, remaining }`.
  `remaining` = total points minus points completed on or before that day; `ideal` = a straight line
  from total to zero across the sprint window.
- **Backlog list** — stories with `status === "backlog"`, filtered by project/priority and sorted by
  priority then age.
- **Today agenda** — calendar events whose `date === today`, sorted by `startTime`.

---

## 4. Repository layout

Monorepo with independent npm projects (no root workspace wiring).

```text
octocode/
├── README.md                  ← this file (AI-oriented project reference)
├── AGENTS.md                  ← agent working rules (short form)
├── package.json               ← agent-harness tooling (root), NOT the app
├── tsconfig.json              ← root TS config for harness/extensions/evals
│
├── frontend/                  ← React SPA (implemented, see §5)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── eslint.config.js
│   ├── tsconfig*.json
│   └── src/                   ← application code (see §5.4)
│
├── backend/                   ← Express + Prisma scaffold (see §6)
│   ├── package.json
│   ├── prisma7.config.ts
│   ├── prisma/schema.prisma
│   └── src/
│       ├── app.ts             ← express app (json body parser only)
│       ├── server.ts          ← process bootstrap, listens on PORT (default 3333)
│       ├── infrastructure/prisma/client.ts
│       └── shared/appError.ts ← EMPTY placeholder (0 bytes) — implement per §6.6
│
├── src/                       ← agent-harness dashboard tooling (NOT product code)
│   ├── dashboard.ts
│   ├── dashboard-ui.ts
│   ├── dashboard-ui-cli.ts
│   ├── models.ts
│   └── user-summary.ts
│
├── tests/                     ← node:test unit tests for the harness tooling
├── evals/                     ← evaluation runner for the harness (`run-eval.ts`)
├── public/                    ← static assets for the harness dashboard
├── scripts/                   ← empty (.gitkeep)
├── tasks/                     ← harness task briefs (markdown)
│
└── .pi/                       ← agent harness configuration (see §8)
    ├── settings.json
    ├── skills/{frontend,backend}/…
    ├── prompts/{plan-instructions,execute-instructions,debug,review}.md
    ├── extensions/{safety,audit,plan-mode}.ts   ← PROTECTED, read-only
    ├── lib/audit.ts
    ├── docs/backend/
    └── audit/                 ← append-only tool-call logs
```

**Important distinction:** root `src/`, `tests/`, `evals/`, `public/`, and `tasks/` belong to the
**agent harness**, not to the Octocode product. The product is `frontend/` and (eventually)
`backend/`.

---

## 5. Frontend

### 5.1 Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 (`react`, `react-dom`) |
| Build | Vite 8 |
| Language | TypeScript ~6, `jsx: react-jsx`, bundler resolution, `verbatimModuleSyntax` |
| Styling | CSS Modules (colocated) + CSS variables in `styles/global.css` |
| Routing | **None** — navigation is app state (`ScreenId`) |
| State | Local React state + feature hooks. No Redux/Zustand/Context for app data |
| Data | Local in-memory store behind async `api/*` functions |
| Drag & drop | Native HTML5 DnD (no library) |
| Charts | Hand-built SVG (`BurndownChart`) |
| Forms | Controlled inputs + hand-rolled validators (no form library) |

**Do not add dependencies** (router, state library, chart library, form/validation library, DnD
library, date library) without a concrete justification recorded in the change description.

### 5.2 Commands (run inside `frontend/`)

```bash
npm install            # install dependencies
npm run dev            # Vite dev server (default http://localhost:5173)
npm run build          # tsc -b && vite build  (also type-checks)
npm run typecheck      # tsc -b (no emit)
npm run lint           # eslint .
npm run preview        # serve the production build
```

From the repo root you can use `npm --prefix frontend run dev` instead of `cd frontend`.

There is **no test runner** in the frontend. Verification is `typecheck` + `lint` + `build` + manual
visual checks (§8.5).

### 5.3 Navigation model

`ScreenId` (in `components/layout/views.ts`) is either a global view or `"project"`:

```ts
type GeneralViewId = "today" | "kanban" | "graph" | "calendar";
type ScreenId = GeneralViewId | "project";
```

`App.tsx` owns:

- `screen: ScreenId` (default `"kanban"`)
- `activeProjectId: string | null` (`null` = "All projects")

The sidebar groups global views into two labeled sections, and lists projects:

```text
Plan     →  Today, Calendar
Sprint   →  Kanban, Graph
Projects →  All projects | <project 1> … <project N>
```

Selecting a global view sets `screen`. Selecting a project sets `activeProjectId` **and**
`screen = "project"`.

The **project** screen (`pages/project`) is a two-tab view: `Backlog` and `Progress`. The tab is
local state inside `ProjectPage`.

### 5.4 Directory map (frontend)

```text
frontend/src/
├── main.tsx                     # React root; imports styles/global.css
├── App.tsx                      # screen state + renders AppShell + active screen
├── App.module.css
│
├── styles/
│   └── global.css               # reset + design tokens (CSS variables). Keep global CSS minimal.
│
├── domain/                      # framework-free types + pure logic (no React)
│   ├── types.ts                 # Project, Story, Sprint, Commit, CalendarEvent, unions
│   ├── story.ts                 # priority order/labels, status labels, comparator
│   ├── sprint.ts                # active-sprint selection + burndown math
│   └── calendar.ts              # calendar event type labels
│
├── data/
│   └── seed.ts                  # local seed data (projects, sprints, stories, calendar)
│
├── api/                         # the ONLY data boundary; async, backed by the in-memory `db`
│   ├── db.ts                    # mutable in-memory store + delay() + createId()
│   ├── projects.ts              # getProjects()
│   ├── stories.ts               # getStories, createStory, assignStoryBranch, updateStoryStatus
│   ├── sprints.ts               # getSprints()
│   └── calendar-events.ts       # getCalendarEvents, createCalendarEvent
│
├── shared/
│   └── date.ts                  # ISO date parsing/formatting, week/month helpers
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # sidebar + content frame
│   │   ├── ProjectSidebar.tsx   # nav groups + project list
│   │   └── views.ts             # ScreenId, GENERAL_VIEW_GROUPS
│   └── shared/                  # generic, feature-independent primitives
│       ├── Badge/               # tone: neutral|accent|critical|high|medium|low
│       ├── Button/              # variant: primary|secondary|ghost|danger
│       ├── EmptyState/
│       ├── ErrorState/
│       ├── Modal/
│       ├── Select/
│       ├── Spinner/
│       └── TextInput/           # type: text|date|time
│
└── pages/                       # feature/page folders (see §5.5)
    ├── today/       calendar/    kanban/    graph/
    ├── project/     backlog/     progress/
```

### 5.5 Screens

**Today** (`pages/today`)
- Hook: `useTodayAgenda` — loads calendar events, filters to today, sorts by time; `addReminder`.
- Components: `TodayTable` (spreadsheet: Time · Type · Task · Notes), `ReminderForm`.
- Validation: `validation/reminder.schema.ts`.

**Calendar** (`pages/calendar`)
- Hook: `useCalendarEvents` — list + `addEvent`.
- Components: `CalendarGrid` (6×7 Monday-first month), `CalendarEventList`, `CalendarEventForm`.
- Local state: `visibleMonth`, `selectedDate`.
- Validation: `validation/calendar-event.schema.ts`.

**Kanban** (`pages/kanban`)
- Hook: `useKanban` — loads projects/sprints/stories; derives product-filtered columns; `moveStory`.
- Components: `KanbanBoard` (5 columns), `KanbanColumn` (drop target), `KanbanCard` (draggable).
- Project filter is local to the hook (`projectFilter: string | null`).
- Moving a card = `updateStoryStatus` via the API; `refactor` sets `completedAt` to today.

**Graph** (`pages/graph`)
- Hook: `useBurndown` — active sprints + burndown points + totals.
- Components: `SprintHeader` (name, date range, committed/completed/remaining), `BurndownChart`.

**Project** (`pages/project`) — tabs:
- **Backlog** (`pages/backlog`): `useBacklog` (project filter from shell + local priority filter),
  `StoryFilters`, `StoryList`, `StoryCard`, `StoryDetailModal` (branches + commits),
  `BranchForm`, `CommitList`, `CreateStoryForm`; validation `validation/story-form.schema.ts`.
- **Progress** (`pages/progress`): `useProjectProgress`, `SprintHistoryList`, `SprintSummaryCard`.

### 5.6 Data flow

```text
component → (callback) → page/hook → api function → in-memory db (data/seed.ts)
```

Rules (enforced by convention, see §8):

- Visual components never call `api/*` directly. Pages/hooks own requests.
- Components receive data via props and emit intent via `onX` callbacks.
- Hooks expose `{ data, loading, error, …actions }`; the page decides how to render states.
- Raw "HTTP" (here, the store) stays behind `api/*`.
- Server-derived data (projects/stories/sprints/events) is kept separate from UI state
  (open modal, active tab, filters).

### 5.7 Business rules implemented

**Backlog ordering** — `compareStoriesByPriorityThenAge` sorts by priority
(`critical → high → medium → low`), then by `createdAt` ascending. Note: the brief's wording
("oldest to newest under the priority order") is implemented as *within each priority group, oldest
first*.

**Story points** — `STORY_POINTS = [1, 2, 3, 5, 8, 13, 21]` as a const union.

**Branch per story (R18)** — `Story.branch` is a required string. The **New story** form has a
`Branch` field that is prefilled live from the title as `feat/<slug(title)>`; the user may edit it
before submitting, and if left empty the branch is generated on create. Generated names are
deduplicated with `-2`, `-3`, … on collision (see `domain/story.ts` + `api/stories.ts`). Branches
are shown on backlog cards and kanban cards, and can be edited in the story detail modal.

**New story placement** — `createStory` assigns the story to the project's latest sprint if one
exists, so it appears in the kanban's `backlog` column and can be moved forward.

**Status transitions** — kanban DnD or `updateStoryStatus` sets `status`; entering `refactor` sets
`completedAt = today`, leaving it clears `completedAt`.

**Sprint length** — seeded sprints are 7 days. The burndown window is derived from the sprint
start/end, so it adapts to whatever dates exist; there is no UI to create sprints yet.

**Burndown** — for each day from sprint start to end: `ideal = total × (1 − day/totalDays)`,
`remaining = total − points of stories with status "refactor" and completedAt ≤ day`.

### 5.8 Styling & design tokens

Global tokens in `styles/global.css` (`:root`):

```text
colors:  --color-bg, --color-surface, --color-surface-muted, --color-border,
         --color-text, --color-text-muted, --color-primary, --color-primary-strong,
         --color-accent, --color-critical, --color-high, --color-medium, --color-low
radii:   --radius-sm|md|lg
spaces:  --space-1|2|3|4|5|6
shadows: --shadow-sm|md
```

Rules: component styles live in a colocated `*.module.css`; class names are camelCase; no inline
`style` except dynamic values (e.g. project color dot, progress bar width). Global CSS is limited to
reset, body defaults, and tokens.

### 5.9 Known frontend limitations

- Data is **in-memory**; a full page reload resets all changes to the seed.
- Kanban/graph **project filters are independent** (each screen keeps its own).
- No sprint management UI (create/close/assign). The "active" sprint is the latest per project.
- Kanban drag-and-drop is desktop-oriented; there is currently **no keyboard-only way** to change a
  story's status (the previous arrow buttons were removed by request).
- Commits are seed data; there is no GitHub integration.
- Calendar does not sync with Google Calendar.
- No frontend test suite.

---

## 6. Backend (scaffold)

### 6.1 Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js + TypeScript (ESM, `"type": "module"`) |
| HTTP | Express 5 |
| ORM | Prisma 7 + `@prisma/adapter-pg` + `pg` (PostgreSQL) |
| Dev runner | `tsx watch` |
| Env | `dotenv` (`.env`, `DATABASE_URL`) |

### 6.2 Commands (run inside `backend/`)

```bash
npm install
npm run dev              # tsx watch src/server.ts
npm run build            # tsc
npm run start            # node dist/server.js
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm run prisma:generate  # prisma generate
npm run prisma:migrate   # prisma migrate dev
npm run prisma:studio    # prisma studio
```

### 6.3 Current state

- `src/app.ts` — `express()` with `express.json()` only. No routes, no error handler.
- `src/server.ts` — reads `PORT` (default `3333`) and `app.listen`.
- `src/infrastructure/prisma/client.ts` — creates a `PrismaClient` with the pg adapter from
  `DATABASE_URL`. Imports the generated client from `../../generated/prisma/client.js`.
- `src/shared/appError.ts` — **empty file (0 bytes)**. Intended for the `AppError` class (§6.6).
- `prisma/schema.prisma` — generator + `postgresql` datasource. **No models.**
- `prisma7.config.ts` — Prisma config; datasource URL from `DATABASE_URL`, migrations in
  `prisma/migrations`.

There is no generated Prisma client committed; run `npm run prisma:generate` before typechecking
backend code that imports it.

### 6.4 Intended architecture (from `.pi/skills/backend`)

```text
Client → Route → Authentication → broad Authorization → Validation
       → Controller → Service → Repository contract → Repository impl → Prisma → DB
```

- **Route**: HTTP method/path + middleware + controller. Declarative only.
- **Controller**: translate HTTP ↔ application input; call one service; choose the response.
- **Service**: one use case per class (`CreateUserService`, `CancelOrderService`, …), business rules
  and resource-specific authorization. No Express/Prisma.
- **Repository**: persistence for one aggregate, behind a contract. Prisma only in the impl.
- **Composition**: construct the object graph (manual constructor injection; no DI container unless
  justified).
- Prefer feature-oriented modules: `modules/<feature>/{controllers,services,repositories,validation,routes}`.
- Errors: throw `AppError(message, statusCode)` for expected failures; let unexpected errors bubble
  to one global error handler that returns `{ message }`.

### 6.5 Planned data model (Prisma — not implemented)

Proposed models mirroring the frontend domain (§3). Adjust names as needed; keep them 1:1 with the
API contract in §7.

```prisma
model Project {
  id            String   @id @default(uuid())
  name          String
  githubAccount String
  repository    String
  color         String
  createdAt     DateTime @default(now())
  stories       Story[]
  sprints       Sprint[]
}

model Sprint {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  name      String
  startDate DateTime
  endDate   DateTime
  stories   Story[]
}

model Story {
  id          String      @id @default(uuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id])
  sprintId    String?
  sprint      Sprint?     @relation(fields: [sprintId], references: [id])
  title       String
  storyPoints Int
  priority    String
  status      String
  branch      String
  createdAt   DateTime    @default(now())
  completedAt DateTime?
  commits     Commit[]
}

model Commit {
  id          String   @id @default(uuid())
  storyId     String
  story       Story    @relation(fields: [storyId], references: [id])
  sha         String
  message     String
  author      String
  committedAt DateTime
}

model CalendarEvent {
  id        String   @id @default(uuid())
  type      String
  title     String
  date      DateTime
  startTime String
  notes     String   @default("")
}
```

Consider enums for `priority`/`status`/`type`, `@@unique([projectId, branch])` for story branches,
and indexes on `Story.projectId`, `Story.sprintId`, and `CalendarEvent.date`.

### 6.6 Planned `AppError`

```ts
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
```

---

## 7. Future frontend ↔ backend integration

Today the frontend talks to `frontend/src/api/*` which read/write `data/seed.ts`. To go live,
replace the bodies of those functions with HTTP calls — **components and hooks do not change**.

Mapping (frontend function → suggested endpoint):

| Frontend | HTTP |
| --- | --- |
| `getProjects()` | `GET /projects` |
| `getSprints()` | `GET /sprints` |
| `getStories()` | `GET /stories` |
| `createStory(input)` | `POST /stories` |
| `updateStoryStatus(id, status)` | `PATCH /stories/:storyId/status` |
| `assignStoryBranch(id, branch)` | `PATCH /stories/:storyId/branch` |
| `getCalendarEvents()` | `GET /calendar-events` |
| `createCalendarEvent(input)` | `POST /calendar-events` |

Recommended steps:

1. Implement Prisma models (§6.5) + a migration.
2. Add backend modules per §6.4 (controller → service → repository) for the table above.
3. Add a shared HTTP client in `frontend/src/api/` (base URL from an env var, JSON, error mapping).
4. Keep the `api/*` function signatures identical so hooks/pages are untouched.
5. Move validation to the backend boundary; keep frontend validation for UX only.
6. Replace `crypto.randomUUID` IDs and `delay()` with server-assigned IDs and real latency.

GitHub and Google Calendar integrations would be new backend capabilities (OAuth + tokens). Never
store secrets in the frontend.

---

## 8. Working rules & agent workflow

### 8.1 `AGENTS.md` (root)

The repository instructions state: understand code first, prefer simple solutions, follow existing
architecture, no unjustified dependencies, focused changes, run tests, don't mask failures, never
weaken tests.

### 8.2 Skills (`.pi/skills`)

Frontend:

- `frontend/structure` — page/feature organization, local components/hooks, state locality, API
  boundaries, CSS Modules.
- `frontend/components` — one UI responsibility, explicit typed props, data down/events up, derived
  state over duplication, loading/error/empty, semantic HTML, accessibility.
- `frontend/forms` — local form state, operation-specific validation, field vs form errors, native
  submit, duplicate-submit guard, preserve input on failure.

Backend:

- `backend/architecture` — layers, dependency direction, DI/composition, module structure.
- `backend/auth` — authentication vs authorization, trusted actor context, middleware vs service.
- `backend/crud` — explicit use cases, controllers/services/repositories, `AppError`.
- `backend/express` — HTTP boundary, routers, middleware order, global error handler.
- `backend/prisma` — client lifecycle, repository integration, raw SQL, performance.
- `backend/validation` — structural validation at the HTTP boundary, schemas.

Skills are **directories with a `SKILL.md`**. When a skill references a relative path, resolve it
against the skill directory.

### 8.3 Harness configuration (`.pi`)

- `settings.json` enables `prompts`, `skills`, `extensions`.
- `prompts/{plan-instructions,execute-instructions,debug,review}.md` define the plan/execute/debug/
  review workflows. Planning is read-only; execution implements an approved plan.
- `extensions/{safety,audit,plan-mode}.ts` — **protected**. The safety extension restricts commands;
  the audit extension logs tool calls; plan-mode blocks writes during planning. **Never edit these.**
  If a change is needed, produce the exact diff and stop for a human to apply.
- `audit/` — append-only logs of tool calls and runs.

### 8.4 Git safety

Agents may run read-only git commands (`status`, `diff`, `log`, `show`). Agents must never run
`add`, `commit`, `push`, `pull`, `merge`, `rebase`, `reset`, `revert`, `cherry-pick`, `stash`, or any
branch/tag/config/hook modification — not directly nor via other tooling. Suggested commit messages
are fine; creating commits is not.

### 8.5 Verification checklist

For frontend changes:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
# then verify visually with `npm run dev` (the product's real test is visual)
```

For backend changes (once implemented): `npm run typecheck`, `npm run lint`, and integration tests.
For harness changes: `npm test` at the repo root (runs `tests/**/*.test.js` with `node:test`).

Never claim a check passed without executing it.

---

## 9. Roadmap / not implemented

Priority order is a suggestion, not a commitment.

1. **Sprint management** — create/close sprints, assign stories, enforce a 7-day duration.
2. **Backend implementation** — Prisma models, modules, endpoints (§6, §7).
3. **Auth** — users, sessions, per-user projects (backend `auth` skill).
4. **GitHub integration** — real OAuth/app, branches and commits fetched from the GitHub API.
5. **Google Calendar sync** — OAuth + token storage + two-way sync.
6. **Persistence for the calendar/planner** and recurring events.
7. **Kanban UX** — keyboard-accessible status changes (DnD is not keyboard friendly), ordering
   within columns, WIP limits.
8. **Graph improvements** — per-sprint comparison, ideal vs actual history for past sprints.
9. **Tests** — add Vitest + React Testing Library for the frontend (requires approval: new deps).
10. **Accessibility audit** — focus management in modals, keyboard DnD alternative, landmarks.
11. **Responsive polish** — mobile layouts for the board and calendar.

---

## 10. Glossary

| Term | Meaning |
| --- | --- |
| **Story** | A unit of work with points, priority, status, branch, commits. |
| **Story points** | Fibonacci effort estimate: 1, 2, 3, 5, 8, 13, 21. |
| **Priority** | `critical` / `high` / `medium` / `low`. |
| **Funnel / status** | `backlog → design → code → test → refactor`. |
| **Backlog** | The set of stories in `backlog` status; the grooming screen. |
| **Sprint** | A one-week time box owning a set of stories. |
| **Active sprint** | The sprint with the latest `startDate` for a project. |
| **Kanban** | The board screen (5 status columns). |
| **Burndown** | Points remaining per day over a sprint; shown on the Graph screen. |
| **Branch** | The per-story git branch (`feat/…`), always present. |
| **Commit** | A commit on a story branch. |
| **Today agenda** | Calendar events scheduled for the current day (spreadsheet). |
| **Planner** | The Today + Calendar surfaces for non-coding work. |

---

## 11. Change log (structure-level)

- **Initial**: monorepo scaffold, harness config, product brief in README.
- **Frontend v1**: full SPA — sidebar projects, combined sprint page (kanban + burndown), backlog,
  calendar, progress; local in-memory data; CSS Modules.
- **Refactor**: split sprint into global **Kanban** and **Graph** screens; navigation moved into the
  sidebar with groups; **Calendar** made global; **Progress** moved into the project view; added
  drag-and-drop; per-screen project filters.
- **Per-story branches + Today**: branches required and auto-generated with `feat/` prefix, shown on
  cards; added the **Today** planner screen and reminder creation.
- **Kanban cleanup**: removed card arrow buttons (drag-and-drop only); rewrote this README as the
  AI-oriented project reference.
- **Create-story branch field**: the New story form now includes an editable branch name, prefilled
  from the title (`feat/<slug>`), and `createStory` accepts an explicit branch.

---

## 12. Quick file index (most-edited files)

| File | Why you'd open it |
| --- | --- |
| `frontend/src/domain/types.ts` | Change the data model. |
| `frontend/src/data/seed.ts` | Add/adjust local demo data. |
| `frontend/src/api/stories.ts` | Change story creation/branch/status logic. |
| `frontend/src/domain/sprint.ts` | Change active-sprint or burndown math. |
| `frontend/src/components/layout/views.ts` | Add/reorder navigation. |
| `frontend/src/App.tsx` | Add a screen or change app-level state. |
| `frontend/src/pages/kanban/**` | Kanban board and drag-and-drop. |
| `frontend/src/pages/today/**` | Today agenda and reminders. |
| `frontend/src/styles/global.css` | Design tokens. |
| `backend/src/app.ts` | Backend HTTP wiring (scaffold). |
| `backend/prisma/schema.prisma` | Backend data model (empty). |
| `AGENTS.md` | Agent working rules. |
