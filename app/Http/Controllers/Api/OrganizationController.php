<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    /**
     * List all organizations (platform admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $query = Organization::with(['partner:id,name,code', 'owner']);

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->has('plan')) {
            $query->where('plan', $request->plan);
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
     * Get organization details
     */
    public function show(Request $request, Organization $organization): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $organization->load(['partner', 'users', 'modules']);

        return response()->json([
            'organization' => $organization,
            'stats' => [
                'users_count' => $organization->users()->count(),
                'storage_used' => $organization->storage_used_human,
                'storage_limit' => $organization->storage_limit_human,
                'storage_percentage' => $organization->storage_usage_percent,
                'active_modules' => $organization->active_modules,
                'monthly_cost' => $organization->monthly_subscription_cost,
                'yearly_cost' => $organization->yearly_subscription_cost,
            ],
        ]);
    }

    /**
     * Create organization
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'partner_id' => 'nullable|exists:partners,id',
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['company', 'nonprofit', 'government', 'education', 'individual'])],
            'email' => 'required|email|unique:organizations,email',
            'phone' => 'nullable|string|max:50',
            'country' => 'nullable|string|size:2',
            'plan' => ['nullable', Rule::in(['free', 'starter', 'professional', 'enterprise'])],
            'status' => ['nullable', Rule::in(['trial', 'active', 'suspended', 'cancelled'])],
            'max_users' => 'nullable|integer|min:1',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email',
        ]);

        $organization = Organization::create([
            'partner_id' => $validated['partner_id'] ?? null,
            'name' => $validated['name'],
            'code' => Organization::generateCode(),
            'type' => $validated['type'],
            'status' => $validated['status'] ?? 'active',
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'country' => $validated['country'] ?? 'US',
            'plan' => $validated['plan'] ?? 'free',
            'max_users' => $validated['max_users'] ?? 3,
        ]);

        // Create owner user
        $owner = User::create([
            'organization_id' => $organization->id,
            'name' => $validated['owner_name'],
            'email' => $validated['owner_email'],
            'password' => Hash::make(str()->random(12)),
            'role' => 'owner',
        ]);

        // Enable default modules
        $organization->enableModule('core');
        $organization->enableModule('contacts');

        return response()->json([
            'organization' => $organization,
            'owner' => $owner,
        ], 201);
    }

    /**
     * Update organization
     */
    public function update(Request $request, Organization $organization): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'partner_id' => 'nullable|exists:partners,id',
            'name' => 'sometimes|string|max:255',
            'type' => ['sometimes', Rule::in(['company', 'nonprofit', 'government', 'education', 'individual'])],
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
     * Delete organization
     */
    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        // Soft delete organization (also cascades to users via DB foreign key)
        $organization->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Get organization statistics for platform dashboard
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        return response()->json([
            'total' => Organization::count(),
            'active' => Organization::whereIn('status', ['trial', 'active'])->count(),
            'trial' => Organization::where('status', 'trial')->count(),
            'suspended' => Organization::where('status', 'suspended')->count(),
            'by_type' => Organization::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_plan' => Organization::selectRaw('plan, count(*) as count')
                ->groupBy('plan')
                ->pluck('count', 'plan'),
            'total_users' => User::whereNotNull('organization_id')->count(),
            'new_this_month' => Organization::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
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
