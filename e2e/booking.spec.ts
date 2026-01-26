/**
 * E2E Booking Tests - Ralph Loop Methodology
 * 
 * Runs 10 mock bookings with iterative detection and repair.
 * Each booking uses different test data to cover edge cases.
 * 
 * Ralph Loop: Run → Detect Failure → Diagnose → Repair → Re-run
 */

import { test, expect, type Page } from '@playwright/test';

// Test data for 10 mock bookings
// Uses only the first 3 services (Most Popular section) to avoid scrolling issues
const MOCK_BOOKINGS = [
  {
    id: 1,
    service: 'Exterior Wash',
    name: 'John Smith',
    phone: '9541234567',
    email: 'john@test.com',
    street: '123 Main Street',
    city: 'Weston',
    zip: '33326',
  },
  {
    id: 2,
    service: 'Interior Wash',
    name: 'Jane Doe',
    phone: '9549876543',
    email: 'jane@test.com',
    street: '456 Oak Avenue',
    city: 'Pembroke Pines',
    zip: '33024',
  },
  {
    id: 3,
    service: 'Full Wax',
    name: 'Bob Johnson',
    phone: '9545551234',
    email: '', // No email - optional field
    street: '789 Palm Drive',
    city: 'Miramar',
    zip: '33025',
  },
  {
    id: 4,
    service: 'Exterior Wash',
    name: 'Alice Williams',
    phone: '9547778899',
    email: 'alice.w@email.org',
    street: '321 Cypress Lane',
    city: 'Davie',
    zip: '33314',
  },
  {
    id: 5,
    service: 'Interior Wash',
    name: 'Charlie Brown',
    phone: '9541112233',
    email: 'charlie@company.co',
    street: '555 Birch Road',
    city: 'Plantation',
    zip: '33317',
  },
  {
    id: 6,
    service: 'Full Wax',
    name: 'Diana Prince',
    phone: '9544445566',
    email: 'diana.p@mail.net',
    street: '777 Maple Street',
    city: 'Sunrise',
    zip: '33313',
  },
  {
    id: 7,
    service: 'Exterior Wash',
    name: 'Edward Norton',
    phone: '9546667788',
    email: '', // No email
    street: '888 Pine Avenue',
    city: 'Hollywood',
    zip: '33020',
  },
  {
    id: 8,
    service: 'Interior Wash',
    name: 'Fiona Apple',
    phone: '9548889900',
    email: 'fiona@music.com',
    street: '999 Cedar Court',
    city: 'Cooper City',
    zip: '33026',
  },
  {
    id: 9,
    service: 'Full Wax',
    name: 'George Lucas',
    phone: '9541239876',
    email: 'george@films.io',
    street: '111 Sequoia Way',
    city: 'Southwest Ranches',
    zip: '33330',
  },
  {
    id: 10,
    service: 'Exterior Wash',
    name: 'Hannah Montana',
    phone: '9549871234',
    email: 'hannah@disney.tv',
    street: '222 Redwood Blvd',
    city: 'Weston',
    zip: '33327',
  },
];

// Track test results for Ralph Loop analysis
const testResults: {
  bookingId: number;
  success: boolean;
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
    
    // Wait for services section to be visible
    await page.waitForSelector('#services', { timeout: 10000 });
    
    // Find the service card containing the service name
    const serviceCard = page.locator('article.card', { hasText: serviceName }).first();
    
    // Scroll to the card (it may be in "More Services" section below the fold)
    await serviceCard.scrollIntoViewIfNeeded();
    await expect(serviceCard).toBeVisible({ timeout: 10000 });
    
    // Click the "Book Now" button within the card
    const bookButton = serviceCard.locator('button.select-btn', { hasText: /book now/i });
    await bookButton.click();
    
    // Wait for modal to open
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 1 (Date & Time)
  async function fillStep1(page: Page) {
    // Select first available date
    const dateButton = page.locator('.date-grid .date-btn').first();
    await expect(dateButton).toBeVisible({ timeout: 5000 });
    await dateButton.click();
    
    // Wait for time grid to appear
    await page.waitForSelector('.time-grid', { timeout: 5000 });
    
    // Select first available time
    const timeButton = page.locator('.time-grid .time-btn').first();
    await timeButton.click();
    
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
  for (const booking of MOCK_BOOKINGS) {
    test(`Booking #${booking.id}: ${booking.service} for ${booking.name}`, async ({ page }) => {
      let success = false;
      let error: string | undefined;
      let repairAttempt = 0;
      const maxRepairs = 2;

      while (!success && repairAttempt <= maxRepairs) {
        try {
          // Step 1: Select service
          await selectService(page, booking.service);
          
          // Step 2: Date & Time
          await fillStep1(page);
          
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
        success,
        error: success ? undefined : error,
        repairAttempt: success ? repairAttempt : undefined,
      });

      // Assert success
      expect(success, `Booking #${booking.id} should succeed. Error: ${error}`).toBe(true);
      
      // Reset for next test
      await resetPage(page);
    });
  }

  // Summary test
  test('Summary: All bookings completed successfully', async () => {
    const successCount = testResults.filter(r => r.success).length;
    const failCount = testResults.filter(r => !r.success).length;
    const repairCount = testResults.filter(r => r.repairAttempt && r.repairAttempt > 0).length;

    console.log('\n=== Ralph Loop Test Summary ===');
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Required Repairs: ${repairCount}`);
    
    if (failCount > 0) {
      console.log('\nFailed bookings:');
      testResults.filter(r => !r.success).forEach(r => {
        console.log(`  - Booking #${r.bookingId}: ${r.error}`);
      });
    }

    expect(successCount).toBe(MOCK_BOOKINGS.length);
  });
});


