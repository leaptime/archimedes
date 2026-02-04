<?php

namespace Modules\L10nItEdi\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Tax;

class L10nItTaxNatura extends Model
{
    protected $table = 'l10n_it_tax_natura';

    protected $fillable = [
        'tax_id',
        'natura_code',
        'law_reference',
    ];

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    public function getNaturaDescription(): string
    {
        return config("l10n_it_edi.natura_codes.{$this->natura_code}", $this->natura_code);
    }
}
