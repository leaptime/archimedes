<?php

namespace Modules\Banking\Parsers;

interface ParserInterface
{
    public function parse(string $content): array;
    public function getFormat(): string;
    public function getSupportedExtensions(): array;
    public function validate(string $content): bool;
}
