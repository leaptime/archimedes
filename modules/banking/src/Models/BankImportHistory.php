<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class BankImportHistory extends Model
{
    protected $table = 'bank_import_history';

    protected $fillable = [
        'bank_account_id',
        'filename',
        'format',
        'transactions_count',
        'transactions_imported',
        'transactions_skipped',
        'total_amount',
        'status',
        'error_message',
        'details',
        'user_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'details' => 'array',
    ];

    protected $attributes = [
        'transactions_count' => 0,
        'transactions_imported' => 0,
        'transactions_skipped' => 0,
        'total_amount' => 0,
        'status' => 'pending',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markProcessing(): void
    {
        $this->status = 'processing';
        $this->save();
    }

    public function markCompleted(int $imported, int $skipped, float $totalAmount): void
    {
        $this->status = 'completed';
        $this->transactions_imported = $imported;
        $this->transactions_skipped = $skipped;
        $this->total_amount = $totalAmount;
        $this->save();
    }

    public function markFailed(string $errorMessage): void
    {
        $this->status = 'failed';
        $this->error_message = $errorMessage;
        $this->save();
    }
}
