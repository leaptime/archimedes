<?php

namespace Modules\Invoicing\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\Product;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('default_code', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        // Filter saleable/purchaseable
        if ($request->boolean('sale_ok')) {
            $query->saleable();
        }
        if ($request->boolean('purchase_ok')) {
            $query->purchaseable();
        }

        // Active only by default
        if (!$request->has('include_inactive')) {
            $query->active();
        }

        // Include relationships
        if ($request->boolean('with_taxes')) {
            $query->with(['saleTax', 'purchaseTax']);
        }

        $perPage = min($request->query('per_page', 25), 100);
        $products = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'barcode' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', 'in:consu,service,storable'],
            'description' => ['nullable', 'string'],
            'description_sale' => ['nullable', 'string'],
            'description_purchase' => ['nullable', 'string'],
            'list_price' => ['nullable', 'numeric', 'min:0'],
            'standard_price' => ['nullable', 'numeric', 'min:0'],
            'default_code' => ['nullable', 'string', 'max:50'],
            'uom' => ['nullable', 'string', 'max:20'],
            'sale_tax_id' => ['nullable', 'exists:taxes,id'],
            'purchase_tax_id' => ['nullable', 'exists:taxes,id'],
            'category' => ['nullable', 'string', 'max:100'],
            'sale_ok' => ['nullable', 'boolean'],
            'purchase_ok' => ['nullable', 'boolean'],
        ]);

        $product = Product::create($validated);

        return response()->json([
            'data' => $product->load(['saleTax', 'purchaseTax']),
            'message' => 'Product created successfully',
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['saleTax', 'purchaseTax']);

        return response()->json([
            'data' => $product,
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'barcode' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', 'in:consu,service,storable'],
            'description' => ['nullable', 'string'],
            'description_sale' => ['nullable', 'string'],
            'description_purchase' => ['nullable', 'string'],
            'list_price' => ['nullable', 'numeric', 'min:0'],
            'standard_price' => ['nullable', 'numeric', 'min:0'],
            'default_code' => ['nullable', 'string', 'max:50'],
            'uom' => ['nullable', 'string', 'max:20'],
            'sale_tax_id' => ['nullable', 'exists:taxes,id'],
            'purchase_tax_id' => ['nullable', 'exists:taxes,id'],
            'category' => ['nullable', 'string', 'max:100'],
            'sale_ok' => ['nullable', 'boolean'],
            'purchase_ok' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
        ]);

        $product->update($validated);

        return response()->json([
            'data' => $product->fresh(['saleTax', 'purchaseTax']),
            'message' => 'Product updated successfully',
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}
