# Archimedes Modular Architecture Manifest

## Version: 1.0.0
## Date: 2026-02-04

---

## 1. Architecture Decisions

### 1.1 Database Schema Strategy
**Decision**: Dynamic ALTER TABLE

- Modules add real database columns when installed
- Best query performance with proper indexes
- Type-safe at database level
- Automatic migrations generated from field definitions
- Rollback support when modules are uninstalled

### 1.2 Module Storage
**Decision**: File System Only

- Modules stored as folders in `/modules` directory
- Similar to Laravel packages and Odoo addons
- Version controlled with git
- Easy to develop, test, and deploy
- Module metadata in `manifest.json`

### 1.3 Frontend Component Extension
**Decision**: Hybrid Slot + Hook System

For extending React components, we will use a combination of:

1. **Extension Points (Slots)**: Named regions in components where modules can inject content
2. **Hook System**: Modules can register callbacks for component lifecycle events
3. **Field Registry**: Modules register field types and form components

This approach provides:
- Clear extension points (predictable)
- Flexibility for complex customizations
- Type-safe with TypeScript

### 1.4 API Field Exposure
**Decision**: Automatic Exposure

- All model fields automatically available in API
- Laravel API Resources auto-generated from model definitions
- Computed/virtual fields included
- Relationship loading via query parameters (?include=invoices,payments)

---

## 2. Module Structure

```
modules/
├── core/                           # Core module (always loaded)
│   ├── manifest.json
│   ├── src/
│   │   ├── Models/
│   │   │   └── ExtendableModel.php     # Base model with extension support
│   │   ├── Services/
│   │   │   ├── ModuleRegistry.php      # Module registration
│   │   │   ├── FieldRegistry.php       # Dynamic field management
│   │   │   └── ExtensionManager.php    # Extension point management
│   │   └── Traits/
│   │       └── HasExtensions.php       # Trait for extendable models
│   ├── database/
│   │   └── migrations/
│   └── frontend/
│       ├── contexts/
│       │   └── ExtensionContext.tsx    # React context for extensions
│       ├── hooks/
│       │   └── useExtensions.ts        # Hook for consuming extensions
│       └── components/
│           └── ExtensionPoint.tsx      # Slot component
│
├── contacts/                       # Contacts module
│   ├── manifest.json
│   ├── src/
│   │   ├── Models/
│   │   │   └── Contact.php
│   │   ├── Controllers/
│   │   │   └── ContactController.php
│   │   ├── Resources/
│   │   │   └── ContactResource.php
│   │   └── routes/
│   │       └── api.php
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 2026_01_01_create_contacts_table.php
│   │   └── seeders/
│   └── frontend/
│       ├── components/
│       │   ├── ContactForm.tsx
│       │   ├── ContactList.tsx
│       │   └── ContactCard.tsx
│       └── pages/
│           └── ContactsPage.tsx
│
├── invoicing/                      # Invoicing module (extends contacts)
│   ├── manifest.json
│   ├── src/
│   │   ├── Models/
│   │   │   ├── Invoice.php
│   │   │   └── PaymentTerm.php
│   │   ├── Extensions/
│   │   │   └── ContactExtension.php    # Extends Contact model
│   │   ├── Controllers/
│   │   └── routes/
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 2026_01_02_create_invoices_table.php
│   │   │   └── 2026_01_02_add_invoicing_fields_to_contacts.php
│   │   └── seeders/
│   └── frontend/
│       ├── extensions/
│       │   └── ContactFormExtension.tsx  # Adds fields to contact form
│       ├── components/
│       └── pages/
│
└── crm/                            # CRM module (extends contacts)
    ├── manifest.json
    └── ...
```

---

## 3. Module Manifest Schema

