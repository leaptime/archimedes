# Odoo UI Architecture Analysis

## Executive Summary

Odoo's UI system is built around three core concepts:
1. **Views** - Declarative XML definitions of how data should be displayed (form, list, kanban)
2. **Widgets** - Reusable field components that handle specific data types
3. **View Inheritance** - XPath-based system to modify existing views without touching original code

This document analyzes these patterns and proposes an equivalent architecture for Archimedes using React.

---

## 1. Odoo View System

### 1.1 View Types

Odoo supports multiple view types, each stored as `ir.ui.view` records:

| View Type | Purpose | React Equivalent |
|-----------|---------|------------------|
| `form` | Single record editing | Detail/Edit Page |
| `list` | Multiple records in table | Table/DataGrid |
| `kanban` | Card-based board view | Kanban Board |
| `search` | Filters and search | Search/Filter Bar |
| `calendar` | Date-based events | Calendar Component |
| `graph` | Charts and analytics | Chart Components |
| `pivot` | Pivot table analysis | Pivot Table |

### 1.2 View Definition (XML)

```xml
<record id="view_partner_form" model="ir.ui.view">
    <field name="name">res.partner.form</field>
    <field name="model">res.partner</field>
    <field name="priority" eval="1"/>
    <field name="arch" type="xml">
        <form string="Partners">
            <sheet>
                <group>
                    <group>
                        <field name="name"/>
                        <field name="email" widget="email"/>
                        <field name="phone" widget="phone"/>
                    </group>
                    <group>
                        <field name="company_id"/>
                        <field name="category_id" widget="many2many_tags"/>
                    </group>
                </group>
                <notebook>
                    <page string="Contacts" name="contacts">
                        <field name="child_ids" mode="kanban"/>
                    </page>
                    <page string="Notes" name="notes">
                        <field name="comment"/>
                    </page>
                </notebook>
            </sheet>
        </form>
    </field>
</record>
```

### 1.3 Key View Elements

| Element | Purpose |
|---------|---------|
| `<form>` | Form view container |
| `<sheet>` | Main content area with styling |
| `<group>` | Responsive column layout |
| `<notebook>` | Tabbed sections |
| `<page>` | Tab within notebook |
| `<field>` | Field display/input |
| `<button>` | Action buttons |
| `<div>`, `<span>` | Custom HTML layout |

### 1.4 Field Attributes

```xml
<field name="amount" 
       widget="monetary"           <!-- Widget type -->
       options="{'currency_field': 'currency_id'}"
       readonly="state != 'draft'" <!-- Dynamic readonly -->
       invisible="not is_company"  <!-- Conditional visibility -->
       required="1"                <!-- Validation -->
       placeholder="0.00"          <!-- Placeholder -->
       class="oe_inline"           <!-- CSS classes -->
/>
```

---

## 2. View Inheritance System

### 2.1 XPath-based Modifications

Odoo uses XPath expressions to locate and modify specific parts of existing views:

```xml
<record id="view_partner_form_account" model="ir.ui.view">
    <field name="name">res.partner.form.inherit.account</field>
    <field name="model">res.partner</field>
    <field name="inherit_id" ref="base.view_partner_form"/>  <!-- Parent view -->
    <field name="arch" type="xml">
        
        <!-- Add fields after existing field -->
        <xpath expr="//field[@name='email']" position="after">
            <field name="credit_limit"/>
            <field name="payment_term_id"/>
        </xpath>
        
        <!-- Add new page to notebook -->
        <xpath expr="//notebook" position="inside">
            <page string="Invoicing" name="invoicing">
                <group>
                    <field name="property_account_receivable_id"/>
                    <field name="property_account_payable_id"/>
                </group>
            </page>
        </xpath>
        
        <!-- Modify existing element attributes -->
        <xpath expr="//field[@name='vat']" position="attributes">
            <attribute name="required">1</attribute>
        </xpath>
        
        <!-- Replace element entirely -->
        <xpath expr="//button[@name='action_old']" position="replace">
            <button name="action_new" string="New Action"/>
        </xpath>
        
        <!-- Add inside element (as first/last child) -->
        <div name="button_box" position="inside">
            <button type="object" name="action_view_invoices" icon="fa-pencil-square-o">
                <field name="total_invoiced" widget="monetary"/>
            </button>
        </div>
        
    </field>
</record>
```

### 2.2 Position Values

