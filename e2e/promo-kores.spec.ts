import { test, expect } from '@playwright/test';

test.describe('KoRes Promo Form — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/promo/kores');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with all form fields and CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Redeem Your Free Wash' })).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Claim My Free Wash' })).toBeVisible();
  });

  test('browser validation blocks empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Claim My Free Wash' }).click();
    // Should still be on form — no success message
    await expect(page.getByRole('heading', { name: 'Redeem Your Free Wash' })).toBeVisible();
    await expect(page.getByText("You're All Set")).not.toBeVisible();
  });

  test('upgrade selection toggles and updates total', async ({ page }) => {
    // Initially shows "100% Free"
    await expect(page.getByText('100% Free')).toBeVisible();

    // Click interior upgrade (+$37)
    await page.getByText('Add Interior Wash').click();
    await expect(page.locator('.total-amount')).toHaveText('$37');

    // Click wax upgrade (+$127)
    await page.getByText('Add Full Wax').click();
    await expect(page.locator('.total-amount')).toHaveText('$164');

    // Deselect interior
    await page.getByText('Add Interior Wash').click();
    await expect(page.locator('.total-amount')).toHaveText('$127');
  });

  test('full form submission succeeds and shows confirmation', async ({ page }) => {
    // Intercept the API call to verify request/response
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/bookings/promo') && resp.request().method() === 'POST'
    );

    // Fill form
    await page.locator('#name').fill('E2E Test User');
    await page.locator('#email').fill('e2e-test@example.com');
    await page.locator('#phone').fill('5551234567');
    await page.locator('#address').fill('999 Test Ave, Weston, FL 33326');

    // Submit
    await page.getByRole('button', { name: 'Claim My Free Wash' }).click();

    // Wait for API response
    const response = await responsePromise;
    const body = await response.json();

    // API should return 200 with success
    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.bookingId).toMatch(/^BK-/);

    // UI should show success state
    await expect(page.getByText("You're All Set")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('e2e-test@example.com')).toBeVisible();
  });

  test('form submission with upgrades includes them in request', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/bookings/promo') && resp.request().method() === 'POST'
    );

    // Select interior upgrade
    await page.getByText('Add Interior Wash').click();

    // Fill form
    await page.locator('#name').fill('E2E Upgrade Test');
    await page.locator('#email').fill('e2e-upgrade@example.com');
    await page.locator('#phone').fill('5559876543');
    await page.locator('#address').fill('888 Upgrade Blvd, Weston, FL 33326');

    // Submit
    await page.getByRole('button', { name: 'Claim My Free Wash' }).click();

    const response = await responsePromise;
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);

    // Verify the request included the upgrade
    const requestBody = JSON.parse(response.request().postData() || '{}');
    expect(requestBody.upgrades).toContain('interior');

    await expect(page.getByText("You're All Set")).toBeVisible({ timeout: 10000 });
  });
});
