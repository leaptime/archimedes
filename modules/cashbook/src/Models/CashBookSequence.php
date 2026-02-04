<?php

namespace Modules\CashBook\Models;

use Illuminate\Database\Eloquent\Model;

class CashBookSequence extends Model
{
    protected $table = 'cashbook_sequences';

    protected $fillable = [
        'company_id',
        'year',
        'next_number',
        'prefix',
    ];

    protected $casts = [
        'year' => 'integer',
        'next_number' => 'integer',
    ];
}