| Position | Behavior |
|----------|----------|
| `after` | Insert after matched element |
| `before` | Insert before matched element |
| `inside` | Append as child of matched element |
| `replace` | Replace matched element entirely |
| `attributes` | Modify element's attributes |

### 2.3 Inheritance Priority

- Lower `priority` value = loaded first
- Multiple modules can extend the same view
- Extensions are applied in dependency order

---

## 3. Widget System

### 3.1 Widget Registry

Odoo uses a registry pattern where widgets are registered by name:

```javascript
// web/static/src/views/fields/monetary/monetary_field.js

import { registry } from "@web/core/registry";

export class MonetaryField extends Component {
    static template = "web.MonetaryField";
    static props = {
        ...standardFieldProps,
        currencyField: { type: String, optional: true },
        hideSymbol: { type: Boolean, optional: true },
    };
    
    // Component logic...
}

export const monetaryField = {
    component: MonetaryField,
    supportedTypes: ["monetary", "float"],
    displayName: "Monetary",
    supportedOptions: [
        { label: "Hide symbol", name: "no_symbol", type: "boolean" },
        { label: "Currency", name: "currency_field", type: "field" },
    ],
    extractProps: ({ attrs, options }) => ({
        currencyField: options.currency_field,
        hideSymbol: options.no_symbol,
    }),
};

// Register the widget
registry.category("fields").add("monetary", monetaryField);
```

### 3.2 Built-in Widgets

| Widget | Description | Field Types |
|--------|-------------|-------------|
| `char` | Basic text input | char, string |
| `text` | Multi-line textarea | text |
| `integer` | Number input | integer |
| `float` | Decimal input | float |
| `monetary` | Currency formatted | monetary, float |
| `boolean` | Checkbox | boolean |
| `boolean_toggle` | Toggle switch | boolean |
| `date` | Date picker | date |
| `datetime` | DateTime picker | datetime |
| `selection` | Dropdown select | selection |
| `radio` | Radio buttons | selection |
| `many2one` | Relation dropdown | many2one |
| `many2many_tags` | Tag input | many2many |
| `many2many_checkboxes` | Checkbox list | many2many |
| `one2many` | Embedded list/form | one2many |
| `email` | Email with link | char |
| `phone` | Phone with call link | char |
| `url` | URL with link | char |
| `html` | Rich text editor | html |
| `image` | Image upload/display | binary |
| `badge` | Colored badge | selection |
| `statusbar` | Workflow status | selection |
| `priority` | Star rating | selection |
| `color` | Color picker | integer |
| `progressbar` | Progress bar | float, integer |

### 3.3 Widget Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    View Renderer                         │
│  (Parses XML arch, creates component tree)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │  <group> │  │ <notebook>│  │  <field> │             │
│   └────┬─────┘  └─────┬────┘  └─────┬────┘             │
│        │              │             │                   │
│   ┌────▼────┐   ┌─────▼────┐  ┌─────▼─────┐           │
│   │ GroupComp│   │NotebookCo│  │FieldComp  │           │
│   └─────────┘   └──────────┘  └─────┬─────┘           │
│                                      │                  │
│                               ┌──────▼──────┐          │
│                               │ Widget      │          │
│                               │ Registry    │          │
│                               └──────┬──────┘          │
│                                      │                  │
│      ┌───────────────┬───────────────┼────────────┐    │
│      ▼               ▼               ▼            ▼    │
│  ┌────────┐    ┌──────────┐   ┌──────────┐  ┌──────┐  │
│  │CharField│    │MonetaryFi│   │Many2OneFi│  │ ...  │  │
│  └────────┘    └──────────┘   └──────────┘  └──────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Actions and Menus

### 4.1 Window Actions

```xml
<record id="action_contacts" model="ir.actions.act_window">
    <field name="name">Contacts</field>
    <field name="res_model">res.partner</field>
    <field name="view_mode">kanban,list,form</field>
    <field name="search_view_id" ref="base.view_res_partner_filter"/>
    <field name="context">{'default_is_company': True}</field>
    <field name="domain">[('active', '=', True)]</field>
</record>
```

### 4.2 Menu Items

```xml
<menuitem id="menu_contacts"
    name="Contacts"
    action="action_contacts"
    parent="menu_root"
    sequence="10"
    groups="base.group_user"/>
```

---

## 5. Proposed Architecture for Archimedes

### 5.1 Design Principles

1. **JSON Schema Instead of XML** - More natural for React ecosystem
2. **Component-based Widgets** - React components registered in a widget registry  
3. **Slot-based Inheritance** - Named extension points instead of XPath
4. **TypeScript-first** - Full type safety for view definitions

