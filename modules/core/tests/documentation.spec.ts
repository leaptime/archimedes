import { test, expect } from './fixtures';

test.describe('Architecture Documentation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/documentation');
    });

    test('should display documentation page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Architecture Documentation' })).toBeVisible();
    });

    test('should have navigation sidebar', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Module System' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Plugin Architecture' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Trust Levels' })).toBeVisible();
    });

    test('should display overview section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Modular' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Extensible' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Multi-Tenant' })).toBeVisible();
    });

    test('should navigate to different sections', async ({ page }) => {
        // Click on Plugin Architecture in nav
        await page.getByRole('button', { name: /Plugin Architecture/i }).click();
        
        // Should scroll to that section
        await expect(page.locator('#plugins')).toBeVisible();
    });

    test('should display trust level cards', async ({ page }) => {
        await expect(page.getByText('L1', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('L2', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('L3', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('L4', { exact: true }).first()).toBeVisible();
    });

    test('should display code examples', async ({ page }) => {
        // Check for code blocks
        await expect(page.locator('pre code').first()).toBeVisible();
    });
});
