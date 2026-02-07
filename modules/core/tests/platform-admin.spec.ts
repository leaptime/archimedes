import { test, expect } from './fixtures';

test.describe('Platform Admin', () => {
    test.describe('Platform Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/platform');
        });

        test('should display platform dashboard', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Platform Administration');
        });

        test('should show admin mode warning banner', async ({ page }) => {
            await expect(page.getByText('Platform Admin Mode')).toBeVisible();
        });

        test('should show stats cards', async ({ page }) => {
            await expect(page.getByText('Total Partners')).toBeVisible();
            await expect(page.getByText('Total Organizations')).toBeVisible();
            await expect(page.getByText('Total Users')).toBeVisible();
            await expect(page.getByText('Pending Payouts')).toBeVisible();
        });

        test('should show organization status breakdown', async ({ page }) => {
            await expect(page.getByText('Active', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Trial', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Suspended', { exact: true }).first()).toBeVisible();
        });

        test('should have new partner button', async ({ page }) => {
            await expect(page.getByRole('link', { name: 'New Partner', exact: true })).toBeVisible();
        });

        test('should have new organization button', async ({ page }) => {
            await expect(page.getByRole('link', { name: 'New Organization', exact: true })).toBeVisible();
        });

        test('should have quick links for partners', async ({ page }) => {
            await expect(page.getByRole('link', { name: /Manage Partners/i })).toBeVisible();
            await expect(page.getByRole('link', { name: /Add New Partner/i })).toBeVisible();
        });

        test('should have quick links for organizations', async ({ page }) => {
            await expect(page.getByRole('link', { name: /Manage Organizations/i })).toBeVisible();
            await expect(page.getByRole('link', { name: /Add New Organization/i })).toBeVisible();
        });

        test('should navigate to partners page', async ({ page }) => {
            await page.getByRole('link', { name: /Manage Partners/i }).click();
            await expect(page).toHaveURL(/\/platform\/partners/);
        });

        test('should navigate to organizations page', async ({ page }) => {
            await page.getByRole('link', { name: /Manage Organizations/i }).click();
            await expect(page).toHaveURL(/\/platform\/organizations/);
        });
    });

    test.describe('Platform Partners List', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/platform/partners');
        });

        test('should display partners page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Partners');
        });

        test('should have search input', async ({ page }) => {
            await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
        });

        test('should have status filter', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await expect(statusFilter).toBeVisible();
        });

        test('should have type filter', async ({ page }) => {
            const typeFilter = page.locator('button:has-text("All Types")');
            await expect(typeFilter).toBeVisible();
        });

        test('should have new partner button', async ({ page }) => {
            await expect(page.getByRole('link', { name: /New Partner/i })).toBeVisible();
        });

        test('should display partners table', async ({ page }) => {
            await expect(page.locator('table')).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Partner/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Type/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Organizations/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Commission/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
        });

        test('should navigate to new partner form', async ({ page }) => {
            await page.getByRole('link', { name: /New Partner/i }).click();
            await expect(page).toHaveURL(/\/platform\/partners\/new/);
        });

        test('should filter by status', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await statusFilter.click();
            await page.locator('[role="option"]:has-text("Active")').click();
            await page.waitForTimeout(500);
        });

        test('should search partners', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        });
    });

    test.describe('Create Partner Form', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/platform/partners/new');
        });

        test('should display new partner form', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('New Partner');
        });

        test('should have partner details section', async ({ page }) => {
            await expect(page.getByText('Partner Details')).toBeVisible();
        });

        test('should have commission settings section', async ({ page }) => {
            await expect(page.getByText('Commission Settings')).toBeVisible();
        });

        test('should have partner admin section', async ({ page }) => {
            await expect(page.getByText('Partner Admin User')).toBeVisible();
        });

        test('should have required fields', async ({ page }) => {
            await expect(page.getByLabel(/Partner Name/i)).toBeVisible();
            // Check for main form sections
            await expect(page.getByText('Partner Details')).toBeVisible();
            await expect(page.getByText('Partner Admin User')).toBeVisible();
        });

        test('should have commission rate field', async ({ page }) => {
            await expect(page.getByLabel(/Commission Rate/i)).toBeVisible();
        });

        test('should have minimum payout field', async ({ page }) => {
            await expect(page.getByLabel(/Minimum Payout/i)).toBeVisible();
        });

        test('should have admin user fields', async ({ page }) => {
            await expect(page.getByLabel(/Full Name/i)).toBeVisible();
            await expect(page.locator('#admin_email')).toBeVisible();
        });

        test('should validate required fields on submit', async ({ page }) => {
            // Clear pre-filled fields
            await page.locator('#name').fill('');
            await page.getByRole('button', { name: /Create Partner/i }).click();
            await page.waitForTimeout(300);
            // Should show validation errors
            await expect(page.getByText(/required/i).first()).toBeVisible();
        });

        test('should have back button', async ({ page }) => {
            await expect(page.getByRole('link', { name: /Back/i })).toBeVisible();
        });

        test('should navigate back to partners list', async ({ page }) => {
            await page.getByRole('link', { name: /Back/i }).click();
            await expect(page).toHaveURL(/\/platform\/partners/);
        });
    });

    test.describe('Platform Organizations List', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/platform/organizations');
        });

        test('should display organizations page', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Organizations');
        });

        test('should have search input', async ({ page }) => {
            await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
        });

        test('should have status filter', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await expect(statusFilter).toBeVisible();
        });

        test('should have type filter', async ({ page }) => {
            const typeFilter = page.locator('button:has-text("All Types")');
            await expect(typeFilter).toBeVisible();
        });

        test('should have plan filter', async ({ page }) => {
            const planFilter = page.locator('button:has-text("All Plans")');
            await expect(planFilter).toBeVisible();
        });

        test('should have new organization button', async ({ page }) => {
            await expect(page.getByRole('link', { name: /New Organization/i })).toBeVisible();
        });

        test('should display organizations table', async ({ page }) => {
            await expect(page.locator('table')).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Organization/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Type/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Partner/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Plan/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Users/i })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
        });

        test('should filter by status', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("All Status")');
            await statusFilter.click();
            await page.locator('[role="option"]:has-text("Active")').click();
            await page.waitForTimeout(500);
        });

        test('should filter by plan', async ({ page }) => {
            const planFilter = page.locator('button:has-text("All Plans")');
            await planFilter.click();
            await page.locator('[role="option"]:has-text("Professional")').click();
            await page.waitForTimeout(500);
        });

        test('should search organizations', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        });
    });
});
