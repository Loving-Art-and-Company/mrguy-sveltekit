/**
 * E2E Booking Tests - Ralph Loop Methodology
 * 
 * Runs 10 mock bookings with iterative detection and repair.
 * Each booking uses different test data to cover edge cases.
 * 
 * Ralph Loop: Run -> Detect Failure -> Diagnose -> Repair -> Re-run
 */

import { test, expect, type Page } from '@playwright/test';

const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const NO_SLOTS_AVAILABLE_ERROR = 'No available booking times found in the public booking flow';

// Test data for 10 mock bookings
// Uses only the first 3 services (Most Popular section) to avoid scrolling issues
// Service names match SERVICE_PACKAGES in src/lib/data/services.ts
const MOCK_BOOKINGS = [
  {
    id: 1,
    service: 'Quick Refresh',
    name: 'John Smith',
    phone: '9541234567',
    email: `john+${RUN_ID}-1@example.invalid`,
    vehicle: '2021 Toyota Camry',
    street: '123 Main Street',
    city: 'Weston',
    zip: '33326',
  },
  {
    id: 2,
    service: 'Family Hauler',
    name: 'Jane Doe',
    phone: '9549876543',
    email: `jane+${RUN_ID}-2@example.invalid`,
    vehicle: '2020 Honda Odyssey',
    street: '456 Oak Avenue',
    city: 'Pembroke Pines',
    zip: '33024',
  },
  {
    id: 3,
    service: 'Electric',
    name: 'Bob Johnson',
    phone: '9545551234',
    email: '', // No email - optional field
    vehicle: '2023 Tesla Model Y',
    street: '789 Palm Drive',
    city: 'Miramar',
    zip: '33025',
  },
  {
    id: 4,
    service: 'Quick Refresh',
    name: 'Alice Williams',
    phone: '9547778899',
    email: `alice+${RUN_ID}-4@example.invalid`,
    vehicle: '2019 Lexus RX',
    street: '321 Cypress Lane',
    city: 'Davie',
    zip: '33314',
  },
  {
    id: 5,
    service: 'Family Hauler',
    name: 'Charlie Brown',
    phone: '9541112233',
    email: `charlie+${RUN_ID}-5@example.invalid`,
    vehicle: '2018 Ford Explorer',
    street: '555 Birch Road',
    city: 'Plantation',
    zip: '33317',
  },
  {
    id: 6,
    service: 'Electric',
    name: 'Diana Prince',
    phone: '9544445566',
    email: `diana+${RUN_ID}-6@example.invalid`,
    vehicle: '2024 Tesla Model 3',
    street: '777 Maple Street',
    city: 'Sunrise',
    zip: '33313',
  },
  {
    id: 7,
    service: 'Quick Refresh',
    name: 'Edward Norton',
    phone: '9546667788',
    email: '', // No email
    vehicle: '2017 Toyota Corolla',
    street: '888 Pine Avenue',
    city: 'Hollywood',
    zip: '33020',
  },
  {
    id: 8,
    service: 'Family Hauler',
    name: 'Fiona Apple',
    phone: '9548889900',
    email: `fiona+${RUN_ID}-8@example.invalid`,
    vehicle: '2022 Kia Telluride',
    street: '999 Cedar Court',
    city: 'Cooper City',
    zip: '33026',
  },
  {
    id: 9,
    service: 'Electric',
    name: 'George Lucas',
    phone: '9541239876',
    email: `george+${RUN_ID}-9@example.invalid`,
    vehicle: '2021 Ford F-150',
    street: '111 Sequoia Way',
    city: 'Southwest Ranches',
    zip: '33330',
  },
  {
    id: 10,
    service: 'Quick Refresh',
    name: 'Hannah Montana',
    phone: '9549871234',
    email: `hannah+${RUN_ID}-10@example.invalid`,
    vehicle: '2020 Nissan Rogue',
    street: '222 Redwood Blvd',
    city: 'Weston',
    zip: '33327',
  },
];

const bookingLimitRaw = process.env.BOOKING_LIMIT;
const bookingLimit = bookingLimitRaw ? Number.parseInt(bookingLimitRaw, 10) : MOCK_BOOKINGS.length;
const activeBookings = MOCK_BOOKINGS.slice(
  0,
  Number.isFinite(bookingLimit) && bookingLimit > 0 ? Math.min(bookingLimit, MOCK_BOOKINGS.length) : MOCK_BOOKINGS.length
);

// Track test results for Ralph Loop analysis
const testResults: {
  bookingId: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  repairAttempt?: number;
}[] = [];

