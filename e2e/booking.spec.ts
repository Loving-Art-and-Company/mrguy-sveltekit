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
    service: 'Clay Bar Treatment',
    name: 'Alice Williams',
    phone: '9547778899',
    email: 'alice.w@email.org',
    street: '321 Cypress Lane',
    city: 'Davie',
    zip: '33314',
  },
  {
    id: 5,
    service: 'Paint Correction + Clay Bar',
    name: 'Charlie Brown',
    phone: '9541112233',
    email: 'charlie@company.co',
    street: '555 Birch Road',
    city: 'Plantation',
    zip: '33317',
  },
  {
    id: 6,
    service: '2-Step Paint Correction',
    name: 'Diana Prince',
    phone: '9544445566',
    email: 'diana.p@mail.net',
    street: '777 Maple Street',
    city: 'Sunrise',
    zip: '33313',
  },
  {
    id: 7,
    service: 'Window Ceramic Coat',
    name: 'Edward Norton',
    phone: '9546667788',
    email: '', // No email
    street: '888 Pine Avenue',
    city: 'Hollywood',
    zip: '33020',
  },
  {
    id: 8,
    service: 'Tire Ceramic Coat',
    name: 'Fiona Apple',
    phone: '9548889900',
    email: 'fiona@music.com',
    street: '999 Cedar Court',
    city: 'Cooper City',
    zip: '33026',
  },
  {
    id: 9,
    service: 'Full Body Ceramic Coat',
    name: 'George Lucas',
    phone: '9541239876',
    email: 'george@films.io',
    street: '111 Sequoia Way',
    city: 'Southwest Ranches',
    zip: '33330',
  },
  {
    id: 10,
    service: 'Exterior Wash', // Repeat service to test consistency
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
    // Scroll to services section
    await page.goto('/');
    await page.locator('#services').scrollIntoViewIfNeeded();
    
    // Find and click the service card
    const serviceCard = page.locator('.package-card', { hasText: serviceName }).first();
    await expect(serviceCard).toBeVisible({ timeout: 10000 });
    
    // Click the "Book Now" button within the card
    const bookButton = serviceCard.locator('button', { hasText: /book/i });
    await bookButton.click();
    
    // Wait for modal to open
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 1 (Date & Time)
  async function fillStep1(page: Page) {
    // Select first available date
    const dateButton = page.locator('.date-grid button').first();
    await dateButton.click();
    
    // Select first available time
    const timeButton = page.locator('.time-grid button').first();
    await timeButton.click();
    
    // Click continue
    const continueBtn = page.locator('button', { hasText: /continue/i });
    await continueBtn.click();
    
    // Wait for step 2
    await expect(page.locator('input[placeholder*="street" i], input[placeholder*="address" i]').first()).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 2 (Location)
  async function fillStep2(page: Page, booking: typeof MOCK_BOOKINGS[0]) {
    // Fill address fields
    await page.locator('input[placeholder*="street" i], input[placeholder*="address" i]').first().fill(booking.street);
    
    // City might be pre-filled or need input
    const cityInput = page.locator('input[placeholder*="city" i]');
    if (await cityInput.isVisible()) {
      await cityInput.fill(booking.city);
    }
    
    // ZIP code
    await page.locator('input[placeholder*="zip" i]').fill(booking.zip);
    
    // Click continue
    const continueBtn = page.locator('button', { hasText: /continue/i });
    await continueBtn.click();
    
    // Wait for step 3
    await expect(page.locator('input[placeholder*="name" i]').first()).toBeVisible({ timeout: 5000 });
  }

  // Helper: Fill step 3 (Contact) and submit
  async function fillStep3AndSubmit(page: Page, booking: typeof MOCK_BOOKINGS[0]) {
    // Fill contact fields
    await page.locator('input[placeholder*="name" i]').first().fill(booking.name);
    await page.locator('input[placeholder*="phone" i], input[type="tel"]').first().fill(booking.phone);
    
    if (booking.email) {
      await page.locator('input[placeholder*="email" i], input[type="email"]').first().fill(booking.email);
    }
    
    // Submit booking
    const submitBtn = page.locator('button', { hasText: /confirm|submit|book/i }).last();
    await submitBtn.click();
    
    // Wait for success or error
    await page.waitForSelector('.success-message, [class*="success"], [class*="error"]', { timeout: 15000 });
  }

  // Helper: Verify booking success
  async function verifySuccess(page: Page): Promise<boolean> {
    try {
      // Look for success indicators
      const successIndicators = [
        page.locator('.success-message'),
        page.locator('[class*="success"]'),
        page.locator('text=/thank you|booking confirmed|success/i'),
      ];
      
      for (const indicator of successIndicators) {
        if (await indicator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // Helper: Close modal and reset
  async function closeModal(page: Page) {
    try {
      // Try clicking close button or overlay
      const closeBtn = page.locator('button[aria-label*="close" i], .modal-close, button:has(svg)').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        // Click overlay
        await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
      }
    } catch {
      // Navigate away to reset
      await page.goto('/');
    }
    
    // Wait for modal to close
    await page.waitForTimeout(500);
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
            await page.goto('/');
            await page.waitForTimeout(1000);
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
      
      // Close modal for next test
      if (success) {
        await page.waitForTimeout(3500); // Wait for auto-close countdown
      }
      await closeModal(page);
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

// API-level booking tests (faster, no browser)
test.describe('Booking API Tests', () => {
  const API_URL = process.env.BASE_URL || 'http://localhost:5173';

  for (const booking of MOCK_BOOKINGS.slice(0, 5)) { // Test first 5 via API
    test(`API Booking #${booking.id}: ${booking.service}`, async ({ request }) => {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // Find service ID from name
      const serviceMap: Record<string, { id: string; price: number }> = {
        'Exterior Wash': { id: 'exterior_wash', price: 47 },
        'Interior Wash': { id: 'interior_wash', price: 47 },
        'Full Wax': { id: 'full_wax', price: 147 },
        'Clay Bar Treatment': { id: 'clay_bar', price: 67 },
        'Paint Correction + Clay Bar': { id: 'paint_correction_clay', price: 167 },
        '2-Step Paint Correction': { id: 'two_step_correction', price: 267 },
        'Window Ceramic Coat': { id: 'window_ceramic', price: 97 },
        'Tire Ceramic Coat': { id: 'tire_ceramic', price: 97 },
        'Full Body Ceramic Coat': { id: 'full_ceramic', price: 747 },
      };

      const serviceInfo = serviceMap[booking.service] || { id: 'exterior_wash', price: 47 };

      const response = await request.post(`${API_URL}/api/bookings/create`, {
        data: {
          service: {
            id: serviceInfo.id,
            name: booking.service,
            price: serviceInfo.price,
          },
          schedule: {
            date: dateStr,
            time: '10:00',
          },
          address: {
            street: booking.street,
            city: booking.city,
            state: 'FL',
            zip: booking.zip,
          },
          contact: {
            name: booking.name,
            phone: booking.phone,
            email: booking.email || '',
          },
        },
      });

      expect(response.ok(), `API should return success for booking #${booking.id}`).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.bookingId).toBeDefined();
      
      console.log(`[API] Booking #${booking.id} created: ${data.bookingId}`);
    });
  }
});
