import { loadLocalEnv } from './env.mjs';
import { googleApiFetch } from './google-auth.mjs';

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return null;
  return `${(value * 100).toFixed(1)}%`;
}

function toNumber(value) {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function diffPercent(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function buildDateRange(daysAgoStart, daysAgoEnd) {
  return { startDate: `${daysAgoStart}daysAgo`, endDate: `${daysAgoEnd}daysAgo` };
}

async function fetchGa4Overview(propertyId) {
  const response = await googleApiFetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [buildDateRange(7, 1), buildDateRange(14, 8)],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
      }),
    },
  );

  if (!response.ok) return response;

  const rows = response.data.rows ?? [];
  const current = rows[0]?.metricValues ?? [];
  const previous = rows[1]?.metricValues ?? [];

  return {
    ok: true,
    status: 'ok',
    accountEmail: response.accountEmail,
    current: {
      sessions: toNumber(current[0]?.value),
      users: toNumber(current[1]?.value),
      pageviews: toNumber(current[2]?.value),
    },
    previous: {
      sessions: toNumber(previous[0]?.value),
      users: toNumber(previous[1]?.value),
      pageviews: toNumber(previous[2]?.value),
    },
  };
}

async function fetchGa4Events(propertyId) {
  const response = await googleApiFetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [buildDateRange(7, 1)],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'booking_modal_opened',
                'booking_submit',
                'booking_success',
                'reschedule_lookup_submitted',
                'reschedule_success',
              ],
            },
          },
        },
        limit: 20,
      }),
    },
  );

  if (!response.ok) return response;

  const eventCounts = {};
  for (const row of response.data.rows ?? []) {
    const name = row.dimensionValues?.[0]?.value;
    if (!name) continue;
    eventCounts[name] = toNumber(row.metricValues?.[0]?.value);
  }

  return {
    ok: true,
    status: 'ok',
    accountEmail: response.accountEmail,
    eventCounts,
  };
}

export async function getAnalyticsSnapshot() {
  loadLocalEnv();

  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const posthogKey = process.env.PUBLIC_POSTHOG_KEY;
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
  const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!propertyId) {
    return {
      generatedAt: new Date().toISOString(),
      status: 'unconfigured',
      reason: 'GOOGLE_ANALYTICS_PROPERTY_ID is not configured.',
      sources: {
        ga4: { status: 'unconfigured' },
        posthog: {
          status: posthogKey ? 'configured_client_only' : 'unconfigured',
          reason: posthogKey
            ? 'Client-side PostHog is configured, but no PostHog API credentials are configured for ops reporting.'
            : 'PostHog is not configured.',
        },
      },
      actions: [
        {
          severity: 'medium',
          type: 'analytics_connector',
          message: 'Configure GOOGLE_ANALYTICS_PROPERTY_ID for daily funnel reporting.',
        },
      ],
    };
  }

  const [overview, events] = await Promise.all([fetchGa4Overview(propertyId), fetchGa4Events(propertyId)]);

  const posthogStatus = posthogApiKey && posthogProjectId
    ? {
        status: 'configured',
        reason: 'PostHog API credentials are configured for future expansion.',
      }
    : posthogKey
      ? {
          status: 'configured_client_only',
          reason: 'PostHog browser tracking is configured. Add POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID to pull it into the ops digest.',
        }
      : {
          status: 'unconfigured',
          reason: 'PostHog is not configured.',
        };

  if (!overview.ok) {
    return {
      generatedAt: new Date().toISOString(),
      status: overview.status,
      reason: overview.reason,
      sources: {
        ga4: {
          status: overview.status,
          reason: overview.reason,
        },
        posthog: posthogStatus,
      },
      actions: [
        {
          severity: 'medium',
          type: 'analytics_access',
          message: 'Reconnect Google with Analytics Readonly scope or verify GOOGLE_ANALYTICS_PROPERTY_ID.',
        },
      ],
    };
  }

  const eventCounts = events.ok ? events.eventCounts : {};
  const bookingOpens = eventCounts.booking_modal_opened ?? 0;
  const bookingSubmits = eventCounts.booking_submit ?? 0;
  const bookingSuccesses = eventCounts.booking_success ?? 0;
  const rescheduleStarts = eventCounts.reschedule_lookup_submitted ?? 0;
  const rescheduleSuccesses = eventCounts.reschedule_success ?? 0;

  const actions = [];
  const sessionDelta = diffPercent(overview.current.sessions, overview.previous.sessions);
  const bookingRate = bookingOpens > 0 ? bookingSuccesses / bookingOpens : null;

  if (sessionDelta != null && sessionDelta <= -25) {
    actions.push({
      severity: 'medium',
      type: 'traffic_drop',
      message: `Sessions are down ${sessionDelta.toFixed(1)}% versus the prior 7-day window.`,
    });
  }

  if (bookingOpens > 0 && bookingSuccesses === 0) {
    actions.push({
      severity: 'high',
      type: 'booking_funnel_zero_success',
      message: 'Booking funnel has opens but zero booking_success events in the last 7 days.',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    status: events.ok ? 'ok' : 'degraded',
    reason: events.ok ? 'GA4 funnel snapshot loaded.' : `GA4 traffic loaded but funnel events failed: ${events.reason}`,
    accountEmail: overview.accountEmail ?? events.accountEmail ?? null,
    sources: {
      ga4: {
        status: events.ok ? 'ok' : 'degraded',
        propertyId,
      },
      posthog: posthogStatus,
    },
    traffic: {
      current7Days: overview.current,
      previous7Days: overview.previous,
      sessionDeltaPercent: sessionDelta,
    },
    funnel: {
      bookingModalOpened: bookingOpens,
      bookingSubmit: bookingSubmits,
      bookingSuccess: bookingSuccesses,
      bookingOpenToSuccessRate: formatPercent(bookingRate),
      rescheduleLookupSubmitted: rescheduleStarts,
      rescheduleSuccess: rescheduleSuccesses,
      rescheduleCompletionRate: formatPercent(rescheduleStarts > 0 ? rescheduleSuccesses / rescheduleStarts : null),
    },
    actions,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snapshot = await getAnalyticsSnapshot();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`# Analytics Snapshot`);
    console.log(`Status: ${snapshot.status}`);
    console.log(`Reason: ${snapshot.reason}`);
    if (snapshot.traffic) {
      console.log(`Sessions (7d): ${snapshot.traffic.current7Days.sessions}`);
      console.log(`Booking success (7d): ${snapshot.funnel.bookingSuccess}`);
    }
  }
}
