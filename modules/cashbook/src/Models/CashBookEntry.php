<?php

namespace Modules\CashBook\Models;

use Modules\Core\Models\ExtendableModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Contacts\Models\Contact;
use Modules\Banking\Models\BankAccount;
use Modules\Banking\Models\BankStatementLine;
use Modules\Invoicing\Models\Invoice;
use App\Models\User;

class CashBookEntry extends ExtendableModel
{
    use SoftDeletes;

    protected $table = 'cashbook_entries';

    public const MODEL_IDENTIFIER = 'cashbook.entry';

    protected $fillable = [
        'number',
        'date',
        'type',
        'amount',
        'currency_code',
        'exchange_rate',
        'payment_method',
        'description',
        'reference',
        'notes',
        'contact_id',
        'bank_account_id',
        'bank_transaction_id',
        'transfer_to_account_id',
        'linked_entry_id',
        'state',
        'confirmed_at',
        'confirmed_by',
        'amount_allocated',
        'company_id',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'amount_allocated' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    protected $appends = ['amount_unallocated', 'is_fully_allocated'];

    // Type constants
    public const TYPE_INCOME = 'income';
    public const TYPE_EXPENSE = 'expense';
    public const TYPE_TRANSFER = 'transfer';

    // State constants
    public const STATE_DRAFT = 'draft';
    public const STATE_CONFIRMED = 'confirmed';
    public const STATE_RECONCILED = 'reconciled';
    public const STATE_CANCELLED = 'cancelled';

    // Payment method constants
    public const METHOD_CASH = 'cash';
    public const METHOD_BANK_TRANSFER = 'bank_transfer';
    public const METHOD_CHECK = 'check';
    public const METHOD_CREDIT_CARD = 'credit_card';
    public const METHOD_DIRECT_DEBIT = 'direct_debit';
    public const METHOD_OTHER = 'other';

    // Relationships
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function bankTransaction(): BelongsTo
    {
        return $this->belongsTo(BankStatementLine::class, 'bank_transaction_id');
    }

    public function transferToAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'transfer_to_account_id');
    }

    public function linkedEntry(): BelongsTo
    {
        return $this->belongsTo(self::class, 'linked_entry_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(CashBookAllocation::class, 'cashbook_entry_id');
    }

    public function invoices(): BelongsToMany
    {
        return $this->belongsToMany(Invoice::class, 'cashbook_allocations', 'cashbook_entry_id', 'invoice_id')
            ->withPivot('amount_applied', 'notes')
            ->withTimestamps();
    }

    // Accessors
    public function getAmountUnallocatedAttribute(): float
    {
        return round($this->amount - $this->amount_allocated, 2);
    }

    public function getIsFullyAllocatedAttribute(): bool
    {
        return $this->amount_unallocated <= 0;
    }

    public function getFormattedAmountAttribute(): string
    {
        $symbol = $this->currency_code === 'EUR' ? '€' : ($this->currency_code === 'USD' ? '$' : $this->currency_code);
        return $symbol . number_format($this->amount, 2);
    }

    // Scopes
    public function scopeIncome($query)
    {
        return $query->where('type', self::TYPE_INCOME);
    }

    public function scopeExpense($query)
    {
        return $query->where('type', self::TYPE_EXPENSE);
    }

    public function scopeTransfer($query)
    {
        return $query->where('type', self::TYPE_TRANSFER);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('state', self::STATE_CONFIRMED);
    }

    public function scopeDraft($query)
    {
        return $query->where('state', self::STATE_DRAFT);
    }

    public function scopeReconciled($query)
    {
        return $query->where('state', self::STATE_RECONCILED);
    }

    public function scopeUnallocated($query)
    {
        return $query->whereRaw('amount > amount_allocated');
    }

    public function scopeForContact($query, int $contactId)
    {
        return $query->where('contact_id', $contactId);
    }

    public function scopeForPeriod($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeByPaymentMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }

    // Business Logic
    public function canConfirm(): bool
    {
        return $this->state === self::STATE_DRAFT;
    }

    public function canCancel(): bool
    {
        return in_array($this->state, [self::STATE_DRAFT, self::STATE_CONFIRMED]);
    }

    public function canAllocate(): bool
    {
        return $this->state === self::STATE_CONFIRMED && $this->amount_unallocated > 0;
    }

    public function confirm(?int $userId = null): bool
    {
        if (!$this->canConfirm()) {
            return false;
        }

        $this->update([
            'state' => self::STATE_CONFIRMED,
            'confirmed_at' => now(),
            'confirmed_by' => $userId,
        ]);

        return true;
    }

    public function cancel(): bool
    {
        if (!$this->canCancel()) {
            return false;
        }

        // Remove all allocations first
        $this->allocations()->delete();
        $this->updateAllocatedAmount();

        $this->update(['state' => self::STATE_CANCELLED]);

        return true;
    }

    public function markReconciled(): bool
    {
        if ($this->state !== self::STATE_CONFIRMED) {
            return false;
        }

        $this->update(['state' => self::STATE_RECONCILED]);
        return true;
    }

    public function updateAllocatedAmount(): void
    {
        $totalAllocated = $this->allocations()->sum('amount_applied');
        $this->update(['amount_allocated' => $totalAllocated]);
    }

    // Generate next number
    public static function generateNumber(?int $companyId = null): string
    {
        $year = date('Y');
        
        $sequence = CashBookSequence::firstOrCreate(
            ['company_id' => $companyId, 'year' => $year],
            ['next_number' => 1, 'prefix' => 'CB']
        );

        $number = sprintf('%s-%d-%05d', $sequence->prefix, $year, $sequence->next_number);
        
        $sequence->increment('next_number');

        return $number;
    }
}
