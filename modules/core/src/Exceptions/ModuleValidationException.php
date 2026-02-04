<?php

namespace Modules\Core\Exceptions;

use Exception;
use Modules\Core\Services\ValidationResult;

class ModuleValidationException extends Exception
{
    protected ValidationResult $validationResult;

    public function __construct(ValidationResult $result)
    {
        $this->validationResult = $result;
        
        $message = sprintf(
            "Module '%s' failed validation:\n%s",
            $result->getModuleName(),
            implode("\n", $result->getErrors())
        );

        parent::__construct($message);
    }

    public function getValidationResult(): ValidationResult
    {
        return $this->validationResult;
    }

    public function getErrors(): array
    {
        return $this->validationResult->getErrors();
    }

    public function getWarnings(): array
    {
        return $this->validationResult->getWarnings();
    }
}
