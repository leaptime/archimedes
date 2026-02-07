import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './modules',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
    ],
    
    // Global timeout settings
    timeout: 15000, // 15s max per test
    expect: {
        timeout: 3000, // 3s for assertions
    },
    
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8000',
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        
        // Action timeouts
        actionTimeout: 3000, // 3s for clicks, fills, etc.
        navigationTimeout: 5000, // 5s for page loads
    },

    projects: [
        // Setup project for authentication
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        // Default tests (platform admin user)
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            testIgnore: ['**/partner-portal.spec.ts'],
            dependencies: ['setup'],
        },
        // Partner portal tests (partner admin user)
        {
            name: 'chromium-partner',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/partner.json',
            },
            testMatch: ['**/partner-portal.spec.ts'],
            dependencies: ['setup'],
        },
    ],

    // Run local dev server before tests
    // NOTE: Run `npm run build` before running tests to ensure production assets exist
    webServer: {
        command: 'php artisan serve --env=testing',
        url: 'http://127.0.0.1:8000',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
});
