<?php

namespace Modules\Banking\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankStatement extends ExtendableModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'reference',
        'bank_account_id',
        'date',
        'balance_start',
        'balance_end',
        'balance_end_real',
        'is_complete',
        'is_valid',
        'problem_description',
        'first_line_index',
        'attachments',
    ];

    protected $casts = [
        'date' => 'date',
        'balance_start' => 'decimal:2',
        'balance_end' => 'decimal:2',
        'balance_end_real' => 'decimal:2',
        'is_complete' => 'boolean',
        'is_valid' => 'boolean',
        'attachments' => 'array',
    ];

    protected $attributes = [
        'balance_start' => 0,
        'balance_end' => 0,
        'balance_end_real' => 0,
        'is_complete' => false,
        'is_valid' => true,
    ];

    protected static function booted(): void
    {
        static::saving(function (BankStatement $statement) {
            $statement->computeBalances();
            $statement->validateStatement();
        });
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BankStatementLine::class, 'statement_id')
            ->orderBy('internal_index');
    }

    public function computeBalances(): void
    {
        $linesSum = $this->lines()->sum('amount');
        $this->balance_end = $this->balance_start + $linesSum;
        $this->is_complete = abs($this->balance_end - $this->balance_end_real) < 0.01;
    }

    public function validateStatement(): void
    {
        $previous = self::where('bank_account_id', $this->bank_account_id)
            ->where('first_line_index', '<', $this->first_line_index)
            ->orderBy('first_line_index', 'desc')
            ->first();

        if (!$previous) {
            $this->is_valid = true;
            $this->problem_description = null;
            return;
        }

        if (abs($this->balance_start - $previous->balance_end_real) < 0.01) {
            $this->is_valid = true;
            $this->problem_description = null;
        } else {
            $this->is_valid = false;
            $this->problem_description = "The starting balance doesn't match the ending balance of the previous statement.";
        }
    }

    public function generateName(): string
    {
        $account = $this->bankAccount;
        $code = strtoupper(substr($account->name, 0, 3));
        return "{$code} Statement {$this->date->format('Y-m-d')}";
    }

    public function computeFirstLineIndex(): void
    {
        $firstLine = $this->lines()->orderBy('internal_index')->first();
        $this->first_line_index = $firstLine?->internal_index;
    }
}
