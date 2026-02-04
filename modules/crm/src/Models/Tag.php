<?php

namespace Modules\Crm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $table = 'crm_tags';

    protected $fillable = [
        'name',
        'color',
    ];

    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'crm_lead_tag', 'tag_id', 'lead_id');
    }
}
