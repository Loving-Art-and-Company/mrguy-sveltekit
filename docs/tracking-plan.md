# MrGuy Detail Tracking Plan

## Overview
- Tools: PostHog (`posthog-js`)
- Implementation owner: Engineering
- Last updated: 2026-02-26
- Primary decisions supported:
  - Which channels and CTAs generate qualified booking intent?
  - Where do users drop off in the booking and reschedule funnels?
  - How much conversion value is tied to promo visibility/applied promo?

## Naming Conventions
- Lowercase, underscore-separated event names
- Object-action style (for example, `booking_success`, `cta_clicked`)
- Context captured in properties, not event name
- No PII in event properties

## Standard Context (auto-attached)
- `page_path`
- Current UTMs (when present): `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- First-touch UTMs: `first_utm_*`
- Last-touch UTMs: `last_utm_*`
- `landing_path`, `landing_at`
- `referrer_host` (if present)

## Event Schema

| Event Name | Description | Properties | Trigger |
|------------|-------------|------------|---------|
| `$pageview` | Page view event | `$current_url` + standard context | Route navigation |
| `cta_clicked` | High-intent CTA click | `cta_type`, `location` | Header/footer CTA interactions |
| `promo_banner_viewed` | Promo impression | `location` | Homepage promo banner render |
| `package_selected` | Package selected from homepage | `service_id`, `service_name`, `quoted_price`, `location` | Homepage package selection |
| `booking_modal_opened` | Booking modal opened | `service_id`, `service_name`, `quoted_price`, `promo_visible` | Booking modal open |
| `booking_edit_service` | Service change action in modal | `service_id`, `service_name`, `step_name` | Change service click |
| `booking_step_completed` | Booking step completion | `step_index`, `step_name`, `service_id`, `service_name` | Step continue click |
| `booking_submit` | Booking submitted to API | `service_id`, `service_name`, `quoted_price`, `promo_visible`, `has_email`, `step_index`, `step_name` | Final submit click |
| `booking_success` | Booking API success | `service_id`, `service_name`, `quoted_price`, `final_price`, `promo_applied`, `booking_id` | Successful booking response |
| `booking_error` | Booking API failure | `service_id`, `service_name`, `quoted_price`, `step_index`, `step_name` | Failed booking response |
| `booking_modal_closed` | Booking modal dismissed/closed | `step_index`, `step_name`, `completed`, `service_id`, `service_name` | Modal close |
| `reschedule_lookup_submitted` | Reschedule lookup attempt | - | Reschedule lookup submit |
| `reschedule_lookup_success` | Reschedule lookup success | `booking_count` | Lookup success response |
| `reschedule_lookup_failed` | Reschedule lookup failure | - | Lookup failure response |
| `reschedule_booking_selected` | Booking chosen for reschedule | `booking_id`, `service_name`, `booking_status` | Booking selection in reschedule flow |
| `reschedule_submit` | Reschedule submit to API | `booking_id`, `old_date`, `new_date`, `new_time` | Reschedule confirm click |
| `reschedule_success` | Reschedule API success | `booking_id`, `new_date`, `new_time` | Successful reschedule response |
| `reschedule_failed` | Reschedule API failure | `booking_id` | Failed reschedule response |
| `reschedule_flow_reset` | Reschedule flow reset | `from_step` | Start over click |
| `reschedule_back_clicked` | Back-to-bookings action | - | Back button in flow |

## Conversions

| Conversion | Event | Counting |
|------------|-------|----------|
| Primary Booking Conversion | `booking_success` | Once per booking |
| Reschedule Completion | `reschedule_success` | Once per successful reschedule |
| High-Intent Lead Action | `cta_clicked` where `cta_type=phone_call` | Per click |

## Data Quality Checklist
- Verify all events in PostHog live events during manual funnel test
- Confirm no phone/email/address values are sent as properties
- Confirm `first_utm_*` persists across subsequent page views
- Confirm no duplicate `booking_submit` or `booking_success` on single submission

## Next Recommended Enhancements
- Add server-side PostHog capture for booking/reschedule endpoints to reduce client-loss risk
- Add explicit channel grouping property (`channel_group`) for reporting
- Add cohort dashboard for promo vs non-promo booking conversion rate
