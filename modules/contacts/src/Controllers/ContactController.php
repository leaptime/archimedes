<?php

namespace Modules\Contacts\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactCategory;
use Modules\Contacts\Models\ContactTitle;
use Modules\Contacts\Models\Industry;
use Modules\Contacts\Models\Country;
use Modules\Contacts\Models\CountryState;
use Modules\Contacts\Models\ContactAddress;
use Modules\Contacts\Models\ContactBankAccount;
use Modules\Contacts\Models\ContactCustomField;
use Modules\Core\Http\Resources\DynamicResource;

class ContactController extends Controller
{
    /**
     * Display a listing of contacts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::query()->contacts(); // Only main contacts, not addresses

        // Search
        if ($search = $request->query('search')) {
            $query->search($search);
        }

        // Filter by type
        if ($request->boolean('companies_only')) {
            $query->companies();
        } elseif ($request->boolean('individuals_only')) {
            $query->individuals();
        }

        // Filter by customer/vendor
        if ($request->boolean('customers_only')) {
            $query->customers();
        }
        if ($request->boolean('vendors_only')) {
            $query->vendors();
        }

        // Filter by category
        if ($categoryId = $request->query('category_id')) {
            $query->withCategory($categoryId);
        }

        // Filter by industry
        if ($industryId = $request->query('industry_id')) {
            $query->where('industry_id', $industryId);
        }

        // Filter by country
        if ($countryId = $request->query('country_id')) {
            $query->where('country_id', $countryId);
        }

        // Active filter (default: only active)
        if (!$request->boolean('include_inactive', false)) {
            $query->active();
        }

        // Include relationships
        $includes = $request->query('include', 'categories,industry,countryRelation');
        $query->with(explode(',', $includes));

        // Sorting
        $sortField = $request->query('sort', 'name');
        $sortDirection = $request->query('direction', 'asc');
        
        // Special sorting for customer/vendor rankings
        if ($request->query('context') === 'customer') {
            $query->orderByDesc('customer_rank');
        } elseif ($request->query('context') === 'supplier') {
            $query->orderByDesc('supplier_rank');
        }
        
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = min($request->query('per_page', 25), 100);
        $contacts = $query->paginate($perPage);

        return response()->json([
            'data' => DynamicResource::collection($contacts->items()),
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ],
        ]);
    }

    /**
     * Store a newly created contact.
     */
    public function store(Request $request): JsonResponse
    {
        $contact = new Contact();
        $rules = $contact->getAllValidationRules();
        
        // Add category validation
        $rules['category_ids'] = ['sometimes', 'array'];
        $rules['category_ids.*'] = ['integer', 'exists:contact_categories,id'];

        $validated = $request->validate($rules);
        
        // Extract category_ids before creating
        $categoryIds = $validated['category_ids'] ?? [];
        unset($validated['category_ids']);

        $contact = Contact::createWithExtensions($validated);
        
        // Attach categories
        if (!empty($categoryIds)) {
            $contact->categories()->sync($categoryIds);
        }

        $contact->load(['categories', 'industry', 'countryRelation', 'title']);

        return response()->json([
            'data' => new DynamicResource($contact),
            'message' => 'Contact created successfully',
        ], 201);
    }

    /**
     * Display the specified contact.
     */
    public function show(Request $request, Contact $contact): JsonResponse
    {
        // Default includes - always include children for related contacts display
        $defaultIncludes = ['categories', 'industry', 'countryRelation', 'stateRelation', 'title', 'parent', 'addresses', 'bankAccounts', 'children'];
        
        // Include relationships
        if ($includes = $request->query('include')) {
            $contact->load(explode(',', $includes));
        } else {
            $contact->load($defaultIncludes);
        }

        // Include custom field values
        if ($request->boolean('with_custom_fields')) {
            $contact->load('customFieldValues.field');
        }

        return response()->json([
            'data' => new DynamicResource($contact),
        ]);
    }

