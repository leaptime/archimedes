<?php

namespace Modules\Core\Console;

use Illuminate\Console\Command;
use Modules\Core\Services\ModuleValidator;

class ModuleValidateCommand extends Command
{
    protected $signature = 'module:validate 
                            {module? : The module name to validate (validates all if not specified)}
                            {--strict : Treat warnings as errors}
                            {--json : Output as JSON}';

    protected $description = 'Validate module compliance with Archimedes standards';

    public function handle(ModuleValidator $validator): int
    {
        $moduleName = $this->argument('module');
        $strict = $this->option('strict');
        $asJson = $this->option('json');

        if ($moduleName) {
            return $this->validateSingleModule($validator, $moduleName, $strict, $asJson);
        }

        return $this->validateAllModules($validator, $strict, $asJson);
    }

    protected function validateSingleModule(ModuleValidator $validator, string $moduleName, bool $strict, bool $asJson): int
    {
        $modulePath = base_path("modules/{$moduleName}");
        
        if (!is_dir($modulePath)) {
            $this->error("Module '{$moduleName}' not found");
            return 1;
        }

        $result = $validator->validate($modulePath);

        if ($asJson) {
            $this->line(json_encode($result->toArray(), JSON_PRETTY_PRINT));
            return $result->isValid() && (!$strict || $result->isFullyCompliant()) ? 0 : 1;
        }

        $this->outputSingleResult($result, $strict);

        if (!$result->isValid()) {
            return 1;
        }

        if ($strict && !$result->isFullyCompliant()) {
            return 1;
        }

        return 0;
    }

    protected function validateAllModules(ModuleValidator $validator, bool $strict, bool $asJson): int
    {
        $report = $validator->getComplianceReport();

        if ($asJson) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT));
            return $report['non_compliant'] > 0 ? 1 : 0;
        }

        $this->info("Module Compliance Report");
        $this->info("========================\n");

        // Summary table
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Modules', $report['total']],
                ['Compliant', $report['compliant']],
                ['Non-Compliant', $report['non_compliant']],
                ['With Warnings', $report['with_warnings']],
            ]
        );

        $this->newLine();

        // Detailed results
        $rows = [];
        foreach ($report['modules'] as $name => $module) {
            $status = $module['valid'] 
                ? ($module['fully_compliant'] ? '✅ Compliant' : '⚠️ Valid (warnings)')
                : '❌ Invalid';

            $issues = count($module['errors']) + count($module['warnings']);
            
            $rows[] = [
                $name,
                $status,
                count($module['errors']),
                count($module['warnings']),
            ];
        }

        $this->table(
            ['Module', 'Status', 'Errors', 'Warnings'],
            $rows
        );

        // Show details for non-compliant modules
        foreach ($report['modules'] as $name => $module) {
            if (!empty($module['errors']) || (!empty($module['warnings']) && $strict)) {
                $this->newLine();
                $this->warn("Module: {$name}");
                
                foreach ($module['errors'] as $error) {
                    $this->error("  ✗ {$error}");
                }
                
                foreach ($module['warnings'] as $warning) {
                    $this->line("  ⚠ <comment>{$warning}</comment>");
                }
            }
        }

        return $report['non_compliant'] > 0 ? 1 : 0;
    }

    protected function outputSingleResult($result, bool $strict): void
    {
        $name = $result->getModuleName();

        if ($result->isFullyCompliant()) {
            $this->info("✅ Module '{$name}' is fully compliant");
            return;
        }

        if ($result->isValid()) {
            $this->warn("⚠️ Module '{$name}' is valid but has warnings:");
        } else {
            $this->error("❌ Module '{$name}' failed validation:");
        }

        foreach ($result->getErrors() as $error) {
            $this->error("  ✗ {$error}");
        }

        foreach ($result->getWarnings() as $warning) {
            $this->line("  ⚠ <comment>{$warning}</comment>");
        }
    }
}
