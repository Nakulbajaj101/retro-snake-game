import { defineConfig, devices } from '@playwright/test';

// Skip starting webServers if:
// - Running in CI (uses docker-compose)
// - DOCKER_RUNNING is set (local docker-compose is running)
const skipWebServers = !!process.env.CI || !!process.env.DOCKER_RUNNING;

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

    // Start webServers only for local development without docker-compose
    webServer: skipWebServers ? undefined : [
        {
            command: 'cd ../backend && uv run uvicorn snake_game.main:app --host 0.0.0.0 --port 8000',
            url: 'http://localhost:8000',
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
