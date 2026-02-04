<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'decimal_places',
        'rate',
        'is_base',
        'active',
        'position',
    ];

    protected $casts = [
        'decimal_places' => 'integer',
        'rate' => 'decimal:10',
        'is_base' => 'boolean',
        'active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public static function getBase(): ?self
    {
        return static::where('is_base', true)->first();
    }

    public static function getByCode(string $code): ?self
    {
        return static::where('code', strtoupper($code))->first();
    }

    public function convert(float $amount, Currency $to): float
    {
        if ($this->id === $to->id) {
            return $amount;
        }

        // Convert to base currency first, then to target
        $baseAmount = $amount / $this->rate;
        return $baseAmount * $to->rate;
    }

    public function format(float $amount): string
    {
        $formatted = number_format($amount, $this->decimal_places);
        
        return $this->position === 'before'
            ? $this->symbol . $formatted
            : $formatted . ' ' . $this->symbol;
    }

    public function round(float $amount): float
    {
        return round($amount, $this->decimal_places);
    }
}
