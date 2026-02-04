<?php

namespace Modules\Invoicing\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\Tax;
use Modules\Invoicing\Models\TaxGroup;

class TaxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tax::with('taxGroup');

        // Filter by type
        if ($type = $request->query('type_tax_use')) {
            $query->where('type_tax_use', $type);
        }

        // Filter by country
        if ($country = $request->query('country_code')) {
            $query->forCountry($country);
        }

        // Active only by default
        if (!$request->has('include_inactive')) {
            $query->active();
        }

        $taxes = $query->orderBy('sequence')->orderBy('name')->get();

        return response()->json([
            'data' => $taxes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'tax_group_id' => ['nullable', 'exists:tax_groups,id'],
            'type' => ['nullable', 'in:percent,fixed'],
            'amount' => ['required', 'numeric'],
            'type_tax_use' => ['nullable', 'in:sale,purchase,none'],
            'tax_scope' => ['nullable', 'in:service,consu,all'],
            'price_include' => ['nullable', 'boolean'],
            'include_base_amount' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'sequence' => ['nullable', 'integer'],
            'country_code' => ['nullable', 'string', 'size:2'],
        ]);

        $tax = Tax::create($validated);

        return response()->json([
            'data' => $tax->load('taxGroup'),
            'message' => 'Tax created successfully',
        ], 201);
    }

    public function show(Tax $tax): JsonResponse
    {
        $tax->load('taxGroup');

        return response()->json([
            'data' => $tax,
        ]);
    }

    public function update(Request $request, Tax $tax): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'tax_group_id' => ['nullable', 'exists:tax_groups,id'],
            'type' => ['nullable', 'in:percent,fixed'],
            'amount' => ['sometimes', 'numeric'],
            'type_tax_use' => ['nullable', 'in:sale,purchase,none'],
            'tax_scope' => ['nullable', 'in:service,consu,all'],
            'price_include' => ['nullable', 'boolean'],
            'include_base_amount' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'sequence' => ['nullable', 'integer'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'active' => ['nullable', 'boolean'],
        ]);

        $tax->update($validated);

        return response()->json([
            'data' => $tax->fresh('taxGroup'),
            'message' => 'Tax updated successfully',
        ]);
    }

    public function destroy(Tax $tax): JsonResponse
    {
        $tax->delete();

        return response()->json([
            'message' => 'Tax deleted successfully',
        ]);
    }

    /**
     * Get tax groups
     */
    public function groups(): JsonResponse
    {
        $groups = TaxGroup::active()->with('taxes')->orderBy('sequence')->get();

        return response()->json([
            'data' => $groups,
        ]);
    }
}
