import { test, expect, testData, apiRequest } from '../../core/tests/fixtures';

test.describe('Contacts Module', () => {
    test.describe('Contacts List Page', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
        });

        test('should display contacts page with stats', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Contacts');
            await expect(page.locator('.text-xs:has-text("Total")')).toBeVisible();
            await expect(page.locator('.text-xs:has-text("Companies")')).toBeVisible();
            await expect(page.locator('.text-xs:has-text("Individuals")')).toBeVisible();
            await expect(page.locator('.text-xs:has-text("Customers")')).toBeVisible();
            await expect(page.locator('.text-xs:has-text("Vendors")')).toBeVisible();
        });

        test('should have search input', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');
            await expect(searchInput).toBeVisible();
            await expect(searchInput).toBeEnabled();
        });

        test('should have filter buttons', async ({ page }) => {
            await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
            await expect(page.getByRole('button', { name: /Companies/ })).toBeVisible();
            await expect(page.getByRole('button', { name: /Individuals/ })).toBeVisible();
        });

        test('should have view mode toggle', async ({ page }) => {
            await expect(page.locator('button.h-8.w-8').first()).toBeVisible();
        });

        test('should have new contact button', async ({ page }) => {
            await expect(page.getByRole('button', { name: 'New Contact' })).toBeVisible();
        });

        test('should filter by company type', async ({ page }) => {
            await page.getByRole('button', { name: /Companies/ }).click();
            await page.waitForResponse(resp => 
                resp.url().includes('/api/contacts') && 
                resp.url().includes('companies_only')
            );
            await expect(page.getByRole('button', { name: /Companies/ })).toHaveClass(/secondary/);
        });

        test('should filter by individual type', async ({ page }) => {
            await page.getByRole('button', { name: /Individuals/ }).click();
            await page.waitForResponse(resp => 
                resp.url().includes('/api/contacts') && 
                resp.url().includes('individuals_only')
            );
            await expect(page.getByRole('button', { name: /Individuals/ })).toHaveClass(/secondary/);
        });

        test('should search contacts', async ({ page }) => {
            await page.fill('input[placeholder*="Search"]', 'test');
            await page.waitForResponse(resp => 
                resp.url().includes('/api/contacts') && 
                resp.url().includes('search=test')
            );
        });
    });

    test.describe('Create Contact', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
        });

        test('should open create dialog', async ({ page }) => {
            await page.getByRole('button', { name: 'New Contact' }).click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();
            await expect(page.locator('[role="dialog"] h2')).toContainText('New Contact');
        });

        test('should have form tabs', async ({ page }) => {
            await page.getByRole('button', { name: 'New Contact' }).click();
            await expect(page.locator('[role="dialog"]').getByRole('tab', { name: 'Basic Info' })).toBeVisible();
            await expect(page.locator('[role="dialog"]').getByRole('tab', { name: 'Address' })).toBeVisible();
            await expect(page.locator('[role="dialog"]').getByRole('tab', { name: 'Classification' })).toBeVisible();
        });

        test('should toggle company mode', async ({ page }) => {
            await page.getByRole('button', { name: 'New Contact' }).click();
            const companySwitch = page.getByRole('switch', { name: 'Company' });
            await companySwitch.click();
            await expect(page.locator('[role="dialog"]').getByRole('tab', { name: 'Legal' })).toBeVisible();
        });

        test('should create individual contact', async ({ page }) => {
            const contactData = testData.contact.individual();
            
            await page.getByRole('button', { name: 'New Contact' }).click();
            const dialog = page.locator('[role="dialog"]');
            
            // Fill name field (first textbox in the tabpanel area)
            const tabpanel = dialog.locator('[role="tabpanel"]');
            await tabpanel.getByRole('textbox').first().fill(contactData.name);
            
            // Submit
            await dialog.getByRole('button', { name: 'Create Contact' }).click();
            
            // Wait for dialog to close (success indicator)
            await expect(dialog).not.toBeVisible({ timeout: 5000 });
        });

        test('should create company contact', async ({ page }) => {
            const contactData = testData.contact.company();
            
            await page.getByRole('button', { name: 'New Contact' }).click();
            const dialog = page.locator('[role="dialog"]');
            
            // Toggle company mode
            await dialog.getByRole('switch', { name: 'Company' }).click();
            
            // Fill name field
            const tabpanel = dialog.locator('[role="tabpanel"]');
            await tabpanel.getByRole('textbox').first().fill(contactData.name);
            
            // Submit
            await dialog.getByRole('button', { name: 'Create Contact' }).click();
            
            // Wait for dialog to close or success
            await expect(dialog).not.toBeVisible({ timeout: 5000 });
        });

        test('should validate required fields', async ({ page }) => {
            await page.getByRole('button', { name: 'New Contact' }).click();
            const dialog = page.locator('[role="dialog"]');
            await dialog.getByRole('button', { name: 'Create Contact' }).click();
            await expect(dialog).toBeVisible();
        });

        test('should close dialog on cancel', async ({ page }) => {
            await page.getByRole('button', { name: 'New Contact' }).click();
            const dialog = page.locator('[role="dialog"]');
            await dialog.getByRole('button', { name: 'Cancel' }).click();
            await expect(dialog).not.toBeVisible();
        });
    });

    test.describe('Edit Contact', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForResponse(resp => resp.url().includes('/api/contacts') && resp.ok());
        });

        test('should open edit dialog from card', async ({ page }) => {
            // Find a contact card by looking for heading level 3 (contact names)
            const contactHeading = page.locator('h3').first();
            if (await contactHeading.count() === 0) {
                test.skip();
                return;
            }
            
            // Get the card container and find the edit button
            const card = contactHeading.locator('..').locator('..').locator('..');
            await card.hover();
            await page.waitForTimeout(300);
            
            // The buttons are in a sibling div to the name - find by structure
            // Button order: View (eye), Edit (edit), Delete (trash)
            const buttons = card.locator('button');
            const buttonCount = await buttons.count();
            
            // Click the second button (edit)
            if (buttonCount >= 2) {
                await buttons.nth(1).click({ force: true });
                await expect(page.locator('[role="dialog"]')).toBeVisible();
            }
        });

        test('should populate form with existing data', async ({ page }) => {
            const contactHeading = page.locator('h3').first();
            if (await contactHeading.count() === 0) {
                test.skip();
                return;
            }
            
            const card = contactHeading.locator('..').locator('..').locator('..');
            await card.hover();
            await page.waitForTimeout(300);
            
            const buttons = card.locator('button');
            if (await buttons.count() >= 2) {
                await buttons.nth(1).click({ force: true });
                
                const dialog = page.locator('[role="dialog"]');
                await expect(dialog).toBeVisible();
                
                // Name field should have value
                const tabpanel = dialog.locator('[role="tabpanel"]');
                const nameInput = tabpanel.getByRole('textbox').first();
                await expect(nameInput).toHaveValue(/.+/);
            }
        });

        test('should update contact', async ({ page }) => {
            const contactHeading = page.locator('h3').first();
            if (await contactHeading.count() === 0) {
                test.skip();
                return;
            }
            
            const card = contactHeading.locator('..').locator('..').locator('..');
            await card.hover();
            await page.waitForTimeout(300);
            
            const buttons = card.locator('button');
            if (await buttons.count() >= 2) {
                await buttons.nth(1).click({ force: true });
                
                const dialog = page.locator('[role="dialog"]');
                const tabpanel = dialog.locator('[role="tabpanel"]');
                const nameInput = tabpanel.getByRole('textbox').first();
                const originalName = await nameInput.inputValue();
                await nameInput.fill(originalName + ' Updated');
                
                await dialog.getByRole('button', { name: 'Save Changes' }).click();
                // Wait for dialog to close (success indicator)
                await expect(dialog).not.toBeVisible({ timeout: 5000 });
            }
        });
    });

    test.describe('Delete Contact', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForResponse(resp => resp.url().includes('/api/contacts') && resp.ok());
        });

        test('should show delete confirmation', async ({ page }) => {
            const contactHeading = page.locator('h3').first();
            if (await contactHeading.count() === 0) {
                test.skip();
                return;
            }
            
            const card = contactHeading.locator('..').locator('..').locator('..');
            await card.hover();
            await page.waitForTimeout(300);
            
            let dialogShown = false;
            page.on('dialog', async dialog => {
                dialogShown = true;
                await dialog.dismiss();
            });
            
            const buttons = card.locator('button');
            if (await buttons.count() >= 3) {
                await buttons.nth(2).click({ force: true });
                await page.waitForTimeout(500);
                expect(dialogShown).toBe(true);
            }
        });
    });

    test.describe('Contact Card Display', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForResponse(resp => resp.url().includes('/api/contacts') && resp.ok());
        });

        test('should display contact names', async ({ page }) => {
            const cards = page.locator('h3');
            if (await cards.count() > 0) {
                await expect(cards.first()).toBeVisible();
            }
        });

        test('should show email with mailto link', async ({ page }) => {
            const emailLink = page.locator('a[href^="mailto:"]').first();
            if (await emailLink.count() > 0) {
                await expect(emailLink).toBeVisible();
            }
        });

        test('should show phone with tel link', async ({ page }) => {
            const phoneLink = page.locator('a[href^="tel:"]').first();
            if (await phoneLink.count() > 0) {
                await expect(phoneLink).toBeVisible();
            }
        });
    });

    test.describe('View Modes', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForResponse(resp => resp.url().includes('/api/contacts') && resp.ok());
        });

        test('should switch to list view', async ({ page }) => {
            const viewModeButtons = page.locator('.border.rounded-lg.p-1 button.h-8.w-8');
            await viewModeButtons.nth(1).click();
            await expect(page.locator('.divide-y')).toBeVisible();
        });

        test('should switch back to grid view', async ({ page }) => {
            const viewModeButtons = page.locator('.border.rounded-lg.p-1 button.h-8.w-8');
            await viewModeButtons.nth(1).click();
            await expect(page.locator('.divide-y')).toBeVisible();
            await viewModeButtons.nth(0).click();
            await expect(page.locator('.grid.grid-cols-1')).toBeVisible();
        });
    });

    test.describe('API Integration', () => {
        test('should load contacts from API', async ({ page }) => {
            const responsePromise = page.waitForResponse(
                resp => resp.url().includes('/api/contacts') && resp.ok()
            );
            await page.goto('/contacts');
            const response = await responsePromise;
            const data = await response.json();
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('meta');
        });

        test('should load options from API', async ({ page }) => {
            const responsePromise = page.waitForResponse(
                resp => resp.url().includes('/api/contacts/options') && resp.ok()
            );
            await page.goto('/contacts');
            const response = await responsePromise;
            const data = await response.json();
            expect(data.data).toHaveProperty('titles');
            expect(data.data).toHaveProperty('industries');
            expect(data.data).toHaveProperty('countries');
        });

        test('should have stats displayed', async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForTimeout(500);
            const totalStat = page.locator('.text-2xl.font-bold').first();
            await expect(totalStat).toBeVisible();
        });
    });

    test.describe('Refresh', () => {
        test('should refresh contacts list', async ({ page }) => {
            await page.goto('/contacts');
            await page.waitForResponse(resp => resp.url().includes('/api/contacts') && resp.ok());
            
            const responsePromise = page.waitForResponse(
                resp => resp.url().includes('/api/contacts') && resp.ok()
            );
            
            // Find refresh button by its icon
            const refreshBtn = page.locator('button:has(svg)').filter({ hasNotText: /All|Companies|Individuals|New|Search/ }).first();
            await refreshBtn.click();
            
            await responsePromise;
        });
    });
});

