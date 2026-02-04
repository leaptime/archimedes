<?php

namespace Modules\Contacts\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Contact extends ExtendableModel
{
    use HasFactory, SoftDeletes;

    protected $table = 'contacts';

    /**
     * Model identifier for permission system
     */
    public const MODEL_IDENTIFIER = 'contacts.contact';

    // Address types (like Odoo)
    public const TYPE_CONTACT = 'contact';
    public const TYPE_INVOICE = 'invoice';
    public const TYPE_DELIVERY = 'delivery';
    public const TYPE_PRIVATE = 'private';
    public const TYPE_OTHER = 'other';

    // Company types
    public const COMPANY_TYPE_PERSON = 'person';
    public const COMPANY_TYPE_COMPANY = 'company';
    public const COMPANY_TYPE_NGO = 'ngo';
    public const COMPANY_TYPE_GOVERNMENT = 'government';

    protected $fillable = [
        // Identity
        'name',
        'ref',
        'display_name',
        'complete_name',
        'title_id',
        'email',
        'email_formatted',
        'phone',
        'mobile',
        'website',
        
        // Type & Classification
        'is_company',
        'type',
        'company_type',
        'company',
        'job_title',
        'industry_id',
        
        // Tax & Legal
        'vat',
        'company_registry',
        
        // Address
        'street',
        'street2',
        'address_line_1', // Legacy
        'address_line_2', // Legacy
        'city',
        'state',
        'state_id',
        'postal_code',
        'country',
        'country_id',
        'latitude',
        'longitude',
        
        // Preferences
        'lang',
        'timezone',
        'notes',
        
        // Media
        'image_path',
        'color',
        
        // Hierarchy
        'parent_id',
        'commercial_partner_id',
        'commercial_company_name',
        
        // Assignment
        'user_id',
        'salesperson_id',
        
        // Flags
        'is_customer',
        'is_vendor',
        'is_employee',
        'active',
        
        // Rankings
        'customer_rank',
        'supplier_rank',
        
        // Other
        'barcode',
    ];

    protected $casts = [
        'is_company' => 'boolean',
        'is_customer' => 'boolean',
        'is_vendor' => 'boolean',
        'is_employee' => 'boolean',
        'active' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'customer_rank' => 'integer',
        'supplier_rank' => 'integer',
        'color' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $attributes = [
        'type' => self::TYPE_CONTACT,
        'is_company' => false,
        'is_customer' => false,
        'is_vendor' => false,
        'is_employee' => false,
        'active' => true,
        'customer_rank' => 0,
        'supplier_rank' => 0,
        'color' => 0,
    ];

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    public function title(): BelongsTo
    {
        return $this->belongsTo(ContactTitle::class, 'title_id');
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class, 'industry_id');
    }

    public function countryRelation(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function stateRelation(): BelongsTo
    {
        return $this->belongsTo(CountryState::class, 'state_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Contact::class, 'parent_id');
    }

    public function commercialPartner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'commercial_partner_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'salesperson_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            ContactCategory::class,
            'contact_category_pivot',
            'contact_id',
            'category_id'
        );
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(ContactAddress::class, 'contact_id');
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(ContactBankAccount::class, 'contact_id');
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(ContactCustomFieldValue::class, 'contact_id');
    }

    // Child contacts (addresses)
    public function invoiceAddresses(): HasMany
    {
        return $this->children()->where('type', self::TYPE_INVOICE);
    }

