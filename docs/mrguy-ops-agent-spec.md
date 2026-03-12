# MrGuy Ops Agent Spec

## Purpose

The MrGuy Ops Agent is a bounded operations agent for `mrguydetail.com`.

Its job is to protect revenue, customer trust, and operational responsiveness by monitoring the live business every day and surfacing the highest-leverage actions to Pablo.

This agent is not a general chatbot and not a free-roaming autonomous worker. It is a hybrid webmaster, lead-ops, customer-service, and growth-monitor operator with explicit scope and approval boundaries.

## First Principles

The business wins only if these truths remain true:

1. A prospect can find the site and complete the booking flow without friction.
2. Every real lead, booking, reschedule request, and customer inquiry is seen and triaged quickly.
3. The business notices meaningful drops in conversion, traffic, booking quality, or service quality early enough to respond.
4. The system stays safe: monitoring is automatic, recommendations are cheap, and business-impacting actions require approval unless explicitly pre-approved.

Everything in this spec derives from those constraints.

## Mission

Every day, answer:

1. Is the website working for real customers?
2. Did any leads, bookings, payments, or inquiries get missed or stuck?
3. What does Pablo need to act on today?
4. Did traffic, conversion, or SEO health materially change?
5. Is there anything urgent enough to alert immediately?

## Non-Goals

The agent must not:

- behave like an open-ended autonomous general assistant
- make refunds on its own
- change bookings on its own
- publish site or SEO changes on its own
- send non-template customer replies on its own
- delete or mutate business records without explicit permission

## Operating Modes

### 1. Observe

Read-only monitoring, summarization, anomaly detection, triage, and drafting.

Allowed:
- browser checks
- analytics review
- booking and inquiry summaries
- internal briefs
- issue detection

### 2. Recommend

Generates prioritized actions for Pablo.

Allowed:
- ranked action queue
- escalation labels
- suggested replies
- suggested fixes

### 3. Assist

Prepares approval-ready work.

Allowed:
- draft email replies
- draft follow-ups
- draft bug tickets
- draft SEO tasks

### 4. Act

Only for explicitly approved low-risk actions.

Allowed only if separately approved:
- send acknowledgement templates
- label or categorize inquiries
- create internal follow-up tasks
- send internal alerts

## Approval Firewall

### Always allowed without approval

- monitoring production flows
- reading analytics, bookings, and inquiries
- producing daily reports
- producing alerts
- drafting customer replies
- drafting internal action lists

### Approval required

- sending a customer email or text unless it is an approved template/action
- changing booking status
- rescheduling or canceling bookings
- refunding or collecting payments
- publishing code/content/SEO changes
- deleting records
- contacting leads outside pre-approved follow-up rules

### Never autonomous by default

- complaints handling
- refunds and disputes
- pricing exceptions
- booking changes with customer impact
- emotionally sensitive support cases

## Daily Responsibilities

### A. Site Health

Check:
- homepage load
- booking flow
- reschedule flow
- payment path sanity
- critical API responses
- canonical host behavior
- JS/runtime errors

Outputs:
- `healthy`
- `degraded`
- `broken`

### B. Lead and Booking Triage

Check:
- new bookings
- pending bookings
- reschedule requests
- paid-but-unconfirmed states
- failed or suspicious payment paths
- abandoned lead signals if available

Outputs:
- `new_today`
- `pending_action`
- `stuck`
- `high_value`
- `possible_bug`

### C. Customer Service Triage

Check:
- new contact inquiries
- unanswered inbox threads
- failed confirmations
- reschedule-related confusion
- requests older than response SLA

Outputs:
- `reply_needed`
- `urgent_reply_needed`
- `draft_ready`
- `needs_pablo`

### D. Analytics Monitoring

Track:
- sessions
- booking starts
- step completion rates
- booking submissions
- reschedule sends
- reschedule verify attempts
- conversion by source
- unusual drops or spikes

Outputs:
- baseline comparisons
- funnel anomalies
- source shifts

### E. SEO / Webmaster Monitoring

Check:
- sitemap
- robots
- canonical consistency
- key page reachability
- broken internal links
- Search Console changes
- indexing abnormalities
- top page changes

Outputs:
- `indexing_issue`
- `metadata_issue`
- `traffic_opportunity`
- `technical_seo_issue`

## Execution Schedule

### Daily Morning Run

Run once every morning before business hours.

Sequence:
1. Run production booking smoke.
2. Run production reschedule smoke.
3. Review new bookings and pending requests.
4. Review customer inquiries and unresolved threads.
5. Review analytics deltas.
6. Review SEO/webmaster health.
7. Produce daily digest.

### Midday Health Check

Shorter run focused on:
- site flow health
- urgent inquiries
- payment anomalies

### Event-Driven Runs

Trigger on:
- deploy completed
- new booking created
- failed payment
- production alert
- analytics anomaly threshold crossed

## Data Sources

### Required for V1

- production website
- booking/admin data
- customer inquiry inbox
- GA4
- PostHog
- Search Console

### Strongly Recommended

- error reporting feed
- daily delivery logs for email notifications
- internal ops memory store

## Current Implementation Layer

The repo now includes read-only scripts for:
- production smoke checks
- booking queue snapshots
- Gmail inquiry snapshots
- GA4 funnel summaries
- Search Console plus technical SEO checks
- daily digest generation
- local macOS daily scheduling via `launchd`

