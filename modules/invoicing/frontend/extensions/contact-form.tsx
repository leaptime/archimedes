import React from 'react';
import { registerSlotContent } from '@modules/core/frontend/views/registry';
import { Group } from '@modules/core/frontend/layout/Group';
import { Page } from '@modules/core/frontend/layout/Notebook';
import { Section } from '@modules/core/frontend/layout/Section';
import { Field } from '@modules/core/frontend/widgets/Field';
import { SlotContentProps } from '@modules/core/frontend/views/types';
import { FileText, DollarSign } from 'lucide-react';

/**
 * Invoicing fields to add after contact details
 */
function InvoicingContactFields({ record, setRecord, errors, readonly }: SlotContentProps) {
    return (
        <Group columns={2}>
            <Field 
                name="credit_limit" 
                label="Credit Limit"
                widget="monetary"
                options={{ currency: 'USD' }}
            />
            <Field 
                name="payment_term_id" 
                label="Payment Terms"
                widget="select"
                options={{
                    choices: [
                        { value: '1', label: 'Immediate Payment' },
                        { value: '2', label: 'Net 15' },
                        { value: '3', label: 'Net 30' },
                        { value: '4', label: 'Net 60' },
                    ],
                    clearable: true,
                }}
            />
            <Field 
                name="tax_id" 
                label="Tax ID"
            />
            <Field 
                name="currency" 
                label="Currency"
                widget="select"
                options={{
                    choices: [
                        { value: 'USD', label: 'US Dollar (USD)' },
                        { value: 'EUR', label: 'Euro (EUR)' },
                        { value: 'GBP', label: 'British Pound (GBP)' },
                    ],
                }}
            />
        </Group>
    );
}

/**
 * Invoicing summary page in notebook
 */
function InvoicingPage({ record, setRecord, errors, readonly }: SlotContentProps) {
    return (
        <Page name="invoicing" label="Invoicing" icon={<DollarSign className="w-4 h-4" />}>
            {/* Summary stats */}
            <Group columns={3}>
                <Field 
                    name="total_invoiced" 
                    label="Total Invoiced"
                    widget="monetary"
                    readonly
                    options={{ currency: 'USD' }}
                />
                <Field 
                    name="total_paid" 
                    label="Total Paid"
                    widget="monetary"
                    readonly
                    options={{ currency: 'USD' }}
                />
                <Field 
                    name="outstanding_balance" 
                    label="Outstanding Balance"
                    widget="monetary"
                    readonly
                    options={{ currency: 'USD' }}
                />
            </Group>

            <div className="mt-4">
                <Group columns={2}>
                    <Field 
                        name="invoice_count" 
                        label="Total Invoices"
                        widget="integer"
                        readonly
                    />
                    <Field 
                        name="is_overdue" 
                        label="Has Overdue"
                        widget="badge"
                        readonly
                        options={{
                            choices: [
                                { value: true, label: 'Overdue', variant: 'destructive' },
                                { value: false, label: 'Current', variant: 'success' },
                            ]
                        }}
                    />
                    <Field 
                        name="last_invoice_date" 
                        label="Last Invoice Date"
                        widget="date"
                        readonly
                    />
                    <Field 
                        name="average_days_to_pay" 
                        label="Avg. Days to Pay"
                        widget="integer"
                        readonly
                    />
                </Group>
            </div>

            <Section 
                title="Credit Information" 
                icon={<FileText className="w-4 h-4" />}
                collapsible
                className="mt-4"
            >
                <Group columns={2}>
                    <Field 
                        name="credit_on_hold" 
                        label="Credit on Hold"
                        widget="switch"
                    />
                    <Field 
                        name="credit_rating" 
                        label="Credit Rating"
                        widget="select"
                        options={{
                            choices: [
                                { value: 'excellent', label: 'Excellent' },
                                { value: 'good', label: 'Good' },
                                { value: 'fair', label: 'Fair' },
                                { value: 'poor', label: 'Poor' },
                            ],
                            clearable: true,
                        }}
                    />
                </Group>
            </Section>
        </Page>
    );
}

// Register extensions
registerSlotContent({
    view: 'contacts.contact.form',
    slot: 'after-contact',
    module: 'invoicing',
    priority: 100,
    component: InvoicingContactFields,
});

registerSlotContent({
    view: 'contacts.contact.form',
    slot: 'pages',
    module: 'invoicing',
    priority: 100,
    component: InvoicingPage,
});
