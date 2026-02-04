# Archimedes UI Extension Architecture Manifest

## Version: 1.0.0
## Date: 2026-02-04

---

## 1. Architecture Decisions

### 1.1 View Storage
**Decision**: Code Only (TypeScript Files)

- Views defined in TypeScript within module folders
- Version controlled with git
- Type-safe view definitions
- No runtime view compilation needed
- Views bundled with module code

### 1.2 View Designer
**Decision**: Yes - Visual Editor (Future Phase)

- Drag-and-drop form builder for non-developers
- Generates TypeScript code that can be exported
- Preview mode with live data
- Will be implemented after core view system is stable

### 1.3 Dynamic Expressions
**Decision**: JavaScript Expressions with Safe Evaluation

**Reasoning**: JavaScript is the most natural choice for a React-based system:
- Developers already know JavaScript
- Full access to record data
- Can use complex logic when needed
- Type checking with TypeScript

**Implementation**: 
- Use a sandboxed evaluator for security
- Expressions receive a `context` object with `record`, `user`, etc.
- Common patterns: `record.status !== 'draft'`, `record.amount > 0`

```typescript
// Expression examples
{
    invisible: "record.is_company === false",
    readonly: "record.status !== 'draft'",
    required: "record.type === 'invoice'",
}
```

### 1.4 View Inheritance
**Decision**: Hybrid (Slots + Path-based)

**Reasoning**: 
- **Slots** for 90% of cases - simple, explicit, predictable
- **Path-based** for complex cases - flexibility when needed

This matches the React philosophy (composition over configuration) while providing escape hatches for complex scenarios.

---

## 2. View System Architecture

### 2.1 View Definition Schema

```typescript
// types/views.ts

export type ViewType = 'form' | 'list' | 'kanban' | 'card' | 'calendar';

export interface ViewDefinition {
    id: string;                    // Unique ID: 'module.model.viewtype'
    model: string;                 // Target model: 'contacts.contact'
    type: ViewType;
    title?: string;
    priority?: number;             // Lower = higher priority
    component: React.ComponentType<ViewProps>;
    
    // Metadata for the view designer
    schema?: ViewSchema;
}

export interface ViewSchema {
    fields: FieldSchema[];
    slots: SlotSchema[];
    actions?: ActionSchema[];
}

export interface FieldSchema {
    name: string;
    type: string;
    widget?: string;
    label?: string;
    required?: boolean | string;   // Boolean or expression
    readonly?: boolean | string;
    invisible?: boolean | string;
    options?: Record<string, any>;
    slot?: string;                 // Which slot this field belongs to
}

export interface SlotSchema {
    name: string;
    label: string;
    description?: string;
    accepts: ('field' | 'group' | 'component')[];
}
```

### 2.2 View Components

```
modules/core/frontend/views/
├── components/
│   ├── ViewRenderer.tsx         # Main view renderer
│   ├── FormView.tsx             # Form view layout
│   ├── ListView.tsx             # List/table view
│   ├── KanbanView.tsx           # Kanban board view
│   ├── CardView.tsx             # Card grid view
│   └── CalendarView.tsx         # Calendar view
├── layout/
│   ├── Sheet.tsx                # Form sheet container
│   ├── Group.tsx                # Responsive column group
│   ├── Notebook.tsx             # Tabbed container
│   ├── Page.tsx                 # Tab page
│   └── Section.tsx              # Collapsible section
├── fields/
│   ├── Field.tsx                # Field resolver component
│   └── FieldLabel.tsx           # Field label with required indicator
├── slots/
│   ├── Slot.tsx                 # Named extension slot
│   └── SlotProvider.tsx         # Slot context provider
└── hooks/
    ├── useView.ts               # Load view definition
    ├── useField.ts              # Field state and validation
    └── useExpression.ts         # Evaluate dynamic expressions
```

### 2.3 Widget Registry

