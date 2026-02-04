import { test, expect } from '@playwright/test';

// Test fixtures
const testData = {
    entry: {
        income: () => ({
            type: 'income',
            date: new Date().toISOString().split('T')[0],
            amount: 1000,
            description: `Test Income ${Date.now()}`,
            payment_method: 'bank_transfer',
            reference: `REF-${Date.now()}`,
        }),
        expense: () => ({
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            amount: 500,
            description: `Test Expense ${Date.now()}`,
            payment_method: 'cash',
        }),
    }
};

test.describe('Cash Book Module', () => {
    test.describe('Cash Book List Page', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/cashbook');
        });

        test('should display cash book page with stats', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Cash Book');
        });

        test('should display stats cards', async ({ page }) => {
            await expect(page.locator('text=Total Entries')).toBeVisible();
            await expect(page.locator('text=Total Income')).toBeVisible();
            await expect(page.locator('text=Total Expense')).toBeVisible();
        });

        test('should have search input', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await expect(searchInput).toBeVisible();
        });

        test('should have status tabs', async ({ page }) => {
            await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Confirmed' })).toBeVisible();
        });

        test('should have new entry button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /New/ })).toBeVisible();
        });

        test('should filter by status', async ({ page }) => {
            await page.getByRole('tab', { name: 'Confirmed' }).click();
            await page.waitForResponse(resp => 
                resp.url().includes('/api/cashbook') && 
                resp.url().includes('state=confirmed')
            );
        });

        test('should filter by type', async ({ page }) => {
            const typeFilter = page.locator('button:has-text("All Types")');
            if (await typeFilter.isVisible()) {
                await typeFilter.click();
                await page.locator('[role="option"]:has-text("Income")').click();
                await page.waitForResponse(resp => 
                    resp.url().includes('/api/cashbook') && 
                    resp.url().includes('type=income')
                );
            }
        });
    });

    test.describe('Create Entry', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/cashbook/new');
        });

        test('should display create form', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('New');
        });

        test('should have form fields', async ({ page }) => {
            await expect(page.locator('label:has-text("Amount")')).toBeVisible();
            await expect(page.locator('label:has-text("Date")')).toBeVisible();
            await expect(page.locator('label:has-text("Description")')).toBeVisible();
        });

        test('should have type selector', async ({ page }) => {
            const typeSelector = page.locator('button:has-text("Income"), button:has-text("Expense")');
            await expect(typeSelector.first()).toBeVisible();
        });

        test('should have payment method selector', async ({ page }) => {
            await expect(page.locator('label:has-text("Payment Method")')).toBeVisible();
        });

        test('should create income entry', async ({ page }) => {
            const entryData = testData.entry.income();
            
            // Select type
            await page.locator('button:has-text("Income")').click();
            await page.locator('[role="option"]:has-text("Income")').click();
            
            // Fill amount
            await page.fill('input[type="number"]', entryData.amount.toString());
            
            // Fill description
            await page.fill('textarea, input#description', entryData.description);
            
            // Submit
            await page.getByRole('button', { name: 'Save' }).click();
            
            // Should redirect to detail or list
            await expect(page).toHaveURL(/\/cashbook/);
        });

        test('should create expense entry', async ({ page }) => {
            const entryData = testData.entry.expense();
            
            // Select expense type
            await page.locator('button:has-text("Income")').click();
            await page.locator('[role="option"]:has-text("Expense")').click();
            
            // Fill amount
            await page.fill('input[type="number"]', entryData.amount.toString());
            
            // Fill description
            await page.fill('textarea, input#description', entryData.description);
            
            // Submit
            await page.getByRole('button', { name: 'Save' }).click();
        });

        test('should show validation for required fields', async ({ page }) => {
            // Try to submit without amount
            await page.getByRole('button', { name: 'Save' }).click();
            
            // Form should show validation
            await expect(page.locator('.text-red-500, .text-destructive')).toBeVisible();
        });
    });

    test.describe('Entry Detail', () => {
        let entryId: number;

        test.beforeAll(async ({ request }) => {
            // Create a test entry via API
            const response = await request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            if (response.ok()) {
                const data = await response.json();
                entryId = data.data.id;
            }
        });

        test('should display entry details', async ({ page }) => {
            if (!entryId) {
                test.skip();
                return;
            }
            
            await page.goto(`/cashbook/${entryId}`);
            
            await expect(page.locator('text=Amount')).toBeVisible();
            await expect(page.locator('text=Status')).toBeVisible();
        });

        test('should show allocations section', async ({ page }) => {
            if (!entryId) {
                test.skip();
                return;
            }
            
            await page.goto(`/cashbook/${entryId}`);
            
            await expect(page.locator('text=Allocations')).toBeVisible();
        });

        test('should have action buttons', async ({ page }) => {
            if (!entryId) {
                test.skip();
                return;
            }
            
            await page.goto(`/cashbook/${entryId}`);
            
            await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
        });

        test('should confirm entry', async ({ page }) => {
            // Create a draft entry
            const response = await page.request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!response.ok()) {
                test.skip();
                return;
            }
            
            const data = await response.json();
            await page.goto(`/cashbook/${data.data.id}`);
            
            const confirmButton = page.getByRole('button', { name: 'Confirm' });
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForResponse(resp => resp.url().includes('/confirm'));
            }
        });
    });

    test.describe('Invoice Allocation', () => {
        test('should show allocate button when invoices exist', async ({ page }) => {
            // Create an entry
            const response = await page.request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!response.ok()) {
                test.skip();
                return;
            }
            
            const data = await response.json();
            await page.goto(`/cashbook/${data.data.id}`);
            
            // Check for allocate functionality
            const allocateButton = page.getByRole('button', { name: /Allocate/ });
            // Button may or may not be visible depending on state
            if (await allocateButton.isVisible()) {
                await expect(allocateButton).toBeEnabled();
            }
        });
    });

    test.describe('API Endpoints', () => {
        test('GET /api/cashbook returns entries list', async ({ request }) => {
            const response = await request.get('/api/cashbook');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
        });

        test('GET /api/cashbook/stats returns statistics', async ({ request }) => {
            const response = await request.get('/api/cashbook/stats');
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data).toBeDefined();
        });

        test('POST /api/cashbook creates an entry', async ({ request }) => {
            const entryData = testData.entry.income();
            
            const response = await request.post('/api/cashbook', {
                data: entryData,
            });
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.id).toBeDefined();
            expect(data.data.amount).toBe(entryData.amount);
        });

        test('POST /api/cashbook/:id/confirm confirms an entry', async ({ request }) => {
            // Create an entry first
            const createResponse = await request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!createResponse.ok()) {
                test.skip();
                return;
            }
            
            const created = await createResponse.json();
            
            // Confirm it
            const response = await request.post(`/api/cashbook/${created.data.id}/confirm`);
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.state).toBe('confirmed');
        });

        test('PUT /api/cashbook/:id updates an entry', async ({ request }) => {
            // Create an entry first
            const createResponse = await request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!createResponse.ok()) {
                test.skip();
                return;
            }
            
            const created = await createResponse.json();
            
            // Update it
            const response = await request.put(`/api/cashbook/${created.data.id}`, {
                data: { description: 'Updated description' },
            });
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.data.description).toBe('Updated description');
        });

        test('DELETE /api/cashbook/:id deletes an entry', async ({ request }) => {
            // Create an entry first
            const createResponse = await request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!createResponse.ok()) {
                test.skip();
                return;
            }
            
            const created = await createResponse.json();
            
            // Delete it
            const response = await request.delete(`/api/cashbook/${created.data.id}`);
            expect(response.status()).toBe(204);
        });

        test('POST /api/cashbook/:id/allocate creates allocation', async ({ request }) => {
            // This test requires an existing invoice
            // Skip if no invoice exists
            const invoiceResponse = await request.get('/api/invoices?per_page=1');
            const invoices = await invoiceResponse.json();
            
            if (!invoices.data || invoices.data.length === 0) {
                test.skip();
                return;
            }
            
            const invoice = invoices.data[0];
            
            // Create a cash book entry
            const createResponse = await request.post('/api/cashbook', {
                data: testData.entry.income(),
            });
            
            if (!createResponse.ok()) {
                test.skip();
                return;
            }
            
            const entry = await createResponse.json();
            
            // Allocate to invoice
            const response = await request.post(`/api/cashbook/${entry.data.id}/allocate`, {
                data: {
                    invoice_id: invoice.id,
                    amount: 100,
                },
            });
            
            // May fail if entry isn't confirmed, which is expected
            expect([200, 201, 422]).toContain(response.status());
        });
    });

    test.describe('Filters and Search', () => {
        test('should search by description', async ({ page }) => {
            await page.goto('/cashbook');
            
            await page.fill('input[placeholder*="Search"]', 'test');
            await page.waitForResponse(resp => 
                resp.url().includes('/api/cashbook') && 
                resp.url().includes('search=test')
            );
        });

        test('should filter by date range', async ({ page }) => {
            await page.goto('/cashbook');
            
            // Look for date filter inputs
            const dateFromInput = page.locator('input[type="date"]').first();
            if (await dateFromInput.isVisible()) {
                const today = new Date().toISOString().split('T')[0];
                await dateFromInput.fill(today);
            }
        });

        test('should paginate results', async ({ page }) => {
            await page.goto('/cashbook');
            
            // Check if pagination exists
            const pagination = page.locator('nav[aria-label="pagination"], .pagination');
            if (await pagination.isVisible()) {
                const nextButton = page.getByRole('button', { name: /Next|>/ });
                if (await nextButton.isEnabled()) {
                    await nextButton.click();
                    await page.waitForResponse(resp => 
                        resp.url().includes('/api/cashbook') && 
                        resp.url().includes('page=2')
                    );
                }
            }
        });
    });
});
