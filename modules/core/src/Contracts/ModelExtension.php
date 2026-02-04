<?php

namespace Modules\Core\Contracts;

interface ModelExtension
{
    /**
     * Target model in module.model notation (e.g., 'contacts.contact')
     */
    public function target(): string;

    /**
     * Define additional fields for the target model
     * 
     * @return array<string, array> Field definitions
     * Example: ['credit_limit' => ['type' => 'decimal', 'precision' => 10, 'scale' => 2]]
     */
    public function fields(): array;

    /**
     * Define additional relationships for the target model
     * 
     * @return array<string, callable> Relationship definitions
     * Example: ['invoices' => fn($model) => $model->hasMany(Invoice::class)]
     */
    public function relationships(): array;

    /**
     * Define computed/virtual attributes
     * 
     * @return array<string, callable> Computed attribute definitions
     * Example: ['total_invoiced' => fn($model) => $model->invoices->sum('total')]
     */
    public function computed(): array;

    /**
     * Define query scopes
     * 
     * @return array<string, callable> Scope definitions
     */
    public function scopes(): array;

    /**
     * Define validation rules for extended fields
     * 
     * @return array<string, array|string> Validation rules
     */
    public function validation(): array;
}
