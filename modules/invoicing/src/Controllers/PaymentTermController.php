<?php

namespace Modules\Invoicing\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\PaymentTerm;

class PaymentTermController extends Controller
{
    public function index(): JsonResponse
    {
        $terms = PaymentTerm::active()->orderBy('days')->get();

        return response()->json([
            'data' => $terms,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'days' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_default' => ['boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            PaymentTerm::where('is_default', true)->update(['is_default' => false]);
        }

        $term = PaymentTerm::create($validated);

        return response()->json([
            'data' => $term,
            'message' => 'Payment term created successfully',
        ], 201);
    }

    public function show(PaymentTerm $paymentTerm): JsonResponse
    {
        return response()->json([
            'data' => $paymentTerm,
        ]);
    }

    public function update(Request $request, PaymentTerm $paymentTerm): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'days' => ['sometimes', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            PaymentTerm::where('is_default', true)
                ->where('id', '!=', $paymentTerm->id)
                ->update(['is_default' => false]);
        }

        $paymentTerm->update($validated);

        return response()->json([
            'data' => $paymentTerm->fresh(),
            'message' => 'Payment term updated successfully',
        ]);
    }

    public function destroy(PaymentTerm $paymentTerm): JsonResponse
    {
        $paymentTerm->delete();

        return response()->json([
            'message' => 'Payment term deleted successfully',
        ]);
    }
}
