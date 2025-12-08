import { Page } from '@playwright/test';

export function getApiBaseUrl(): string {
    return process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000/api';
}

export async function registerUser(page: Page, username: string, password: string) {
    // Use specific selector for Login button
    await page.getByRole('button', { name: 'Login / Register', exact: true }).click();
    await page.waitForSelector('text=Register');

    // Switch to register mode if needed
    const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
    if (await registerButton.isVisible()) {
        await registerButton.click();
    }

    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for success - look for username with emoji in header
    await page.waitForSelector(`text=👤 ${username}`, { timeout: 5000 });
}

export async function loginUser(page: Page, username: string, password: string) {
    // Use specific selector for Login button
    await page.getByRole('button', { name: 'Login / Register', exact: true }).click();
    await page.waitForSelector('text=Login');

    // Make sure we're in login mode
    const loginButton = page.locator('button:has-text("Already have an account? Login")');
    if (await loginButton.isVisible()) {
        await loginButton.click();
    }

    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for success - look for username with emoji in header
    await page.waitForSelector(`text=👤 ${username}`, { timeout: 5000 });
}

export async function logout(page: Page) {
    await page.click('text=Logout');
    // Wait for login button to appear
    await page.waitForSelector('button:has-text("Login / Register")');
}

export async function clearDatabase() {
    // Clear the test database by making a request to delete it
    const apiUrl = getApiBaseUrl();
    const response = await fetch(apiUrl.replace('/api', '/'));
    if (response.ok) {
        // Database will be recreated on next request
    }
}

export function generateRandomUsername(): string {
    return `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

