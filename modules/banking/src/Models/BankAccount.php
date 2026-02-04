<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class BankAccount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'account_number',
        'bank_name',
        'bank_bic',
        'iban',
        'account_type',
        'currency_code',
        'current_balance',
        'last_statement_balance',
        'last_statement_date',
        'partner_id',
        'suspense_account_code',
        'active',
        'settings',
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'last_statement_balance' => 'decimal:2',
        'last_statement_date' => 'date',
        'active' => 'boolean',
        'settings' => 'array',
    ];

    protected $attributes = [
        'account_type' => 'bank',
        'currency_code' => 'EUR',
        'current_balance' => 0,
        'last_statement_balance' => 0,
        'active' => true,
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'partner_id');
    }

    public function statements(): HasMany
    {
        return $this->hasMany(BankStatement::class)->orderBy('date', 'desc');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BankStatementLine::class)->orderBy('date', 'desc');
    }

    public function importHistory(): HasMany
    {
        return $this->hasMany(BankImportHistory::class);
    }

    public function getUnreconciledLinesAttribute()
    {
        return $this->lines()->where('is_reconciled', false)->get();
    }

    public function getUnreconciledCountAttribute(): int
    {
        return $this->lines()->where('is_reconciled', false)->count();
    }

    public function getToCheckCountAttribute(): int
    {
        return $this->lines()->where('checked', false)->count();
    }

    public function updateBalance(): void
    {
        $lastLine = $this->lines()
            ->orderBy('internal_index', 'desc')
            ->first();

        if ($lastLine) {
            $this->current_balance = $lastLine->running_balance ?? 0;
            $this->save();
        }
    }

    public function getDisplayNameAttribute(): string
    {
        $name = $this->name;
        if ($this->account_number) {
            $masked = '****' . substr($this->account_number, -4);
            $name .= " ({$masked})";
        }
        return $name;
    }
}
