# Agent Instructions

## AI documents (`AI - NNN.md`)

An **AI document** is a durable, human- and agent-readable note for a task: a plan, a design
breakdown, or a handoff. The user often asks for a new one or to update an existing one.

- **Name:** `AI - NNN.md` with a three-digit, sequential number (`AI - 001.md`, `AI - 002.md`, …).
- **Location:** inside the task folder it belongs to, e.g. `tasks/001-FIX-BACKEND/AI - 001.md`.
- **Reference format:** `tasks/example/AI - 006.md`. Follow its shape.

Required shape:

1. H1 title: `# AI - NNN — <short, concrete title>`.
2. Metadata block: branch/area, **status** (plan / in progress / implemented / handoff), the
   source task file, and what to read together with it.
3. `## TL;DR` — the essential state and the open items, no fluff.
4. `## Index` — numbered sections with anchor links.
5. Numbered body sections. Depending on the document type, cover: current state with concrete
   file paths/endpoints, decisions (with rationale), what was or will be implemented, open items,
   caveats/risks, how to resume, and a doc map.

Style rules:

- Be dense and factual. Reference real paths, endpoints, models, and commit SHAs.
- Clearly separate **done / proposed / open**; never present a plan as implemented.
- Use tables for state, open items, and doc maps.
- Record assumptions explicitly when interpreting an ambiguous request.
- When asked to create or update an `AI - NNN.md`, follow this convention.

## General

- Understand the relevant existing code before modifying it.
- Prefer simple solutions over unnecessary abstractions.
- Follow the existing architecture and conventions unless there is a clear reason not to.
- Do not introduce new dependencies without justification.
- Do not make unrelated changes.

## Implementation

- Keep changes focused on the requested task.
- Prefer clear and maintainable code over clever code.
- Preserve existing behavior unless the task explicitly requires changing it.
- Consider failure modes and edge cases.

## Testing

- Run the relevant tests after modifying code.
- Add or update tests when behavior changes.
- Never modify or remove a valid test merely to make an implementation pass.
- Do not hide failures or weaken assertions.

## Debugging

- Investigate the root cause before applying a fix.
- Prefer fixing the cause rather than masking the symptom.
- When uncertain, gather evidence instead of guessing.

## Completion

Before declaring a task complete:

1. Run the relevant tests.
2. Review the resulting diff.
3. Check for unintended changes.
4. Report what changed and any remaining risks or uncertainties.
