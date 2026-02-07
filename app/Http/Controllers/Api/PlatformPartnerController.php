<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerPayout;
use App\Models\PartnerRevenue;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PlatformPartnerController extends Controller
{
    /**
     * List all partners (platform admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $query = Partner::query();

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

        $partners = $query
            ->withCount('organizations')
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($partners);
    }

    /**
     * Get partner details
     */
    public function show(Request $request, Partner $partner): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $partner->load(['organizations', 'users']);

        return response()->json([
            'partner' => $partner,
            'stats' => [
                'total_organizations' => $partner->organizations()->count(),
                'active_organizations' => $partner->active_organizations_count,
                'total_users' => $partner->total_users_count,
                'monthly_revenue' => $partner->monthly_revenue,
                'monthly_commission' => $partner->monthly_commission,
                'pending_payout' => $partner->pending_payout,
            ],
        ]);
    }

    /**
     * Create partner
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'type' => ['required', Rule::in(['reseller', 'affiliate', 'distributor'])],
            'email' => 'required|email|unique:partners,email',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|size:2',
            'tax_id' => 'nullable|string|max:50',
            'vat_number' => 'nullable|string|max:50',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'minimum_payout' => 'nullable|numeric|min:0',
            'max_organizations' => 'nullable|integer|min:1',
            'max_users_per_org' => 'nullable|integer|min:1',
            // Admin user for partner
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'nullable|string|min:8',
        ]);

        $partner = Partner::create([
            'name' => $validated['name'],
            'code' => Partner::generateCode(),
            'legal_name' => $validated['legal_name'] ?? null,
            'type' => $validated['type'],
            'status' => 'active',
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
            'commission_rate' => $validated['commission_rate'] ?? 20.00,
            'minimum_payout' => $validated['minimum_payout'] ?? 100.00,
            'max_organizations' => $validated['max_organizations'] ?? null,
            'max_users_per_org' => $validated['max_users_per_org'] ?? null,
        ]);

        // Create admin user for partner
        $admin = User::create([
            'partner_id' => $partner->id,
            'name' => $validated['admin_name'],
            'email' => $validated['admin_email'],
            'password' => Hash::make($validated['admin_password'] ?? str()->random(12)),
            'role' => 'admin',
        ]);

        return response()->json([
            'partner' => $partner,
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
        ], 201);
    }

    /**
     * Update partner
     */
    public function update(Request $request, Partner $partner): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'legal_name' => 'sometimes|nullable|string|max:255',
            'type' => ['sometimes', Rule::in(['reseller', 'affiliate', 'distributor'])],
            'status' => ['sometimes', Rule::in(['active', 'suspended', 'terminated'])],
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'minimum_payout' => 'sometimes|numeric|min:0',
            'max_organizations' => 'sometimes|nullable|integer|min:1',
            'max_users_per_org' => 'sometimes|nullable|integer|min:1',
            'notes' => 'sometimes|nullable|string',
        ]);

        $partner->update($validated);

        return response()->json(['partner' => $partner]);
    }

    /**
     * Delete partner
     */
    public function destroy(Request $request, Partner $partner): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        // Check if partner has organizations
        if ($partner->organizations()->exists()) {
            return response()->json([
                'error' => 'Cannot delete partner with existing organizations'
            ], 400);
        }

        $partner->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Get partner payouts
     */
    public function payouts(Request $request, Partner $partner): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $payouts = $partner->payouts()
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($payouts);
    }

    /**
     * Create payout for partner
     */
    public function createPayout(Request $request, Partner $partner): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        // Get unpaid approved revenue
        $unpaidRevenue = $partner->revenue()
            ->unpaid()
            ->get();

        if ($unpaidRevenue->isEmpty()) {
            return response()->json(['error' => 'No unpaid revenue to payout'], 400);
        }

        $totalAmount = $unpaidRevenue->sum('commission_amount');

        if ($totalAmount < $partner->minimum_payout) {
            return response()->json([
                'error' => "Amount ({$totalAmount}) is below minimum payout ({$partner->minimum_payout})"
            ], 400);
        }

        // Create payout
        $payout = PartnerPayout::create([
            'partner_id' => $partner->id,
            'reference' => PartnerPayout::generateReference(),
            'status' => 'pending',
            'amount' => $totalAmount,
            'currency' => $partner->currency,
            'period_start' => $unpaidRevenue->min('period_date'),
            'period_end' => $unpaidRevenue->max('period_date'),
            'breakdown' => $unpaidRevenue->groupBy('organization_id')
                ->map(fn ($items) => [
                    'organization' => $items->first()->organization->name ?? 'Unknown',
                    'amount' => $items->sum('commission_amount'),
                ])
                ->values()
                ->toArray(),
            'payment_method' => $partner->payout_method,
        ]);

        // Link revenue items to payout
        $unpaidRevenue->each(fn ($rev) => $rev->update(['payout_id' => $payout->id]));

        return response()->json(['payout' => $payout], 201);
    }

    /**
     * Mark payout as completed
     */
    public function completePayout(Request $request, Partner $partner, PartnerPayout $payout): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        if ($payout->partner_id !== $partner->id) {
            return response()->json(['error' => 'Payout does not belong to partner'], 400);
        }

        $validated = $request->validate([
            'payment_reference' => 'nullable|string|max:255',
        ]);

        $payout->markCompleted($validated['payment_reference'] ?? null);

        return response()->json(['payout' => $payout->fresh()]);
    }

    /**
     * Get platform-wide partner statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        return response()->json([
            'total_partners' => Partner::count(),
            'active_partners' => Partner::active()->count(),
            'total_organizations_via_partners' => \App\Models\Organization::whereNotNull('partner_id')->count(),
            'total_commission_this_month' => PartnerRevenue::whereMonth('period_date', now()->month)
                ->whereYear('period_date', now()->year)
                ->sum('commission_amount'),
            'pending_payouts_amount' => PartnerRevenue::where('status', 'approved')
                ->whereNull('payout_id')
                ->sum('commission_amount'),
            'by_type' => Partner::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
        ]);
    }

    /**
     * Authorize that user is platform admin
     */
    protected function authorizePlatformAdmin(Request $request): void
    {
        if (!$request->user()?->is_platform_admin) {
            abort(403, 'Platform admin access required');
        }
    }
}
