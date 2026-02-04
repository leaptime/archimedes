<?php

namespace Modules\Invoicing\Extensions;

use Modules\Core\Contracts\ModelExtension;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\PaymentTerm;

class ContactExtension implements ModelExtension
{
    /**
     * Target model in module.model notation
     */
    public function target(): string
    {
        return 'contacts.contact';
    }

    /**
     * Additional fields for the contacts table
     */
    public function fields(): array
    {
        return [
            'credit_limit' => [
                'type' => 'decimal',
                'precision' => 12,
                'scale' => 2,
                'default' => 0,
                'nullable' => true,
            ],
            'payment_term_id' => [
                'type' => 'unsignedBigInteger',
                'nullable' => true,
            ],
            'tax_id' => [
                'type' => 'string',
                'max' => 50,
                'nullable' => true,
            ],
            'billing_email' => [
                'type' => 'string',
                'max' => 255,
                'nullable' => true,
            ],
            'billing_address' => [
                'type' => 'text',
                'nullable' => true,
            ],
            'currency' => [
                'type' => 'string',
                'max' => 3,
                'default' => 'EUR',
                'nullable' => true,
            ],
        ];
    }

    /**
     * Additional relationships
     */
    public function relationships(): array
    {
        return [
            'invoices' => fn($model) => $model->hasMany(Invoice::class, 'contact_id'),
            'paymentTerm' => fn($model) => $model->belongsTo(PaymentTerm::class),
        ];
    }

    /**
     * Computed attributes
     */
    public function computed(): array
    {
        return [
            'total_invoiced' => function ($contact) {
                return $contact->invoices()->sum('total');
            },
            'total_paid' => function ($contact) {
                return $contact->invoices()
                    ->where('status', 'paid')
                    ->sum('total');
            },
            'outstanding_balance' => function ($contact) {
                return $contact->invoices()
                    ->whereIn('status', ['sent', 'overdue'])
                    ->sum('amount_due');
            },
            'is_overdue' => function ($contact) {
                return $contact->invoices()
                    ->where('due_date', '<', now())
                    ->where('status', '!=', 'paid')
                    ->exists();
            },
            'available_credit' => function ($contact) {
                $limit = $contact->credit_limit ?? 0;
                $outstanding = $contact->invoices()
                    ->whereIn('status', ['sent', 'overdue'])
                    ->sum('amount_due');
                return max(0, $limit - $outstanding);
            },
            'invoice_count' => function ($contact) {
                return $contact->invoices()->count();
            },
        ];
    }

    /**
     * Query scopes
     */
    public function scopes(): array
    {
        return [
            'withOutstandingInvoices' => function ($query) {
                return $query->whereHas('invoices', function ($q) {
                    $q->whereIn('status', ['sent', 'overdue']);
                });
            },
            'overCreditLimit' => function ($query) {
                return $query->whereRaw('credit_limit > 0')
                    ->whereHas('invoices', function ($q) {
                        $q->whereIn('status', ['sent', 'overdue'])
                          ->havingRaw('SUM(amount_due) > contacts.credit_limit');
                    });
            },
            'goodStanding' => function ($query) {
                return $query->whereDoesntHave('invoices', function ($q) {
                    $q->where('status', 'overdue');
                });
            },
        ];
    }

    /**
     * Validation rules for extended fields
     */
    public function validation(): array
    {
        return [
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_term_id' => ['nullable', 'exists:payment_terms,id'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'billing_email' => ['nullable', 'email', 'max:255'],
            'billing_address' => ['nullable', 'string'],
            'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