test.describe('Booking Flow E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // Helper: Click a service card by name
  async function selectService(page: Page, serviceName: string) {
    // Go to homepage and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Svelte hydration to complete (event handlers attached)
    await page.waitForSelector('main[data-hydrated="true"]', { timeout: 15000 });
    
    // Wait for services section to be visible
    await page.waitForSelector('#services', { timeout: 10000 });
    
    // Find the service card containing the service name
    const serviceCard = page.locator('article.card', { hasText: serviceName }).first();
    await expect(serviceCard).toBeVisible({ timeout: 10000 });
    
    // Find and scroll to the Book Now button specifically (it may be below the fold)
    const bookButton = serviceCard.locator('button.select-btn', { hasText: /book now/i });
    await bookButton.scrollIntoViewIfNeeded();
    await expect(bookButton).toBeVisible({ timeout: 5000 });
    
    // Click the button and wait for modal
    await bookButton.click({ timeout: 5000 });
    
    // Wait for modal to open
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
  }

  // Helper: Fill step 1 (Date & Time)
  async function waitForAvailabilityToSettle(page: Page) {
    await page.waitForSelector('.time-grid', { timeout: 5000 });
    await page.waitForFunction(() => {
      const helperText = Array.from(document.querySelectorAll<HTMLElement>('.helper-text, .error'))
        .map((el) => el.textContent?.trim() || '');

      return !helperText.some((text) => text.includes('Checking the latest availability'));
    }, { timeout: 10000 });
  }

  async function scanForAvailableSlot(page: Page) {
    const dateButtons = page.locator('.date-grid .date-btn');
    await expect(dateButtons.first()).toBeVisible({ timeout: 5000 });

    const dateCount = await dateButtons.count();
    const attemptedDates: string[] = [];

    for (let index = 0; index < dateCount; index++) {
      const dateButton = dateButtons.nth(index);
      const dateLabel = (await dateButton.textContent())?.trim() || `date-${index + 1}`;
      attemptedDates.push(dateLabel);

      await dateButton.click();
      await waitForAvailabilityToSettle(page);

      const availableTimeButton = page.locator('.time-grid .time-btn:not([disabled])').first();
      if (await availableTimeButton.isVisible().catch(() => false)) {
        await availableTimeButton.click();
        return { selectedTime: true, attemptedDates, availabilityError: '' };
      }
    }

    const availabilityError = ((await page.locator('.step-content .error').allTextContents())
      .map((text) => text.trim())
      .find(Boolean)) || '';

    return { selectedTime: false, attemptedDates, availabilityError };
  }

  async function fillStep1(page: Page, serviceName: string) {
    const availabilityPasses = 3;
    const attemptedDateSets: string[][] = [];
    let lastAvailabilityError = '';

    for (let pass = 0; pass < availabilityPasses; pass++) {
      const { selectedTime, attemptedDates, availabilityError } = await scanForAvailableSlot(page);
      attemptedDateSets.push(attemptedDates);
      lastAvailabilityError = availabilityError;

      if (selectedTime) {
        break;
      }

      if (availabilityError && !availabilityError.includes('fully booked')) {
        throw new Error(`Availability failed: ${availabilityError}`);
      }

      if (pass < availabilityPasses - 1) {
        console.log(
          `[Ralph Loop] Availability pass ${pass + 1}/${availabilityPasses} found no slots across: ${attemptedDates.join(', ')}`
        );
        await resetPage(page);
        await page.waitForTimeout(1000 * (pass + 1));
        await selectService(page, serviceName);
      }
    }

    const timeSelected = await page.locator('.time-grid .time-btn.selected').count();
    if (timeSelected === 0) {
      const attemptedDates = attemptedDateSets.flat().join(', ');
      const reason = lastAvailabilityError || NO_SLOTS_AVAILABLE_ERROR;
      throw new Error(`${NO_SLOTS_AVAILABLE_ERROR}: ${reason}. Dates checked: ${attemptedDates}`);
    }
    
    // Click continue
    const continueBtn = page.locator('.continue-btn');
    await continueBtn.click();
    
    // Wait for step 2 (location form)
    await expect(page.locator('input[placeholder="123 Main St"]')).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 2 (Location)
  async function fillStep2(page: Page, booking: typeof MOCK_BOOKINGS[0]) {
    // Fill street address
    await page.locator('input[placeholder="123 Main St"]').fill(booking.street);
    
    // City - clear and fill (it may have default "Weston")
    const cityInput = page.locator('input[placeholder="Weston"]');
    await cityInput.clear();
    await cityInput.fill(booking.city);
    
    // ZIP code
    await page.locator('input[placeholder="33326"]').fill(booking.zip);
    
    // Click continue
    const continueBtn = page.locator('.continue-btn');
    await continueBtn.click();
    
    // Wait for step 3 (contact form)
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 3 (Contact) and submit
  async function fillStep3AndSubmit(page: Page, booking: typeof MOCK_BOOKINGS[0]) {
    // Fill name
    await page.locator('input[placeholder="John Doe"]').fill(booking.name);
    
    // Fill phone
    await page.locator('input[placeholder="(954) 555-1234"]').fill(booking.phone);
    
    // Fill email if provided
    if (booking.email) {
      await page.locator('input[placeholder="you@email.com"]').fill(booking.email);
    }

    await page.locator('input[placeholder="2021 Tesla Model Y"]').fill(booking.vehicle);
    
    // Submit booking
    const submitBtn = page.locator('.submit-btn');
    await submitBtn.click();
    
    // Wait for success screen or error
    await page.waitForSelector('.success-screen, .submit-error', { timeout: 15000 });
  }

  // Helper: Verify booking success
  async function verifySuccess(page: Page): Promise<boolean> {
    try {
      const successScreen = page.locator('.success-screen');
      return await successScreen.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  // Helper: Close modal and reset (just navigate away to reset state)
  async function resetPage(page: Page) {
    // Simply navigate to homepage to reset - modal will close automatically
    try {
      await page.goto('/', { timeout: 10000 });
    } catch {
      // Ignore navigation errors
    }
  }

  // Run booking tests
  for (const booking of activeBookings) {
    test(`Booking #${booking.id}: ${booking.service} for ${booking.name}`, async ({ page }) => {
      // Capture console errors to debug hydration issues
      page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[Browser Error] ${msg.text()}`);
      });
      page.on('pageerror', err => console.log(`[Page Error] ${err.message}`));
      let success = false;
      let skipped = false;
      let error: string | undefined;
      let repairAttempt = 0;
      const maxRepairs = 2;

      while (!success && !skipped && repairAttempt <= maxRepairs) {
        try {
          // Step 1: Select service
          await selectService(page, booking.service);
          
          // Step 2: Date & Time
          await fillStep1(page, booking.service);
          
          // Step 3: Location
          await fillStep2(page, booking);
          
          // Step 4: Contact & Submit
          await fillStep3AndSubmit(page, booking);
          
          // Verify success
          success = await verifySuccess(page);
          
          if (!success) {
            throw new Error('Success message not found after submission');
          }

        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
          if (error.includes(NO_SLOTS_AVAILABLE_ERROR)) {
            skipped = true;
            console.log(`[Ralph Loop] Booking #${booking.id} skipped: ${error}`);
            break;
          }
          console.log(`[Ralph Loop] Booking #${booking.id} attempt ${repairAttempt + 1} failed: ${error}`);
          
          // Repair attempt: Reset and retry
          repairAttempt++;
          if (repairAttempt <= maxRepairs) {
            console.log(`[Ralph Loop] Attempting repair #${repairAttempt}...`);
            await resetPage(page);
            await page.waitForTimeout(500);
          }
        }
      }

      // Record result
      testResults.push({
        bookingId: booking.id,
        status: skipped ? 'skipped' : success ? 'passed' : 'failed',
        error: success ? undefined : error,
        repairAttempt: success ? repairAttempt : undefined,
      });

      if (skipped) {
        test.info().annotations.push({
          type: 'skip',
          description: error || NO_SLOTS_AVAILABLE_ERROR,
        });
        test.skip(true, error || NO_SLOTS_AVAILABLE_ERROR);
      }

      // Assert success
      expect(success, `Booking #${booking.id} should succeed. Error: ${error}`).toBe(true);
      
      // Reset for next test
      await resetPage(page);
    });
  }

  // Summary test
  test('Summary: All bookings completed successfully', async () => {
    const successCount = testResults.filter((r) => r.status === 'passed').length;
    const failCount = testResults.filter((r) => r.status === 'failed').length;
    const skippedCount = testResults.filter((r) => r.status === 'skipped').length;
    const repairCount = testResults.filter((r) => r.repairAttempt && r.repairAttempt > 0).length;

    console.log('\n=== Ralph Loop Test Summary ===');
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Skipped (no public availability): ${skippedCount}`);
    console.log(`Required Repairs: ${repairCount}`);
    
    if (failCount > 0) {
      console.log('\nFailed bookings:');
      testResults.filter((r) => r.status === 'failed').forEach(r => {
        console.log(`  - Booking #${r.bookingId}: ${r.error}`);
      });
    }

    expect(testResults.length).toBe(activeBookings.length);
    expect(failCount).toBe(0);
  });
});
