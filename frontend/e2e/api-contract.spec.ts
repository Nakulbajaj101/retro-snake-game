import { test, expect } from '@playwright/test';
import { registerUser, loginUser, generateRandomUsername } from './helpers';

test.describe('API Contract Tests', () => {
    test('should return correct User object structure from registration', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register user and capture the API response
        const userResponse = await page.evaluate(async ({ username, password }) => {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            return response.json();
        }, { username, password });

        // Verify User object structure matches frontend interface
        expect(userResponse).toHaveProperty('id');
        expect(userResponse).toHaveProperty('username');
        expect(userResponse).toHaveProperty('created_at');
        expect(typeof userResponse.id).toBe('string');
        expect(typeof userResponse.username).toBe('string');
        expect(userResponse.username).toBe(username);
        expect(typeof userResponse.created_at).toBe('string');
    });

    test('should return correct Token object structure from login', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register first
        await registerUser(page, username, password);
        await page.click('text=Logout');
        await page.waitForSelector('text=Login / Register');

        // Login and capture API response
        const loginResponse = await page.evaluate(async ({ username, password }) => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            return response.json();
        }, { username, password });

        // Verify LoginResponse structure matches frontend interface
        expect(loginResponse).toHaveProperty('token');
        expect(loginResponse).toHaveProperty('user');
        expect(typeof loginResponse.token).toBe('string');
        expect(loginResponse.token.length).toBeGreaterThan(0);
        
        // Verify User object in response
        expect(loginResponse.user).toHaveProperty('id');
        expect(loginResponse.user).toHaveProperty('username');
        expect(loginResponse.user).toHaveProperty('created_at');
        expect(loginResponse.user.username).toBe(username);
    });

    test('should return correct Score object structure from submission', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register and login
        await registerUser(page, username, password);

        // Get token and submit score
        const scoreResponse = await page.evaluate(async ({ username, password }) => {
            // Login to get token
            const loginRes = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const loginData = await loginRes.json();
            const token = loginData.token;

            // Submit score
            const scoreRes = await fetch('http://localhost:3000/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score: 150 }),
            });
            return scoreRes.json();
        }, { username, password });

        // Verify Score object structure matches frontend interface
        expect(scoreResponse).toHaveProperty('id');
        expect(scoreResponse).toHaveProperty('user_id');
        expect(scoreResponse).toHaveProperty('username');
        expect(scoreResponse).toHaveProperty('score');
        expect(scoreResponse).toHaveProperty('created_at');
        
        expect(typeof scoreResponse.id).toBe('string');
        expect(typeof scoreResponse.user_id).toBe('string');
        expect(typeof scoreResponse.username).toBe('string');
        expect(typeof scoreResponse.score).toBe('number');
        expect(typeof scoreResponse.created_at).toBe('string');
        
        expect(scoreResponse.username).toBe(username);
        expect(scoreResponse.score).toBe(150);
    });

    test('should return correct Score array structure from leaderboard', async ({ page }) => {
        await page.goto('/');

        // Fetch leaderboard directly
        const leaderboardResponse = await page.evaluate(async () => {
            const response = await fetch('http://localhost:3000/api/scores?limit=10');
            return response.json();
        });

        // Verify it's an array
        expect(Array.isArray(leaderboardResponse)).toBe(true);

        // If there are scores, verify their structure
        if (leaderboardResponse.length > 0) {
            const firstScore = leaderboardResponse[0];
            expect(firstScore).toHaveProperty('id');
            expect(firstScore).toHaveProperty('user_id');
            expect(firstScore).toHaveProperty('username');
            expect(firstScore).toHaveProperty('score');
            expect(firstScore).toHaveProperty('created_at');
            
            expect(typeof firstScore.id).toBe('string');
            expect(typeof firstScore.user_id).toBe('string');
            expect(typeof firstScore.username).toBe('string');
            expect(typeof firstScore.score).toBe('number');
            expect(typeof firstScore.created_at).toBe('string');
        }
    });

    test('should return correct error format for duplicate username', async ({ page }) => {
        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register first user
        await page.goto('/');
        await registerUser(page, username, password);
        await page.click('text=Logout');
        await page.waitForSelector('text=Login / Register');

        // Try to register duplicate and capture error
        const errorResponse = await page.evaluate(async ({ username, password }) => {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            
            if (!response.ok) {
                return {
                    status: response.status,
                    error: await response.json()
                };
            }
            return { status: response.status, error: null };
        }, { username, password });

        // Verify error format
        expect(errorResponse.status).toBe(409); // Conflict
        expect(errorResponse.error).toHaveProperty('detail');
        expect(typeof errorResponse.error.detail).toBe('string');
        expect(errorResponse.error.detail.toLowerCase()).toContain('username');
    });

    test('should return correct error format for invalid credentials', async ({ page }) => {
        await page.goto('/');

        const username = generateRandomUsername();
        const password = 'TestP@ss123';

        // Register user first
        await registerUser(page, username, password);
        await page.click('text=Logout');
        await page.waitForSelector('text=Login / Register');

        // Try invalid login and capture error
        const errorResponse = await page.evaluate(async ({ username }) => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: 'wrongpassword' }),
            });
            
            if (!response.ok) {
                return {
                    status: response.status,
                    error: await response.json()
                };
            }
            return { status: response.status, error: null };
        }, { username });

        // Verify error format
        expect(errorResponse.status).toBe(401); // Unauthorized
        expect(errorResponse.error).toHaveProperty('detail');
        expect(typeof errorResponse.error.detail).toBe('string');
    });

    test('should return correct error format for unauthorized score submission', async ({ page }) => {
        await page.goto('/');

        // Try to submit score without authentication
        const errorResponse = await page.evaluate(async () => {
            const response = await fetch('http://localhost:3000/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: 100 }),
            });
            
            if (!response.ok) {
                return {
                    status: response.status,
                    error: await response.json()
                };
            }
            return { status: response.status, error: null };
        });

        // Verify error format
        expect(errorResponse.status).toBe(401); // Unauthorized
        expect(errorResponse.error).toHaveProperty('detail');
        expect(typeof errorResponse.error.detail).toBe('string');
    });
});

