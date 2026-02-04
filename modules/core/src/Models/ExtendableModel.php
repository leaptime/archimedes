<?php

namespace Modules\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Traits\HasExtensions;

abstract class ExtendableModel extends Model
{
    use HasExtensions;

    /**
     * Get the model's attributes including computed ones for serialization
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        // Add computed attributes
        foreach ($this->getExtendedComputed() as $key => $callback) {
            if (!isset($array[$key])) {
                $array[$key] = $callback($this);
            }
        }

        return $array;
    }

    /**
     * Get model data for API resource
     */
    public function toResourceArray(array $includes = []): array
    {
        $data = $this->toArray();

        // Include requested relationships
        foreach ($includes as $relation) {
            if ($this->relationLoaded($relation)) {
                $data[$relation] = $this->getRelation($relation);
            } elseif (method_exists($this, $relation) || $this->getExtendedRelationship($relation)) {
                $data[$relation] = $this->{$relation};
            }
        }

        return $data;
    }

    /**
     * Create a new model instance with extended fields support
     */
    public static function createWithExtensions(array $attributes): static
    {
        $instance = new static();
        $fillable = $instance->getFillable();
        
        // Filter attributes to only fillable fields
        $filtered = array_intersect_key($attributes, array_flip($fillable));
        
        return static::create($filtered);
    }

    /**
     * Update model with extended fields support
     */
    public function updateWithExtensions(array $attributes): bool
    {
        $fillable = $this->getFillable();
        
        // Filter attributes to only fillable fields
        $filtered = array_intersect_key($attributes, array_flip($fillable));
        
        return $this->update($filtered);
    }
}
