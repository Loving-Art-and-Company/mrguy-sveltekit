# Project Codex Instructions

## Project Truth

This file overrides assumptions.

Before making changes, inspect the repository and infer the actual stack from the code.

Do not assume React, Next.js, Astro, Flutter, Rails, Svelte, Shopify, or any other stack unless the repo proves it.

## Current Project Stack

- Language: TypeScript, Svelte
- Framework: SvelteKit, Svelte 5, Vite, adapter-node
- Package manager: npm (package-lock.json)
- Build command: npm run build (vite build)
- Dev command: npm run dev (vite dev)
- Test command: npm run test; npm run test:e2e for Playwright
- Deploy target: Node/Vercel or Cloud Run paths are present; verify target before deployment
- Database: Postgres with Drizzle ORM
- Styling: Svelte scoped styles/CSS; lucide-svelte icons
- Important directories: src/routes, src/lib, scripts, tests/e2e, drizzle.config.ts

## Project Priorities

1. Keep the app working.
2. Keep changes small.
3. Improve clarity before adding features.
4. Avoid unnecessary dependencies.
5. Prefer boring, stable solutions.
6. Protect production data and credentials.

## Required Workflow

For every task:

1. Read this file.
2. Check `git status`.
3. Inspect the relevant files before proposing changes.
4. Explain the plan briefly.
5. Make the smallest useful change.
6. Run the relevant check.
7. Summarize the diff and risks.

## Forbidden Without Approval

Do not do these without explicit approval:

- Change framework
- Add a major dependency
- Change deployment target
- Change database schema
- Change authentication
- Change payment logic
- Rewrite large files
- Delete major functionality
- Rename public routes
- Change environment variable names
- Touch production credentials

## Output Format After Work

Use this format:

### Changed
- ...

### Tested
- ...

### Risks
- ...

### Next
- ...

## Existing Repository Notes

# Mr. Guy Mobile Detail - Project Guidance

## Context System

**Before starting work, AI should load:**
1. `.context/backpack.md` - Current project state and active work
2. `DESIGN.md` - Visual contract for public booking and marketing surfaces
3. `.context/decisions.md` - Architecture decisions and rationale
4. `CLAUDE.md` - Legacy architecture documentation / supporting reference
5. `README.md` - Quick start and setup guide

**At end of session:**
- Update `.context/backpack.md` with progress
- Log any new architecture decisions in `.context/decisions.md`

For UI, landing-page, booking-flow, pricing, or styling tasks, `DESIGN.md` is binding unless the task explicitly calls for a redesign.

## Project Overview

Port from React version at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`

Mobile detailing booking platform for West Broward, South Florida.

**Stack:** SvelteKit + Neon Postgres + Stripe

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview build

# Quality
npm run check            # Type check + SvelteKit sync
npm run check:watch      # Watch mode
```

## Key Patterns

### Svelte 5 Runes (Required)
```javascript
// State
let count = $state(0);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props
let { name, age = 18 } = $props();
```

### Server-Side Validation (Required)
```javascript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/)
});

const result = schema.safeParse(data);
```

### Database Access
```javascript
// Keep database access server-side through repositories
import * as bookingRepo from '$lib/repositories/bookingRepo';
```

## Security Rules

- Never commit `.env.local` (already in .gitignore)
- `DATABASE_URL` stays server-only
- Validate all inputs server-side with Zod
- Validate all access through server routes and repository boundaries

## Reference Docs

- Architecture: `.context/decisions.md` then `CLAUDE.md` for legacy/reference detail
- Security: `SECURITY.md`
- Ralph Phases: `RALPH-PHASE*.md` (implementation history)
- Global standards: `~/AGENTS.md`

## Autoresearch Protocol

When `autoresearch.md` or `autoresearch.sh` exists in this project:

- Read `autoresearch.md` before substantial implementation, refactor, or investigation work.
- Run `./autoresearch.sh` before and after changes when the task should be provable.
- Treat `autoresearch.md` as the task contract: objective, metric, scope, out-of-bounds, regressions, and next experiments.
- Keep `autoresearch.sh` safe and repeatable. Emit only `METRIC`, `CHECK`, or `ARTIFACT` lines.
- Put deeper benchmarks or probes in `autoresearch.bench.sh` and richer validation in `autoresearch.checks.sh`.
- Update `autoresearch.md` when the objective, constraints, or proof commands change.

## Agent Skills & Memory

Global skills are indexed at `~/.agents/skills/_manifest.json`.
Full conventions and episodic logging live at `~/memory/agents/skills.md`.