```typescript
// Widget definition
export interface WidgetDefinition<P = any> {
    // The React component
    component: React.ComponentType<WidgetProps & P>;
    
    // Display name for the view designer
    displayName: string;
    
    // Field types this widget can handle
    supportedTypes: string[];
    
    // Default widget for these types (first match wins)
    defaultFor?: string[];
    
    // Configurable options for the view designer
    options?: WidgetOptionDefinition[];
    
    // Extract component props from field definition
    extractProps?: (field: FieldInfo, options: Record<string, any>) => P;
    
    // Check if field value is empty (for required validation)
    isEmpty?: (value: any) => boolean;
    
    // Custom validation
    validate?: (value: any, field: FieldInfo) => string | null;
    
    // Preview component for view designer
    preview?: React.ComponentType<{ value: any }>;
}

// Base widget props
export interface WidgetProps {
    name: string;
    value: any;
    onChange: (value: any) => void;
    field: FieldInfo;
    readonly?: boolean;
    required?: boolean;
    error?: string;
    placeholder?: string;
}
```

### 2.4 Built-in Widgets

| Category | Widget | Types | Description |
|----------|--------|-------|-------------|
| **Text** | `char` | string | Single line text input |
| | `text` | text | Multi-line textarea |
| | `email` | string | Email with validation and mailto link |
| | `url` | string | URL with link |
| | `phone` | string | Phone with tel link |
| | `password` | string | Password input |
| **Numbers** | `integer` | integer | Whole number input |
| | `float` | float, decimal | Decimal number input |
| | `monetary` | decimal | Currency with symbol |
| | `percentage` | float | Percentage with % symbol |
| **Selection** | `select` | * | Dropdown select |
| | `radio` | * | Radio button group |
| | `badge` | * | Colored badge display |
| | `statusbar` | * | Workflow status bar |
| | `priority` | integer | Star rating |
| **Boolean** | `checkbox` | boolean | Standard checkbox |
| | `switch` | boolean | Toggle switch |
| **Date/Time** | `date` | date | Date picker |
| | `datetime` | datetime | DateTime picker |
| | `time` | time | Time picker |
| | `daterange` | * | Date range picker |
| **Relations** | `many2one` | foreignId | Dropdown with search |
| | `many2many_tags` | * | Tag-style multi-select |
| | `many2many_checkboxes` | * | Checkbox list |
| | `one2many` | * | Embedded list/table |
| **Media** | `image` | binary | Image upload/preview |
| | `file` | binary | File upload |
| | `avatar` | binary | Circular avatar image |
| **Rich** | `html` | text | Rich text editor |
| | `markdown` | text | Markdown editor |
| | `json` | json | JSON editor |
| | `code` | text | Code editor with syntax |
| **Special** | `color` | string | Color picker |
| | `rating` | integer | Star rating input |
| | `progress` | integer, float | Progress bar |
| | `signature` | binary | Signature pad |

---

## 3. Slot-based Extension System

### 3.1 Defining Slots

```tsx
// modules/contacts/frontend/views/ContactForm.tsx

export function ContactForm({ contact }: ContactFormProps) {
    return (
        <FormSheet model="contacts.contact" record={contact}>
            {/* Header slot */}
            <Slot name="header" />
            
            <Group columns={2}>
                <Field name="name" required />
                <Field name="email" widget="email" />
                
                {/* Slot after basic info */}
                <Slot name="after-basic" className="col-span-2" />
            </Group>
            
            <Group columns={2}>
                <Field name="phone" widget="phone" />
                <Field name="mobile" widget="phone" />
                
                {/* Slot after contact info */}
                <Slot name="after-contact" className="col-span-2" />
            </Group>
            
            <Section title="Address">
                <Field name="address_line_1" />
                <Field name="city" />
                <Field name="country" />
                
                {/* Slot after address */}
                <Slot name="after-address" />
            </Section>
            
            <Notebook>
                <Page name="details" label="Details">
                    <Field name="notes" widget="text" />
                    <Slot name="details-content" />
                </Page>
                
                {/* Slot for additional pages */}
                <Slot name="pages" />
            </Notebook>
            
            {/* Footer slot */}
            <Slot name="footer" />
        </FormSheet>
    );
}

// Register the view
registerView({
    id: 'contacts.contact.form',
    model: 'contacts.contact',
    type: 'form',
    component: ContactForm,
    schema: {
        slots: [
            { name: 'header', label: 'Header', accepts: ['component'] },
            { name: 'after-basic', label: 'After Basic Info', accepts: ['field', 'group'] },
            { name: 'after-contact', label: 'After Contact Info', accepts: ['field', 'group'] },
            { name: 'after-address', label: 'After Address', accepts: ['field', 'group'] },
            { name: 'details-content', label: 'Details Tab Content', accepts: ['field', 'component'] },
            { name: 'pages', label: 'Additional Pages', accepts: ['component'] },
            { name: 'footer', label: 'Footer', accepts: ['component'] },
        ],
    },
});
```

