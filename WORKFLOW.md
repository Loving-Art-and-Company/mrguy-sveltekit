---
version: 1
name: "MrGuy Agent Workflow"
tracker:
  ready_status: "Ready for Agent"
  working_status: "Agent Working"
  review_status: "Human Review"
  blocked_status: "Blocked"
  done_status: "Done"
workspace:
  canonical_path: "~/Projects/company/loving-art-and-company/brands/mr-guy-mobile-detail/web/mrguy-sveltekit"
  branch_prefix: "codex/"
proof:
  require_tests: true
  require_visual_proof_for_ui: true
  require_handoff: true
safety:
  auto_merge: false
  auto_deploy: false
  secrets_in_logs: false
---

# Agent Workflow

You are working in MrGuy, the mobile detailing booking site.

## Startup

1. Read `AGENTS.md` and follow it.
2. Read `~/memory/index.md`, then the MrGuy project memory when available.
3. Confirm the working tree state before editing.
4. Preserve user changes. Do not revert unrelated edits.
5. Create or use a branch named `codex/<short-task-slug>` unless the ticket says otherwise.

## Task Handling

Treat the issue as the source of truth for scope. If the issue is unclear, stop and ask in the tracker instead of inventing product behavior.

Before editing:

- Identify the files and tests likely involved.
- Check existing SvelteKit, booking, analytics, CSP, and Cloud Run/Vercel deployment patterns.
- Keep the change scoped to the task.

During implementation:

- Do not create real bookings during proof unless the ticket provides a safe staging database or explicit approval.
- Preserve Twilio/SMS removal unless the ticket explicitly changes that direction.
- Preserve analytics and CSP hardening.
- Never store secrets in files, logs, screenshots, or memory.

## Proof

Run the commands that match the change:

- `npm run check`
- `npm run build`
- Relevant tests.
- Desktop and mobile viewport inspection for UI changes.
- Booking-flow proof only against safe test/staging data.

If proof cannot run, explain the exact blocker and what remains unverified.

## Handoff

When ready for human review, provide summary, changed files, verification, proof artifacts, remaining risks, and PR link if one exists.

Move the issue to `Human Review` only after the handoff is complete.

## Completion

Do not mark work `Done` until the human reviewer accepts the result and the repo-specific merge/deploy step has happened.
