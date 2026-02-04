# Odoo Permission System Analysis

## Executive Summary

Odoo implements a robust, multi-layered permission system with four key components:

1. **Groups** (`res.groups`) - Collections of users with specific access rights
2. **Access Control Lists** (`ir.model.access`) - CRUD permissions per model per group
3. **Record Rules** (`ir.rule`) - Row-level security with domain filters
4. **Menu/View Visibility** - UI elements shown/hidden based on groups

---

## 1. Groups (res.groups)

### Definition

Groups are defined in XML files within the `security/` directory:

```xml
<record id="group_account_invoice" model="res.groups">
    <field name="name">Invoicing</field>
    <field name="category_id" ref="base.module_category_accounting_accounting"/>
    <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
</record>
```

### Key Fields

| Field | Description |
|-------|-------------|
| `name` | Display name of the group |
| `category_id` | Module category (for UI grouping in settings) |
| `implied_ids` | Parent groups (inheritance) |
| `users` | Users directly assigned to this group |
| `comment` | Description/help text |

### Group Hierarchy

Groups can inherit from other groups via `implied_ids`:

```
group_account_invoice  →  group_account_manager
                       ↘
                         group_account_basic  ↘
                      group_account_readonly  →  group_account_user
```

- When a user is in `group_account_manager`, they also get `group_account_invoice` permissions
- `implied_ids` creates a permission inheritance chain

### Built-in Base Groups

| Group | Purpose |
|-------|---------|
| `base.group_user` | Internal users (employees) |
| `base.group_portal` | Portal users (external customers/vendors) |
| `base.group_public` | Public/anonymous users |
| `base.group_system` | System administrators |
| `base.group_erp_manager` | Access rights managers |
| `base.group_no_one` | Technical features (debug mode) |

---

## 2. Access Control Lists (ir.model.access)

### Definition (CSV Format)

Access rules are defined in `security/ir.model.access.csv`:

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_account_move_readonly,account.move readonly,model_account_move,account.group_account_readonly,1,0,0,0
access_account_move_uinvoice,account.move,model_account_move,account.group_account_invoice,1,1,1,1
```

### Fields

| Field | Description |
|-------|-------------|
| `id` | Unique XML ID for the rule |
| `name` | Human-readable name |
| `model_id:id` | Target model (format: `model_<model_name>`) |
| `group_id:id` | Group this rule applies to |
| `perm_read` | 1 = can read, 0 = cannot |
| `perm_write` | 1 = can update, 0 = cannot |
| `perm_create` | 1 = can create, 0 = cannot |
| `perm_unlink` | 1 = can delete, 0 = cannot |

### Permission Resolution

- User must have **at least one** ACL rule granting the permission
- Multiple rules for same model are OR-ed together
- If no rule exists, access is **denied**

### Pattern: Tiered Access

```csv
# Readonly access for basic users
access_contact_readonly,contact.readonly,model_contact,group_user,1,0,0,0

# Full access for managers
access_contact_manager,contact.manager,model_contact,group_manager,1,1,1,1
```

---

## 3. Record Rules (ir.rule)

### Purpose

Record rules provide **row-level security** - filtering which records a user can access based on domain expressions.

### Definition (XML)

```xml
<record model="ir.rule" id="res_partner_rule">
    <field name="name">res.partner company</field>
    <field name="model_id" ref="base.model_res_partner"/>
    <field name="domain_force">[
        '|', 
        ('company_id', 'parent_of', company_ids), 
        ('company_id', '=', False)
    ]</field>
</record>
```

### Key Fields

| Field | Description |
|-------|-------------|
| `name` | Rule description |
| `model_id` | Target model |
| `domain_force` | Domain expression to filter records |
| `groups` | Groups this rule applies to (empty = global) |
| `global` | Computed: True if no groups specified |
| `perm_read` | Apply to read operations |
| `perm_write` | Apply to write operations |
| `perm_create` | Apply to create operations |
| `perm_unlink` | Apply to delete operations |

### Domain Context Variables

The domain can use these variables:

```python
{
    'user': self.env.user,           # Current user record
    'company_ids': [1, 2, 3],        # User's allowed companies
    'company_id': 1,                 # Current company
    'time': time,                    # Python time module
}
```

### Rule Types

#### Global Rules (no groups)
- Apply to **ALL** users
- Multiple global rules are **AND-ed** together

```xml
<!-- Everyone can only see records from their companies -->
<record model="ir.rule" id="account_move_comp_rule">
    <field name="name">Account Entry Company Rule</field>
    <field name="model_id" ref="model_account_move"/>
    <field name="domain_force">[('company_id', 'in', company_ids)]</field>
</record>
```

#### Group Rules
- Apply only to users in specified groups
- Multiple group rules are **OR-ed** together

```xml
<!-- Portal users can only see their own invoices -->
<record id="account_invoice_rule_portal" model="ir.rule">
    <field name="name">Portal Personal Invoices</field>
    <field name="model_id" ref="account.model_account_move"/>
    <field name="domain_force">[
        ('state', 'not in', ('cancel', 'draft')), 
        ('move_type', 'in', ('out_invoice', 'out_refund')), 
        ('message_partner_ids', 'child_of', [user.commercial_partner_id.id])
    ]</field>
    <field name="groups" eval="[(4, ref('base.group_portal'))]"/>
