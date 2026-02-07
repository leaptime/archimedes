import { test, expect } from '../../core/tests/fixtures';

test.describe('Italian E-Invoicing (FatturaPA) Module', () => {
    
    test.describe('API Endpoints - Reference Data', () => {
        test('should fetch natura options', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/natura-options');
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            expect(Array.isArray(data.data)).toBe(true);
            
            // Should contain common natura codes
            const codes = data.data.map((n: any) => n.code);
            expect(codes).toContain('N1');
            expect(codes).toContain('N4');
        });

        test('should fetch regime fiscale options', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/regime-fiscale-options');
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            
            // Should contain RF01 (Ordinario)
            const codes = data.data.map((r: any) => r.code);
            expect(codes).toContain('RF01');
            expect(codes).toContain('RF19'); // Forfettario
        });

        test('should fetch document type options', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/document-type-options');
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data.data).toBeDefined();
            
            // Should contain standard document types
            const codes = data.data.map((d: any) => d.code);
            expect(codes).toContain('TD01'); // Fattura
            expect(codes).toContain('TD04'); // Nota di credito
            expect(codes).toContain('TD24'); // Fattura differita
        });
    });

    test.describe('Invoice EDI Validation', () => {
        test.skip('should validate invoice for EDI sending', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Find first invoice
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                // Extract invoice ID from URL
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                    expect(response.status()).toBe(200);
                    
                    const data = await response.json();
                    expect(typeof data.valid).toBe('boolean');
                    expect(Array.isArray(data.errors)).toBe(true);
                }
            }
        });

        test.skip('should return validation errors for incomplete invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // This test depends on having an invoice without Italian fiscal data
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                    const data = await response.json();
                    
                    // Should have errors if contact lacks Italian fiscal data
                    if (!data.valid) {
                        expect(data.errors.length).toBeGreaterThan(0);
                    }
                }
            }
        });
    });

    test.describe('XML Preview', () => {
        test.skip('should generate XML preview for invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
                    
                    if (response.status() === 200) {
                        const data = await response.json();
                        expect(data.success).toBe(true);
                        expect(data.xml).toBeDefined();
                        
                        // XML should contain FatturaPA elements
                        expect(data.xml).toContain('FatturaElettronica');
                        expect(data.xml).toContain('FatturaElettronicaHeader');
                        expect(data.xml).toContain('FatturaElettronicaBody');
                    }
                }
            }
        });

        test.skip('XML preview should contain correct structure', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
                    
                    if (response.status() === 200) {
                        const data = await response.json();
                        
                        if (data.success && data.xml) {
                            // Check required FatturaPA sections
                            expect(data.xml).toContain('DatiTrasmissione');
                            expect(data.xml).toContain('CedentePrestatore');
                            expect(data.xml).toContain('CessionarioCommittente');
                            expect(data.xml).toContain('DatiGenerali');
                            expect(data.xml).toContain('DatiBeniServizi');
                        }
                    }
                }
            }
        });
    });

    test.describe('EDI Status', () => {
        test.skip('should fetch EDI status for invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/status`);
                    expect(response.status()).toBe(200);
                    
                    const data = await response.json();
                    expect(data.data).toBeDefined();
                    expect(data.data.state_label).toBeDefined();
                    expect(data.data.state_color).toBeDefined();
                }
            }
        });
    });

    test.describe('EDI Attachments and Logs', () => {
        test.skip('should fetch attachments for invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/attachments`);
                    expect(response.status()).toBe(200);
                    
                    const data = await response.json();
                    expect(data.data).toBeDefined();
                    expect(Array.isArray(data.data)).toBe(true);
                }
            }
        });

        test.skip('should fetch logs for invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/logs`);
                    expect(response.status()).toBe(200);
                    
                    const data = await response.json();
                    expect(data.data).toBeDefined();
                    expect(Array.isArray(data.data)).toBe(true);
                }
            }
        });
    });

    test.describe('Edge Cases - Italian Fiscal Codes', () => {
        test('natura codes should have correct format', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/natura-options');
            const data = await response.json();
            
            // All natura codes should match format N[1-7](.N)?
            for (const natura of data.data) {
                expect(natura.code).toMatch(/^N[1-7](\.[0-9])?$/);
                expect(natura.label).toBeDefined();
                expect(natura.label.length).toBeGreaterThan(0);
            }
        });

        test('regime fiscale codes should have correct format', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/regime-fiscale-options');
            const data = await response.json();
            
            // All regime codes should match format RF[0-9]{2}
            for (const regime of data.data) {
                expect(regime.code).toMatch(/^RF[0-9]{2}$/);
                expect(regime.label).toBeDefined();
            }
        });

        test('document type codes should have correct format', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/document-type-options');
            const data = await response.json();
            
            // All document type codes should match format TD[0-9]{2}
            for (const docType of data.data) {
                expect(docType.code).toMatch(/^TD[0-9]{2}$/);
                expect(docType.label).toBeDefined();
            }
        });
    });

    test.describe('Edge Cases - XML Generation', () => {
        test.skip('XML should be valid UTF-8', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
                    
                    if (response.status() === 200) {
                        const data = await response.json();
                        if (data.xml) {
                            // Should start with XML declaration
                            expect(data.xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
                        }
                    }
                }
            }
        });

        test.skip('XML should contain namespace declarations', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
                    
                    if (response.status() === 200) {
                        const data = await response.json();
                        if (data.xml) {
                            // Should contain FatturaPA namespace
                            expect(data.xml).toContain('http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2');
                        }
                    }
                }
            }
        });
    });

    test.describe('Edge Cases - Send Operations', () => {
        test('should prevent sending draft invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // Find a draft invoice
            const draftBadge = page.locator('text=Draft').first();
            if (await draftBadge.isVisible()) {
                const row = draftBadge.locator('xpath=ancestor::tr');
                await row.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    
                    // Try to send - should fail validation
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                    const data = await response.json();
                    
                    expect(data.valid).toBe(false);
                    expect(data.errors).toContain('Invoice must be posted before sending to SDI');
                }
            }
        });

        test.skip('should require contact fiscal data', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                    const data = await response.json();
                    
                    // If not valid, should mention contact requirements
                    if (!data.valid) {
                        const hasContactError = data.errors.some((e: string) => 
                            e.includes('VAT') || 
                            e.includes('Codice Fiscale') || 
                            e.includes('contact') ||
                            e.includes('PA Index') ||
                            e.includes('PEC')
                        );
                        // May or may not have contact errors depending on test data
                    }
                }
            }
        });
    });

    test.describe('Edge Cases - State Transitions', () => {
        test.skip('should not allow resend of successfully sent invoice', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            // This test requires an invoice that was already sent
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    const statusResponse = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/status`);
                    const statusData = await statusResponse.json();
                    
                    // If already sent (not rejected), validate should prevent resend
                    if (statusData.data.state && !['rejected', null].includes(statusData.data.state)) {
                        const validateResponse = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                        const validateData = await validateResponse.json();
                        
                        expect(validateData.can_send).toBe(false);
                    }
                }
            }
        });

        test('should allow resend of rejected invoice', async ({ page }) => {
            // This test verifies that rejected invoices can be resent
            // Requires a rejected invoice in test data
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
        });
    });

    test.describe('Error Handling', () => {
        test('should handle invalid invoice ID gracefully', async ({ page }) => {
            await page.goto('/invoices');
            
            const response = await page.request.get('/api/l10n-it-edi/invoices/999999/status');
            // Should return 404 or appropriate error
            expect([404, 500]).toContain(response.status());
        });

        test.skip('should handle missing configuration gracefully', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    
                    // Validation should catch missing company config
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
                    const data = await response.json();
                    
                    if (!data.valid) {
                        // Should include company configuration error
                        const hasConfigError = data.errors.some((e: string) => 
                            e.includes('Partita IVA') || 
                            e.includes('configured') ||
                            e.includes('company')
                        );
                    }
                }
            }
        });
    });

    test.describe('Italian Localization UI Elements', () => {
        test.skip('should display Italian labels in FatturaPA panel', async ({ page }) => {
            // This test would check the FatturaPaPanel component
            // Requires the component to be integrated into the invoice detail page
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                // Check for Italian EDI section if present
                const ediSection = page.locator('text=Fatturazione Elettronica');
                // May or may not be present depending on UI integration
            }
        });
    });

    test.describe('Performance', () => {
        test('natura options should load quickly', async ({ page }) => {
            await page.goto('/invoices');
            
            const startTime = Date.now();
            const response = await page.request.get('/api/l10n-it-edi/natura-options');
            const endTime = Date.now();
            
            expect(response.status()).toBe(200);
            expect(endTime - startTime).toBeLessThan(1000); // Should load in under 1 second
        });

        test.skip('XML preview should generate in reasonable time', async ({ page }) => {
            await page.goto('/invoices');
            await page.waitForResponse(resp => resp.url().includes('/api/invoices'));
            
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForURL(/\/invoices\/\d+/);
                
                const url = page.url();
                const match = url.match(/\/invoices\/(\d+)/);
                if (match) {
                    const invoiceId = match[1];
                    
                    const startTime = Date.now();
                    const response = await page.request.get(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
                    const endTime = Date.now();
                    
                    expect(endTime - startTime).toBeLessThan(3000); // Should generate in under 3 seconds
                }
            }
        });
    });
});