```json
{
  "$schema": "./module-manifest.schema.json",
  "name": "invoicing",
  "version": "1.0.0",
  "displayName": "Invoicing",
  "description": "Invoice management with payment tracking",
  "category": "Finance",
  "author": "The Last Software",
  "license": "MIT",
  
  "depends": ["core", "contacts"],
  "optional": ["accounting"],
  
  "autoload": {
    "psr-4": {
      "Modules\\Invoicing\\": "src/"
    }
  },
  
  "providers": [
    "Modules\\Invoicing\\InvoicingServiceProvider"
  ],
  
  "extends": {
    "contacts.contact": {
      "fields": "src/Extensions/ContactExtension.php",
      "frontend": "frontend/extensions/ContactFormExtension.tsx"
    }
  },
  
  "routes": {
    "api": "src/routes/api.php",
    "web": "src/routes/web.php"
  },
  
  "migrations": "database/migrations",
  "seeders": "database/seeders",
  
  "frontend": {
    "entry": "frontend/index.ts",
    "pages": {
      "/invoices": "frontend/pages/InvoicesPage.tsx",
      "/invoices/:id": "frontend/pages/InvoiceDetailPage.tsx"
    },
    "navigation": {
      "main": [
        {
          "label": "Invoices",
          "icon": "FileText",
          "path": "/invoices",
          "permission": "invoicing.view"
        }
      ]
    }
  },
  
  "permissions": [
    "invoicing.view",
    "invoicing.create",
    "invoicing.edit",
    "invoicing.delete"
  ],
  
  "settings": {
    "invoice_prefix": {
      "type": "string",
      "default": "INV-",
      "label": "Invoice Number Prefix"
    },
    "default_payment_term": {
      "type": "select",
      "options": "payment_terms",
      "label": "Default Payment Term"
    }
  }
}
```

---

## 4. Model Extension System

### 4.1 Base Extendable Model

```php
// modules/core/src/Models/ExtendableModel.php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Traits\HasExtensions;

abstract class ExtendableModel extends Model
{
    use HasExtensions;
    
    // Extended fields are merged into fillable
    public function getFillable(): array
    {
        return array_merge(
            $this->fillable,
            $this->getExtendedFillable()
        );
    }
    
    // Extended relationships are callable
    public function __call($method, $parameters)
    {
        if ($relationship = $this->getExtendedRelationship($method)) {
            return $relationship;
        }
        return parent::__call($method, $parameters);
    }
    
    // Extended computed attributes
    public function getAttribute($key)
    {
        if ($computed = $this->getExtendedComputed($key)) {
            return $computed($this);
        }
        return parent::getAttribute($key);
    }
}
```

### 4.2 Extension Definition

```php
// modules/invoicing/src/Extensions/ContactExtension.php

namespace Modules\Invoicing\Extensions;

use Modules\Core\Contracts\ModelExtension;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\PaymentTerm;

class ContactExtension implements ModelExtension
{
    public function target(): string
    {
        return 'contacts.contact';  // Module.Model notation
    }
    
    public function fields(): array
    {
        return [
            'credit_limit' => [
                'type' => 'decimal',
                'precision' => 10,
                'scale' => 2,
                'default' => 0,
                'nullable' => true,
            ],
            'payment_term_id' => [
                'type' => 'foreignId',
                'references' => 'payment_terms',
                'nullable' => true,
            ],
            'tax_id' => [
                'type' => 'string',
                'max' => 50,
                'nullable' => true,
            ],
        ];
    }
    
    public function relationships(): array
    {
        return [
            'invoices' => fn($model) => $model->hasMany(Invoice::class, 'contact_id'),
            'paymentTerm' => fn($model) => $model->belongsTo(PaymentTerm::class),
        ];
    }
    
    public function computed(): array
    {
        return [
            'total_invoiced' => fn($contact) => $contact->invoices()->sum('total'),
            'outstanding_balance' => fn($contact) => $contact->invoices()
                ->where('status', '!=', 'paid')
                ->sum('amount_due'),
            'is_overdue' => fn($contact) => $contact->invoices()
                ->where('due_date', '<', now())
                ->where('status', '!=', 'paid')
                ->exists(),
        ];
    }
    
    public function scopes(): array
    {
        return [
            'withOutstandingInvoices' => fn($query) => $query->whereHas('invoices', 
                fn($q) => $q->where('status', '!=', 'paid')
            ),
        ];
    }
    
    public function validation(): array
    {
        return [
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'tax_id' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

---

## 5. Frontend Extension System

### 5.1 Extension Point Component

```tsx
// modules/core/frontend/components/ExtensionPoint.tsx

import React from 'react';
import { useExtensions } from '../hooks/useExtensions';

interface ExtensionPointProps {
  name: string;           // e.g., "contacts.form.after-email"
  context?: any;          // Data passed to extensions
  children?: React.ReactNode;
}

export function ExtensionPoint({ name, context, children }: ExtensionPointProps) {
  const extensions = useExtensions(name);
  
  return (
    <>
      {children}
      {extensions.map((Extension, index) => (
        <Extension key={`${name}-${index}`} {...context} />
      ))}
    </>
  );
}
```

### 5.2 Using Extension Points

```tsx
// modules/contacts/frontend/components/ContactForm.tsx

