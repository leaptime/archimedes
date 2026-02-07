<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Partner;
use App\Models\PartnerPayout;
use App\Models\PartnerRevenue;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PartnerController extends Controller
{
    /**
     * Get current partner's dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $partner = Partner::findOrFail($user->partner_id);

        // Get statistics
        $stats = [
            'total_organizations' => $partner->organizations()->count(),
            'active_organizations' => $partner->organizations()->active()->count(),
            'total_users' => User::whereIn('organization_id', $partner->organizations()->pluck('id'))->count(),
            'monthly_revenue' => $partner->monthly_revenue,
            'monthly_commission' => $partner->monthly_commission,
            'pending_payout' => $partner->pending_payout,
            'commission_rate' => $partner->commission_rate,
        ];

        // Recent organizations
        $recentOrganizations = $partner->organizations()
            ->with('owner')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'type' => $org->type,
                'status' => $org->status,
                'plan' => $org->plan,
                'users_count' => $org->users()->count(),
                'created_at' => $org->created_at,
            ]);

        // Revenue breakdown by month (last 6 months)
        $revenueByMonth = PartnerRevenue::where('partner_id', $partner->id)
            ->where('period_date', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw('DATE_TRUNC(\'month\', period_date) as month, SUM(gross_amount) as revenue, SUM(commission_amount) as commission')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'code' => $partner->code,
                'status' => $partner->status,
            ],
            'stats' => $stats,
            'recent_organizations' => $recentOrganizations,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }

    /**
     * List partner's organizations
     */
    public function organizations(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $partner = Partner::findOrFail($user->partner_id);

        $query = $partner->organizations()->with('owner');

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        $organizations = $query
            ->withCount('users')
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($organizations);
    }

    /**
     * Get single organization details
     */
    public function showOrganization(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id || $organization->partner_id !== $user->partner_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $organization->load(['users', 'modules', 'partner']);
        
        return response()->json([
            'organization' => $organization,
            'stats' => [
                'users_count' => $organization->users()->count(),
                'storage_used' => $organization->storage_used_human,
                'storage_limit' => $organization->storage_limit_human,
                'storage_percentage' => $organization->storage_usage_percent,
                'active_modules' => $organization->active_modules,
                'monthly_cost' => $organization->monthly_subscription_cost,
            ],
        ]);
    }

    /**
     * Create a new organization
     */
    public function createOrganization(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $partner = Partner::findOrFail($user->partner_id);

        if (!$partner->canCreateOrganization()) {
            return response()->json([
                'error' => 'Cannot create more organizations. Limit reached or partner suspended.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['company', 'nonprofit', 'government', 'education', 'individual'])],
            'email' => 'required|email|unique:organizations,email',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|size:2',
            'tax_id' => 'nullable|string|max:50',
            'vat_number' => 'nullable|string|max:50',
            'industry' => 'nullable|string|max:100',
            'plan' => ['nullable', Rule::in(['free', 'starter', 'professional', 'enterprise'])],
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
            // Owner user details
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email',
            'owner_password' => 'nullable|string|min:8',
        ]);

        // Create organization
        $organization = Organization::create([
            'partner_id' => $partner->id,
            'name' => $validated['name'],
            'code' => Organization::generateCode(),
            'type' => $validated['type'],
            'status' => 'trial',
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'website' => $validated['website'] ?? null,
            'street' => $validated['street'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'zip' => $validated['zip'] ?? null,
            'country' => $validated['country'] ?? 'US',
            'tax_id' => $validated['tax_id'] ?? null,
            'vat_number' => $validated['vat_number'] ?? null,
            'industry' => $validated['industry'] ?? null,
            'plan' => $validated['plan'] ?? 'free',
            'timezone' => $validated['timezone'] ?? 'UTC',
            'currency' => $validated['currency'] ?? 'USD',
            'trial_ends_at' => now()->addDays(14),
        ]);

        // Create owner user
        $owner = User::create([
            'organization_id' => $organization->id,
            'name' => $validated['owner_name'],
            'email' => $validated['owner_email'],
            'password' => Hash::make($validated['owner_password'] ?? str()->random(12)),
            'role' => 'owner',
        ]);

        // Enable default modules
        $organization->enableModule('core', ['monthly_price' => 0, 'yearly_price' => 0]);
        $organization->enableModule('contacts', ['monthly_price' => 0, 'yearly_price' => 0]);

        return response()->json([
            'organization' => $organization,
            'owner' => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
            ],
        ], 201);
    }

    /**
     * Update organization
     */
    public function updateOrganization(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id || $organization->partner_id !== $user->partner_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(['trial', 'active', 'suspended', 'cancelled'])],
            'plan' => ['sometimes', Rule::in(['free', 'starter', 'professional', 'enterprise'])],
            'max_users' => 'sometimes|integer|min:1',
            'storage_limit_bytes' => 'sometimes|integer|min:0',
            'notes' => 'sometimes|nullable|string',
        ]);

        $organization->update($validated);

        return response()->json(['organization' => $organization]);
    }

    /**
     * Enable module for organization
     */
    public function enableModule(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id || $organization->partner_id !== $user->partner_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'module_id' => 'required|string',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
        ]);

        $module = $organization->enableModule(
            $validated['module_id'],
            [
                'monthly_price' => $validated['monthly_price'],
                'yearly_price' => $validated['yearly_price'],
            ]
        );

        return response()->json(['module' => $module]);
    }

    /**
     * Disable module for organization
     */
    public function disableModule(Request $request, Organization $organization, string $moduleId): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id || $organization->partner_id !== $user->partner_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Prevent disabling core modules
        if (in_array($moduleId, ['core', 'contacts'])) {
            return response()->json(['error' => 'Cannot disable core modules'], 400);
        }

        $organization->disableModule($moduleId);

        return response()->json(['success' => true]);
    }

    /**
     * Get partner payouts
     */
    public function payouts(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $payouts = PartnerPayout::where('partner_id', $user->partner_id)
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($payouts);
    }

    /**
     * Get partner revenue details
     */
    public function revenue(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $query = PartnerRevenue::where('partner_id', $user->partner_id)
            ->with('organization:id,name,code');

        // Filter by period
        if ($request->has('year') && $request->has('month')) {
            $query->forPeriod($request->year, $request->month);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $revenue = $query->latest('period_date')->paginate($request->input('per_page', 50));

        // Summary
        $summary = [
            'total_gross' => PartnerRevenue::where('partner_id', $user->partner_id)
                ->whereMonth('period_date', $request->month ?? now()->month)
                ->whereYear('period_date', $request->year ?? now()->year)
                ->sum('gross_amount'),
            'total_commission' => PartnerRevenue::where('partner_id', $user->partner_id)
                ->whereMonth('period_date', $request->month ?? now()->month)
                ->whereYear('period_date', $request->year ?? now()->year)
                ->sum('commission_amount'),
        ];

        return response()->json([
            'revenue' => $revenue,
            'summary' => $summary,
        ]);
    }

    /**
     * Get partner profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $partner = Partner::findOrFail($user->partner_id);

        return response()->json(['partner' => $partner]);
    }

    /**
     * Update partner profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->partner_id) {
            return response()->json(['error' => 'Not a partner user'], 403);
        }

        $partner = Partner::findOrFail($user->partner_id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'legal_name' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:50',
            'website' => 'sometimes|nullable|url|max:255',
            'street' => 'sometimes|nullable|string|max:255',
            'street2' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:100',
            'zip' => 'sometimes|nullable|string|max:20',
            'country' => 'sometimes|nullable|string|size:2',
            'payout_method' => ['sometimes', Rule::in(['bank_transfer', 'paypal', 'stripe'])],
            'payout_details' => 'sometimes|nullable|array',
        ]);

        $partner->update($validated);

        return response()->json(['partner' => $partner]);
    }
}
