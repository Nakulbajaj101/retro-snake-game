import { Page } from '@playwright/test';

export async function registerUser(page: Page, username: string, password: string) {
    await page.click('text=Login / Register');
    await page.waitForSelector('text=Register');

    // Switch to register mode if needed
    const registerButton = page.locator('button:has-text("Don\'t have an account? Register")');
    if (await registerButton.isVisible()) {
        await registerButton.click();
    }

    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for success
    await page.waitForSelector(`text=${username}`, { timeout: 5000 });
}

export async function loginUser(page: Page, username: string, password: string) {
    await page.click('text=Login / Register');
    await page.waitForSelector('text=Login');

    // Make sure we're in login mode
    const loginButton = page.locator('button:has-text("Already have an account? Login")');
    if (await loginButton.isVisible()) {
        await loginButton.click();
    }

    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for success
    await page.waitForSelector(`text=${username}`, { timeout: 5000 });
}

export async function logout(page: Page) {
    await page.click('text=Logout');
    await page.waitForSelector('text=Login / Register');
}

export async function clearDatabase() {
    // Clear the test database by making a request to delete it
    const response = await fetch('http://localhost:3000/');
    if (response.ok) {
        // Database will be recreated on next request
    }
}

export function generateRandomUsername(): string {
    return `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
