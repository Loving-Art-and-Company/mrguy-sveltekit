const PRIMARY_ORIGIN = process.env.PRIMARY_ORIGIN ?? 'https://mrguydetail.com';
const SECONDARY_ORIGIN = process.env.SECONDARY_ORIGIN ?? 'https://mrguymobiledetail.com';
const CHECK_PATHS = ['/', '/book', '/pay/success'];
const MAX_ATTEMPTS = Number(process.env.SMOKE_RETRIES ?? '12');
const DELAY_MS = Number(process.env.SMOKE_DELAY_MS ?? '15000');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchManual(url) {
  return fetch(url, {
    redirect: 'manual',
    headers: {
      'user-agent': 'mrguy-domain-smoke-test/1.0'
    }
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertPermanentRedirect(path) {
  const sourceUrl = new URL(path, SECONDARY_ORIGIN);
  const expectedUrl = new URL(path, PRIMARY_ORIGIN).toString();
  const response = await fetchManual(sourceUrl);
  const location = response.headers.get('location');

  assert(
    response.status === 301 || response.status === 308,
    `Expected ${sourceUrl} to return 301/308, got ${response.status}`
  );
  assert(location === expectedUrl, `Expected redirect to ${expectedUrl}, got ${location ?? 'null'}`);
}

async function assertPrimaryHomepageMetadata() {
  const response = await fetch(new URL('/', PRIMARY_ORIGIN), {
    headers: {
      'user-agent': 'mrguy-domain-smoke-test/1.0'
    }
  });
  const html = await response.text();

  assert(response.ok, `Expected ${PRIMARY_ORIGIN}/ to return 200, got ${response.status}`);
  assert(
    html.includes(`<link rel="canonical" href="${PRIMARY_ORIGIN}/"`),
    `Expected primary homepage canonical tag to point at ${PRIMARY_ORIGIN}/`
  );
  assert(
    !html.includes(SECONDARY_ORIGIN),
    `Expected primary homepage HTML not to reference ${SECONDARY_ORIGIN}`
  );
}

async function runChecks() {
  for (const path of CHECK_PATHS) {
    await assertPermanentRedirect(path);
  }

  await assertPrimaryHomepageMetadata();
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    await runChecks();
    console.log(
      `Domain smoke test passed: ${SECONDARY_ORIGIN} permanently redirects to ${PRIMARY_ORIGIN}`
    );
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`);

    if (attempt === MAX_ATTEMPTS) {
      process.exit(1);
    }

    await sleep(DELAY_MS);
  }
}
