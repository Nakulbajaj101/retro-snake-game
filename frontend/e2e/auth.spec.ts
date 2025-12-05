import { test, expect } from '@playwright/test';
import { registerUser, loginUser, logout, generateRandomUsername } from './helpers';

test.describe('Authentication', () => {
    test('should register a new user', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'testpass123';

        await registerUser(page, username, password);

        // Verify user is logged in
        await expect(page.locator(`text=${username}`)).toBeVisible();
    });

    test('should login an existing user', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'testpass123';

        // First register
        await registerUser(page, username, password);

        // Then logout
        await logout(page);

        // Then login again
        await loginUser(page, username, password);

        // Verify user is logged in
        await expect(page.locator(`text=${username}`)).toBeVisible();
    });

    test('should logout user', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'testpass123';

        await registerUser(page, username, password);
        await logout(page);

        // Verify login button is visible
        await expect(page.locator('text=Login / Register')).toBeVisible();
    });

    test('should persist session after page reload', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'testpass123';

        await registerUser(page, username, password);

        // Reload page
        await page.reload();

        // Verify user is still logged in
        await expect(page.locator(`text=${username}`)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Login / Register');
        await page.fill('input[type="text"]', 'nonexistent');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('text=/Error|Invalid|failed/i').first()).toBeVisible({ timeout: 5000 });
    });
});
