import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Only start webServers when NOT in CI (CI uses docker-compose)
    webServer: process.env.CI ? undefined : [
        {
            command: 'cd ../backend && uv run uvicorn main:app --host 0.0.0.0 --port 3000',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 120000,
        },
        {
            command: 'npm run dev',
            url: 'http://localhost:8080',
            reuseExistingServer: true,
            timeout: 120000,
        },
    ],
});
