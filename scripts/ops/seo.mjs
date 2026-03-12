import { loadLocalEnv } from './env.mjs';
import { googleApiFetch } from './google-auth.mjs';

async function checkUrl(url) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return {
      ok: response.ok,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchSearchConsoleOverview(siteUrl) {
  const body = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    rowLimit: 5,
    dimensions: ['page'],
  };

  return googleApiFetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export async function getSeoSnapshot() {
  loadLocalEnv();

  const baseUrl = process.env.BASE_URL ?? process.env.PUBLIC_BASE_URL ?? 'https://mrguydetail.com';
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ?? baseUrl;

  const [robots, sitemap, searchConsole] = await Promise.all([
    checkUrl(new URL('/robots.txt', baseUrl).toString()),
    checkUrl(new URL('/sitemap.xml', baseUrl).toString()),
    fetchSearchConsoleOverview(siteUrl),
  ]);

  const actions = [];
  if (!robots.ok) {
    actions.push({
      severity: 'medium',
      type: 'robots_health',
      message: 'robots.txt did not return 200.',
    });
  }

  if (!sitemap.ok) {
    actions.push({
      severity: 'medium',
      type: 'sitemap_health',
      message: 'sitemap.xml did not return 200.',
    });
  }

  if (!searchConsole.ok) {
    return {
      generatedAt: new Date().toISOString(),
      status: robots.ok && sitemap.ok ? 'degraded' : 'failed',
      reason: searchConsole.reason,
      technical: { robots, sitemap },
      searchConsole: {
        status: searchConsole.status,
        reason: searchConsole.reason,
      },
      actions: [
        ...actions,
        {
          severity: 'low',
          type: 'search_console_connector',
          message: 'Reconnect Google with Search Console Readonly scope or verify GOOGLE_SEARCH_CONSOLE_SITE_URL.',
        },
      ],
    };
  }

  const rows = searchConsole.data.rows ?? [];
  const totals = rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + (row.clicks ?? 0),
      impressions: acc.impressions + (row.impressions ?? 0),
    }),
    { clicks: 0, impressions: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    status: actions.length > 0 ? 'degraded' : 'ok',
    reason: 'SEO snapshot loaded.',
    technical: { robots, sitemap },
    searchConsole: {
      status: 'ok',
      accountEmail: searchConsole.accountEmail ?? null,
      siteUrl,
      topPages: rows.map((row) => ({
        page: row.keys?.[0] ?? '',
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      })),
      totals,
    },
    actions,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snapshot = await getSeoSnapshot();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`# SEO Snapshot`);
    console.log(`Status: ${snapshot.status}`);
    console.log(`Reason: ${snapshot.reason}`);
    console.log(`robots.txt: ${snapshot.technical.robots.status}`);
    console.log(`sitemap.xml: ${snapshot.technical.sitemap.status}`);
  }
}