</record>
```

#### Partial Permission Rules

```xml
<!-- Readonly group can read but not modify -->
<record id="account_move_rule_group_readonly" model="ir.rule">
    <field name="name">Readonly Move</field>
    <field name="model_id" ref="model_account_move"/>
    <field name="domain_force">[(1, '=', 1)]</field>
    <field name="groups" eval="[(4, ref('account.group_account_readonly'))]"/>
    <field name="perm_write" eval="False"/>
    <field name="perm_create" eval="False"/>
    <field name="perm_unlink" eval="False"/>
</record>
```

### Common Domain Patterns

```python
# Multi-company: User can only see their companies' records
[('company_id', 'in', company_ids)]
[('company_id', 'parent_of', company_ids)]  # Include parent companies

# Owner-only: User can only see their own records
[('user_id', '=', user.id)]
[('create_uid', '=', user.id)]

# Partner-based: User sees records linked to their partner
[('partner_id', 'child_of', user.commercial_partner_id.id)]

# No restriction (allow all)
[(1, '=', 1)]

# Block all
[(0, '=', 1)]

# Combined with OR
['|', ('user_id', '=', user.id), ('public', '=', True)]
```

---

## 4. Menu & View Visibility

### Menu Items

```xml
<menuitem id="menu_finance"
    name="Invoicing"
    groups="account.group_account_invoice"
    sequence="40"/>
```

### View Elements

```xml
<field name="credit_limit" groups="account.group_account_manager"/>

<button name="action_post" 
        string="Confirm" 
        groups="account.group_account_invoice"/>

<page string="Accounting" groups="account.group_account_user">
    ...
</page>
```

---

## 5. Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               1. Check ir.model.access (ACL)                     │
│   - Does user's group have READ/WRITE/CREATE/DELETE on model?   │
│   - If no ACL grants permission → ACCESS DENIED                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ ACL OK
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               2. Apply ir.rule (Record Rules)                    │
│   - Get all global rules for model + operation                  │
│   - Get group rules where user is member                        │
│   - Combine: AND(global_rules) AND OR(group_rules)              │
│   - Filter query with combined domain                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Records filtered
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               3. Return filtered records                         │
│   - User only sees records matching all applicable rules        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Proposed Architecture for Archimedes

### 6.1 Permission Levels

| Level | Description |
|-------|-------------|
| **Model ACL** | CRUD permissions per model per role |
| **Record Rules** | Row-level filtering with expressions |
| **Field-level** | Hide/readonly specific fields per role |
| **UI Visibility** | Menu, button, field visibility |

### 6.2 Roles/Groups

```php
// Module manifest.json
{
    "permissions": {
        "groups": [
            {
                "id": "contacts.group_user",
                "name": "Contact User",
                "implied": ["base.group_user"]
            },
            {
                "id": "contacts.group_manager",
                "name": "Contact Manager",
                "implied": ["contacts.group_user"]
            }
        ]
    }
}
```

### 6.3 Access Control (Model-level)

```php
// permissions/access.php
return [
    // model => [group => [read, write, create, delete]]
    'contacts.contact' => [
        'base.group_user' => [true, false, false, false],  // Read only
        'contacts.group_user' => [true, true, true, false], // No delete
        'contacts.group_manager' => [true, true, true, true], // Full
    ],
];
```

### 6.4 Record Rules

```php
// permissions/rules.php
return [
    [
        'name' => 'Users see own contacts',
        'model' => 'contacts.contact',
        'domain' => "record.user_id === user.id || record.is_public === true",
        'groups' => ['contacts.group_user'],
        'operations' => ['read', 'write'],
    ],
    [
        'name' => 'Managers see all contacts',
        'model' => 'contacts.contact',
        'domain' => "true", // No filter
        'groups' => ['contacts.group_manager'],
    ],
    [
        'name' => 'Multi-company filter',
        'model' => 'contacts.contact',
        'domain' => "user.company_ids.includes(record.company_id)",
        'global' => true, // Applies to all
    ],
];
```

### 6.5 Field-level Permissions

```php
// In model or extension
public function fieldPermissions(): array
{
    return [
        'credit_limit' => [
            'read' => ['invoicing.group_manager'],
            'write' => ['invoicing.group_manager'],
        ],
        'salary' => [
            'read' => ['hr.group_manager'],
            'write' => ['hr.group_manager'],
        ],
    ];
}
```

### 6.6 Frontend Integration

```tsx
// Check permission in React
const { hasPermission, hasGroup } = usePermissions();

// Model-level
{hasPermission('contacts.contact', 'write') && (
    <Button onClick={handleSave}>Save</Button>
)}

// Group-level
{hasGroup('contacts.group_manager') && (
    <Button onClick={handleDelete}>Delete</Button>
)}

// Field-level (in Field component)
<Field 
    name="credit_limit" 
    groups="invoicing.group_manager"
    readonly="!hasGroup('invoicing.group_manager')"
/>
```

---

## 7. Questions for Implementation

1. **Storage**: Should permissions be defined in:
   - Code only (PHP/TypeScript files)?
   - Database (runtime editable)?
   - Hybrid?

2. **Evaluation**: How to evaluate record rule domains?
   - PHP evaluation on backend?
   - SQL query modification?
   - Both?

3. **Caching**: How to cache permission checks for performance?

4. **Inheritance**: Should we support group inheritance like Odoo?

5. **Super User**: Do we need a bypass mechanism (like Odoo's `sudo()`)?
