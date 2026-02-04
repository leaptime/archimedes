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
    timeout: 30000, // 30s max per test
    expect: {
        timeout: 3000, // 3s for assertions (toast messages may take time)
    },
    
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        
        // Action timeouts
        actionTimeout: 5000, // 5s for clicks, fills, etc.
        navigationTimeout: 10000, // 10s for page loads
    },

    projects: [
        // Setup project for authentication
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },
        // Firefox disabled - run `npx playwright install firefox` to enable
        // {
        //     name: 'firefox',
        //     use: { 
        //         ...devices['Desktop Firefox'],
        //         storageState: 'playwright/.auth/user.json',
        //     },
        //     dependencies: ['setup'],
        // },
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
