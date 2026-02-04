<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PartialReconcile extends Model
{
    protected $fillable = [
        'bank_statement_line_id',
        'reconcile_type',
        'reconcile_id',
        'reconcile_model',
        'amount',
        'currency_code',
        'amount_currency',
        'max_date',
        'full_reconcile_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'amount_currency' => 'decimal:2',
        'max_date' => 'date',
    ];

    protected $attributes = [
        'currency_code' => 'EUR',
    ];

    public function statementLine(): BelongsTo
    {
        return $this->belongsTo(BankStatementLine::class, 'bank_statement_line_id');
    }

    public function fullReconcile(): BelongsTo
    {
        return $this->belongsTo(FullReconcile::class);
    }

    public function getReconciledRecordAttribute()
    {
        if (!$this->reconcile_model || !$this->reconcile_id) {
            return null;
        }

        return app($this->reconcile_model)->find($this->reconcile_id);
    }
}
