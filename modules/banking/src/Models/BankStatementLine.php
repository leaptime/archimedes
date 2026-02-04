<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class BankStatementLine extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'statement_id',
        'bank_account_id',
        'date',
        'payment_ref',
        'partner_name',
        'partner_id',
        'amount',
        'currency_code',
        'amount_currency',
        'foreign_currency_code',
        'running_balance',
        'account_number',
        'transaction_type',
        'sequence',
        'internal_index',
        'is_reconciled',
        'amount_residual',
        'checked',
        'transaction_details',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'amount_currency' => 'decimal:2',
        'running_balance' => 'decimal:2',
        'amount_residual' => 'decimal:2',
        'is_reconciled' => 'boolean',
        'checked' => 'boolean',
        'transaction_details' => 'array',
    ];

    protected $attributes = [
        'currency_code' => 'EUR',
        'sequence' => 1,
        'is_reconciled' => false,
        'checked' => false,
    ];

    protected static function booted(): void
    {
        static::creating(function (BankStatementLine $line) {
            $line->computeInternalIndex();
            $line->amount_residual = $line->amount_residual ?? abs($line->amount);
        });

        static::updating(function (BankStatementLine $line) {
            if ($line->isDirty(['date', 'sequence'])) {
                $line->computeInternalIndex();
            }
        });

        static::saved(function (BankStatementLine $line) {
            if ($line->statement_id) {
                $line->statement->computeBalances();
                $line->statement->computeFirstLineIndex();
                $line->statement->save();
            }
        });
    }

    public function statement(): BelongsTo
    {
        return $this->belongsTo(BankStatement::class, 'statement_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'partner_id');
    }

    public function partialReconciles(): HasMany
    {
        return $this->hasMany(PartialReconcile::class, 'bank_statement_line_id');
    }

    public function computeInternalIndex(): void
    {
        $dateStr = $this->date->format('Ymd');
        $seqStr = str_pad(2147483647 - $this->sequence, 10, '0', STR_PAD_LEFT);
        $idStr = str_pad($this->id ?? 0, 10, '0', STR_PAD_LEFT);
        $this->internal_index = "{$dateStr}{$seqStr}{$idStr}";
    }

    public function computeRunningBalance(): void
    {
        $previousLine = self::where('bank_account_id', $this->bank_account_id)
            ->where('internal_index', '<', $this->internal_index)
            ->orderBy('internal_index', 'desc')
            ->first();

        $previousBalance = $previousLine?->running_balance ?? 0;

        if (!$previousLine && $this->statement_id) {
            $previousBalance = $this->statement->balance_start;
        }

        $this->running_balance = $previousBalance + $this->amount;
    }

    public function markReconciled(): void
    {
        $this->is_reconciled = true;
        $this->amount_residual = 0;
        $this->checked = true;
        $this->save();
    }

    public function undoReconciliation(): void
    {
        $this->partialReconciles()->delete();
        $this->is_reconciled = false;
        $this->amount_residual = abs($this->amount);
        $this->save();
    }

    public function getTypeAttribute(): string
    {
        return $this->amount >= 0 ? 'credit' : 'debit';
    }

    public function getAbsoluteAmountAttribute(): float
    {
        return abs($this->amount);
    }

    public function getDisplayNameAttribute(): string
    {
        $name = $this->payment_ref ?? 'Transaction';
        if ($this->partner_name) {
            $name .= " - {$this->partner_name}";
        }
        return $name;
    }
}
