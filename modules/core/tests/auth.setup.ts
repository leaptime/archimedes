import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials (use test user)
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    // Verify we're logged in
    await expect(page).toHaveURL(/dashboard/);
    
    // Save authentication state
    await page.context().storageState({ path: authFile });
});
