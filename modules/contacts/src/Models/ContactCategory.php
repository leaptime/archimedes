<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ContactCategory extends Model
{
    protected $table = 'contact_categories';

    protected $fillable = [
        'name',
        'color',
        'parent_id',
        'parent_path',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContactCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ContactCategory::class, 'parent_id');
    }

    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class, 'contact_category_pivot', 'category_id', 'contact_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function getDisplayNameAttribute(): string
    {
        $names = [];
        $current = $this;
        while ($current) {
            array_unshift($names, $current->name);
            $current = $current->parent;
        }
        return implode(' / ', $names);
    }

    protected static function booted(): void
    {
        static::saving(function ($category) {
            $category->updateParentPath();
        });
    }

    protected function updateParentPath(): void
    {
        if ($this->parent_id) {
            $parent = static::find($this->parent_id);
            $this->parent_path = $parent?->parent_path
                ? $parent->parent_path . '/' . $this->parent_id
                : (string) $this->parent_id;
        } else {
            $this->parent_path = null;
        }
    }
}
