<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class InvoiceSequence extends Model
{
    protected $fillable = [
        'code',
        'name',
        'prefix',
        'suffix',
        'padding',
        'next_number',
        'use_date_range',
        'date_format',
        'active',
    ];

    protected $casts = [
        'padding' => 'integer',
        'next_number' => 'integer',
        'use_date_range' => 'boolean',
        'active' => 'boolean',
    ];

    public function ranges(): HasMany
    {
        return $this->hasMany(InvoiceSequenceRange::class, 'sequence_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public static function getByCode(string $code): ?self
    {
        return static::where('code', $code)->where('active', true)->first();
    }

    /**
     * Generate the next number in the sequence
     */
    public function getNextNumber(?\DateTimeInterface $date = null): string
    {
        $date = $date ?? now();
        
        return DB::transaction(function () use ($date) {
            if ($this->use_date_range) {
                return $this->getNextNumberWithDateRange($date);
            }
            
            return $this->getNextNumberSimple();
        });
    }

    protected function getNextNumberSimple(): string
    {
        $number = $this->next_number;
        $this->increment('next_number');
        
        return $this->formatNumber($number);
    }

    protected function getNextNumberWithDateRange(\DateTimeInterface $date): string
    {
        $dateFormat = $this->date_format ?: 'Y';
        $datePrefix = $date->format($dateFormat);
        
        // Find or create range for this date
        $startOfPeriod = $this->getStartOfPeriod($date);
        $endOfPeriod = $this->getEndOfPeriod($date);
        
        $range = $this->ranges()
            ->where('date_from', '<=', $date->format('Y-m-d'))
            ->where('date_to', '>=', $date->format('Y-m-d'))
            ->lockForUpdate()
            ->first();

        if (!$range) {
            $range = $this->ranges()->create([
                'date_from' => $startOfPeriod->format('Y-m-d'),
                'date_to' => $endOfPeriod->format('Y-m-d'),
                'next_number' => 1,
            ]);
        }

        $number = $range->next_number;
        $range->increment('next_number');
        
        return $this->formatNumber($number, $datePrefix);
    }

    protected function formatNumber(int $number, ?string $datePrefix = null): string
    {
        $paddedNumber = str_pad($number, $this->padding, '0', STR_PAD_LEFT);
        
        $result = $this->prefix;
        
        if ($datePrefix) {
            $result .= $datePrefix . '/';
        }
        
        $result .= $paddedNumber;
        $result .= $this->suffix;
        
        return $result;
    }

    protected function getStartOfPeriod(\DateTimeInterface $date): \DateTimeInterface
    {
        $format = $this->date_format ?: 'Y';
        
        return match ($format) {
            'Y' => (clone $date)->modify('first day of January'),
            'Y-m', 'Ym' => (clone $date)->modify('first day of this month'),
            default => (clone $date)->modify('first day of January'),
        };
    }

    protected function getEndOfPeriod(\DateTimeInterface $date): \DateTimeInterface
    {
        $format = $this->date_format ?: 'Y';
        
        return match ($format) {
            'Y' => (clone $date)->modify('last day of December'),
            'Y-m', 'Ym' => (clone $date)->modify('last day of this month'),
            default => (clone $date)->modify('last day of December'),
        };
    }
}