### 3.2 Filling Slots (Module Extensions)

```tsx
// modules/invoicing/frontend/extensions/contact-form.tsx

import { registerSlotContent } from '@modules/core';

// Add invoicing fields after contact info
registerSlotContent({
    view: 'contacts.contact.form',
    slot: 'after-contact',
    module: 'invoicing',
    priority: 100,
    component: function InvoicingFields({ record }) {
        return (
            <Group columns={2}>
                <Field name="credit_limit" widget="monetary" />
                <Field name="payment_term_id" widget="select" />
                <Field name="tax_id" />
                <Field name="currency" widget="select" />
            </Group>
        );
    },
});

// Add invoicing page to notebook
registerSlotContent({
    view: 'contacts.contact.form',
    slot: 'pages',
    module: 'invoicing',
    priority: 100,
    component: function InvoicingPage({ record }) {
        return (
            <Page name="invoicing" label="Invoicing">
                <Group columns={2}>
                    <Field name="total_invoiced" widget="monetary" readonly />
                    <Field name="outstanding_balance" widget="monetary" readonly />
                    <Field name="invoice_count" readonly />
                    <Field name="is_overdue" widget="badge" readonly />
                </Group>
                
                <Section title="Recent Invoices">
                    <Field name="invoices" widget="one2many" limit={5} />
                </Section>
            </Page>
        );
    },
});
```

---

## 4. Path-based Modifications (Advanced)

For complex cases where slots aren't sufficient:

```typescript
// Modify existing field properties
registerViewModification({
    view: 'contacts.contact.form',
    module: 'invoicing',
    modifications: [
        {
            // Target by field name
            target: { field: 'email' },
            modify: {
                required: "record.type === 'customer'",
            },
        },
        {
            // Target by path
            target: { path: 'notebook.pages[0]' },
            modify: {
                label: 'Contact Details',
            },
        },
        {
            // Insert before/after
            target: { field: 'phone' },
            position: 'before',
            insert: {
                component: 'field',
                props: { name: 'billing_email', widget: 'email' },
            },
        },
    ],
});
```

---

## 5. Expression Evaluation

### 5.1 Expression Context

```typescript
interface ExpressionContext {
    record: Record<string, any>;     // Current record data
    parent?: Record<string, any>;    // Parent record (for nested forms)
    user: {
        id: number;
        name: string;
        groups: string[];
    };
    env: {
        isMobile: boolean;
        lang: string;
    };
}
```

### 5.2 Safe Evaluator

```typescript
// Sandboxed expression evaluation
function evaluateExpression(expr: string | boolean, context: ExpressionContext): boolean {
    if (typeof expr === 'boolean') return expr;
    
    // Create safe context with only allowed variables
    const safeContext = {
        record: context.record,
        parent: context.parent,
        user: context.user,
        env: context.env,
    };
    
    try {
        // Use Function constructor for sandboxed eval
        const fn = new Function(
            ...Object.keys(safeContext),
            `"use strict"; return (${expr});`
        );
        return Boolean(fn(...Object.values(safeContext)));
    } catch (e) {
        console.warn(`Expression evaluation failed: ${expr}`, e);
        return false;
    }
}
```

### 5.3 Usage in Fields

```tsx
<Field 
    name="credit_limit" 
    widget="monetary"
    readonly="record.status === 'locked'"
    invisible="!record.is_company"
    required="record.type === 'customer' && record.credit_enabled"
/>
```

---

## 6. View Designer (Future)

### 6.1 Designer Features

- Drag-and-drop field placement
- Visual slot filling
- Field property editor
- Expression builder with autocomplete
- Live preview with sample data
- Export to TypeScript code
- Import existing views for editing

