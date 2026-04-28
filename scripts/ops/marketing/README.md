# AI Marketing Agents — Mr. Guy Mobile Detail

Fully autonomous marketing stack that runs inside the existing `mrguy-ops` daily pipeline.

Powered by **Google Gemini 2.0 Flash** with high-quality template fallbacks if the API is unavailable.

## Agents

### 1. Review Harvester (`review-harvester.mjs`)
**Job:** Find completed bookings and draft personalized review requests.

**Workflow:**
1. Queries bookings with `status = 'completed'` from the last 7 days
2. Skips anyone who already received a review request
3. Generates a personalized review-request draft via Gemini (falls back to templates if AI is unavailable)
4. Logs the draft for human review
5. Records every draft in `marketing_review_requests`

**Run manually:**
```bash
npm run ops:marketing:reviews
```

**Env required:**
- `GEMINI_API_KEY` — for AI personalization via Google Gemini (optional, has template fallback)
- `GBP_REVIEW_LINK` — direct link to Google review page (optional, has default)

---

### 2. GBP Bot (`gbp-bot.mjs`)
**Job:** Generate Google Business Profile post drafts weekly.

**Workflow:**
1. Looks at recent completed jobs for context
2. Generates 3 posts via Gemini:
   - Before/after story
   - City-specific offer
   - Florida car care tip
3. Saves drafts to `marketing_gbp_posts`
4. Human copies drafts into GBP and publishes

**Run manually:**
```bash
npm run ops:marketing:gbp
```

**Future upgrade:** Wire to Google Business Profile API for fully automated publishing.

---

### 3. Marketing Digest (`marketing-digest.mjs`)
**Job:** Feed stats into the daily ops digest.

Shows:
- Review requests sent (7 days)
- Total reviews received
- GBP drafts queued
- GBP posts published
- Recent draft previews

---

## Database Tables

### `marketing_review_requests`
Tracks every review request draft.

| Column | Purpose |
|--------|---------|
| `booking_id` | Link to booking |
| `contact` | Phone number |
| `message_body` | Draft message text |
| `status` | `draft` |
| `review_received` | Set to `true` when a review comes in |

### `marketing_gbp_posts`
Tracks generated GBP content.

| Column | Purpose |
|--------|---------|
| `post_type` | `story`, `offer`, `tip`, `general` |
| `content` | Full post body |
| `status` | `draft` / `published` |
| `generated_at` | When AI created it |
| `published_at` | When it went live on GBP |

---

## Scheduling

The marketing agents run automatically as part of the daily ops pipeline:

```bash
# Runs review-harvester + gbp-bot, then generates the full digest
bash scripts/run-ops-daily.sh
```

Install the daily schedule (already exists for main ops):
```bash
bash scripts/ops/install-daily-launchd.sh
```

Runs every morning at 7:00 AM local time.

---

## Quick Commands

```bash
# Set up DB tables
npm run ops:marketing:setup

# Run review harvester now
npm run ops:marketing:reviews

# Run GBP bot now
npm run ops:marketing:gbp

# View marketing stats
npm run ops:marketing:digest

# Full daily ops digest
npm run ops:digest
```

---

## 100% AI-Driven Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Review Harvester (drafts) | ✅ Live |
| 1 | GBP Bot (drafts) | ✅ Live |
| 1 | Marketing digest | ✅ Live |
| 2 | Auto-publish GBP posts via API | 📝 Next |
| 2 | Auto-respond to new GBP reviews | 📝 Next |
| 3 | City page generator | 📝 Next |
| 3 | Blog content factory | 📝 Next |
| 4 | Citation blitz automation | 📝 Next |
| 4 | Partnership outreach droid | 📝 Next |

---

## Blockers to Resolve

1. **Add `GEMINI_API_KEY`** to `.env.local` so the agents use Gemini instead of template fallbacks.
   - Get your free key at: https://aistudio.google.com/app/apikey
   - Generous free tier — enough for months of operation

2. **Add `GBP_REVIEW_LINK`** to `.env.local` so review request drafts route customers to your direct Google review URL.

---

## File Map

```
scripts/ops/marketing/
├── README.md                 # This file
├── db.mjs                    # DB connection helper
├── llm.mjs                   # Gemini API client
├── setup-marketing-db.mjs    # Creates tables
├── review-harvester.mjs      # Agent 1: review request drafts
├── gbp-bot.mjs               # Agent 2: GBP post drafts
└── marketing-digest.mjs      # Agent 3: Stats snapshot
```