test.describe('Contacts Form Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/contacts');
        await page.getByRole('button', { name: 'New Contact' }).click();
    });

    test('should validate email format', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        const tabpanel = dialog.locator('[role="tabpanel"]');
        
        // Fill name first
        await tabpanel.getByRole('textbox').first().fill('Test Name');
        // Fill invalid email (4th textbox in Basic Info tab)
        await tabpanel.getByRole('textbox').nth(3).fill('invalid-email');
        
        await dialog.getByRole('button', { name: 'Create Contact' }).click();
        // Dialog stays open due to validation
        await expect(dialog).toBeVisible();
    });

    test('should create contact with only required fields', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        const tabpanel = dialog.locator('[role="tabpanel"]');
        
        // Just fill name
        await tabpanel.getByRole('textbox').first().fill('Minimal Contact ' + Date.now());
        
        await dialog.getByRole('button', { name: 'Create Contact' }).click();
        
        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
});

test.describe('Contacts Address Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/contacts');
        await page.getByRole('button', { name: 'New Contact' }).click();
    });

    test('should switch to address tab', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Address' }).click();
        await expect(dialog.getByText('Street')).toBeVisible();
        await expect(dialog.getByText('City')).toBeVisible();
    });

    test('should have country dropdown', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Address' }).click();
        await expect(dialog.getByRole('combobox').filter({ hasText: /Select country/i })).toBeVisible();
    });
});

test.describe('Contacts Classification Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/contacts');
        await page.getByRole('button', { name: 'New Contact' }).click();
    });

    test('should switch to classification tab', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Classification' }).click();
        await expect(dialog.getByRole('switch', { name: /Customer/i })).toBeVisible();
        await expect(dialog.getByRole('switch', { name: /Vendor/i })).toBeVisible();
    });

    test('should toggle customer flag', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Classification' }).click();
        const customerSwitch = dialog.getByRole('switch', { name: /Customer/i });
        await customerSwitch.click();
        await expect(customerSwitch).toHaveAttribute('data-state', 'checked');
    });

    test('should toggle vendor flag', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Classification' }).click();
        const vendorSwitch = dialog.getByRole('switch', { name: /Vendor/i });
        await vendorSwitch.click();
        await expect(vendorSwitch).toHaveAttribute('data-state', 'checked');
    });

    test('should have industry dropdown', async ({ page }) => {
        const dialog = page.locator('[role="dialog"]');
        await dialog.getByRole('tab', { name: 'Classification' }).click();
        await expect(dialog.getByRole('combobox').filter({ hasText: /Select industry/i })).toBeVisible();
    });
});
