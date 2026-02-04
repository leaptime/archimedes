<?php

namespace Modules\Core\Services;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class FieldRegistry
{
    protected array $extensions = [];
    protected array $fieldCache = [];

    /**
     * Register field extensions for a model
     */
    public function register(string $target, array $fields, string $module): void
    {
        if (!isset($this->extensions[$target])) {
            $this->extensions[$target] = [];
        }

        $this->extensions[$target][$module] = $fields;
        
        // Clear cache for this target
        unset($this->fieldCache[$target]);
    }

    /**
     * Get all extended fields for a model
     */
    public function getFields(string $target): array
    {
        if (isset($this->fieldCache[$target])) {
            return $this->fieldCache[$target];
        }

        $fields = [];
        
        foreach ($this->extensions[$target] ?? [] as $module => $moduleFields) {
            foreach ($moduleFields as $fieldName => $definition) {
                $fields[$fieldName] = array_merge($definition, ['_module' => $module]);
            }
        }

        $this->fieldCache[$target] = $fields;
        
        return $fields;
    }

    /**
     * Get field names for fillable array
     */
    public function getFillable(string $target): array
    {
        return array_keys($this->getFields($target));
    }

    /**
     * Generate migration for extended fields
     */
    public function generateMigration(string $target, string $table): string
    {
        $fields = $this->getFields($target);
        
        if (empty($fields)) {
            return '';
        }

        $upStatements = [];
        $downStatements = [];

        foreach ($fields as $fieldName => $definition) {
            $upStatements[] = $this->generateFieldStatement($fieldName, $definition);
            $downStatements[] = "\$table->dropColumn('{$fieldName}');";
        }

        $className = 'AddExtendedFieldsTo' . str_replace(' ', '', ucwords(str_replace('_', ' ', $table))) . 'Table';
        $timestamp = date('Y_m_d_His');

        return <<<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('{$table}', function (Blueprint \$table) {
            {$this->indent(implode("\n", $upStatements), 12)}
        });
    }

    public function down(): void
    {
        Schema::table('{$table}', function (Blueprint \$table) {
            {$this->indent(implode("\n", $downStatements), 12)}
        });
    }
};
PHP;
    }

    /**
     * Apply extended fields to a table (runtime)
     */
    public function applyToTable(string $target, string $table): void
    {
        $fields = $this->getFields($target);

        if (empty($fields)) {
            return;
        }

        $existingColumns = Schema::getColumnListing($table);

        Schema::table($table, function (Blueprint $blueprint) use ($fields, $existingColumns) {
            foreach ($fields as $fieldName => $definition) {
                if (!in_array($fieldName, $existingColumns)) {
                    $this->addFieldToBlueprint($blueprint, $fieldName, $definition);
                }
            }
        });
    }

    /**
     * Generate a field statement for migration
     */
    protected function generateFieldStatement(string $fieldName, array $definition): string
    {
        $type = $definition['type'] ?? 'string';
        $nullable = $definition['nullable'] ?? true;
        $default = $definition['default'] ?? null;

        $statement = match ($type) {
            'string' => "\$table->string('{$fieldName}'" . ($definition['max'] ?? false ? ", {$definition['max']}" : '') . ")",
            'text' => "\$table->text('{$fieldName}')",
            'integer' => "\$table->integer('{$fieldName}')",
            'bigInteger' => "\$table->bigInteger('{$fieldName}')",
            'decimal' => "\$table->decimal('{$fieldName}', {$definition['precision']}, {$definition['scale']})",
            'float' => "\$table->float('{$fieldName}')",
            'boolean' => "\$table->boolean('{$fieldName}')",
            'date' => "\$table->date('{$fieldName}')",
            'datetime' => "\$table->dateTime('{$fieldName}')",
            'timestamp' => "\$table->timestamp('{$fieldName}')",
            'json' => "\$table->json('{$fieldName}')",
            'foreignId' => "\$table->foreignId('{$fieldName}')->constrained('{$definition['references']}')",
            'unsignedBigInteger' => "\$table->unsignedBigInteger('{$fieldName}')",
            default => "\$table->string('{$fieldName}')",
        };

        if ($nullable) {
            $statement .= "->nullable()";
        }

        if ($default !== null) {
            $defaultValue = is_string($default) ? "'{$default}'" : $default;
            $statement .= "->default({$defaultValue})";
        }

        return $statement . ";";
    }

    /**
     * Add field to blueprint at runtime
     */
    protected function addFieldToBlueprint(Blueprint $blueprint, string $fieldName, array $definition): void
    {
        $type = $definition['type'] ?? 'string';
        $nullable = $definition['nullable'] ?? true;
        $default = $definition['default'] ?? null;

        $column = match ($type) {
            'string' => $blueprint->string($fieldName, $definition['max'] ?? 255),
            'text' => $blueprint->text($fieldName),
            'integer' => $blueprint->integer($fieldName),
            'bigInteger' => $blueprint->bigInteger($fieldName),
            'decimal' => $blueprint->decimal($fieldName, $definition['precision'] ?? 8, $definition['scale'] ?? 2),
            'float' => $blueprint->float($fieldName),
            'boolean' => $blueprint->boolean($fieldName),
            'date' => $blueprint->date($fieldName),
            'datetime' => $blueprint->dateTime($fieldName),
            'timestamp' => $blueprint->timestamp($fieldName),
            'json' => $blueprint->json($fieldName),
            'foreignId' => $blueprint->foreignId($fieldName)->constrained($definition['references']),
            'unsignedBigInteger' => $blueprint->unsignedBigInteger($fieldName),
            default => $blueprint->string($fieldName),
        };

        if ($nullable && $type !== 'foreignId') {
            $column->nullable();
        }

        if ($default !== null) {
            $column->default($default);
        }
    }

    /**
     * Indent helper for code generation
     */
    protected function indent(string $code, int $spaces): string
    {
        $indent = str_repeat(' ', $spaces);
        return implode("\n" . $indent, explode("\n", $code));
    }

    /**
     * Get all registered extensions
     */
    public function getAllExtensions(): array
    {
        return $this->extensions;
    }

    /**
     * Check if a target has extensions
     */
    public function hasExtensions(string $target): bool
    {
        return !empty($this->extensions[$target]);
    }
}
