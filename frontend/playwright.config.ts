import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: [
        {
            command: 'cd ../backend && uv run uvicorn main:app --host 0.0.0.0 --port 3000',
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
        {
            command: 'npm run dev',
            url: 'http://localhost:8080',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
    ],
});
