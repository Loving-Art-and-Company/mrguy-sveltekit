import { test, expect } from '@playwright/test';

test.describe('Debug Svelte 5 Input', () => {
    test('user scenario loop', async ({ page }) => {
        await page.goto('/promo/kores');
    
        const fillParams = {
            '#name': 'Test User',
        };
    
        for (const [selector, value] of Object.entries(fillParams)) {
            await page.waitForSelector(selector);
            await page.$eval(selector, (el, val) => {
                const input = el as HTMLInputElement;
                input.value = val;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, value as string);
        }
        
        // Check immediate
        await expect(page.locator('#name')).toHaveValue('Test User');
    });
});
