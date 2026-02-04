<?php

namespace Modules\Invoicing\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Invoicing\Models\PaymentTerm;
use Modules\Invoicing\Models\Tax;
use Modules\Invoicing\Models\Currency;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::query();

        // Filter by move type
        if ($moveType = $request->query('move_type')) {
            $query->where('move_type', $moveType);
        }

        // Filter by type group (sale/purchase)
        if ($request->query('type') === 'sale') {
            $query->sale();
        } elseif ($request->query('type') === 'purchase') {
            $query->purchase();
        }

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('ref', 'like', "%{$search}%")
                  ->orWhereHas('contact', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('company', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by state
        if ($state = $request->query('state')) {
            $query->where('state', $state);
        }

        // Filter by payment state
        if ($paymentState = $request->query('payment_state')) {
            $query->where('payment_state', $paymentState);
        }

        // Filter by contact
        if ($contactId = $request->query('contact_id')) {
            $query->where('contact_id', $contactId);
        }

        // Filter by date range
        if ($from = $request->query('from_date')) {
            $query->where('invoice_date', '>=', $from);
        }
        if ($to = $request->query('to_date')) {
            $query->where('invoice_date', '<=', $to);
        }

        // Filter overdue
        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        // Include relationships
        $query->with(['contact', 'currency']);
        
        if ($includes = $request->query('include')) {
            $allowed = ['lines', 'payments', 'taxLines', 'user'];
            $requested = array_intersect(explode(',', $includes), $allowed);
            if ($requested) {
                $query->with($requested);
            }
        }

        // Sorting
        $sortField = $request->query('sort', 'invoice_date');
        $sortDirection = $request->query('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = min($request->query('per_page', 25), 100);
        $invoices = $query->paginate($perPage);

        return response()->json([
            'data' => $invoices->items(),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    /**
     * Store a newly created invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'move_type' => ['nullable', 'in:out_invoice,out_refund,in_invoice,in_refund'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'ref' => ['nullable', 'string', 'max:255'],
            'invoice_date' => ['nullable', 'date'],
            'invoice_date_due' => ['nullable', 'date'],
            'payment_term_id' => ['nullable', 'exists:payment_terms,id'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'narration' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'lines' => ['nullable', 'array'],
            'lines.*.product_id' => ['nullable', 'exists:products,id'],
            'lines.*.name' => ['nullable', 'string'],
            'lines.*.description' => ['nullable', 'string'],
            'lines.*.quantity' => ['nullable', 'numeric', 'min:0'],
            'lines.*.price_unit' => ['nullable', 'numeric'],
            'lines.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.tax_ids' => ['nullable', 'array'],
            'lines.*.tax_ids.*' => ['exists:taxes,id'],
            'lines.*.display_type' => ['nullable', 'in:product,line_section,line_note'],
        ]);

        // Set defaults
        $validated['move_type'] = $validated['move_type'] ?? Invoice::MOVE_TYPE_OUT_INVOICE;
        $validated['state'] = Invoice::STATE_DRAFT;
        $validated['invoice_date'] = $validated['invoice_date'] ?? now()->format('Y-m-d');
        $validated['user_id'] = $request->user()->id;

        // Calculate due date from payment term
        if (!empty($validated['payment_term_id']) && empty($validated['invoice_date_due'])) {
            $paymentTerm = PaymentTerm::find($validated['payment_term_id']);
            if ($paymentTerm) {
                $invoiceDate = new \DateTime($validated['invoice_date']);
                $validated['invoice_date_due'] = $paymentTerm->calculateDueDate($invoiceDate)->format('Y-m-d');
            }
        }

        // Default due date if still not set
        if (empty($validated['invoice_date_due'])) {
            $validated['invoice_date_due'] = (new \DateTime($validated['invoice_date']))
                ->modify('+30 days')
                ->format('Y-m-d');
        }

        $invoice = Invoice::create($validated);

        // Create lines
        if (!empty($validated['lines'])) {
            foreach ($validated['lines'] as $index => $lineData) {
                $lineData['invoice_id'] = $invoice->id;
                $lineData['sequence'] = ($index + 1) * 10;
                $lineData['display_type'] = $lineData['display_type'] ?? InvoiceLine::DISPLAY_TYPE_PRODUCT;
                
                InvoiceLine::create($lineData);
            }
        }

        $invoice->refresh();
        $invoice->load(['contact', 'lines', 'currency']);

        return response()->json([
            'data' => $invoice,
            'message' => 'Invoice created successfully',
        ], 201);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $invoice->load(['contact', 'lines.product', 'payments', 'taxLines', 'currency', 'paymentTerm', 'user']);

        return response()->json([
            'data' => $invoice,
        ]);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->state !== Invoice::STATE_DRAFT) {
            return response()->json([
                'message' => 'Only draft invoices can be edited',
            ], 422);
        }

        $validated = $request->validate([
            'contact_id' => ['sometimes', 'exists:contacts,id'],
            'ref' => ['nullable', 'string', 'max:255'],
            'invoice_date' => ['sometimes', 'date'],
            'invoice_date_due' => ['sometimes', 'date'],
            'payment_term_id' => ['nullable', 'exists:payment_terms,id'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'narration' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'lines' => ['nullable', 'array'],
            'lines.*.id' => ['nullable', 'exists:invoice_items,id'],
            'lines.*.product_id' => ['nullable', 'exists:products,id'],
            'lines.*.name' => ['nullable', 'string'],
            'lines.*.description' => ['nullable', 'string'],
            'lines.*.quantity' => ['nullable', 'numeric', 'min:0'],
            'lines.*.price_unit' => ['nullable', 'numeric'],
            'lines.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.tax_ids' => ['nullable', 'array'],
            'lines.*.display_type' => ['nullable', 'in:product,line_section,line_note'],
            'lines.*._delete' => ['nullable', 'boolean'],
        ]);

        $invoice->update($validated);

        // Update lines if provided
        if (isset($validated['lines'])) {
            $existingIds = [];

            foreach ($validated['lines'] as $index => $lineData) {
                // Handle deletion
                if (!empty($lineData['_delete']) && !empty($lineData['id'])) {
                    InvoiceLine::where('id', $lineData['id'])->delete();
                    continue;
                }

                $lineData['sequence'] = ($index + 1) * 10;

                if (!empty($lineData['id'])) {
                    // Update existing
                    $line = InvoiceLine::find($lineData['id']);
                    if ($line && $line->invoice_id === $invoice->id) {
                        $line->update($lineData);
                        $existingIds[] = $line->id;
                    }
                } else {
                    // Create new
                    $lineData['invoice_id'] = $invoice->id;
                    $lineData['display_type'] = $lineData['display_type'] ?? InvoiceLine::DISPLAY_TYPE_PRODUCT;
                    $line = InvoiceLine::create($lineData);
                    $existingIds[] = $line->id;
                }
            }

            // Delete lines not in the update (if full replacement is desired)
            // Commented out to allow partial updates
            // $invoice->lines()->whereNotIn('id', $existingIds)->delete();
        }

        $invoice->refresh();
        $invoice->load(['contact', 'lines', 'currency']);

        return response()->json([
            'data' => $invoice,
            'message' => 'Invoice updated successfully',
        ]);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        if ($invoice->state === Invoice::STATE_POSTED && $invoice->payment_state !== Invoice::PAYMENT_NOT_PAID) {
            return response()->json([
                'message' => 'Cannot delete an invoice with payments',
            ], 422);
        }

        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }

    /**
     * Post (confirm) an invoice
     */
    public function post(Invoice $invoice): JsonResponse
    {
        if ($invoice->state !== Invoice::STATE_DRAFT) {
            return response()->json([
                'message' => 'Only draft invoices can be posted',
            ], 422);
        }

        if ($invoice->lines()->where('display_type', 'product')->count() === 0) {
            return response()->json([
                'message' => 'Cannot post an invoice without lines',
            ], 422);
        }

        $invoice->post();
        $invoice->load(['contact', 'lines', 'currency']);

        return response()->json([
            'data' => $invoice,
            'message' => 'Invoice posted successfully',
        ]);
    }

    /**
     * Cancel an invoice
     */
    public function cancel(Invoice $invoice): JsonResponse
    {
        if (!$invoice->cancel()) {
            return response()->json([
                'message' => 'Cannot cancel this invoice (it may be paid or already cancelled)',
            ], 422);
        }

        return response()->json([
            'data' => $invoice->fresh(['contact', 'lines']),
            'message' => 'Invoice cancelled successfully',
        ]);
    }

    /**
     * Reset to draft
     */
    public function resetToDraft(Invoice $invoice): JsonResponse
    {
        if (!$invoice->resetToDraft()) {
            return response()->json([
                'message' => 'Only cancelled invoices can be reset to draft',
            ], 422);
        }

        return response()->json([
            'data' => $invoice->fresh(['contact', 'lines']),
            'message' => 'Invoice reset to draft',
        ]);
    }

    /**
     * Send invoice (mark as sent)
     */
    public function send(Invoice $invoice): JsonResponse
    {
        $invoice->markAsSent();

        // TODO: Implement email sending

        return response()->json([
            'data' => $invoice->fresh(['contact', 'lines']),
            'message' => 'Invoice sent successfully',
        ]);
    }

    /**
     * Register a payment
     */
    public function registerPayment(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->state !== Invoice::STATE_POSTED) {
            return response()->json([
                'message' => 'Can only register payments for posted invoices',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'string'],
            'reference' => ['nullable', 'string'],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = $invoice->registerPayment(
            $validated['amount'],
            $validated['payment_method'] ?? null,
            $validated['reference'] ?? null
        );

        if (!empty($validated['payment_date'])) {
            $payment->update(['payment_date' => $validated['payment_date']]);
        }
        if (!empty($validated['notes'])) {
            $payment->update(['notes' => $validated['notes']]);
        }

        return response()->json([
            'data' => $invoice->fresh(['contact', 'lines', 'payments']),
            'payment' => $payment,
            'message' => 'Payment registered successfully',
        ]);
    }

    /**
     * Duplicate an invoice
     */
    public function duplicate(Invoice $invoice): JsonResponse
    {
        $newInvoice = $invoice->duplicate();
        $newInvoice->load(['contact', 'lines']);

        return response()->json([
            'data' => $newInvoice,
            'message' => 'Invoice duplicated successfully',
        ], 201);
    }

    /**
     * Create credit note from invoice
     */
    public function createCreditNote(Invoice $invoice): JsonResponse
    {
        if (!$invoice->is_invoice) {
            return response()->json([
                'message' => 'Can only create credit notes from invoices',
            ], 422);
        }

        $creditNote = $invoice->createCreditNote();
        $creditNote->load(['contact', 'lines']);

        return response()->json([
            'data' => $creditNote,
            'message' => 'Credit note created successfully',
        ], 201);
    }

    /**
     * Get invoice statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $query = Invoice::query();

        // Filter by type
        if ($request->query('type') === 'sale') {
            $query->sale();
        } elseif ($request->query('type') === 'purchase') {
            $query->purchase();
        }

        if ($contactId = $request->query('contact_id')) {
            $query->where('contact_id', $contactId);
        }

        // Date range
        if ($from = $request->query('from_date')) {
            $query->where('invoice_date', '>=', $from);
        }
        if ($to = $request->query('to_date')) {
            $query->where('invoice_date', '<=', $to);
        }

        $stats = [
            'total_count' => (clone $query)->count(),
            'draft_count' => (clone $query)->where('state', Invoice::STATE_DRAFT)->count(),
            'posted_count' => (clone $query)->where('state', Invoice::STATE_POSTED)->count(),
            'paid_count' => (clone $query)->where('payment_state', Invoice::PAYMENT_PAID)->count(),
            'overdue_count' => (clone $query)->overdue()->count(),

            'total_amount' => (clone $query)->where('state', Invoice::STATE_POSTED)->sum('amount_total'),
            'paid_amount' => (clone $query)->where('state', Invoice::STATE_POSTED)->sum('amount_paid'),
            'outstanding_amount' => (clone $query)
                ->where('state', Invoice::STATE_POSTED)
                ->whereIn('payment_state', [Invoice::PAYMENT_NOT_PAID, Invoice::PAYMENT_PARTIAL])
                ->sum('amount_residual'),
            'overdue_amount' => (clone $query)->overdue()->sum('amount_residual'),
        ];

        return response()->json(['data' => $stats]);
    }

    /**
     * Get available currencies
     */
    public function currencies(): JsonResponse
    {
        $currencies = Currency::active()->orderBy('code')->get();
        return response()->json(['data' => $currencies]);
    }

    /**
     * Get available taxes
     */
    public function taxes(Request $request): JsonResponse
    {
        $query = Tax::active();

        if ($type = $request->query('type')) {
            if ($type === 'sale') {
                $query->forSale();
            } elseif ($type === 'purchase') {
                $query->forPurchase();
            }
        }

        $taxes = $query->orderBy('sequence')->get();
        return response()->json(['data' => $taxes]);
    }
}