    /**
     * Update the specified contact.
     */
    public function update(Request $request, Contact $contact): JsonResponse
    {
        $rules = $contact->getAllValidationRules();
        
        // Make rules for update (allow partial updates)
        $rules = array_map(function ($rule) {
            if (is_array($rule)) {
                return array_filter($rule, fn($r) => $r !== 'required');
            }
            return str_replace('required|', '', $rule);
        }, $rules);
        
        // Add category validation
        $rules['category_ids'] = ['sometimes', 'array'];
        $rules['category_ids.*'] = ['integer', 'exists:contact_categories,id'];

        $validated = $request->validate($rules);
        
        // Extract category_ids
        $categoryIds = $validated['category_ids'] ?? null;
        unset($validated['category_ids']);

        $contact->updateWithExtensions($validated);
        
        // Sync categories if provided
        if ($categoryIds !== null) {
            $contact->categories()->sync($categoryIds);
        }

        $contact->load(['categories', 'industry', 'countryRelation', 'title']);

        return response()->json([
            'data' => new DynamicResource($contact->fresh()),
            'message' => 'Contact updated successfully',
        ]);
    }

    /**
     * Remove the specified contact.
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return response()->json([
            'message' => 'Contact deleted successfully',
        ]);
    }

    /**
     * Restore a soft-deleted contact.
     */
    public function restore(int $id): JsonResponse
    {
        $contact = Contact::withTrashed()->findOrFail($id);
        $contact->restore();

        return response()->json([
            'data' => new DynamicResource($contact),
            'message' => 'Contact restored successfully',
        ]);
    }

