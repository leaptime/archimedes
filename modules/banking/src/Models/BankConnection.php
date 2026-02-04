<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class BankConnection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'bank_account_id',
        'provider',
        'institution_id',
        'institution_name',
        'institution_logo',
        'external_account_id',
        'credentials',
        'status',
        'last_sync_at',
        'next_sync_at',
        'expires_at',
        'error_message',
        'sync_enabled',
        'settings',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'settings' => 'array',
        'last_sync_at' => 'datetime',
        'next_sync_at' => 'datetime',
        'expires_at' => 'datetime',
        'sync_enabled' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'pending',
        'sync_enabled' => true,
    ];

    protected $hidden = [
        'credentials',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_ERROR = 'error';
    const STATUS_EXPIRED = 'expired';
    const STATUS_REVOKED = 'revoked';

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(BankConnectionSyncLog::class)->orderBy('created_at', 'desc');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return true;
        }
        return $this->status === self::STATUS_EXPIRED;
    }

    public function needsSync(): bool
    {
        if (!$this->sync_enabled || !$this->isActive()) {
            return false;
        }

        if (!$this->next_sync_at) {
            return true;
        }

        return $this->next_sync_at->isPast();
    }

    public function markSynced(int $transactionsCount = 0): void
    {
        $syncInterval = $this->settings['sync_interval_hours'] ?? 6;

        $this->last_sync_at = now();
        $this->next_sync_at = now()->addHours($syncInterval);
        $this->status = self::STATUS_ACTIVE;
        $this->error_message = null;
        $this->save();

        $this->syncLogs()->create([
            'status' => 'success',
            'transactions_count' => $transactionsCount,
        ]);
    }

    public function markError(string $message): void
    {
        $this->status = self::STATUS_ERROR;
        $this->error_message = $message;
        $this->save();

        $this->syncLogs()->create([
            'status' => 'error',
            'error_message' => $message,
        ]);
    }

    public function markExpired(): void
    {
        $this->status = self::STATUS_EXPIRED;
        $this->sync_enabled = false;
        $this->error_message = 'Connection has expired. Please reconnect.';
        $this->save();
    }

    protected function displayStatus(): Attribute
    {
        return Attribute::make(
            get: function () {
                return match ($this->status) {
                    self::STATUS_ACTIVE => 'Connected',
                    self::STATUS_PENDING => 'Pending',
                    self::STATUS_ERROR => 'Error',
                    self::STATUS_EXPIRED => 'Expired',
                    self::STATUS_REVOKED => 'Disconnected',
                    default => 'Unknown',
                };
            }
        );
    }
}