### 5.2 View Schema Definition

```typescript
// View definition as JSON schema
interface ViewDefinition {
    id: string;
    model: string;
    type: 'form' | 'list' | 'kanban' | 'card';
    priority?: number;
    arch: ViewArch;
}

interface ViewArch {
    component: string;  // 'sheet', 'group', 'field', 'notebook', etc.
    props?: Record<string, any>;
    slots?: Record<string, ViewArch[]>;
    children?: ViewArch[];
}

// Example form view
const contactFormView: ViewDefinition = {
    id: 'contacts.contact.form',
    model: 'contacts.contact',
    type: 'form',
    arch: {
        component: 'sheet',
        children: [
            {
                component: 'group',
                props: { columns: 2 },
                children: [
                    { component: 'field', props: { name: 'name', required: true } },
                    { component: 'field', props: { name: 'email', widget: 'email' } },
                    { component: 'field', props: { name: 'phone', widget: 'phone' } },
                ]
            },
            {
                component: 'notebook',
                children: [
                    {
                        component: 'page',
                        props: { name: 'details', label: 'Details' },
                        slots: {
                            // Named slot for extensions
                            'after-address': []
                        },
                        children: [
                            { component: 'field', props: { name: 'address' } },
                            { component: 'slot', props: { name: 'after-address' } },
                        ]
                    }
                ]
            }
        ]
    }
};
```

### 5.3 View Inheritance (Module Extension)

```typescript
// Invoicing module extends contact form
const contactInvoicingExtension: ViewExtension = {
    id: 'invoicing.contact.form.extend',
    extends: 'contacts.contact.form',
    priority: 100,
    
    modifications: [
        // Add fields to existing slot
        {
            slot: 'after-address',
            insert: [
                { component: 'field', props: { name: 'credit_limit', widget: 'monetary' } },
                { component: 'field', props: { name: 'payment_term_id', widget: 'select' } },
            ]
        },
        
        // Add new page to notebook
        {
            target: { component: 'notebook' },
            position: 'append',
            insert: {
                component: 'page',
                props: { name: 'invoicing', label: 'Invoicing' },
                children: [
                    { component: 'field', props: { name: 'total_invoiced', widget: 'monetary', readonly: true } },
                    { component: 'field', props: { name: 'outstanding_balance', widget: 'monetary', readonly: true } },
                ]
            }
        },
        
        // Modify existing field
        {
            target: { component: 'field', props: { name: 'email' } },
            modify: { props: { required: true } }
        }
    ]
};
```

### 5.4 Widget Registry

```typescript
// Widget registration
interface WidgetDefinition {
    component: React.ComponentType<any>;
    displayName: string;
    supportedTypes: string[];
    supportedOptions?: WidgetOption[];
    extractProps?: (fieldInfo: FieldInfo) => Record<string, any>;
    isEmpty?: (value: any) => boolean;
}

// Register widget
registerWidget('monetary', {
    component: MonetaryField,
    displayName: 'Monetary',
    supportedTypes: ['decimal', 'float'],
    supportedOptions: [
        { name: 'currency_field', type: 'field', label: 'Currency Field' },
        { name: 'hide_symbol', type: 'boolean', label: 'Hide Symbol' },
    ],
    extractProps: ({ options }) => ({
        currencyField: options?.currency_field,
        hideSymbol: options?.hide_symbol,
    }),
});

// Built-in widgets
const builtInWidgets = {
    // Text inputs
    'char': CharWidget,
    'text': TextWidget,
    'email': EmailWidget,
    'url': UrlWidget,
    'phone': PhoneWidget,
    
    // Numbers
    'integer': IntegerWidget,
    'float': FloatWidget,
    'monetary': MonetaryWidget,
    'percentage': PercentageWidget,
    
    // Selection
    'select': SelectWidget,
    'radio': RadioWidget,
    'badge': BadgeWidget,
    'statusbar': StatusBarWidget,
    
    // Boolean
    'boolean': BooleanWidget,
    'switch': SwitchWidget,
    
    // Date/Time
    'date': DateWidget,
    'datetime': DateTimeWidget,
    
    // Relations
    'many2one': Many2OneWidget,
    'many2many_tags': Many2ManyTagsWidget,
    'many2many_checkboxes': Many2ManyCheckboxesWidget,
    'one2many': One2ManyWidget,
    
    // Media
    'image': ImageWidget,
    'file': FileWidget,
    
    // Rich content
    'html': HtmlWidget,
    'json': JsonWidget,
};
```

