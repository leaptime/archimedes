# Odoo Modular Architecture Analysis

## Executive Summary

Odoo's modular architecture is one of the most sophisticated in the open-source ERP world. Its key innovation is the ability for modules to **extend existing models** with new fields and methods without modifying the original code. This document analyzes how Odoo achieves this and proposes how we can implement similar functionality in Archimedes.

---

## 1. Odoo Module Structure

### 1.1 Module Folder Structure
```
addons/
├── contacts/                    # Module folder
│   ├── __manifest__.py         # Module manifest (metadata, dependencies)
│   ├── __init__.py             # Python package init
│   ├── models/                 # Model definitions
│   │   ├── __init__.py
│   │   └── res_partner.py      # Model files
│   ├── views/                  # XML view definitions
│   ├── security/               # Access rights (ir.model.access.csv)
│   ├── data/                   # Default data
│   ├── static/                 # JS, CSS, images
│   └── i18n/                   # Translations
```

### 1.2 Module Manifest (`__manifest__.py`)
```python
{
    'name': 'Contacts',
    'version': '1.0',
    'category': 'Sales/CRM',
    'summary': 'Centralize your address book',
    'description': '...',
    'depends': ['base', 'mail'],          # Dependencies on other modules
    'data': ['views/contact_views.xml'],  # Files to load
    'application': True,                   # Is this a main app?
    'installable': True,
    'auto_install': False,
}
```

---

## 2. The `_inherit` Mechanism (Core Innovation)

### 2.1 Model Definition (Base)
```python
# In base module: odoo/addons/base/models/res_partner.py
class Partner(models.Model):
    _name = 'res.partner'
    _description = 'Contact'
    
    name = fields.Char()
    email = fields.Char()
    phone = fields.Char()
    # ... base fields
```

### 2.2 Model Extension (Adding Fields)
```python
# In account module: addons/account/models/partner.py
class ResPartner(models.Model):
    _name = 'res.partner'
    _inherit = 'res.partner'  # <-- KEY: Extends existing model
    
    # NEW FIELDS added by account module
    credit = fields.Monetary(compute='_credit_debit_get')
    debit = fields.Monetary(compute='_credit_debit_get')
    total_invoiced = fields.Monetary(compute='_invoice_total')
    property_account_payable_id = fields.Many2one('account.account')
    property_account_receivable_id = fields.Many2one('account.account')
    invoice_ids = fields.One2many('account.move', 'partner_id')
    # ... accounting-specific fields
    
    # NEW METHODS
    def _credit_debit_get(self):
        # Calculate credit/debit for this partner
        pass
```

### 2.3 How It Works Internally

1. **Registry**: Odoo maintains a model registry that maps model names to their definitions
2. **Multiple Inheritance**: When a model uses `_inherit`, Odoo merges the class into the existing model
3. **Field Merging**: Fields from all inheriting classes are combined
4. **Method Resolution**: Methods are resolved using Python's MRO (Method Resolution Order)

```
         Model Registry
              │
    ┌─────────┴─────────┐
    │   res.partner     │
    │                   │
    │  Base fields:     │  ← From base module
    │  - name           │
    │  - email          │
    │  - phone          │
    │                   │
    │  + Account fields:│  ← From account module (via _inherit)
    │  - credit         │
    │  - debit          │
    │  - invoice_ids    │
    │                   │
    │  + CRM fields:    │  ← From crm module (via _inherit)
    │  - lead_ids       │
    │  - opportunity_id │
    └───────────────────┘
```

---

## 3. Key Architectural Patterns

### 3.1 Field Types
```python
# Scalar fields
name = fields.Char(string='Name', required=True)
active = fields.Boolean(default=True)
amount = fields.Float(digits=(16, 2))
count = fields.Integer()
notes = fields.Text()
html_content = fields.Html()
date = fields.Date()
datetime = fields.Datetime()

# Relational fields
partner_id = fields.Many2one('res.partner', string='Partner')  # FK
invoice_ids = fields.One2many('account.move', 'partner_id')    # Reverse FK
tag_ids = fields.Many2many('res.tag', string='Tags')           # M2M

# Computed fields
total = fields.Float(compute='_compute_total', store=True)

# Related fields (delegation)
partner_name = fields.Char(related='partner_id.name')
```

### 3.2 Dependency Management
- Modules declare dependencies in `__manifest__.py`
- Installation order is determined by dependency graph
- A module can only extend models from modules it depends on