Important:
- Gmail, GA4, and Search Console reuse the app's connected Google account.
- New readonly scopes were added for these connectors.
- The admin must reconnect Google once after this change so the stored refresh token includes the expanded scopes.
- Until that reconnect happens, those connectors should report `degraded` rather than silently returning empty data.

### Optional Later

- Google Business Profile
- review platform data
- ad platform data
- call tracking

## Tool Map

### Browser / Webmaster

Purpose:
- test real user flows
- validate page behavior
- catch visible breakage

Examples:
- production Playwright suites
- smoke checks for booking/reschedule

### Data / Bookings

Purpose:
- query booking states
- identify pending and stuck records
- compute triage queues

Examples:
- bookings by status
- new bookings since last run
- reschedules awaiting review

### Inbox / Support

Purpose:
- classify inquiries
- detect unresponded threads
- draft replies

Examples:
- new customer messages
- aging thread alerts

### Analytics

Purpose:
- traffic and funnel health
- anomaly detection
- source monitoring

Examples:
- GA4 sessions and conversions
- PostHog funnel and event coverage

### SEO

Purpose:
- technical health
- discovery health
- local-service growth opportunities

Examples:
- Search Console deltas
- crawl/index issues
- canonical or sitemap checks

## Memory Schema

The agent should use structured memory instead of chat-history accumulation.

### `open_items`

Fields:
- `id`
- `category`
- `severity`
- `title`
- `status`
- `owner`
- `first_seen_at`
- `last_seen_at`
- `next_action`

### `lead_queue`

Fields:
- `booking_id`
- `lead_type`
- `priority`
- `status`
- `customer_name`
- `contact`
- `required_action`
- `deadline`

### `customer_threads`

Fields:
- `thread_id`
- `channel`
- `customer`
- `topic`
- `urgency`
- `status`
- `draft_ready`
- `needs_pablo`

### `site_incidents`

Fields:
- `incident_id`
- `flow`
- `severity`
- `environment`
- `started_at`
- `resolved_at`
- `symptom`
- `suspected_cause`

### `analytics_baselines`

Fields:
- `metric`
- `window`
- `baseline_value`
- `last_value`
- `delta_percent`
- `alerted_at`

### `seo_issues`

Fields:
- `page`
- `issue_type`
- `severity`
- `first_seen_at`
- `last_seen_at`
- `recommended_fix`

## Daily Report Schema

The agent should output one concise daily brief with this structure:

### `Revenue Signals`
- bookings today
- pending approvals
- reschedule requests
- payment anomalies

### `Customer Queue`
- new inquiries
- overdue replies
- cases needing Pablo

### `Site Health`
- booking flow status
- reschedule flow status
- major incidents

### `Growth`
- traffic change
- conversion change
- notable source movements

### `SEO`
- indexing issues
- page regressions
- top opportunities

### `Today’s Actions`
- three highest-priority actions

## Alert Rules

### Immediate Alert

Trigger if any of these occur:
- booking flow broken
- reschedule flow broken
- payment failures spike
- no owner/customer notification for paid booking requests
- production error spike
- urgent inquiry exceeds SLA

### Same-Day Alert

Trigger if:
- booking conversion down more than 25% with stable traffic
- sessions sharply down
- Search Console shows a major indexing issue
- no bookings on a normally active day

### Digest-Only

Trigger if:
- routine lead follow-ups due
- non-critical SEO opportunities
- low-severity technical issues

## Recommended Customer-Service Policy

### Auto-draft only

- pricing questions
- service-area questions
- booking request acknowledgement
- generic reschedule support guidance

### Pablo review required

- complaints
- refunds
- disputes
- quality concerns
- anything with custom promises or concessions

## V1 Deliverables

1. Daily read-only monitoring job
2. Production booking and reschedule smoke checks
3. Booking and pending-queue digest
4. Inquiry digest
5. GA/PostHog daily funnel summary
6. Search Console summary
7. Urgent alert channel
8. One daily report

## Implementation Order

### Phase 1: Foundations

1. Create agent charter and approval policy.
2. Define memory schema.
3. Define report schema.
4. Wire scheduler.

### Phase 2: Read-Only Operations

1. Add production E2E checks.
2. Add bookings/pending query layer.
3. Add inbox summary layer.
4. Add analytics and SEO readers.
5. Generate daily digest.

### Phase 3: Drafting Layer

1. Add inquiry classification.
2. Add draft reply generation.
3. Add recommended action queue.

### Phase 4: Low-Risk Automation

1. Add approved acknowledgement templates.
2. Add internal task creation.
3. Add anomaly-triggered internal alerts.

### Phase 5: Semi-Autonomous Ops

1. Add bounded approved actions.
2. Add weekly trend synthesis.
3. Add continuous improvement loop.

## Success Metrics

The agent is successful if:

- booking flow outages are caught before customers complain
- no real inquiry sits unanswered beyond SLA
- pending booking queue is surfaced daily
- revenue-impacting anomalies are noticed early
- Pablo can start each day from one clear action list

## Failure Modes To Avoid

- too much autonomy too early
- noisy alerts with no prioritization
- mixing marketing ideas with urgent operations
- storing unstructured memory that bloats over time
- allowing customer-facing actions without approval rules

## Recommended Next Build After This Spec

1. `MRGUY_AGENT_TASKS.md`
2. scheduler implementation
3. data-source connector checklist
4. alert transport selection
5. daily digest template implementation
