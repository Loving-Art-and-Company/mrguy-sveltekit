# MrGuy Ops Agent Memory

Keep this file short. Record only durable operational patterns, alert rules, and handoff constraints that help future daily runs.

## Known Constraints

- Read-only by default.
- Customer-facing sends, booking changes, payment changes, and production content/code changes require approval.
- Do not store secrets or raw customer PII here.

## Current Prerequisites

- Gmail, GA4, and Search Console snapshots require the connected Google account to be reauthorized once with `gmail.readonly`, `analytics.readonly`, and `webmasters.readonly`.
- Ops alerts send through Resend only when `SEND_ALERTS=1` and `MRGUY_OPS_ALERT_TO` is configured.
- Daily digests write to `output/ops/latest-digest.md` and archive copies in `output/ops/`.

## Working Patterns

- `npm run ops:smoke` is the fastest health check for homepage, booking modal/availability, and reschedule flow.
- `npm run ops:digest` aggregates smoke, booking queue, inquiries, analytics, and SEO into one ranked action list for Pablo.
- Check archived digests and `output/ops/daily-run.log` before escalating a recurring issue.