### 3.3 View Inheritance
```xml
<!-- Base view in contacts module -->
<record id="view_partner_form" model="ir.ui.view">
    <field name="model">res.partner</field>
    <field name="arch" type="xml">
        <form>
            <field name="name"/>
            <field name="email"/>
        </form>
    </field>
</record>

<!-- Extended view in account module -->
<record id="view_partner_form_account" model="ir.ui.view">
    <field name="model">res.partner</field>
    <field name="inherit_id" ref="contacts.view_partner_form"/>
    <field name="arch" type="xml">
        <xpath expr="//field[@name='email']" position="after">
            <field name="credit"/>
            <field name="debit"/>
        </xpath>
    </field>
</record>
```

---

## 4. Database Schema Management

### 4.1 Dynamic Schema Updates
- Odoo automatically creates/alters tables when models change
- Fields added by extensions create new columns
- No manual migrations needed for simple field additions

### 4.2 Module Installation Flow
1. Parse `__manifest__.py` and resolve dependencies
2. Load Python model definitions
3. Merge inherited models into registry
4. Create/update database tables
5. Load data files (views, security, demo data)
6. Execute post-install hooks

---

## 5. Proposed Architecture for Archimedes

### 5.1 Key Differences from Odoo
| Aspect | Odoo | Archimedes |
|--------|------|------------|
| Backend | Python | PHP (Laravel) |
| Frontend | Owl (custom) | React |
| ORM | Custom | Eloquent |
| View System | XML templates | React components |
| Database | PostgreSQL | Any (via Laravel) |

### 5.2 Proposed Module Structure
```
modules/
├── contacts/
│   ├── manifest.json           # Module manifest
│   ├── Models/
│   │   └── Contact.php         # Eloquent model
│   ├── Extensions/             # Model extensions (traits)
│   ├── Migrations/
│   ├── Controllers/
│   ├── Resources/              # API resources
│   ├── frontend/
│   │   ├── components/
│   │   └── pages/
│   └── routes/
│       ├── api.php
│       └── web.php
```

### 5.3 Model Extension Mechanism (Laravel)

```php
// Base Contact model in contacts module
namespace Modules\Contacts\Models;

class Contact extends ExtendableModel
{
    protected $table = 'contacts';
    
    // Base fields defined in migration
    protected $fillable = ['name', 'email', 'phone'];
}

// Extension from invoicing module
namespace Modules\Invoicing\Extensions;

class ContactInvoicingExtension
{
    // Register additional fields
    public function fields(): array
    {
        return [
            'credit_limit' => ['type' => 'decimal', 'precision' => 10, 'scale' => 2],
            'payment_term_id' => ['type' => 'foreignId', 'references' => 'payment_terms'],
        ];
    }
    
    // Register relationships
    public function relationships(): array
    {
        return [
            'invoices' => ['hasMany', Invoice::class, 'contact_id'],
            'paymentTerm' => ['belongsTo', PaymentTerm::class],
        ];
    }
    
    // Register computed attributes
    public function computed(): array
    {
        return [
            'total_invoiced' => fn($contact) => $contact->invoices->sum('total'),
            'outstanding_balance' => fn($contact) => $contact->invoices->where('status', 'unpaid')->sum('total'),
        ];
    }
}
```

---

## 6. Clarifying Questions

Before proceeding with the implementation, I need to understand:

### 6.1 Backend Architecture
1. **Database Schema Strategy**: 
   - Option A: Single table with JSON column for extended fields (flexible, but limited querying)
   - Option B: Dynamic ALTER TABLE to add columns (more complex, better performance)
   - Option C: EAV (Entity-Attribute-Value) pattern (very flexible, complex queries)
   
2. **Module Storage**: Where should modules be stored?
   - File system (like Odoo)
   - Database (for marketplace distribution)
   - Both (hybrid approach)

3. **Module Dependencies**: How strict should dependency management be?
   - Hard dependencies (module won't load without dependencies)
   - Soft dependencies (graceful degradation)

### 6.2 Frontend Architecture
4. **Component Extension**: How should React components be extended?
   - Slot/portal system (like Vue)
   - HOC (Higher-Order Components)
   - Render props pattern
   - Plugin/hook system

5. **Form Builder**: Should we implement a dynamic form builder?
   - JSON schema-based forms
   - React component composition
   - Hybrid approach

### 6.3 API Architecture
6. **API Extension**: How should the API handle extended fields?
   - Automatic field exposure based on model definition
   - Explicit resource transformers
   - GraphQL (automatic schema from models)

### 6.4 User Experience
7. **Module Management**: How should users install/manage modules?
   - Admin panel UI
   - CLI commands
   - Both

8. **Field Visibility**: Should extended fields be:
   - Always visible when module is installed
   - Configurable per user/role
   - Configurable per view

---

## 7. Next Steps

1. Answer the clarifying questions above
2. Create detailed technical specification
3. Design database schema for module registry
4. Implement core extensibility framework
5. Create first modules (contacts, invoicing) as proof of concept
6. Build module marketplace integration
