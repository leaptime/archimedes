<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReconcileModelLine extends Model
{
    protected $fillable = [
        'reconcile_model_id',
        'sequence',
        'account_code',
        'label',
        'amount_type',
        'amount_string',
        'amount',
        'force_tax_included',
        'tax_ids',
        'analytic_distribution',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'force_tax_included' => 'boolean',
        'tax_ids' => 'array',
        'analytic_distribution' => 'array',
    ];

    protected $attributes = [
        'sequence' => 10,
        'amount_type' => 'percentage',
        'amount_string' => '100',
        'amount' => 0,
        'force_tax_included' => false,
    ];

    protected static function booted(): void
    {
        static::saving(function (ReconcileModelLine $line) {
            $line->parseAmount();
        });
    }

    public function reconcileModel(): BelongsTo
    {
        return $this->belongsTo(ReconcileModel::class);
    }

    protected function parseAmount(): void
    {
        if ($this->amount_type === 'regex') {
            $this->amount = 0;
        } else {
            $this->amount = (float) str_replace(',', '.', $this->amount_string);
        }
    }

    public function computeAmount(BankStatementLine $line): float
    {
        switch ($this->amount_type) {
            case 'fixed':
                return $this->amount;
            case 'percentage':
            case 'percentage_st_line':
                return abs($line->amount) * ($this->amount / 100);
            case 'regex':
                if (preg_match("/{$this->amount_string}/", $line->payment_ref ?? '', $matches)) {
                    $amountStr = $matches[1] ?? '0';
                    $amountStr = str_replace(',', '.', preg_replace('/[^\d,.]/', '', $amountStr));
                    return (float) $amountStr;
                }
                return 0;
            default:
                return 0;
        }
    }
}
