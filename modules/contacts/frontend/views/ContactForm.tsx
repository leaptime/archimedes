import React from 'react';
import { FormSheet, SheetContent, SheetFooter } from '@modules/core/frontend/layout/Sheet';
import { Group, GroupItem } from '@modules/core/frontend/layout/Group';
import { Section } from '@modules/core/frontend/layout/Section';
import { Notebook, Page } from '@modules/core/frontend/layout/Notebook';
import { Slot } from '@modules/core/frontend/slots/Slot';
import { Field } from '@modules/core/frontend/widgets/Field';
import { registerView } from '@modules/core/frontend/views/registry';
import { Button } from '@/components/ui/button';
import { MapPin, FileText, Building2, CreditCard, Tag, Globe } from 'lucide-react';

interface ContactFormProps {
    contact: Record<string, any>;
    onContactChange: (data: Record<string, any>) => void;
    errors?: Record<string, string>;
    onSave?: () => void;
    onCancel?: () => void;
    readonly?: boolean;
    options?: {
        titles?: Array<{ id: number; name: string; shortcut: string }>;
        industries?: Array<{ id: number; name: string }>;
        countries?: Array<{ id: number; name: string; code: string }>;
        categories?: Array<{ id: number; name: string; color: string }>;
        states?: Array<{ id: number; name: string; code: string }>;
    };
}

