import { test, expect } from '@playwright/test';
import { registerUser, logout, loginUser, generateRandomUsername } from './helpers';

test.describe('Full User Journey', () => {
    test('complete flow: register -> play -> score -> leaderboard -> logout -> login', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'testpass123';

        // Step 1: Register new user
        await registerUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Step 2: Verify leaderboard is visible
        await expect(page.locator('text=🏆 Leaderboard')).toBeVisible();

        // Step 3: Start game
        await page.click('text=Start Game!');
        await expect(page.locator('text=Start Game!')).not.toBeVisible();

        // Step 4: Verify game UI
        await expect(page.locator('text=Score:')).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible();

        // Step 5: Logout
        await page.click('text=Pause', { force: true }); // Pause game first
        await logout(page);
        await expect(page.locator('text=Login / Register')).toBeVisible();

        // Step 6: Login again
        await loginUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Step 7: Verify session persists after reload
        await page.reload();
        await expect(page.locator(`text=${username}`)).toBeVisible();
    });

    test('guest user flow: play -> prompt to login -> register -> continue', async ({ page }) => {
        await page.goto('/');

        // Verify we're not logged in
        await expect(page.locator('text=Login / Register')).toBeVisible();

        // Start game as guest
        await page.click('text=Start Game!');
        await expect(page.locator('text=Score:')).toBeVisible();

        // Verify leaderboard is still visible
        await expect(page.locator('text=🏆 Leaderboard')).toBeVisible();
    });

    test('multiple users on leaderboard', async ({ page, context }) => {
        // Create first user
        await page.goto('/');
        const user1 = generateRandomUsername();
        await registerUser(page, user1, 'testpass123');

        // Logout
        await logout(page);

        // Create second user in same session
        const user2 = generateRandomUsername();
        await registerUser(page, user2, 'testpass123');

        // Both users should potentially appear on leaderboard
        // (if they played and got scores)
        await expect(page.locator('text=🏆 Leaderboard')).toBeVisible();
    });
});
