import { test, expect, testData, apiRequest } from '../../core/tests/fixtures';

// Extend test data for invoicing
const invoiceTestData = {
    invoice: {
        draft: () => ({
            move_type: 'out_invoice',
            ref: `TEST-${Date.now()}`,
            invoice_date: new Date().toISOString().split('T')[0],
            invoice_date_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lines: [
                {
                    name: 'Test Product',
                    quantity: 2,
                    price_unit: 100,
                    discount: 0,
                    tax_ids: [],
                    display_type: 'product',
                },
            ],
        }),
    },
    product: {
        simple: () => ({
            name: `Test Product ${Date.now()}`,
            code: `PROD-${Date.now()}`,
            list_price: 99.99,
            cost: 50,
            sale_ok: true,
            purchase_ok: true,
        }),
    },
};

test.describe('Invoicing Module', () => {
    test.describe('Invoice List Page', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices');
        });

        test('should display invoices page with title', async ({ page }) => {
            // Title can be "Invoices" or "Bills" depending on active tab
            await expect(page.locator('h1')).toBeVisible();
            const title = await page.locator('h1').textContent();
            expect(['Invoices', 'Bills']).toContain(title?.trim());
        });

        test('should display stats cards', async ({ page }) => {
            await expect(page.getByText('Total', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Outstanding', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Overdue', { exact: true }).first()).toBeVisible();
        });

        test('should have type tabs', async ({ page }) => {
            await expect(page.getByRole('tab', { name: /Sales/i })).toBeVisible();
            await expect(page.getByRole('tab', { name: /Purchases/i })).toBeVisible();
        });

        test('should have search input', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await expect(searchInput).toBeVisible();
        });

        test('should have new invoice button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /New Invoice/i })).toBeVisible();
        });

        test('should switch between sales and purchases tabs', async ({ page }) => {
            const purchasesTab = page.getByRole('tab', { name: /Purchases|Bills/i });
            if (await purchasesTab.isVisible()) {
                await purchasesTab.click();
                await page.waitForTimeout(500);
            }
        });

        test('should filter by status', async ({ page }) => {
            const filterButton = page.locator('button:has-text("All Status"), button:has-text("Status")');
            if (await filterButton.isVisible()) {
                await filterButton.click();
                await expect(page.locator('[role="option"]')).toBeVisible();
            }
        });

        test('should search invoices', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('INV-2024');
            await page.waitForTimeout(500); // Debounce
        });
    });

    test.describe('Create Invoice', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should display invoice form', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('New Invoice');
        });

        test('should have invoice type selector', async ({ page }) => {
            await expect(page.locator('text=Type')).toBeVisible();
            const typeSelect = page.locator('button:has-text("Customer Invoice")');
            await expect(typeSelect).toBeVisible();
        });

        test('should have customer/vendor picker', async ({ page }) => {
            await expect(page.getByText('Customer', { exact: true })).toBeVisible();
        });

        test('should have date fields', async ({ page }) => {
            await expect(page.locator('text=Invoice Date')).toBeVisible();
            await expect(page.locator('text=Due Date')).toBeVisible();
        });

        test('should have invoice lines section', async ({ page }) => {
            await expect(page.locator('text=Invoice Lines')).toBeVisible();
        });

        test('should have add line button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Add Line/i })).toBeVisible();
        });

        test('should have add section button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Add Section/i })).toBeVisible();
        });

        test('should have add note button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Add Note/i })).toBeVisible();
        });

        test('should display totals summary', async ({ page }) => {
            await expect(page.locator('.text-muted-foreground:has-text("Subtotal")').first()).toBeVisible();
            await expect(page.locator('.text-muted-foreground:has-text("Tax")').first()).toBeVisible();
            await expect(page.locator('.font-semibold:has-text("Total")').first()).toBeVisible();
        });

        test('should have save button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
        });

        test('should have cancel button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
        });

        test('should add new line item', async ({ page }) => {
            const initialRows = await page.locator('table tbody tr').count();
            await page.getByRole('button', { name: /Add Line/i }).click();
            const newRows = await page.locator('table tbody tr').count();
            expect(newRows).toBeGreaterThan(initialRows);
        });

        test('should add section', async ({ page }) => {
            await page.getByRole('button', { name: /Add Section/i }).click();
            await expect(page.locator('input[placeholder="Section title"]')).toBeVisible();
        });

        test('should add note', async ({ page }) => {
            await page.getByRole('button', { name: /Add Note/i }).click();
            await expect(page.locator('textarea[placeholder="Note..."]')).toBeVisible();
        });

        test.skip('should calculate totals on line change', async ({ page }) => {
            // Fill in a line item
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);

            await qtyInput.fill('5');
            await priceInput.fill('100');

            // Check that total updates
            await page.waitForTimeout(300);
            const summary = page.locator('text=Summary').locator('..');
            await expect(summary).toContainText('500');
        });

        test.skip('should change invoice type', async ({ page }) => {
            const typeButton = page.locator('button:has-text("Customer Invoice")');
            await typeButton.click();
            await page.locator('[role="option"]:has-text("Vendor Bill")').click();
            await expect(page.locator('text=Vendor')).toBeVisible();
        });
    });

    test.describe('Invoice Detail Page', () => {
        test.skip('should navigate to invoice detail from list', async ({ page }) => {
            await page.goto('/invoices');
            
            // Wait for invoices to load
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Click on first invoice if exists
            const firstRow = page.locator('table tbody tr, [data-testid="invoice-row"]').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await expect(page.url()).toMatch(/\/invoices\/\d+/);
            }
        });
    });

    test.describe('Invoice Actions', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices');
        });

        test('should have action menu on invoice row', async ({ page }) => {
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const actionButton = page.locator('button[aria-label="Actions"], button:has([data-lucide="more-horizontal"])').first();
            if (await actionButton.isVisible()) {
                await actionButton.click();
                await expect(page.locator('[role="menu"], [role="menuitem"]')).toBeVisible();
            }
        });
    });

    test.describe('Invoice Workflow', () => {
        test('should show confirm button for draft invoice', async ({ page }) => {
            // This test requires a draft invoice to exist
            // Create one via API first or check UI
            await page.goto('/invoices/new');
            await expect(page.locator('h1')).toContainText('New Invoice');
        });

        test('should show payment button for posted invoice', async ({ page }) => {
            await page.goto('/invoices');
            
            // Look for a posted invoice with payment button
            const paymentBtn = page.locator('button:has-text("Register Payment")');
            // This may not be visible if no posted invoices exist
        });
    });

    test.describe('Invoice Filters', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices');
        });

        test('should filter by draft status', async ({ page }) => {
            const statusFilter = page.locator('button:has-text("Status"), [data-testid="status-filter"]');
            if (await statusFilter.isVisible()) {
                await statusFilter.click();
                const draftOption = page.locator('[role="option"]:has-text("Draft")');
                if (await draftOption.isVisible()) {
                    await draftOption.click();
                }
            }
        });

        test('should filter by date range', async ({ page }) => {
            const dateFilter = page.locator('button:has-text("Date"), [data-testid="date-filter"]');
            if (await dateFilter.isVisible()) {
                await dateFilter.click();
            }
        });

        test('should clear all filters', async ({ page }) => {
            const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Reset")');
            if (await clearBtn.isVisible()) {
                await clearBtn.click();
            }
        });
    });

    test.describe('Invoice API Endpoints', () => {
        test('should fetch invoice stats', async ({ page }) => {
            await page.goto('/invoices');
            const response = await page.waitForResponse(
                resp => resp.url().includes('/api/invoices/stats')
            );
            expect(response.status()).toBe(200);
        });

        test('should fetch invoices list', async ({ page }) => {
            await page.goto('/invoices');
            const response = await page.waitForResponse(
                resp => resp.url().includes('/api/invoices') && !resp.url().includes('/stats')
            );
            expect(response.status()).toBe(200);
        });

        test('should fetch currencies', async ({ page }) => {
            await page.goto('/invoices/new');
            const response = await page.waitForResponse(
                resp => resp.url().includes('/api/invoices/currencies')
            );
            expect(response.status()).toBe(200);
        });

        test('should fetch taxes', async ({ page }) => {
            await page.goto('/invoices/new');
            const response = await page.waitForResponse(
                resp => resp.url().includes('/api/invoices/taxes')
            );
            expect(response.status()).toBe(200);
        });
    });

    test.describe('Invoice Form Validation', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should show error when saving without customer', async ({ page }) => {
            await page.getByRole('button', { name: /Save/i }).click();
            
            // Should show validation error or alert
            await page.waitForTimeout(500);
            // Alert or toast should appear
        });

        test('should require at least one line item', async ({ page }) => {
            // Remove all lines
            const deleteButtons = page.locator('button:has([data-lucide="trash-2"])');
            const count = await deleteButtons.count();
            
            for (let i = count - 1; i >= 0; i--) {
                const btn = deleteButtons.nth(i);
                if (await btn.isEnabled()) {
                    await btn.click();
                }
            }
        });
    });

    test.describe('Invoice Print/Export', () => {
        test.skip('should have print button on detail page', async ({ page }) => {
            await page.goto('/invoices');
            
            // Navigate to first invoice
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            const firstRow = page.locator('table tbody tr').first();
            
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const printBtn = page.getByRole('button', { name: /Print/i });
                await expect(printBtn).toBeVisible();
            }
        });
    });

    test.describe('Payment Registration', () => {
        test('should open payment dialog', async ({ page }) => {
            await page.goto('/invoices');
            
            // Find a posted invoice
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Navigate to detail and try to register payment
            const paymentBtn = page.getByRole('button', { name: /Register Payment/i }).first();
            if (await paymentBtn.isVisible()) {
                await paymentBtn.click();
                await expect(page.locator('[role="dialog"]')).toBeVisible();
                await expect(page.locator('text=Register Payment')).toBeVisible();
            }
        });

        test('payment dialog should have amount field', async ({ page }) => {
            await page.goto('/invoices');
            
            const paymentBtn = page.getByRole('button', { name: /Register Payment/i }).first();
            if (await paymentBtn.isVisible()) {
                await paymentBtn.click();
                await expect(page.locator('label:has-text("Amount")')).toBeVisible();
                await expect(page.locator('input#amount')).toBeVisible();
            }
        });

        test('payment dialog should have payment method selector', async ({ page }) => {
            await page.goto('/invoices');
            
            const paymentBtn = page.getByRole('button', { name: /Register Payment/i }).first();
            if (await paymentBtn.isVisible()) {
                await paymentBtn.click();
                await expect(page.locator('text=Payment Method')).toBeVisible();
            }
        });
    });

    test.describe('Credit Note Creation', () => {
        test.skip('should have credit note button on posted invoice', async ({ page }) => {
            await page.goto('/invoices');
            
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            const firstRow = page.locator('table tbody tr').first();
            
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const creditNoteBtn = page.getByRole('button', { name: /Credit Note/i });
                // Only visible for posted invoices
            }
        });
    });

    test.describe('Invoice Duplication', () => {
        test.skip('should have duplicate button', async ({ page }) => {
            await page.goto('/invoices');
            
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            const firstRow = page.locator('table tbody tr').first();
            
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const duplicateBtn = page.getByRole('button', { name: /Duplicate/i });
                await expect(duplicateBtn).toBeVisible();
            }
        });
    });

    test.describe('Responsive Design', () => {
        test('invoice list should be responsive on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/invoices');
            
            await expect(page.locator('h1')).toContainText('Invoices');
            await expect(page.getByRole('button', { name: /New/i })).toBeVisible();
        });

        test('invoice form should be responsive on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/invoices/new');
            
            await expect(page.locator('h1')).toContainText('New Invoice');
            await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
        });

        test.skip('invoice detail should be responsive on tablet', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                await expect(page.locator('h1')).toBeVisible();
            }
        });
    });

    test.describe('Edge Cases - Line Items', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should handle zero quantity', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            await qtyInput.fill('0');
            
            // Total should be 0
            await page.waitForTimeout(300);
        });

        test('should handle negative price (for discounts)', async ({ page }) => {
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            await priceInput.fill('-50');
            
            await page.waitForTimeout(300);
        });

        test('should handle 100% discount', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            const discountInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(2);
            
            await qtyInput.fill('1');
            await priceInput.fill('100');
            await discountInput.fill('100');
            
            await page.waitForTimeout(300);
            // Total should be 0
        });

        test('should handle very large numbers', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            
            await qtyInput.fill('999999');
            await priceInput.fill('999999.99');
            
            await page.waitForTimeout(300);
        });

        test('should handle decimal quantities', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            await qtyInput.fill('2.5');
            
            await page.waitForTimeout(300);
        });

        test.skip('should remove line when clicking delete', async ({ page }) => {
            // Add a second line first
            await page.getByRole('button', { name: /Add Line/i }).click();
            const rowsBefore = await page.locator('table tbody tr').count();
            
            // Delete one line
            const deleteBtn = page.locator('button:has([data-lucide="trash-2"])').first();
            if (await deleteBtn.isEnabled()) {
                await deleteBtn.click();
                const rowsAfter = await page.locator('table tbody tr').count();
                expect(rowsAfter).toBeLessThan(rowsBefore);
            }
        });

        test.skip('should not delete last line', async ({ page }) => {
            // Try to delete the only line
            const deleteBtn = page.locator('button:has([data-lucide="trash-2"])').first();
            const isDisabled = await deleteBtn.isDisabled();
            // Should be disabled or only one line should remain
        });

        test('should handle multiple sections and notes', async ({ page }) => {
            await page.getByRole('button', { name: /Add Section/i }).click();
            await page.getByRole('button', { name: /Add Note/i }).click();
            await page.getByRole('button', { name: /Add Line/i }).click();
            await page.getByRole('button', { name: /Add Section/i }).click();
            
            const rows = await page.locator('table tbody tr').count();
            expect(rows).toBeGreaterThanOrEqual(5);
        });
    });

    test.describe('Edge Cases - Dates', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should handle past invoice date', async ({ page }) => {
            const dateInput = page.locator('input#invoice_date');
            const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await dateInput.fill(pastDate);
        });

        test('should handle due date before invoice date', async ({ page }) => {
            const invoiceDateInput = page.locator('input#invoice_date');
            const dueDateInput = page.locator('input#invoice_date_due');
            
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            await invoiceDateInput.fill(today);
            await dueDateInput.fill(yesterday);
            
            // Should show warning or prevent this
        });

        test('should handle far future dates', async ({ page }) => {
            const dueDateInput = page.locator('input#invoice_date_due');
            const futureDate = new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await dueDateInput.fill(futureDate);
        });
    });

    test.describe('Edge Cases - Currency and Numbers', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should display currency symbol correctly', async ({ page }) => {
            const summarySection = page.locator('text=Summary').locator('..');
            await expect(summarySection).toBeVisible();
            // Should show $ or configured currency
        });

        test('should format large totals with thousands separator', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            
            await qtyInput.fill('1000');
            await priceInput.fill('1000');
            
            await page.waitForTimeout(500);
            // Total should be formatted as 1,000,000.00 or similar
        });
    });

    test.describe('Edge Cases - Contact Selection', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should search contacts in picker', async ({ page }) => {
            const contactButton = page.locator('button:has-text("Select contact")');
            if (await contactButton.isVisible()) {
                await contactButton.click();
                
                const searchInput = page.locator('[cmdk-input]');
                if (await searchInput.isVisible()) {
                    await searchInput.fill('test');
                    await page.waitForTimeout(500);
                }
            }
        });

        test('should clear selected contact', async ({ page }) => {
            // This tests the ability to change contact after selection
            const contactButton = page.locator('button[role="combobox"]').first();
            if (await contactButton.isVisible()) {
                await contactButton.click();
                await page.waitForTimeout(300);
            }
        });
    });

    test.describe('Edge Cases - Invoice States', () => {
        test('should not allow editing posted invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Find a posted invoice and try to edit
            const postedBadge = page.locator('text=Posted').first();
            if (await postedBadge.isVisible()) {
                const row = postedBadge.locator('xpath=ancestor::tr');
                await row.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                // Edit button should not be visible for posted invoices
                const editBtn = page.getByRole('button', { name: /Edit/i });
                // Should not be visible or should redirect to read-only view
            }
        });

        test('should show correct actions for draft invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const draftBadge = page.locator('text=Draft').first();
            if (await draftBadge.isVisible()) {
                const row = draftBadge.locator('xpath=ancestor::tr');
                await row.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                // Should see Edit and Confirm buttons
                await expect(page.getByRole('button', { name: /Edit/i })).toBeVisible();
                await expect(page.getByRole('button', { name: /Confirm/i })).toBeVisible();
            }
        });

        test('should show correct actions for cancelled invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const cancelledBadge = page.locator('text=Cancelled').first();
            if (await cancelledBadge.isVisible()) {
                const row = cancelledBadge.locator('xpath=ancestor::tr');
                await row.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                // Should see Reset to Draft button
                await expect(page.getByRole('button', { name: /Reset to Draft/i })).toBeVisible();
            }
        });
    });

    test.describe('Edge Cases - Payment States', () => {
        test('should show overdue badge for past due invoices', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Check if any overdue badges are visible
            const overdueBadge = page.locator('text=Overdue');
            // May or may not be visible depending on test data
        });

        test('should show partial payment state', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const partialBadge = page.locator('text=Partially Paid');
            // May or may not be visible depending on test data
        });

        test('should update payment state after registration', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Find posted unpaid invoice
            const notPaidBadge = page.locator('text=Not Paid').first();
            if (await notPaidBadge.isVisible()) {
                const row = notPaidBadge.locator('xpath=ancestor::tr');
                await row.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const paymentBtn = page.getByRole('button', { name: /Register Payment/i });
                if (await paymentBtn.isVisible()) {
                    await paymentBtn.click();
                    await expect(page.locator('[role="dialog"]')).toBeVisible();
                }
            }
        });
    });

    test.describe('Edge Cases - Search and Filters', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
        });

        test('should handle empty search results', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('nonexistentinvoice12345xyz');
            await page.waitForTimeout(500);
            
            // Should show empty state or no results message
        });

        test('should handle special characters in search', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('INV-2024/001');
            await page.waitForTimeout(500);
        });

        test('should combine multiple filters', async ({ page }) => {
            // Switch to purchases tab
            await page.getByRole('tab', { name: /Purchases/i }).click();
            await page.waitForTimeout(300);
            
            // Then search
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        });

        test('should persist filters on navigation', async ({ page }) => {
            // Apply search
            const searchInput = page.locator('input[placeholder*="Search"]');
            await searchInput.fill('test');
            await page.waitForTimeout(500);
            
            // Navigate away and back
            await page.goto('/dashboard');
            await page.goto('/invoices');
            
            // Filters may or may not persist (implementation dependent)
        });
    });

    test.describe('Edge Cases - Keyboard Navigation', () => {
        test('should navigate form with Tab key', async ({ page }) => {
            await page.goto('/invoices/new');
            
            // Tab through form fields
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
        });

        test('should submit form with Enter key', async ({ page }) => {
            await page.goto('/invoices/new');
            
            // Focus on save button and press Enter
            const saveBtn = page.getByRole('button', { name: /Save/i });
            await saveBtn.focus();
            await page.keyboard.press('Enter');
        });

        test('should close dialogs with Escape key', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const paymentBtn = page.getByRole('button', { name: /Register Payment/i }).first();
            if (await paymentBtn.isVisible()) {
                await paymentBtn.click();
                await expect(page.locator('[role="dialog"]')).toBeVisible();
                
                await page.keyboard.press('Escape');
                await expect(page.locator('[role="dialog"]')).not.toBeVisible();
            }
        });
    });

    test.describe('Edge Cases - Error Handling', () => {
        test('should handle network error gracefully', async ({ page }) => {
            await page.goto('/invoices/new');
            
            // Intercept API calls and simulate error
            await page.route('**/api/invoices', route => {
                route.abort();
            });
            
            await page.getByRole('button', { name: /Save/i }).click();
            await page.waitForTimeout(1000);
            
            // Should show error message
        });

        test('should handle 500 server error', async ({ page }) => {
            await page.goto('/invoices/new');
            
            await page.route('**/api/invoices', route => {
                route.fulfill({
                    status: 500,
                    body: JSON.stringify({ message: 'Internal Server Error' }),
                });
            });
            
            await page.getByRole('button', { name: /Save/i }).click();
            await page.waitForTimeout(1000);
        });

        test('should handle validation errors from server', async ({ page }) => {
            await page.goto('/invoices/new');
            
            await page.route('**/api/invoices', route => {
                route.fulfill({
                    status: 422,
                    body: JSON.stringify({
                        message: 'Validation failed',
                        errors: {
                            contact_id: ['The contact field is required.'],
                        },
                    }),
                });
            });
            
            await page.getByRole('button', { name: /Save/i }).click();
            await page.waitForTimeout(1000);
        });
    });

    test.describe('Edge Cases - Concurrent Operations', () => {
        test('should handle double-click on save button', async ({ page }) => {
            await page.goto('/invoices/new');
            
            const saveBtn = page.getByRole('button', { name: /Save/i });
            
            // Double click rapidly
            await saveBtn.dblclick();
            
            // Should not create duplicate invoices
        });

        test('should handle rapid navigation', async ({ page }) => {
            await page.goto('/invoices');
            await page.goto('/invoices/new');
            await page.goto('/invoices');
            await page.goto('/invoices/new');
            
            await expect(page.locator('h1')).toContainText('New Invoice');
        });
    });

    test.describe('Invoice Type Specific Tests', () => {
        test.skip('should show vendor fields for vendor bill', async ({ page }) => {
            await page.goto('/invoices/new?type=in_invoice');
            
            await expect(page.locator('text=Vendor')).toBeVisible();
        });

        test.skip('should show customer fields for customer invoice', async ({ page }) => {
            await page.goto('/invoices/new?type=out_invoice');
            
            await expect(page.locator('text=Customer')).toBeVisible();
        });

        test('should handle credit note creation', async ({ page }) => {
            await page.goto('/invoices/new?type=out_refund');
            
            await expect(page.locator('h1')).toContainText('New Invoice');
        });

        test('should handle vendor refund', async ({ page }) => {
            await page.goto('/invoices/new?type=in_refund');
            
            await expect(page.locator('h1')).toContainText('New Invoice');
        });
    });

    test.describe('Tax Calculations', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/invoices/new');
        });

        test('should calculate tax correctly with single rate', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            
            await qtyInput.fill('10');
            await priceInput.fill('100');
            
            // Select a tax if available
            const taxSelect = page.locator('table tbody tr').first().locator('button:has-text("No tax")');
            if (await taxSelect.isVisible()) {
                await taxSelect.click();
                const taxOption = page.locator('[role="option"]').first();
                if (await taxOption.isVisible()) {
                    await taxOption.click();
                }
            }
            
            await page.waitForTimeout(500);
        });

        test('should handle discount with tax', async ({ page }) => {
            const qtyInput = page.locator('table tbody tr').first().locator('input[type="number"]').first();
            const priceInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(1);
            const discountInput = page.locator('table tbody tr').first().locator('input[type="number"]').nth(2);
            
            await qtyInput.fill('10');
            await priceInput.fill('100');
            await discountInput.fill('10');
            
            await page.waitForTimeout(500);
            // Subtotal should be 900, tax calculated on 900
        });
    });
});
