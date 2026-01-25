# Mr. Guy Mobile Detail - Project Guidance

## Context System

**Before starting work, AI should load:**
1. `.claude/context.md` - Current project state and active work
2. `.claude/decisions.md` - Architecture decisions and rationale  
3. `CLAUDE.md` - Comprehensive architecture documentation
4. `README.md` - Quick start and setup guide

**At end of session:**
- Update `.claude/context.md` with progress
- Log any new architecture decisions in `.claude/decisions.md`

## Project Overview

Port from React version at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`

Mobile detailing booking platform for West Broward, South Florida.

**Stack:** SvelteKit + Supabase + Stripe + Twilio Verify

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

### Supabase RLS (All Tables Protected)
```javascript
// Use service role server-side only
import { supabase } from '$lib/server/supabase';

// Browser client has RLS restrictions
import { supabase } from '$lib/supabase';
```

## Security Rules

- Never commit `.env.local` (already in .gitignore)
- Supabase service role key = server-only
- Validate all inputs server-side with Zod
- All Supabase tables have RLS policies

## Reference Docs

- Architecture: `CLAUDE.md`
- Security: `SECURITY.md`
- Ralph Phases: `RALPH-PHASE*.md` (implementation history)
- Global standards: `~/AGENTS.md`