    public function deliveryAddresses(): HasMany
    {
        return $this->children()->where('type', self::TYPE_DELIVERY);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeCompanies($query)
    {
        return $query->where('is_company', true);
    }

    public function scopeIndividuals($query)
    {
        return $query->where('is_company', false);
    }

    public function scopeCustomers($query)
    {
        return $query->where('is_customer', true);
    }

    public function scopeVendors($query)
    {
        return $query->where('is_vendor', true);
    }

    public function scopeEmployees($query)
    {
        return $query->where('is_employee', true);
    }

    public function scopeContacts($query)
    {
        return $query->where('type', self::TYPE_CONTACT);
    }

    public function scopeWithCategory($query, $categoryId)
    {
        return $query->whereHas('categories', function ($q) use ($categoryId) {
            $q->where('contact_categories.id', $categoryId);
        });
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              ->orWhere('company', 'like', "%{$search}%")
              ->orWhere('ref', 'like', "%{$search}%")
              ->orWhere('vat', 'like', "%{$search}%");
        });
    }

    // =========================================================================
    // COMPUTED ATTRIBUTES
    // =========================================================================

    public function getDisplayNameAttribute(): string
    {
        if ($this->attributes['display_name'] ?? null) {
            return $this->attributes['display_name'];
        }
        
        $name = $this->name ?? '';
        
        // For individuals with a company, show "Company, Name"
        if (!$this->is_company && ($this->company || $this->parent_id)) {
            $companyName = $this->commercial_company_name 
                ?? $this->company 
                ?? $this->parent?->name;
            if ($companyName) {
                return "{$companyName}, {$name}";
            }
        }
        
        return $name;
    }

    public function getCompleteNameAttribute(): string
    {
        if ($this->attributes['complete_name'] ?? null) {
            return $this->attributes['complete_name'];
        }
        
        $name = $this->name ?? '';
        
        // Add address type suffix for non-contact types
        if (in_array($this->type, [self::TYPE_INVOICE, self::TYPE_DELIVERY, self::TYPE_OTHER])) {
            $typeLabels = [
                self::TYPE_INVOICE => 'Invoice',
                self::TYPE_DELIVERY => 'Delivery',
                self::TYPE_OTHER => 'Other',
            ];
            $suffix = $typeLabels[$this->type] ?? '';
            if ($suffix) {
                $name = $name ? "{$name} ({$suffix})" : $suffix;
            }
        }
        
        // Prepend company name for individuals
        if (!$this->is_company) {
            $companyName = $this->commercial_company_name ?? $this->parent?->name;
            if ($companyName) {
                return "{$companyName}, {$name}";
            }
        }
        
        return $name;
    }

    public function getEmailFormattedAttribute(): string
    {
        if ($this->attributes['email_formatted'] ?? null) {
            return $this->attributes['email_formatted'];
        }
        
        if (!$this->email) {
            return '';
        }
        
        if ($this->name) {
            return "\"{$this->name}\" <{$this->email}>";
        }
        
        return $this->email;
    }

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->street ?? $this->address_line_1,
            $this->street2 ?? $this->address_line_2,
            $this->city,
            $this->stateRelation?->name ?? $this->state,
            $this->postal_code,
            $this->countryRelation?->name ?? $this->country,
        ]);
        return implode(', ', $parts);
    }

    public function getCompanyTypeDisplayAttribute(): string
    {
        return match($this->company_type) {
            self::COMPANY_TYPE_COMPANY => 'Company',
            self::COMPANY_TYPE_NGO => 'Non-Profit',
            self::COMPANY_TYPE_GOVERNMENT => 'Government',
            default => 'Individual',
        };
    }

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Get the commercial partner (billing entity)
     * For individuals, this is the parent company. For companies, it's self.
     */
    public function getCommercialPartner(): Contact
    {
        if ($this->is_company || !$this->parent_id) {
            return $this;
        }
        return $this->parent?->getCommercialPartner() ?? $this;
    }

    /**
     * Get address of specific type
     */
    public function getAddressOfType(string $type): ?ContactAddress
    {
        return $this->addresses()
            ->active()
            ->ofType($type)
            ->orderByDesc('is_default')
            ->first();
    }

    /**
     * Get default invoice address
     */
    public function getInvoiceAddress(): ?ContactAddress
    {
        return $this->getAddressOfType(ContactAddress::TYPE_INVOICE)
            ?? $this->getAddressOfType(ContactAddress::TYPE_OTHER);
    }

    /**
     * Get default delivery address
     */
    public function getDeliveryAddress(): ?ContactAddress
    {
        return $this->getAddressOfType(ContactAddress::TYPE_DELIVERY)
            ?? $this->getInvoiceAddress();
    }

    /**
     * Get all child contacts (employees/addresses) with hierarchy
     */
    public function getAllChildren(): \Illuminate\Support\Collection
    {
        $children = collect();
        foreach ($this->children as $child) {
            $children->push($child);
            $children = $children->merge($child->getAllChildren());
        }
        return $children;
    }

    /**
     * Get custom field value
     */
    public function getCustomField(string $fieldName)
    {
        $value = $this->customFieldValues()
            ->whereHas('field', fn($q) => $q->where('name', $fieldName))
            ->first();
        return $value?->casted_value;
    }

    /**
     * Set custom field value
     */
    public function setCustomField(string $fieldName, $value): void
    {
        $field = ContactCustomField::where('name', $fieldName)->first();
        if (!$field) {
            return;
        }

        $this->customFieldValues()->updateOrCreate(
            ['field_id' => $field->id],
            ['value' => is_array($value) ? json_encode($value) : $value]
        );
    }

    /**
     * Increment customer rank (called when sales are made)
     */
    public function incrementCustomerRank(int $amount = 1): void
    {
        $this->increment('customer_rank', $amount);
        if (!$this->is_customer) {
            $this->update(['is_customer' => true]);
        }
    }

    /**
     * Increment supplier rank (called when purchases are made)
     */
    public function incrementSupplierRank(int $amount = 1): void
    {
        $this->increment('supplier_rank', $amount);
        if (!$this->is_vendor) {
            $this->update(['is_vendor' => true]);
        }
    }

    // =========================================================================
    // LIFECYCLE HOOKS
    // =========================================================================

    protected static function booted(): void
    {
        static::saving(function (Contact $contact) {
            // Auto-compute commercial partner
            if (!$contact->commercial_partner_id) {
                $commercial = $contact->getCommercialPartner();
                if ($commercial->id !== $contact->id) {
                    $contact->commercial_partner_id = $commercial->id;
                }
            }

            // Auto-set commercial company name
            if (!$contact->commercial_company_name && $contact->parent_id) {
                $contact->commercial_company_name = $contact->parent?->name;
            }
        });
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'ref' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'], // Changed from 'url' to allow empty
            'type' => ['nullable', 'in:contact,invoice,delivery,private,other'],
            'company_type' => ['nullable', 'in:person,company,ngo,government'],
            'is_company' => ['nullable', 'boolean'],
            'is_customer' => ['nullable', 'boolean'],
            'is_vendor' => ['nullable', 'boolean'],
            'is_employee' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'vat' => ['nullable', 'string', 'max:50'],
            'company_registry' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'street2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_id' => ['nullable', 'integer', 'exists:country_states,id'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'title_id' => ['nullable', 'integer', 'exists:contact_titles,id'],
            'parent_id' => ['nullable', 'integer', 'exists:contacts,id'],
            'salesperson_id' => ['nullable', 'integer', 'exists:users,id'],
            'lang' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
