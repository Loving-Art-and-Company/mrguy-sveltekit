import { test, expect, type Page } from '@playwright/test';

const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const NO_SLOTS_AVAILABLE_ERROR = 'No available booking times found in the public booking flow';
const RESCHEDULE_TEST_EMAIL = process.env.RESCHEDULE_TEST_EMAIL;
const RESCHEDULE_MISSING_EMAIL_PHONE = process.env.RESCHEDULE_MISSING_EMAIL_PHONE;
const RESCHEDULE_MULTI_EMAIL_PHONE = process.env.RESCHEDULE_MULTI_EMAIL_PHONE;

const RESCHEDULE_BOOKING = {
  service: 'Quick Refresh',
  name: `Reschedule Test ${RUN_ID}`,
  phone: `954${RUN_ID.slice(-7)}`,
  email: RESCHEDULE_TEST_EMAIL ?? '',
  street: '123 Reschedule Lane',
  city: 'Weston',
  zip: '33326',
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

async function openReschedule(page: Page) {
  await page.goto('/reschedule');
  await expect(page.getByRole('heading', { name: 'Enter Your Phone Number' })).toBeVisible();
}

async function submitReschedulePhone(page: Page, phone: string) {
  await page.getByPlaceholder('(954) 555-1234').fill(phone);
  await page.getByRole('button', { name: 'Email Verification Code' }).click();
}

async function selectService(page: Page, serviceName: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('main[data-hydrated="true"]', { timeout: 15000 });
  await page.waitForSelector('#services', { timeout: 10000 });

  const serviceCard = page.locator('article.card', { hasText: serviceName }).first();
  await expect(serviceCard).toBeVisible({ timeout: 10000 });

  const bookButton = serviceCard.locator('button.select-btn', { hasText: /book now/i });
  await bookButton.scrollIntoViewIfNeeded();
  await expect(bookButton).toBeVisible({ timeout: 5000 });
  await bookButton.click({ timeout: 5000 });
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
}

async function waitForAvailabilityToSettle(page: Page) {
  await page.waitForSelector('.time-grid', { timeout: 5000 });
  await page.waitForFunction(() => {
    const helperText = Array.from(document.querySelectorAll<HTMLElement>('.helper-text, .error'))
      .map((el) => el.textContent?.trim() || '');

    return !helperText.some((text) => text.includes('Checking the latest availability'));
  }, { timeout: 10000 });
}

async function fillStep1(page: Page) {
  const dateButtons = page.locator('.date-grid .date-btn');
  await expect(dateButtons.first()).toBeVisible({ timeout: 5000 });

  const dateCount = await dateButtons.count();

  for (let index = 0; index < dateCount; index++) {
    await dateButtons.nth(index).click();
    await waitForAvailabilityToSettle(page);

    const availableTimeButton = page.locator('.time-grid .time-btn:not([disabled])').first();
    if (await availableTimeButton.isVisible().catch(() => false)) {
      await availableTimeButton.click();
      await page.locator('.continue-btn').click();
      await expect(page.locator('input[placeholder="123 Main St"]')).toBeVisible({ timeout: 5000 });
      return;
    }
  }

  throw new Error(NO_SLOTS_AVAILABLE_ERROR);
}

async function fillStep2(page: Page) {
  await page.locator('input[placeholder="123 Main St"]').fill(RESCHEDULE_BOOKING.street);
  const cityInput = page.locator('input[placeholder="Weston"]');
  await cityInput.clear();
  await cityInput.fill(RESCHEDULE_BOOKING.city);
  await page.locator('input[placeholder="33326"]').fill(RESCHEDULE_BOOKING.zip);
  await page.locator('.continue-btn').click();
  await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible({ timeout: 5000 });
}

async function fillStep3AndSubmit(page: Page) {
  await page.locator('input[placeholder="John Doe"]').fill(RESCHEDULE_BOOKING.name);
  await page.locator('input[placeholder="(954) 555-1234"]').fill(RESCHEDULE_BOOKING.phone);
  await page.locator('input[placeholder="you@email.com"]').fill(RESCHEDULE_BOOKING.email);
  await page.locator('.submit-btn').click();
  await page.waitForSelector('.success-screen, .submit-error', { timeout: 15000 });

  const success = await page.locator('.success-screen').isVisible().catch(() => false);
  if (!success) {
    const submitError = await page.locator('.submit-error').textContent().catch(() => '');
    throw new Error(submitError || 'Booking submission failed');
  }
}

test.describe('Reschedule Flow E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('creates a booking and reaches email verification on reschedule', async ({ page }) => {
    test.skip(!RESCHEDULE_TEST_EMAIL, 'Set RESCHEDULE_TEST_EMAIL to run the production reschedule E2E.');

    await selectService(page, RESCHEDULE_BOOKING.service);
    await fillStep1(page);
    await fillStep2(page);
    await fillStep3AndSubmit(page);

    await openReschedule(page);
    await submitReschedulePhone(page, RESCHEDULE_BOOKING.phone);

    await expect(page.getByRole('heading', { name: 'Enter Verification Code' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.desc')).toContainText(maskEmail(RESCHEDULE_TEST_EMAIL!));
  });

  test('rejects an invalid verification code after sending email verification', async ({ page }) => {
    test.skip(!RESCHEDULE_TEST_EMAIL, 'Set RESCHEDULE_TEST_EMAIL to run the production reschedule E2E.');

    await openReschedule(page);
    await submitReschedulePhone(page, RESCHEDULE_BOOKING.phone);

    await expect(page.getByRole('heading', { name: 'Enter Verification Code' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.desc')).toContainText(maskEmail(RESCHEDULE_TEST_EMAIL!));

    await page.locator('.otp-digit').first().fill('0');
    await page.locator('.otp-digit').nth(1).fill('0');
    await page.locator('.otp-digit').nth(2).fill('0');
    await page.locator('.otp-digit').nth(3).fill('0');
    await page.locator('.otp-digit').nth(4).fill('0');
    await page.locator('.otp-digit').nth(5).fill('0');

    await page.getByRole('button', { name: 'Verify and Continue' }).click();
    await expect(page.locator('.error')).toContainText('Invalid or expired verification code', { timeout: 15000 });
  });

  test('shows support message when no email is on file for the phone number', async ({ page }) => {
    test.skip(
      !RESCHEDULE_MISSING_EMAIL_PHONE,
      'Set RESCHEDULE_MISSING_EMAIL_PHONE to a production booking phone with no email on file.'
    );

    await openReschedule(page);
    await submitReschedulePhone(page, RESCHEDULE_MISSING_EMAIL_PHONE!);

    await expect(page.locator('.error')).toContainText(
      'We could not find an email address for this booking. Please call 954-804-4747 for help.',
      { timeout: 15000 }
    );
    await expect(page.getByRole('heading', { name: 'Enter Your Phone Number' })).toBeVisible();
  });

  test('shows support message when multiple emails exist for the same phone number', async ({ page }) => {
    test.skip(
      !RESCHEDULE_MULTI_EMAIL_PHONE,
      'Set RESCHEDULE_MULTI_EMAIL_PHONE to a production phone linked to multiple booking emails.'
    );

    await openReschedule(page);
    await submitReschedulePhone(page, RESCHEDULE_MULTI_EMAIL_PHONE!);

    await expect(page.locator('.error')).toContainText(
      'We found multiple emails for this phone number. Please call 954-804-4747 for help.',
      { timeout: 15000 }
    );
    await expect(page.getByRole('heading', { name: 'Enter Your Phone Number' })).toBeVisible();
  });
});
