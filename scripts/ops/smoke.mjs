import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://mrguydetail.com';

async function runCheck(name, fn) {
  try {
    const detail = await fn();
    return { name, status: 'passed', detail };
  } catch (error) {
    return {
      name,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function waitForAvailabilityToSettle(page) {
  await page.waitForSelector('.time-grid', { timeout: 5000 });
  await page.waitForFunction(() => {
    const helperText = Array.from(document.querySelectorAll('.helper-text, .error'))
      .map((el) => el.textContent?.trim() || '');
    return !helperText.some((text) => text.includes('Checking the latest availability'));
  }, { timeout: 10000 });
}

export async function runSmokeSuite() {
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const checks = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    checks.push(await runCheck('homepage_load', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('main[data-hydrated="true"]', { timeout: 15000 });
      await page.getByRole('heading', { name: /Skip the Car Wash Line/i }).waitFor({ timeout: 10000 });
      return 'Homepage rendered and hydrated';
    }));

    checks.push(await runCheck('booking_modal', async () => {
      const firstBookButton = page.locator('button.select-btn').first();
      await firstBookButton.scrollIntoViewIfNeeded();
      await firstBookButton.click();
      await page.waitForSelector('.modal-overlay', { timeout: 10000 });
      await page.getByRole('heading', { name: 'Book Appointment' }).waitFor({ timeout: 10000 });
      return 'Booking modal opened';
    }));

    checks.push(await runCheck('booking_availability', async () => {
      const firstDate = page.locator('.date-grid .date-btn').first();
      await firstDate.click();
      await waitForAvailabilityToSettle(page);
      const availableCount = await page.locator('.time-grid .time-btn:not([disabled])').count();
      if (availableCount < 1) {
        throw new Error('No enabled booking time slots were found in the visible booking modal');
      }
      return `${availableCount} enabled booking time slots available`;
    }));

    checks.push(await runCheck('reschedule_page', async () => {
      await page.goto(`${BASE_URL}/reschedule`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.getByRole('heading', { name: 'Enter Your Phone Number' }).waitFor({ timeout: 10000 });
      const desc = await page.locator('.desc').first().textContent();
      if (!desc?.includes('verification code')) {
        throw new Error(`Unexpected reschedule copy: ${desc ?? 'missing'}`);
      }
      return 'Reschedule page loaded with email verification copy';
    }));
  } finally {
    await browser.close();
  }

  const failedChecks = checks.filter((check) => check.status === 'failed');

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    ok: failedChecks.length === 0,
    checks,
    consoleErrors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonMode = process.argv.includes('--json');
  const report = await runSmokeSuite();

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`# Production Smoke`);
    console.log(`Base URL: ${report.baseUrl}`);
    console.log(`Status: ${report.ok ? 'OK' : 'FAILED'}`);
    for (const check of report.checks) {
      console.log(`- ${check.name}: ${check.status} (${check.detail})`);
    }
    if (report.consoleErrors.length > 0) {
      console.log(`Console errors: ${report.consoleErrors.length}`);
    }
  }
}
