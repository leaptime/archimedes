<?php

namespace Modules\Invoicing\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\Payment;

class PaymentController extends Controller
{
    public function index(Invoice $invoice): JsonResponse
    {
        $payments = $invoice->payments()->orderBy('payment_date', 'desc')->get();

        return response()->json([
            'data' => $payments,
        ]);
    }

    public function store(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,credit_card,check,other'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = $invoice->payments()->create($validated);

        return response()->json([
            'data' => $payment,
            'invoice' => $invoice->fresh(),
            'message' => 'Payment recorded successfully',
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json([
            'data' => $payment->load('invoice'),
        ]);
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'payment_date' => ['sometimes', 'date'],
            'payment_method' => ['sometimes', 'string', 'in:cash,bank_transfer,credit_card,check,other'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment->update($validated);

        return response()->json([
            'data' => $payment->fresh(),
            'invoice' => $payment->invoice->fresh(),
            'message' => 'Payment updated successfully',
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $invoice = $payment->invoice;
        $payment->delete();

        return response()->json([
            'invoice' => $invoice->fresh(),
            'message' => 'Payment deleted successfully',
        ]);
    }
}