export function ContactForm({
    contact,
    onContactChange,
    errors = {},
    onSave,
    onCancel,
    readonly = false,
    options = {},
}: ContactFormProps) {
    const isCompany = contact.is_company;

    // Convert options to select format
    const titleOptions = options.titles?.map(t => ({ value: t.id, label: t.shortcut || t.name })) || [];
    const industryOptions = options.industries?.map(i => ({ value: i.id, label: i.name })) || [];
    const countryOptions = options.countries?.map(c => ({ value: c.id, label: c.name })) || [];
    const stateOptions = options.states?.map(s => ({ value: s.id, label: s.name })) || [];
    const categoryOptions = options.categories?.map(c => ({ value: c.id, label: c.name })) || [];

    const companyTypeOptions = [
        { value: 'person', label: 'Individual' },
        { value: 'company', label: 'Company' },
        { value: 'ngo', label: 'Non-Profit' },
        { value: 'government', label: 'Government' },
    ];

    return (
        <FormSheet
            viewId="contacts.contact.form"
            model="contacts.contact"
            record={contact}
            onRecordChange={onContactChange}
            errors={errors}
            readonly={readonly}
        >
            <SheetContent>
                {/* Header slot for extensions */}
                <Slot name="header" />

                {/* Type Toggle */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                    <Field 
                        name="is_company" 
                        label="Company"
                        widget="switch"
                    />
                    {isCompany && (
                        <Field 
                            name="company_type" 
                            label="Type"
                            widget="select"
                            options={{ options: companyTypeOptions }}
                        />
                    )}
                    <div className="flex-1" />
                    <Field 
                        name="active" 
                        label="Active"
                        widget="switch"
                    />
                </div>

                {/* Identity Section */}
                <Group columns={2} title="Identity">
                    {!isCompany && (
                        <Field 
                            name="title_id" 
                            label="Title"
                            widget="select"
                            options={{ options: titleOptions, placeholder: 'Select title...' }}
                        />
                    )}
                    <GroupItem span={isCompany ? 2 : 1}>
                        <Field 
                            name="name" 
                            label={isCompany ? "Company Name" : "Name"}
                            required 
                            placeholder={isCompany ? "Enter company name" : "Enter full name"}
                        />
                    </GroupItem>
                    <Field 
                        name="ref" 
                        label="Reference"
                        placeholder="Internal reference"
                    />
                    {!isCompany && (
                        <Field 
                            name="job_title" 
                            label="Job Position"
                            placeholder="e.g., Sales Manager"
                        />
                    )}
                    <Slot name="after-identity" />
                </Group>

                {/* Contact Information */}
                <div className="mt-6">
                    <Group columns={2} title="Contact Information">
                        <Field 
                            name="email" 
                            label="Email"
                            widget="email"
                            required={isCompany}
                        />
                        <Field 
                            name="phone" 
                            label="Phone"
                            widget="phone"
                        />
                        <Field 
                            name="mobile" 
                            label="Mobile"
                            widget="phone"
                        />
                        <Field 
                            name="website" 
                            label="Website"
                            widget="url"
                            placeholder="https://example.com"
                        />
                        <Slot name="after-contact" />
                    </Group>
                </div>

                {/* Company/Employment (for individuals) */}
                {!isCompany && (
                    <div className="mt-6">
                        <Group columns={2} title="Employment">
                            <Field 
                                name="parent_id" 
                                label="Related Company"
                                widget="select"
                                options={{ 
                                    placeholder: 'Select company...',
                                    // This would be populated via API
                                }}
                            />
                            <Field 
                                name="company" 
                                label="Company Name"
                                placeholder="Or enter company name"
                            />
                        </Group>
                    </div>
                )}

                {/* Classification */}
                <div className="mt-6">
                    <Section 
                        title="Classification" 
                        icon={<Tag className="w-4 h-4" />}
                        collapsible
                        defaultOpen
                    >
                        <Group columns={2}>
                            <Field 
                                name="industry_id" 
                                label="Industry"
                                widget="select"
                                options={{ options: industryOptions, placeholder: 'Select industry...' }}
                            />
                            <Field 
                                name="category_ids" 
                                label="Tags"
                                widget="multiselect"
                                options={{ options: categoryOptions }}
                            />
                            <Field 
                                name="is_customer" 
                                label="Customer"
                                widget="switch"
                            />
                            <Field 
                                name="is_vendor" 
                                label="Vendor"
                                widget="switch"
                            />
                            <Field 
                                name="salesperson_id" 
                                label="Salesperson"
                                widget="select"
                                options={{ placeholder: 'Assign salesperson...' }}
                            />
                            <Slot name="after-classification" />
                        </Group>
                    </Section>
                </div>

                {/* Address Section */}
                <div className="mt-6">
                    <Section 
                        title="Address" 
                        icon={<MapPin className="w-4 h-4" />}
                        collapsible
                        defaultOpen
                    >
                        <Group columns={2}>
                            <GroupItem span={2}>
                                <Field 
                                    name="street" 
                                    label="Street"
                                    placeholder="Street address"
                                />
                            </GroupItem>
                            <GroupItem span={2}>
                                <Field 
                                    name="street2" 
                                    label="Street 2"
                                    placeholder="Apartment, suite, etc."
                                />
                            </GroupItem>
                            <Field 
                                name="city" 
                                label="City"
                            />
                            <Field 
                                name="postal_code" 
                                label="Postal Code"
                            />
                            <Field 
                                name="country_id" 
                                label="Country"
                                widget="select"
                                options={{ options: countryOptions, placeholder: 'Select country...' }}
                            />
                            <Field 
                                name="state_id" 
                                label="State/Province"
                                widget="select"
                                options={{ options: stateOptions, placeholder: 'Select state...' }}
                            />
                            <Slot name="after-address" />
                        </Group>
                    </Section>
                </div>

                {/* Legal/Tax (for companies) */}
                {isCompany && (
                    <div className="mt-6">
                        <Section 
                            title="Legal Information" 
                            icon={<Building2 className="w-4 h-4" />}
                            collapsible
                        >
                            <Group columns={2}>
                                <Field 
                                    name="vat" 
                                    label="Tax ID / VAT"
                                    placeholder="e.g., US123456789"
                                />
                                <Field 
                                    name="company_registry" 
                                    label="Company Registry"
                                    placeholder="Company registration number"
                                />
                                <Slot name="after-legal" />
                            </Group>
                        </Section>
                    </div>
                )}

                {/* Preferences */}
                <div className="mt-6">
                    <Section 
                        title="Preferences" 
                        icon={<Globe className="w-4 h-4" />}
                        collapsible
                    >
                        <Group columns={2}>
                            <Field 
                                name="lang" 
                                label="Language"
                                widget="select"
                                options={{ 
                                    options: [
                                        { value: 'en', label: 'English' },
                                        { value: 'es', label: 'Spanish' },
                                        { value: 'fr', label: 'French' },
                                        { value: 'de', label: 'German' },
                                        { value: 'it', label: 'Italian' },
                                    ],
                                    placeholder: 'Select language...'
                                }}
                            />
                            <Field 
                                name="timezone" 
                                label="Timezone"
                                widget="select"
                                options={{ 
                                    options: [
                                        { value: 'UTC', label: 'UTC' },
                                        { value: 'America/New_York', label: 'Eastern Time' },
                                        { value: 'America/Los_Angeles', label: 'Pacific Time' },
                                        { value: 'Europe/London', label: 'London' },
                                        { value: 'Europe/Paris', label: 'Paris' },
                                        { value: 'Asia/Tokyo', label: 'Tokyo' },
                                    ],
                                    placeholder: 'Select timezone...'
                                }}
                            />
                            <Slot name="after-preferences" />
                        </Group>
                    </Section>
                </div>

                {/* Tabbed sections */}
                <div className="mt-6">
                    <Notebook defaultTab="notes">
                        <Page name="notes" label="Notes" icon={<FileText className="w-4 h-4" />}>
                            <Field 
                                name="notes" 
                                label="Internal Notes"
                                widget="text"
                                options={{ rows: 6 }}
                            />
                            <Slot name="notes-content" className="mt-4" />
                        </Page>

                        <Page name="addresses" label="Addresses" icon={<MapPin className="w-4 h-4" />}>
                            <Slot name="addresses-content" />
                            <p className="text-sm text-muted-foreground">
                                Additional addresses (invoice, delivery) can be managed from the contact detail view.
                            </p>
                        </Page>

                        <Page name="banking" label="Banking" icon={<CreditCard className="w-4 h-4" />}>
                            <Slot name="banking-content" />
                            <p className="text-sm text-muted-foreground">
                                Bank accounts can be managed from the contact detail view.
                            </p>
                        </Page>

                        {/* Slot for additional pages from other modules */}
                        <Slot name="pages" />
                    </Notebook>
                </div>

                {/* Footer slot */}
                <Slot name="footer" className="mt-6" />
            </SheetContent>

            {!readonly && (
                <SheetFooter>
                    {onCancel && (
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    {onSave && (
                        <Button onClick={onSave}>
                            Save
                        </Button>
                    )}
                </SheetFooter>
            )}
        </FormSheet>
    );
}

// Register the view
registerView({
    id: 'contacts.contact.form',
    model: 'contacts.contact',
    type: 'form',
    title: 'Contact',
    component: ContactForm as any,
    schema: {
        fields: [
            // Identity
            { name: 'name', type: 'string', required: true },
            { name: 'ref', type: 'string' },
            { name: 'title_id', type: 'many2one', widget: 'select' },
            { name: 'is_company', type: 'boolean', widget: 'switch' },
            { name: 'company_type', type: 'string', widget: 'select' },
            { name: 'active', type: 'boolean', widget: 'switch' },
            
            // Contact
            { name: 'email', type: 'string', widget: 'email' },
            { name: 'phone', type: 'string', widget: 'phone' },
            { name: 'mobile', type: 'string', widget: 'phone' },
            { name: 'website', type: 'string', widget: 'url' },
            
            // Employment
            { name: 'parent_id', type: 'many2one', widget: 'select' },
            { name: 'company', type: 'string' },
            { name: 'job_title', type: 'string' },
            
            // Classification
            { name: 'industry_id', type: 'many2one', widget: 'select' },
            { name: 'category_ids', type: 'many2many', widget: 'multiselect' },
            { name: 'is_customer', type: 'boolean', widget: 'switch' },
            { name: 'is_vendor', type: 'boolean', widget: 'switch' },
            { name: 'salesperson_id', type: 'many2one', widget: 'select' },
            
            // Address
            { name: 'street', type: 'string' },
            { name: 'street2', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'postal_code', type: 'string' },
            { name: 'state_id', type: 'many2one', widget: 'select' },
            { name: 'country_id', type: 'many2one', widget: 'select' },
            
            // Legal
            { name: 'vat', type: 'string' },
            { name: 'company_registry', type: 'string' },
            
            // Preferences
            { name: 'lang', type: 'string', widget: 'select' },
            { name: 'timezone', type: 'string', widget: 'select' },
            
            // Notes
            { name: 'notes', type: 'text' },
        ],
        slots: [
            { name: 'header', label: 'Header', accepts: ['component'] },
            { name: 'after-identity', label: 'After Identity', accepts: ['field', 'group'] },
            { name: 'after-contact', label: 'After Contact Info', accepts: ['field', 'group'] },
            { name: 'after-classification', label: 'After Classification', accepts: ['field', 'group'] },
            { name: 'after-address', label: 'After Address', accepts: ['field', 'group'] },
            { name: 'after-legal', label: 'After Legal Info', accepts: ['field', 'group'] },
            { name: 'after-preferences', label: 'After Preferences', accepts: ['field', 'group'] },
            { name: 'notes-content', label: 'Notes Tab Content', accepts: ['field', 'component'] },
            { name: 'addresses-content', label: 'Addresses Tab Content', accepts: ['component'] },
            { name: 'banking-content', label: 'Banking Tab Content', accepts: ['component'] },
            { name: 'pages', label: 'Additional Pages', accepts: ['component'] },
            { name: 'footer', label: 'Footer', accepts: ['component'] },
        ],
    },
});
