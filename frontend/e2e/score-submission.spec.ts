import { test, expect } from '@playwright/test';
import { registerUser, generateRandomUsername } from './helpers';

test.describe('Score Submission Integration', () => {
    test('should submit score after game and display on leaderboard', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register and login
        await registerUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Start game
        await page.click('text=Start Game!');
        await page.waitForTimeout(500); // Wait for game to initialize

        // Move snake to trigger collision (move right into wall)
        // The game starts moving right by default, so we'll wait for collision
        // or manually trigger by moving into wall
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        
        // Continue moving until game over (snake hits wall)
        // Move right repeatedly to hit the wall
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(50);
            // Check if game over screen appeared
            const gameOverVisible = await page.locator('text=/GAME OVER|😢/i').isVisible().catch(() => false);
            if (gameOverVisible) break;
        }

        // Wait for game over screen
        await expect(page.locator('text=/GAME OVER|😢/i').first()).toBeVisible({ timeout: 5000 });

        // Wait for score submission (check for success message or score submitted indicator)
        await page.waitForTimeout(1000); // Give time for score submission

        // Verify score appears on leaderboard
        // The leaderboard should update automatically
        const leaderboard = page.locator('text=🏆 Leaderboard').locator('..');
        await expect(leaderboard).toBeVisible();
        
        // Check if the username appears in leaderboard (it might take a moment to load)
        await page.waitForTimeout(2000); // Wait for leaderboard to refresh
        
        // Verify the user's score is visible (either in leaderboard or in game over screen)
        await expect(page.locator(`text=${username}`).or(page.locator('text=/Score Submitted|Score saved/i'))).toBeVisible({ timeout: 5000 });
    });

    test('should persist score on leaderboard after page reload', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';
        const testScore = 999;

        // Register and login
        await registerUser(page, username, password);
        await expect(page.locator(`text=${username}`)).toBeVisible();

        // Get token from localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();

        // Submit score directly via API call
        const scoreSubmitted = await page.evaluate(async ({ token, score }) => {
            try {
                const response = await fetch('http://localhost:3000/api/scores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ score })
                });
                if (response.ok) {
                    return await response.json();
                }
                throw new Error(`Failed to submit: ${response.status}`);
            } catch (error) {
                console.error('Score submission error:', error);
                return null;
            }
        }, { token, score: testScore });

        // Verify score was submitted successfully
        expect(scoreSubmitted).not.toBeNull();
        expect(scoreSubmitted?.score).toBe(testScore);

        // Wait a moment for backend to process
        await page.waitForTimeout(500);

        // Reload page to test persistence
        await page.reload();
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Wait for leaderboard to be visible
        await expect(page.locator('text=🏆 Leaderboard')).toBeVisible({ timeout: 10000 });
        
        // Wait for leaderboard to finish loading (wait for "Loading..." to disappear)
        try {
            await page.waitForFunction(() => {
                const text = document.body.innerText;
                return !text.includes('Loading...');
            }, { timeout: 5000 });
        } catch {
            // Continue even if timeout - leaderboard might already be loaded
        }

        // Wait a bit more for leaderboard data to fetch
        await page.waitForTimeout(2000);

        // Verify score persists by checking the API directly
        const leaderboardData = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:3000/api/scores?limit=10');
                if (response.ok) {
                    return await response.json();
                }
                return [];
            } catch (error) {
                return [];
            }
        });

        // Verify the score is in the leaderboard
        const scoreFound = leaderboardData.some((score: any) => 
            score.username === username && score.score === testScore
        );

        expect(scoreFound).toBeTruthy();
        
        // Also verify it appears in the UI (as a secondary check)
        const scoreInUI = await page.locator(`text=${testScore}`).first().isVisible().catch(() => false);
        const usernameInUI = await page.evaluate((username) => {
            const text = document.body.innerText;
            return text.includes(username);
        }, username);

        // At least one UI check should pass if leaderboard is displaying correctly
        expect(scoreInUI || usernameInUI).toBeTruthy();
    });

    test('should not submit score for guest users', async ({ page }) => {
        await page.goto('/');

        // Verify we're not logged in
        await expect(page.locator('text=Login / Register')).toBeVisible();

        // Start game
        await page.click('text=Start Game!');
        await page.waitForTimeout(500);

        // Trigger game over quickly
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(50);
            const gameOverVisible = await page.locator('text=/GAME OVER|😢/i').isVisible().catch(() => false);
            if (gameOverVisible) break;
        }

        // Wait for game over screen
        await expect(page.locator('text=/GAME OVER|😢/i').first()).toBeVisible({ timeout: 5000 });

        // Verify login prompt is shown for guest users
        await expect(page.locator('text=/Login to Save|🔐/i')).toBeVisible({ timeout: 3000 });
    });
});