import { ExtensionPoint } from '@modules/core';

export function ContactForm({ contact, onSave }) {
  const [data, setData] = useState(contact);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Extension point: Before form */}
      <ExtensionPoint name="contacts.form.before" context={{ contact, data }} />
      
      <div className="space-y-4">
        <Input label="Name" value={data.name} onChange={...} />
        <Input label="Email" value={data.email} onChange={...} />
        
        {/* Extension point: After basic fields */}
        <ExtensionPoint name="contacts.form.after-basic" context={{ contact, data, setData }} />
        
        <Input label="Phone" value={data.phone} onChange={...} />
        
        {/* Extension point: After contact fields */}
        <ExtensionPoint name="contacts.form.after-contact" context={{ contact, data, setData }} />
      </div>
      
      {/* Extension point: Before submit */}
      <ExtensionPoint name="contacts.form.before-submit" context={{ contact, data }} />
      
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### 5.3 Registering Extensions

```tsx
// modules/invoicing/frontend/extensions/ContactFormExtension.tsx

import { registerExtension } from '@modules/core';
import { Input, Select } from '@/components/ui';

// Register extension for the contact form
registerExtension('contacts.form.after-contact', ({ data, setData }) => {
  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-medium">Invoicing</h4>
      
      <Input
        label="Credit Limit"
        type="number"
        value={data.credit_limit || ''}
        onChange={(e) => setData({ ...data, credit_limit: e.target.value })}
      />
      
      <Select
        label="Payment Terms"
        value={data.payment_term_id}
        onChange={(value) => setData({ ...data, payment_term_id: value })}
        options={/* loaded from API */}
      />
      
      <Input
        label="Tax ID"
        value={data.tax_id || ''}
        onChange={(e) => setData({ ...data, tax_id: e.target.value })}
      />
    </div>
  );
});
```

---

## 6. API Auto-Generation

### 6.1 Dynamic Resource Generation

```php
// modules/core/src/Http/Resources/DynamicResource.php

namespace Modules\Core\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DynamicResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [];
        
        // Include all fillable fields
        foreach ($this->resource->getFillable() as $field) {
            $data[$field] = $this->resource->{$field};
        }
        
        // Include computed fields
        foreach ($this->resource->getExtendedComputed() as $key => $callback) {
            $data[$key] = $callback($this->resource);
        }
        
        // Include requested relationships
        if ($includes = $request->query('include')) {
            foreach (explode(',', $includes) as $relation) {
                if ($this->resource->relationLoaded($relation)) {
                    $data[$relation] = $this->resource->{$relation};
                }
            }
        }
        
        return $data;
    }
}
```

---

## 7. Implementation Phases

### Phase 1: Core Framework (Week 1-2)
- [ ] Module loader and registry
- [ ] ExtendableModel base class
- [ ] Field extension system
- [ ] Migration generator for extensions
- [ ] Basic API resource generation

### Phase 2: Frontend Extensions (Week 3-4)
- [ ] Extension context and hooks
- [ ] ExtensionPoint component
- [ ] Navigation extension system
- [ ] Settings page generation

### Phase 3: Proof of Concept (Week 5-6)
- [ ] Contacts module (base)
- [ ] Invoicing module (extends contacts)
- [ ] CRM module (extends contacts)
- [ ] Full integration test

### Phase 4: Polish & Documentation (Week 7-8)
- [ ] Module CLI commands (create, install, uninstall)
- [ ] Developer documentation
- [ ] Module development guide
- [ ] Performance optimization

---

## 8. File Structure Overview

```
archimedes/
├── app/                            # Laravel app (existing)
├── modules/                        # NEW: Module directory
│   ├── core/                       # Core extensibility framework
│   ├── contacts/                   # Contacts module
│   ├── invoicing/                  # Invoicing module
│   └── crm/                        # CRM module
├── config/
│   └── modules.php                 # Module configuration
├── docs/
│   └── architecture/
│       ├── ODOO_ANALYSIS.md
│       └── MANIFEST.md             # This file
└── resources/
    └── js/
        └── modules/                # Frontend module loader
```

---

## 9. Approval Required

Please review this architecture and confirm:

1. **Module folder location**: `/modules` at project root
2. **Manifest format**: JSON (as shown above)
3. **Extension approach**: Hybrid Slot + Hook system for frontend
4. **API strategy**: Automatic field exposure with include parameter
5. **Migration strategy**: Auto-generate from extension field definitions

Once approved, I will begin implementation starting with Phase 1.
