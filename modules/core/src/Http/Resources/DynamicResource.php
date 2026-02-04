<?php

namespace Modules\Core\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Core\Models\ExtendableModel;

class DynamicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        // Get includes from query parameter
        $includes = $request->query('include')
            ? explode(',', $request->query('include'))
            : [];

        // If the resource is an ExtendableModel, use its toResourceArray method
        if ($this->resource instanceof ExtendableModel) {
            return $this->resource->toResourceArray($includes);
        }

        // Otherwise, fall back to basic serialization
        $data = parent::toArray($request);

        // Handle includes for regular models
        foreach ($includes as $relation) {
            $relation = trim($relation);
            if ($this->resource->relationLoaded($relation)) {
                $data[$relation] = $this->resource->getRelation($relation);
            }
        }

        return $data;
    }

    /**
     * Create a resource collection with dynamic loading
     */
    public static function collection($resource)
    {
        return parent::collection($resource)->additional([
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }
}