    /**
     * Get contact statistics
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total' => Contact::contacts()->count(),
                'companies' => Contact::contacts()->companies()->count(),
                'individuals' => Contact::contacts()->individuals()->count(),
                'customers' => Contact::contacts()->customers()->count(),
                'vendors' => Contact::contacts()->vendors()->count(),
                'active' => Contact::contacts()->active()->count(),
                'by_industry' => Industry::withCount('contacts')
                    ->having('contacts_count', '>', 0)
                    ->orderByDesc('contacts_count')
                    ->limit(10)
                    ->get()
                    ->map(fn($i) => ['name' => $i->name, 'count' => $i->contacts_count]),
                'by_country' => Country::withCount('contacts')
                    ->having('contacts_count', '>', 0)
                    ->orderByDesc('contacts_count')
                    ->limit(10)
                    ->get()
                    ->map(fn($c) => ['name' => $c->name, 'code' => $c->code, 'count' => $c->contacts_count]),
            ],
        ]);
    }

    /**
     * Get contact form options (dropdowns)
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'titles' => ContactTitle::all(['id', 'name', 'shortcut']),
                'industries' => Industry::active()->orderBy('name')->get(['id', 'name']),
                'countries' => Country::orderBy('name')->get(['id', 'name', 'code', 'phone_code']),
                'categories' => ContactCategory::active()->orderBy('name')->get(['id', 'name', 'color', 'parent_id']),
                'types' => [
                    ['value' => Contact::TYPE_CONTACT, 'label' => 'Contact'],
                    ['value' => Contact::TYPE_INVOICE, 'label' => 'Invoice Address'],
                    ['value' => Contact::TYPE_DELIVERY, 'label' => 'Delivery Address'],
                    ['value' => Contact::TYPE_PRIVATE, 'label' => 'Private Address'],
                    ['value' => Contact::TYPE_OTHER, 'label' => 'Other'],
                ],
                'company_types' => [
                    ['value' => Contact::COMPANY_TYPE_PERSON, 'label' => 'Individual'],
                    ['value' => Contact::COMPANY_TYPE_COMPANY, 'label' => 'Company'],
                    ['value' => Contact::COMPANY_TYPE_NGO, 'label' => 'Non-Profit'],
                    ['value' => Contact::COMPANY_TYPE_GOVERNMENT, 'label' => 'Government'],
                ],
            ],
        ]);
    }

    /**
     * Get states for a country
     */
    public function states(Country $country): JsonResponse
    {
        return response()->json([
            'data' => $country->states()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    /**
     * Get contact field definitions for forms
     */
    public function fields(): JsonResponse
    {
        $contact = new Contact();
        
        // Base fields with groups
        $fields = [
            // Identity
            'name' => ['type' => 'string', 'required' => true, 'label' => 'Name', 'group' => 'identity'],
            'title_id' => ['type' => 'select', 'label' => 'Title', 'group' => 'identity', 'relation' => 'titles'],
            'ref' => ['type' => 'string', 'label' => 'Internal Reference', 'group' => 'identity'],
            
            // Type
            'is_company' => ['type' => 'boolean', 'label' => 'Is Company', 'group' => 'type'],
            'company_type' => ['type' => 'select', 'label' => 'Company Type', 'group' => 'type'],
            'type' => ['type' => 'select', 'label' => 'Address Type', 'group' => 'type'],
            
            // Contact Info
            'email' => ['type' => 'email', 'label' => 'Email', 'group' => 'contact'],
            'phone' => ['type' => 'tel', 'label' => 'Phone', 'group' => 'contact'],
            'mobile' => ['type' => 'tel', 'label' => 'Mobile', 'group' => 'contact'],
            'website' => ['type' => 'url', 'label' => 'Website', 'group' => 'contact'],
            
            // Company Info
            'company' => ['type' => 'string', 'label' => 'Company Name', 'group' => 'company'],
            'job_title' => ['type' => 'string', 'label' => 'Job Position', 'group' => 'company'],
            'industry_id' => ['type' => 'select', 'label' => 'Industry', 'group' => 'company', 'relation' => 'industries'],
            'parent_id' => ['type' => 'select', 'label' => 'Related Company', 'group' => 'company', 'relation' => 'contacts'],
            
            // Legal/Tax
            'vat' => ['type' => 'string', 'label' => 'Tax ID / VAT', 'group' => 'legal'],
            'company_registry' => ['type' => 'string', 'label' => 'Company Registry', 'group' => 'legal'],
            
            // Address
            'street' => ['type' => 'string', 'label' => 'Street', 'group' => 'address'],
            'street2' => ['type' => 'string', 'label' => 'Street 2', 'group' => 'address'],
            'city' => ['type' => 'string', 'label' => 'City', 'group' => 'address'],
            'state_id' => ['type' => 'select', 'label' => 'State/Province', 'group' => 'address', 'relation' => 'states'],
            'postal_code' => ['type' => 'string', 'label' => 'Postal Code', 'group' => 'address'],
            'country_id' => ['type' => 'select', 'label' => 'Country', 'group' => 'address', 'relation' => 'countries'],
            
            // Preferences
            'lang' => ['type' => 'select', 'label' => 'Language', 'group' => 'preferences'],
            'timezone' => ['type' => 'select', 'label' => 'Timezone', 'group' => 'preferences'],
            'salesperson_id' => ['type' => 'select', 'label' => 'Salesperson', 'group' => 'preferences', 'relation' => 'users'],
            
            // Classification
            'category_ids' => ['type' => 'multiselect', 'label' => 'Tags', 'group' => 'classification', 'relation' => 'categories'],
            'is_customer' => ['type' => 'boolean', 'label' => 'Is Customer', 'group' => 'classification'],
            'is_vendor' => ['type' => 'boolean', 'label' => 'Is Vendor', 'group' => 'classification'],
            
            // Notes
            'notes' => ['type' => 'textarea', 'label' => 'Internal Notes', 'group' => 'notes'],
        ];

        // Add extended fields
        $extendedFillable = $contact->getExtendedFillable();
        $fieldRegistry = app(\Modules\Core\Services\FieldRegistry::class);
        $extendedFields = $fieldRegistry->getFields('contacts.contact');

        foreach ($extendedFields as $fieldName => $definition) {
            $fields[$fieldName] = [
                'type' => $definition['type'] ?? 'string',
                'label' => $definition['label'] ?? ucwords(str_replace('_', ' ', $fieldName)),
                'group' => $definition['group'] ?? 'extensions',
                'module' => $definition['_module'] ?? 'unknown',
            ];
        }

        // Add custom fields
        $customFields = ContactCustomField::active()->ordered()->get();
        foreach ($customFields as $cf) {
            $fields['custom_' . $cf->name] = [
                'type' => $cf->field_type,
                'label' => $cf->label,
                'group' => 'custom',
                'required' => $cf->required,
                'options' => $cf->options,
                'custom_field_id' => $cf->id,
            ];
        }

        return response()->json(['data' => $fields]);
    }

    // =========================================================================
    // ADDRESS MANAGEMENT
    // =========================================================================

    /**
     * Add address to contact
     */
    public function addAddress(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:invoice,delivery,private,other'],
            'name' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'street2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'state_id' => ['nullable', 'exists:country_states,id'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_default' => ['boolean'],
        ]);

        // If this is default, unset others
        if ($validated['is_default'] ?? false) {
            $contact->addresses()
                ->where('type', $validated['type'])
                ->update(['is_default' => false]);
        }

        $address = $contact->addresses()->create($validated);

        return response()->json([
            'data' => $address,
            'message' => 'Address added successfully',
        ], 201);
    }

    /**
     * Update contact address
     */
    public function updateAddress(Request $request, Contact $contact, ContactAddress $address): JsonResponse
    {
        if ($address->contact_id !== $contact->id) {
            abort(404);
        }

        $validated = $request->validate([
            'type' => ['in:invoice,delivery,private,other'],
            'name' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'street2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'state_id' => ['nullable', 'exists:country_states,id'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_default' => ['boolean'],
        ]);

        // If setting as default, unset others
        if ($validated['is_default'] ?? false) {
            $contact->addresses()
                ->where('type', $address->type)
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'data' => $address->fresh(),
            'message' => 'Address updated successfully',
        ]);
    }

