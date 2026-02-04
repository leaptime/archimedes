<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FullReconcile extends Model
{
    protected $fillable = [
        'name',
    ];

    public function partials(): HasMany
    {
        return $this->hasMany(PartialReconcile::class);
    }

    public function getStatementLinesAttribute()
    {
        return BankStatementLine::whereIn(
            'id',
            $this->partials()->pluck('bank_statement_line_id')
        )->get();
    }

    public static function generateName(): string
    {
        $lastReconcile = self::orderBy('id', 'desc')->first();
        $number = $lastReconcile ? $lastReconcile->id + 1 : 1;
        return 'REC' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