### 6.2 Designer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        View Designer                             │
├─────────────────┬───────────────────────┬───────────────────────┤
│  Component      │    Canvas             │    Properties         │
│  Palette        │    (Drop Zone)        │    Panel              │
│                 │                       │                       │
│  ┌───────────┐  │  ┌─────────────────┐  │  ┌─────────────────┐  │
│  │ Fields    │  │  │  Form Preview   │  │  │ Field: name     │  │
│  │ - char    │  │  │                 │  │  │                 │  │
│  │ - number  │  │  │ ┌─────────────┐ │  │  │ Widget: char    │  │
│  │ - select  │  │  │ │ Name [____] │ │  │  │ Required: ✓     │  │
│  │ - ...     │  │  │ │ Email[____] │ │  │  │ Readonly:       │  │
│  ├───────────┤  │  │ │             │ │  │  │   Expression:   │  │
│  │ Layout    │  │  │ │ [+Slot]     │ │  │  │   [_________]   │  │
│  │ - group   │  │  │ │             │ │  │  │                 │  │
│  │ - section │  │  │ └─────────────┘ │  │  │ Validation:     │  │
│  │ - tabs    │  │  │                 │  │  │   [_________]   │  │
│  │ - ...     │  │  └─────────────────┘  │  └─────────────────┘  │
│  └───────────┘  │                       │                       │
└─────────────────┴───────────────────────┴───────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Core View System (Week 1-2)
- [ ] View and widget type definitions
- [ ] ViewRegistry service
- [ ] WidgetRegistry service  
- [ ] FormSheet, Group, Section, Notebook, Page components
- [ ] Field component with widget resolution
- [ ] Slot and SlotProvider components

### Phase 2: Built-in Widgets (Week 3-4)
- [ ] Text widgets (char, text, email, url, phone)
- [ ] Number widgets (integer, float, monetary, percentage)
- [ ] Selection widgets (select, radio, badge)
- [ ] Boolean widgets (checkbox, switch)
- [ ] Date widgets (date, datetime)
- [ ] Relation widgets (many2one, many2many_tags)

### Phase 3: Extension System (Week 5-6)
- [ ] Slot content registration
- [ ] View modification system
- [ ] Expression evaluator
- [ ] Module view loading

### Phase 4: Integration & Polish (Week 7-8)
- [ ] Connect contacts module to new view system
- [ ] Connect invoicing extensions
- [ ] List and Kanban views
- [ ] Performance optimization

### Phase 5: View Designer (Future)
- [ ] Component palette
- [ ] Drag-and-drop canvas
- [ ] Properties panel
- [ ] Code export
- [ ] Live preview

---

## 8. File Structure

```
modules/
├── core/
│   └── frontend/
│       ├── views/
│       │   ├── registry.ts              # View registry
│       │   ├── ViewRenderer.tsx         # Main renderer
│       │   ├── types.ts                 # Type definitions
│       │   └── components/
│       │       ├── FormView.tsx
│       │       ├── ListView.tsx
│       │       └── ...
│       ├── widgets/
│       │   ├── registry.ts              # Widget registry
│       │   ├── types.ts                 # Widget types
│       │   ├── Field.tsx                # Field resolver
│       │   └── builtin/
│       │       ├── CharWidget.tsx
│       │       ├── MonetaryWidget.tsx
│       │       └── ...
│       ├── layout/
│       │   ├── Sheet.tsx
│       │   ├── Group.tsx
│       │   ├── Notebook.tsx
│       │   └── ...
│       └── slots/
│           ├── Slot.tsx
│           ├── SlotProvider.tsx
│           └── registry.ts
├── contacts/
│   └── frontend/
│       └── views/
│           ├── ContactForm.tsx          # Form view definition
│           ├── ContactList.tsx          # List view definition
│           └── index.ts                 # Register views
└── invoicing/
    └── frontend/
        └── extensions/
            ├── contact-form.tsx         # Extend contact form
            └── index.ts                 # Register extensions
```

---

## 9. Approval Required

Please confirm:

1. ✅ **View Storage**: Code only (TypeScript)
2. ✅ **View Designer**: Yes (future phase)
3. ✅ **Expressions**: JavaScript with safe evaluation
4. ✅ **Inheritance**: Hybrid (Slots + Path-based)

Ready to begin implementation?