### 5.5 View Component Architecture

```tsx
// ViewRenderer - Main entry point
function ViewRenderer({ model, type, record }: ViewRendererProps) {
    const viewDef = useView(model, type);
    const mergedView = useMergedView(viewDef);  // Apply extensions
    
    return <ArchRenderer arch={mergedView.arch} record={record} />;
}

// ArchRenderer - Recursive component renderer
function ArchRenderer({ arch, record }: ArchRendererProps) {
    const Component = getViewComponent(arch.component);
    
    return (
        <Component {...arch.props}>
            {arch.children?.map((child, i) => (
                <ArchRenderer key={i} arch={child} record={record} />
            ))}
            {arch.slots && Object.entries(arch.slots).map(([name, content]) => (
                <Slot key={name} name={name}>
                    {content.map((child, i) => (
                        <ArchRenderer key={i} arch={child} record={record} />
                    ))}
                </Slot>
            ))}
        </Component>
    );
}

// Field component - resolves widget
function Field({ name, widget, ...props }: FieldProps) {
    const field = useField(name);
    const widgetDef = useWidget(widget || field.type);
    const Widget = widgetDef.component;
    const extractedProps = widgetDef.extractProps?.({ field, ...props }) || {};
    
    return <Widget field={field} {...props} {...extractedProps} />;
}
```

### 5.6 Extension Points (Slots)

```tsx
// Define slot in base view
function ContactForm({ contact }: { contact: Contact }) {
    return (
        <FormSheet>
            <FormGroup columns={2}>
                <Field name="name" required />
                <Field name="email" widget="email" />
            </FormGroup>
            
            {/* Named extension point */}
            <ExtensionPoint name="contacts.form.after-basic" context={{ contact }} />
            
            <FormGroup>
                <Field name="phone" widget="phone" />
            </FormGroup>
            
            <ExtensionPoint name="contacts.form.after-contact" context={{ contact }} />
            
            <Notebook>
                <Page name="details" label="Details">
                    <Field name="address" />
                    <ExtensionPoint name="contacts.form.details.after-address" />
                </Page>
                
                {/* Slot for additional pages */}
                <ExtensionPoint name="contacts.form.pages" />
            </Notebook>
        </FormSheet>
    );
}

// Invoicing module extends the form
registerExtension('contacts.form.after-contact', InvoicingFields, { 
    module: 'invoicing', 
    priority: 100 
});

registerExtension('contacts.form.pages', InvoicingPage, { 
    module: 'invoicing', 
    priority: 100 
});
```

---

## 6. Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] View schema definition and types
- [ ] View registry service
- [ ] ArchRenderer component
- [ ] Basic layout components (Sheet, Group, Notebook, Page)

### Phase 2: Widget System (Week 3-4)
- [ ] Widget registry
- [ ] Field component with widget resolution
- [ ] Implement core widgets (char, text, number, select, boolean)
- [ ] Implement advanced widgets (monetary, date, many2one)

### Phase 3: View Inheritance (Week 5-6)
- [ ] View merger/compiler
- [ ] Slot-based extension system
- [ ] Modification applier (append, prepend, modify)
- [ ] Priority-based loading

### Phase 4: Integration (Week 7-8)
- [ ] Connect to existing modules (contacts, invoicing)
- [ ] Dynamic view loading from API
- [ ] View editor UI (optional)
- [ ] Documentation and examples

---

## 7. Comparison Summary

| Aspect | Odoo | Archimedes (Proposed) |
|--------|------|----------------------|
| View Definition | XML | JSON/TypeScript |
| Inheritance | XPath expressions | Named slots + modifiers |
| Widget System | Owl Components | React Components |
| Registry | JS Registry | TypeScript Registry |
| View Types | form, list, kanban, etc. | Same concepts, React impl |
| Field Resolution | By type + widget attr | Same pattern |
| Dynamic Visibility | Python expressions | JS/TS expressions |

---

## 8. Questions for Clarification

1. **View Storage**: Should views be defined in:
   - Code only (TypeScript files)
   - Database (runtime customizable)
   - Hybrid (base in code, customizations in DB)

2. **View Designer**: Do you want a visual view editor like Odoo Studio?

3. **Expression Language**: For dynamic `invisible`/`readonly`:
   - JavaScript expressions
   - Simple DSL (like Odoo's Python subset)
   - JSON Logic

4. **Backward Compatibility**: Should we support importing Odoo XML views?
