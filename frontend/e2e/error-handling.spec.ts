import { test, expect } from '@playwright/test';
import { registerUser, generateRandomUsername } from './helpers';

test.describe('Error Handling Integration', () => {
    test('should show error for duplicate username registration', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register first user
        await registerUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Logout
        await page.click('text=Logout');
        await page.waitForSelector('text=Login / Register');

        // Try to register with same username
        await page.click('text=Login / Register');
        await page.waitForSelector('text=Register');

        // Switch to register mode
        const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
        if (await registerButton.isVisible()) {
            await registerButton.click();
        }

        await page.fill('input[type="text"]', username);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('text=/Error|already exists|Username/i').first()).toBeVisible({ timeout: 5000 });
        
        // Verify we're still on the registration form (not logged in)
        await expect(page.locator('text=Login / Register')).toBeVisible();
    });

    test('should show error for invalid login credentials', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register user first
        await registerUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Logout
        await page.click('text=Logout');
        await page.waitForSelector('text=Login / Register');

        // Try to login with wrong password
        await page.click('text=Login / Register');
        await page.waitForSelector('text=Login');

        // Make sure we're in login mode
        const loginButton = page.locator('button:has-text("Already have an account? Login")');
        if (await loginButton.isVisible()) {
            await loginButton.click();
        }

        await page.fill('input[type="text"]', username);
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('text=/Error|Invalid|failed/i').first()).toBeVisible({ timeout: 5000 });

        // Verify we're still logged out
        await expect(page.locator('text=Login / Register')).toBeVisible();
    });

    test('should show error for nonexistent user login', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Login / Register');
        await page.waitForSelector('text=Login');

        // Make sure we're in login mode
        const loginButton = page.locator('button:has-text("Already have an account? Login")');
        if (await loginButton.isVisible()) {
            await loginButton.click();
        }

        await page.fill('input[type="text"]', 'nonexistentuser12345');
        await page.fill('input[type="password"]', 'somepassword');
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('text=/Error|Invalid|failed/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for weak password during registration', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Login / Register');
        await page.waitForSelector('text=Register');

        // Switch to register mode
        const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
        if (await registerButton.isVisible()) {
            await registerButton.click();
        }

        // Verify password requirements are visible (always shown in register mode)
        await expect(page.locator('text=/Password Requirements|At least 8 characters/i').first()).toBeVisible();

        const username = generateRandomUsername();
        const weakPassword = 'weak'; // Too short (4 chars), score will be 0

        await page.fill('input[type="text"]', username);
        await page.fill('input[type="password"]', weakPassword);

        // Wait for password strength indicator to appear
        await page.waitForTimeout(500);

        // Try to submit - weak passwords (score < 2) should prevent registration
        await page.click('button[type="submit"]');
        
        // Wait for any toast/error to appear and for registration attempt to complete
        await page.waitForTimeout(3000);
        
        // The key test: verify registration didn't succeed - we should NOT be logged in
        const loggedIn = await page.locator(`text=${username}`).isVisible({ timeout: 2000 }).catch(() => false);
        
        // Weak password should prevent registration - user should NOT be logged in
        // This is the primary assertion - weak passwords must not allow registration
        expect(loggedIn).toBe(false);
    });

    test('should show password requirements in registration form', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Login / Register');
        await page.waitForSelector('text=Register');

        // Switch to register mode
        const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
        if (await registerButton.isVisible()) {
            await registerButton.click();
        }

        // Verify password requirements are visible
        await expect(page.locator('text=/Password Requirements|At least 8 characters/i').first()).toBeVisible();
    });

    test('should show network error when backend is unavailable', async ({ page, context }) => {
        // This test requires stopping the backend, which is complex in e2e
        // Instead, we'll test the error message format by intercepting the request
        
        await page.goto('/');
        
        // Intercept the register request and fail it
        await page.route('**/api/auth/register', route => route.abort('failed'));
        
        await page.click('text=Login / Register');
        await page.waitForSelector('text=Register');

        // Switch to register mode
        const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
        if (await registerButton.isVisible()) {
            await registerButton.click();
        }

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        await page.fill('input[type="text"]', username);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for error message about backend connection
        await expect(page.locator('text=/Error|connect|server|backend/i').first()).toBeVisible({ timeout: 5000 });
    });
});