    /**
     * Delete contact address
     */
    public function deleteAddress(Contact $contact, ContactAddress $address): JsonResponse
    {
        if ($address->contact_id !== $contact->id) {
            abort(404);
        }

        $address->delete();

        return response()->json([
            'message' => 'Address deleted successfully',
        ]);
    }

    // =========================================================================
    // BANK ACCOUNT MANAGEMENT
    // =========================================================================

    /**
     * Add bank account to contact
     */
    public function addBankAccount(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'acc_number' => ['required', 'string', 'max:255'],
            'acc_holder_name' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_bic' => ['nullable', 'string', 'max:20'],
            'country_id' => ['nullable', 'exists:countries,id'],
        ]);

        $bankAccount = $contact->bankAccounts()->create($validated);

        return response()->json([
            'data' => $bankAccount,
            'message' => 'Bank account added successfully',
        ], 201);
    }

    /**
     * Delete contact bank account
     */
    public function deleteBankAccount(Contact $contact, ContactBankAccount $bankAccount): JsonResponse
    {
        if ($bankAccount->contact_id !== $contact->id) {
            abort(404);
        }

        $bankAccount->delete();

        return response()->json([
            'message' => 'Bank account deleted successfully',
        ]);
    }

    // =========================================================================
    // CATEGORY MANAGEMENT
    // =========================================================================

    /**
     * List categories
     */
    public function categories(): JsonResponse
    {
        $categories = ContactCategory::active()
            ->with('parent')
            ->withCount('contacts')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Create category
     */
    public function createCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'parent_id' => ['nullable', 'exists:contact_categories,id'],
        ]);

        $category = ContactCategory::create($validated);

        return response()->json([
            'data' => $category,
            'message' => 'Category created successfully',
        ], 201);
    }
}
